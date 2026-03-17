import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

const USE_SUPABASE_AUTH = process.env.USE_SUPABASE_AUTH === "true";

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
        // Mirror cookies onto the request so downstream code sees them
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // Re-create response to include updated request cookies
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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dashboard routes ───────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (USE_SUPABASE_AUTH) {
      const { user, response } = await getSupabaseMiddleware(request);
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      // Role cookie is set at login for fast middleware checking
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

  // ── Login page redirect ────────────────────────────────────
  if (pathname === "/login") {
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

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
