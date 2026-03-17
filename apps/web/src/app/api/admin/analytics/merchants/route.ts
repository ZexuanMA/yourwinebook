import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getPerMerchantStats } from "@/lib/analytics-store";
import { winePrices } from "@/lib/mock-data";
import { getMerchantFavoriteCount } from "@/lib/user-store";
import { getAllMerchantsFromStore } from "@/lib/merchant-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return false;
  return (await getMockAccount(slug))?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const merchantWineMap: Record<string, string[]> = {};
  for (const [wineSlug, prices] of Object.entries(winePrices)) {
    for (const p of prices) {
      if (!merchantWineMap[p.merchantSlug]) merchantWineMap[p.merchantSlug] = [];
      merchantWineMap[p.merchantSlug].push(wineSlug);
    }
  }

  const merchantList = await getAllMerchantsFromStore();
  const nameMap = Object.fromEntries(merchantList.map((m) => [m.slug, m.name]));

  const stats = getPerMerchantStats(merchantWineMap);
  const withFavorites = await Promise.all(stats.map(async (s) => ({
    ...s,
    name: nameMap[s.slug] ?? s.slug,
    favoriteCount: await getMerchantFavoriteCount(s.slug),
  })));
  return NextResponse.json(withFavorites);
}
