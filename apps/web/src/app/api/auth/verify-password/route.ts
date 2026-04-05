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
import { changePasswordSchema } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("password_min_length", 400, request);
  }
  const { currentPassword, newPassword } = parsed.data;

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const user = await supabaseGetUser();
    if (!user) {
      return apiError("unauthorized", 401, request);
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
      return apiError("wrong_current_password", 400, request);
    }

    const ok = await supabaseChangePassword(newPassword);
    if (!ok) {
      return apiError("password_update_failed", 500, request);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Legacy path ──
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug)
    return apiError("unauthorized", 401, request);

  if (slug === "admin") {
    if (!(await verifyAdminPassword(currentPassword))) {
      return apiError("wrong_current_password", 400, request);
    }
    await updateAdminPassword(newPassword);
    return NextResponse.json({ ok: true });
  }

  if (!(await verifyMerchantPassword(slug, currentPassword))) {
    return apiError("wrong_current_password", 400, request);
  }

  await updateMerchantPassword(slug, newPassword);
  return NextResponse.json({ ok: true });
});
