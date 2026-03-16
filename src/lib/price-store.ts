import fs from "fs";
import path from "path";
import { winePrices as mockWinePrices, type MerchantPrice } from "./mock-data";

/**
 * Price override layer.
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
export function updatePrice(wineSlug: string, merchantSlug: string, price: number): boolean {
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
export function getMergedPrices(wineSlug: string): MerchantPrice[] {
  const basePrices = mockWinePrices[wineSlug] ?? [];
  if (basePrices.length === 0) return [];

  const overrides = readStore()[wineSlug] ?? {};

  // Apply overrides
  const merged = basePrices.map((p) => {
    const override = overrides[p.merchantSlug];
    return {
      ...p,
      price: override?.price ?? p.price,
    };
  });

  // Recalculate isBest
  const lowestPrice = Math.min(...merged.map((p) => p.price));
  return merged.map((p) => ({
    ...p,
    isBest: p.price === lowestPrice,
  }));
}

/**
 * Get all merged wine prices (for every wine that has price data).
 */
export function getAllMergedPrices(): Record<string, MerchantPrice[]> {
  const result: Record<string, MerchantPrice[]> = {};
  for (const wineSlug of Object.keys(mockWinePrices)) {
    result[wineSlug] = getMergedPrices(wineSlug);
  }
  return result;
}

/**
 * Get a specific merchant's price override for a wine, if any.
 */
export function getPriceOverride(wineSlug: string, merchantSlug: string): number | null {
  const store = readStore();
  return store[wineSlug]?.[merchantSlug]?.price ?? null;
}

/**
 * Get the updated minPrice for a wine after applying price overrides.
 * Returns null if the wine has no price data.
 */
export function getUpdatedMinPrice(wineSlug: string): number | null {
  const merged = getMergedPrices(wineSlug);
  if (merged.length === 0) return null;
  return Math.min(...merged.map((p) => p.price));
}
