import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

const USE_SUPABASE_AUTH = process.env.USE_SUPABASE_AUTH === "true";

// ── Supabase helper ──────────────────────────────────────────────────────────

/**
 * Create a Supabase client scoped to the middleware request/response pair.
 * Also refreshes the session (token rotation) automatically.
 */
async function getSupabaseMiddleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null, response };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response };
}

// ── Route-specific handlers ──────────────────────────────────────────────────

/** Handle /dashboard/* routes — require authentication + admin role check. */
async function handleDashboard(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (USE_SUPABASE_AUTH) {
    const { user, response } = await getSupabaseMiddleware(request);
    if (!user) {
      const loginRedirect = NextResponse.redirect(new URL("/login", request.url));
      loginRedirect.cookies.delete("wb_role");
      return loginRedirect;
    }
    const role = request.cookies.get("wb_role")?.value;
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Legacy: cookie-based auth
  const slug = request.cookies.get("wb_session")?.value;
  if (!slug) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/dashboard/admin") && slug !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

/** Handle /login — redirect already-authenticated users to dashboard. */
async function handleLogin(request: NextRequest): Promise<NextResponse> {
  if (USE_SUPABASE_AUTH) {
    const { user, response } = await getSupabaseMiddleware(request);
    const role = request.cookies.get("wb_role")?.value;
    if (user && (role === "admin" || role === "merchant_staff")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  const slug = request.cookies.get("wb_session")?.value;
  if (slug) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

// ── Main middleware ──────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    return handleDashboard(request);
  }

  if (pathname === "/login") {
    return handleLogin(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
