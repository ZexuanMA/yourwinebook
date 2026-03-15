import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getMockAccount } from "./lib/mock-auth";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /dashboard routes — must be logged in
  if (pathname.startsWith("/dashboard")) {
    const slug = request.cookies.get("wb_session")?.value;
    if (!slug) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Protect /dashboard/admin — admin only
    if (pathname.startsWith("/dashboard/admin")) {
      const account = getMockAccount(slug);
      if (!account || account.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Already logged in → skip login page
  if (pathname === "/login") {
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
