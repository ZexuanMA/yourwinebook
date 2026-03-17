import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, updateLastSeen } from "@/lib/user-store";
import { USE_SUPABASE_AUTH, supabaseSignIn } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const authUser = await supabaseSignIn(email, password);
    if (!authUser) {
      return NextResponse.json(
        { error: "Email 或密碼錯誤" },
        { status: 401 }
      );
    }

    if (authUser.status === "banned") {
      return NextResponse.json(
        { error: "帳號已被停用，請聯繫客服" },
        { status: 403 }
      );
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
    return NextResponse.json(
      { error: "Email 或密碼錯誤" },
      { status: 401 }
    );
  }
  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "帳號已被停用，請聯繫客服" },
      { status: 403 }
    );
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
}
