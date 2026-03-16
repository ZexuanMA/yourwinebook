import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMerchantPassword, updateMerchantPassword } from "@/lib/merchant-store";
import { verifyAdminPassword, updateAdminPassword } from "@/lib/admin-store";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "新密碼至少需要 6 個字符" }, { status: 400 });
  }

  if (slug === "admin") {
    if (!(await verifyAdminPassword(currentPassword))) {
      return NextResponse.json({ error: "當前密碼不正確" }, { status: 400 });
    }
    await updateAdminPassword(newPassword);
    return NextResponse.json({ ok: true });
  }

  if (!(await verifyMerchantPassword(slug, currentPassword))) {
    return NextResponse.json({ error: "當前密碼不正確" }, { status: 400 });
  }

  await updateMerchantPassword(slug, newPassword);
  return NextResponse.json({ ok: true });
}
