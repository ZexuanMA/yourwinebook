import { NextRequest, NextResponse } from "next/server";
import { getMerchantFavoriteCount } from "@/lib/user-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return NextResponse.json({ favoriteCount: await getMerchantFavoriteCount(slug) });
}
