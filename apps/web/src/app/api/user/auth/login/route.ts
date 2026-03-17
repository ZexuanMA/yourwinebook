import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, updateLastSeen } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const user = await verifyCredentials(email, password);
  if (!user) return NextResponse.json({ error: "Email 或密碼錯誤" }, { status: 401 });
  if (user.status === "suspended") return NextResponse.json({ error: "帳號已被停用，請聯繫客服" }, { status: 403 });

  updateLastSeen(user.id);

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("wb_user_session", user.id, {
    httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax",
  });
  return res;
}
