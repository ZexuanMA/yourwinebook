import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/mock-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const merchant = verifyCredentials(email, password);

  if (!merchant) {
    return NextResponse.json({ error: "Email 或密碼錯誤" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, merchant });
  response.cookies.set("wb_session", merchant.slug, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  });
  return response;
}
