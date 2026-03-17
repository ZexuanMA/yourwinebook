import { NextRequest, NextResponse } from "next/server";
import { verifyUserPassword, updateUserPassword } from "@/lib/user-store";
import {
  USE_SUPABASE_AUTH,
  supabaseGetUser,
  supabaseChangePassword,
} from "@/lib/supabase-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword) {
    return NextResponse.json(
      { error: "請輸入當前密碼" },
      { status: 400 }
    );
  }
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

    // Verify current password
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
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyUserPassword(id, currentPassword))) {
    return NextResponse.json(
      { error: "當前密碼不正確" },
      { status: 400 }
    );
  }

  await updateUserPassword(id, newPassword);
  return NextResponse.json({ ok: true });
}
