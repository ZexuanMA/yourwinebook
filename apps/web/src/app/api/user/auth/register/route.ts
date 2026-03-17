import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ error: "請填寫所有必填項" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "密碼至少需要 6 個字符" }, { status: 400 });

  const user = await registerUser(name, email, password);
  if (!user) return NextResponse.json({ error: "該 Email 已被注冊" }, { status: 409 });

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("wb_user_session", user.id, {
    httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax",
  });
  return res;
}
