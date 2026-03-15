import { NextRequest, NextResponse } from "next/server";
import { getMockMerchant } from "@/lib/mock-auth";

export async function GET(request: NextRequest) {
  const slug = request.cookies.get("wb_session")?.value;
  if (!slug) return NextResponse.json(null, { status: 401 });
  const merchant = getMockMerchant(slug);
  if (!merchant) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(merchant);
}
