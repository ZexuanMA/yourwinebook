import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/mock-auth";
import {
  USE_SUPABASE_AUTH,
  supabaseSignIn,
} from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const user = await supabaseSignIn(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Email 或密碼錯誤" },
        { status: 401 }
      );
    }

    // Only admin and merchant_staff can access the dashboard
    if (user.role !== "admin" && user.role !== "merchant_staff") {
      return NextResponse.json(
        { error: "此帳號無後台權限" },
        { status: 403 }
      );
    }

    // Block suspended/banned/inactive accounts (codex-review 3.2)
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "此帳號已被停用" },
        { status: 403 }
      );
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
    return NextResponse.json({ error: "Email 或密碼錯誤" }, { status: 401 });
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
}
