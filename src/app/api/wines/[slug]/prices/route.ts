import { NextRequest, NextResponse } from "next/server";
import { getWinePrices } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const prices = await getWinePrices(slug);
  return NextResponse.json(prices);
}
