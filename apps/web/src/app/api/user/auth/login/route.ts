import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, updateLastSeen } from "@/lib/user-store";
import { USE_SUPABASE_AUTH, supabaseSignIn } from "@/lib/supabase-auth";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`user-login:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalid_input", 400, request);
  }
  const { email, password } = parsed.data;

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const authUser = await supabaseSignIn(email, password);
    if (!authUser) {
      return apiError("invalid_credentials", 401, request);
    }

    if (authUser.status === "banned") {
      return apiError("account_banned", 403, request);
    }

    // Map to the user shape expected by frontend
    const user = {
      id: authUser.id,
      name: authUser.displayName,
      email: authUser.email,
      status: authUser.status === "active" ? "active" : "suspended",
    };

    const res = NextResponse.json({ ok: true, user });
    // Keep wb_user_session for backward compatibility
    res.cookies.set("wb_user_session", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  }

  // ── Legacy path ──
  const user = await verifyCredentials(email, password);
  if (!user) {
    return apiError("invalid_credentials", 401, request);
  }
  if (user.status === "suspended") {
    return apiError("account_banned", 403, request);
  }

  updateLastSeen(user.id);

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("wb_user_session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res;
});
