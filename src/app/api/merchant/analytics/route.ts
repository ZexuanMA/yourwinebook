import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getMerchantAnalyticsSummary } from "@/lib/analytics-store";
import { winePrices } from "@/lib/mock-data";

export async function GET() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = getMockAccount(slug);
  if (!account || account.role !== "merchant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const merchantWineSlugs = Object.entries(winePrices)
    .filter(([, prices]) => prices.some((p) => p.merchantSlug === slug))
    .map(([wineSlug]) => wineSlug);

  return NextResponse.json(getMerchantAnalyticsSummary(slug, merchantWineSlugs));
}
