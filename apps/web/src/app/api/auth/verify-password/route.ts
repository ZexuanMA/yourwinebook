import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyMerchantPassword,
  updateMerchantPassword,
} from "@/lib/merchant-store";
import {
  verifyAdminPassword,
  updateAdminPassword,
} from "@/lib/admin-store";
import {
  USE_SUPABASE_AUTH,
  supabaseGetUser,
  supabaseChangePassword,
} from "@/lib/supabase-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { currentPassword, newPassword } = await request.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "新密碼至少需要 6 個字符" },
      { status: 400 }
    );
  }

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const user = await supabaseGetUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify current password by attempting sign-in
    const supabase = await createSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }
    const { error: verifyError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
    if (verifyError) {
      return NextResponse.json(
        { error: "當前密碼不正確" },
        { status: 400 }
      );
    }

    const ok = await supabaseChangePassword(newPassword);
    if (!ok) {
      return NextResponse.json(
        { error: "密碼更新失敗" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  // ── Legacy path ──
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (slug === "admin") {
    if (!(await verifyAdminPassword(currentPassword))) {
      return NextResponse.json(
        { error: "當前密碼不正確" },
        { status: 400 }
      );
    }
    await updateAdminPassword(newPassword);
    return NextResponse.json({ ok: true });
  }

  if (!(await verifyMerchantPassword(slug, currentPassword))) {
    return NextResponse.json(
      { error: "當前密碼不正確" },
      { status: 400 }
    );
  }

  await updateMerchantPassword(slug, newPassword);
  return NextResponse.json({ ok: true });
}
