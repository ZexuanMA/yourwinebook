import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMerchantPassword, updateMerchantPassword } from "@/lib/merchant-store";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (slug === "admin") {
    // Admin password is hardcoded for now
    if (currentPassword !== "admin123") {
      return NextResponse.json({ error: "當前密碼不正確" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!verifyMerchantPassword(slug, currentPassword)) {
    return NextResponse.json({ error: "當前密碼不正確" }, { status: 400 });
  }

  if (newPassword) {
    updateMerchantPassword(slug, newPassword);
  }

  return NextResponse.json({ ok: true });
}
