/**
 * Price store — file-based overlay (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 */
import fs from "fs";
import path from "path";
import { winePrices as mockWinePrices, type MerchantPrice } from "./mock-data";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer } from "./supabase-server";

/**
 * Price override layer (legacy).
 * Structure: { [wineSlug]: { [merchantSlug]: { price, updatedAt } } }
 */
interface PriceOverride {
  price: number;
  updatedAt: string;
}

type PriceStore = Record<string, Record<string, PriceOverride>>;

const DATA_FILE = path.join(process.cwd(), "data", "prices.json");

function readStore(): PriceStore {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as PriceStore;
  } catch {
    return {};
  }
}

function writeStore(store: PriceStore): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[price-store] write error:", err);
  }
}

/**
 * Update a merchant's price for a wine.
 */
export async function updatePrice(wineSlug: string, merchantSlug: string, price: number): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      // Resolve slugs to UUIDs
      const [{ data: wine }, { data: merchant }] = await Promise.all([
        sb.from("wines").select("id").eq("slug", wineSlug).single(),
        sb.from("merchants").select("id").eq("slug", merchantSlug).single(),
      ]);
      if (!wine || !merchant) {
        console.error("[price-store] updatePrice: wine or merchant not found", { wineSlug, merchantSlug });
        return false;
      }
      const { error } = await sb
        .from("merchant_prices")
        .upsert(
          { wine_id: wine.id, merchant_id: merchant.id, price, updated_at: new Date().toISOString() },
          { onConflict: "wine_id,merchant_id" }
        );
      if (error) {
        console.error("[price-store] updatePrice error:", error.message);
        return false;
      }
      // Recalculate is_best for all prices of this wine
      const { data: allPrices } = await sb
        .from("merchant_prices")
        .select("id, price")
        .eq("wine_id", wine.id);
      if (allPrices && allPrices.length > 0) {
        const minPrice = Math.min(...allPrices.map((p: { price: number }) => p.price));
        for (const p of allPrices) {
          await sb
            .from("merchant_prices")
            .update({ is_best: p.price === minPrice })
            .eq("id", p.id);
        }
      }
      return true;
    }
  }

  // Legacy path
  const store = readStore();
  if (!store[wineSlug]) store[wineSlug] = {};
  store[wineSlug][merchantSlug] = {
    price,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
  return true;
}

/**
 * Get merged wine prices (mock data + overrides).
 * Recalculates isBest based on merged prices.
 */
export async function getMergedPrices(wineSlug: string): Promise<MerchantPrice[]> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data: wine } = await sb.from("wines").select("id").eq("slug", wineSlug).single();
      if (!wine) return [];
      const { data } = await sb
        .from("merchant_prices")
        .select("*, merchants(name, slug)")
        .eq("wine_id", wine.id)
        .order("price");
      if (!data || data.length === 0) return [];
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return data.map((row: any) => ({
        merchant: row.merchants?.name ?? "",
        merchantSlug: row.merchants?.slug ?? "",
        price: row.price as number,
        isBest: row.is_best as boolean,
      }));
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  }

  // Legacy path
  const basePrices = mockWinePrices[wineSlug] ?? [];
  if (basePrices.length === 0) return [];

  const overrides = readStore()[wineSlug] ?? {};

  const merged = basePrices.map((p) => {
    const override = overrides[p.merchantSlug];
    return {
      ...p,
      price: override?.price ?? p.price,
    };
  });

  const lowestPrice = Math.min(...merged.map((p) => p.price));
  return merged.map((p) => ({
    ...p,
    isBest: p.price === lowestPrice,
  }));
}

/**
 * Get all merged wine prices (for every wine that has price data).
 */
export async function getAllMergedPrices(): Promise<Record<string, MerchantPrice[]>> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb
        .from("merchant_prices")
        .select("*, wines(slug), merchants(name, slug)")
        .order("price");
      if (!data) return {};
      const result: Record<string, MerchantPrice[]> = {};
      /* eslint-disable @typescript-eslint/no-explicit-any */
      for (const row of data as any[]) {
        const wineSlug = row.wines?.slug;
        if (!wineSlug) continue;
        if (!result[wineSlug]) result[wineSlug] = [];
        result[wineSlug].push({
          merchant: row.merchants?.name ?? "",
          merchantSlug: row.merchants?.slug ?? "",
          price: row.price as number,
          isBest: row.is_best as boolean,
        });
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
      return result;
    }
  }

  // Legacy path
  const result: Record<string, MerchantPrice[]> = {};
  for (const wineSlug of Object.keys(mockWinePrices)) {
    result[wineSlug] = await getMergedPrices(wineSlug);
  }
  return result;
}

/**
 * Get a specific merchant's price override for a wine, if any.
 */
export async function getPriceOverride(wineSlug: string, merchantSlug: string): Promise<number | null> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const [{ data: wine }, { data: merchant }] = await Promise.all([
        sb.from("wines").select("id").eq("slug", wineSlug).single(),
        sb.from("merchants").select("id").eq("slug", merchantSlug).single(),
      ]);
      if (!wine || !merchant) return null;
      const { data } = await sb
        .from("merchant_prices")
        .select("price")
        .eq("wine_id", wine.id)
        .eq("merchant_id", merchant.id)
        .single();
      return data?.price ?? null;
    }
  }

  // Legacy path
  const store = readStore();
  return store[wineSlug]?.[merchantSlug]?.price ?? null;
}

/**
 * Get the updated minPrice for a wine after applying price overrides.
 * Returns null if the wine has no price data.
 */
export async function getUpdatedMinPrice(wineSlug: string): Promise<number | null> {
  const merged = await getMergedPrices(wineSlug);
  if (merged.length === 0) return null;
  return Math.min(...merged.map((p) => p.price));
}
