import { NextRequest, NextResponse } from "next/server";
import { getMerchantWines } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const wines = await getMerchantWines(slug);
  return NextResponse.json(wines);
}
