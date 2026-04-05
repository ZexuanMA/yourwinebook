import { NextRequest, NextResponse } from "next/server";
import { verifyUserPassword, updateUserPassword } from "@/lib/user-store";
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
    const firstIssue = parsed.error.issues[0];
    if (firstIssue?.path.includes("currentPassword")) {
      return apiError("current_password_required", 400, request);
    }
    return apiError("password_min_length", 400, request);
  }
  const { currentPassword, newPassword } = parsed.data;

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const user = await supabaseGetUser();
    if (!user) {
      return apiError("unauthorized", 401, request);
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
      return apiError("wrong_current_password", 400, request);
    }

    const ok = await supabaseChangePassword(newPassword);
    if (!ok) {
      return apiError("password_update_failed", 500, request);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Legacy path ──
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) {
    return apiError("unauthorized", 401, request);
  }

  if (!(await verifyUserPassword(id, currentPassword))) {
    return apiError("wrong_current_password", 400, request);
  }

  await updateUserPassword(id, newPassword);
  return NextResponse.json({ ok: true });
});
