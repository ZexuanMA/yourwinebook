import { NextRequest, NextResponse } from "next/server";
import { verifyUserPassword, updateUserPassword } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword) {
    return NextResponse.json({ error: "請輸入當前密碼" }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "新密碼至少需要 6 個字符" }, { status: 400 });
  }
  if (!verifyUserPassword(id, currentPassword)) {
    return NextResponse.json({ error: "當前密碼不正確" }, { status: 400 });
  }

  updateUserPassword(id, newPassword);
  return NextResponse.json({ ok: true });
}
