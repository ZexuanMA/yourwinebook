import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getPerMerchantStats } from "@/lib/analytics-store";
import { winePrices } from "@/lib/mock-data";
import { getMerchantFavoriteCount } from "@/lib/user-store";
import { getAllMerchantsFromStore } from "@/lib/merchant-store";
import { USE_SUPABASE_AUTH } from "@/lib/supabase-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return false;
  return (await getMockAccount(slug))?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let merchantWineMap: Record<string, string[]> = {};

  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb
        .from("merchant_prices")
        .select("wines(slug), merchants(slug)");
      /* eslint-disable @typescript-eslint/no-explicit-any */
      for (const row of (data ?? []) as any[]) {
        const merchantSlug = row.merchants?.slug as string;
        const wineSlug = row.wines?.slug as string;
        if (!merchantSlug || !wineSlug) continue;
        if (!merchantWineMap[merchantSlug]) merchantWineMap[merchantSlug] = [];
        merchantWineMap[merchantSlug].push(wineSlug);
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } else {
      for (const [wineSlug, prices] of Object.entries(winePrices)) {
        for (const p of prices) {
          if (!merchantWineMap[p.merchantSlug]) merchantWineMap[p.merchantSlug] = [];
          merchantWineMap[p.merchantSlug].push(wineSlug);
        }
      }
    }
  } else {
    for (const [wineSlug, prices] of Object.entries(winePrices)) {
      for (const p of prices) {
        if (!merchantWineMap[p.merchantSlug]) merchantWineMap[p.merchantSlug] = [];
        merchantWineMap[p.merchantSlug].push(wineSlug);
      }
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
