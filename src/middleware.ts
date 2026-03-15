import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard — redirect to /login if no session cookie
  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("wb_session");
    if (!session?.value) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // If already logged in, skip /login
  if (pathname === "/login") {
    const session = request.cookies.get("wb_session");
    if (session?.value) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // All other routes: delegate to next-intl for locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
