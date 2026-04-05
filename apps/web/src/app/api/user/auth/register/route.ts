import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/user-store";
import { USE_SUPABASE_AUTH, supabaseSignUp } from "@/lib/supabase-auth";
import { checkRateLimit, getClientIp, REGISTER_RATE_LIMIT } from "@/lib/rate-limit";
import { createSupabaseServer } from "@/lib/supabase-server";
import { registerSchema } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

const REQUIRE_INVITE_CODE = process.env.REQUIRE_INVITE_CODE === "true";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, REGISTER_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    // Provide specific error for common validation failures
    const firstIssue = parsed.error.issues[0];
    if (firstIssue?.path.includes("password") && firstIssue?.code === "too_small") {
      return apiError("password_too_short", 400, request);
    }
    return apiError("missing_required_fields", 400, request);
  }
  const { name, email, password, inviteCode } = parsed.data;

  // ── Invite code validation ──
  let inviteCodeId: string | null = null;
  if (REQUIRE_INVITE_CODE) {
    if (!inviteCode) {
      return apiError("invite_code_required", 400, request);
    }
    const supabase = await createSupabaseServer();
    if (supabase) {
      const { data: codeData } = await supabase
        .from("invite_codes")
        .select("id, used_by, expires_at")
        .eq("code", inviteCode.toUpperCase())
        .is("used_by", null)
        .single();

      if (!codeData) {
        return apiError("invite_code_invalid", 400, request);
      }
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return apiError("invite_code_expired", 400, request);
      }
      inviteCodeId = codeData.id;
    }
  }

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const authUser = await supabaseSignUp(email, password, name);
    if (!authUser) {
      return apiError("email_already_registered", 409, request);
    }

    const user = {
      id: authUser.id,
      name: authUser.displayName,
      email: authUser.email,
      status: authUser.status,
    };

    // Mark invite code as used
    if (inviteCodeId) {
      const sb = await createSupabaseServer();
      if (sb) {
        await sb.from("invite_codes").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", inviteCodeId);
      }
    }

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("wb_user_session", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  }

  // ── Legacy path ──
  const user = await registerUser(name, email, password);
  if (!user) {
    return apiError("email_already_registered", 409, request);
  }

  // Mark invite code as used (legacy path)
  if (inviteCodeId) {
    const sb = await createSupabaseServer();
    if (sb) {
      await sb.from("invite_codes").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", inviteCodeId);
    }
  }

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("wb_user_session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res;
});
