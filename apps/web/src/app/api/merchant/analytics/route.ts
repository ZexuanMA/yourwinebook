import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getMerchantAnalyticsSummary } from "@/lib/analytics-store";
import { winePrices } from "@/lib/mock-data";
import { USE_SUPABASE_AUTH } from "@/lib/supabase-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getMockAccount(slug);
  if (!account || account.role !== "merchant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let merchantWineSlugs: string[];

  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data: merchant } = await sb
        .from("merchants")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!merchant) {
        merchantWineSlugs = [];
      } else {
        const { data } = await sb
          .from("merchant_prices")
          .select("wines(slug)")
          .eq("merchant_id", merchant.id);
        /* eslint-disable @typescript-eslint/no-explicit-any */
        merchantWineSlugs = (data ?? [])
          .map((row: any) => row.wines?.slug as string)
          .filter(Boolean);
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }
    } else {
      merchantWineSlugs = Object.entries(winePrices)
        .filter(([, prices]) => prices.some((p) => p.merchantSlug === slug))
        .map(([wineSlug]) => wineSlug);
    }
  } else {
    merchantWineSlugs = Object.entries(winePrices)
      .filter(([, prices]) => prices.some((p) => p.merchantSlug === slug))
      .map(([wineSlug]) => wineSlug);
  }

  return NextResponse.json(getMerchantAnalyticsSummary(slug, merchantWineSlugs));
}
