import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/mock-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const account = verifyCredentials(email, password);

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
  return response;
}
