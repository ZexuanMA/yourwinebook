import { NextRequest, NextResponse } from "next/server";
import { getMerchantBySlug } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(merchant);
}
