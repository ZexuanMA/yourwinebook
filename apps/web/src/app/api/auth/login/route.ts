import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/mock-auth";
import {
  USE_SUPABASE_AUTH,
  supabaseSignIn,
} from "@/lib/supabase-auth";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin-login:${ip}`, AUTH_RATE_LIMIT);
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
    const user = await supabaseSignIn(email, password);
    if (!user) {
      return apiError("invalid_credentials", 401, request);
    }

    // Only admin and merchant_staff can access the dashboard
    if (user.role !== "admin" && user.role !== "merchant_staff") {
      return apiError("no_dashboard_access", 403, request);
    }

    // Block suspended/banned/inactive accounts (codex-review 3.2)
    if (user.status !== "active") {
      return apiError("account_suspended", 403, request);
    }

    const account = {
      slug: user.role === "admin" ? "admin" : user.merchantSlug || user.id,
      name: user.displayName,
      email: user.email,
      role: user.role === "admin" ? "admin" : "merchant",
      status: user.status,
    };

    const response = NextResponse.json({ ok: true, account });

    // Set role cookie for middleware (fast role check without DB query)
    response.cookies.set("wb_role", user.role, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    // Keep wb_session for backward compatibility with dashboard components
    response.cookies.set("wb_session", account.slug, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  }

  // ── Legacy path ──
  const account = await verifyCredentials(email, password);

  if (!account) {
    return apiError("invalid_credentials", 401, request);
  }

  const response = NextResponse.json({ ok: true, account });
  response.cookies.set("wb_session", account.slug, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  if (account.preferredLang) {
    response.cookies.set("wb_dash_lang", account.preferredLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
});
