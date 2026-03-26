/**
 * Wine store — file-based (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 *
 * Legacy mode: merchant-created wines are stored in data/wines.json.
 * The mock-data.ts wines array is read-only (seed data).
 * At runtime, getAll() merges both sources.
 *
 * Supabase mode: all CRUD goes to the wines + merchant_prices tables.
 */

import fs from "fs";
import path from "path";
import { wines as seedWines, type Wine, type MerchantPrice } from "./mock-data";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer } from "./supabase-server";

// ── Types ────────────────────────────────────────────────────

export interface CreateWineInput {
  name: string;
  name_zh?: string;
  type: Wine["type"];
  region_zh: string;
  region_en: string;
  grape_variety?: string;
  vintage?: number;
  description_zh?: string;
  description_en?: string;
  tags_zh?: string[];
  tags_en?: string[];
  tasting_notes?: Wine["tasting_notes"];
  price: number;
  buy_url?: string;
}

export interface UpdateWineInput {
  name?: string;
  name_zh?: string;
  region_zh?: string;
  region_en?: string;
  grape_variety?: string;
  vintage?: number;
  description_zh?: string;
  description_en?: string;
  tags_zh?: string[];
  tags_en?: string[];
  tasting_notes?: Wine["tasting_notes"];
}

interface StoredWine extends Wine {
  createdBy: string; // merchantSlug
  createdAt: string;
  isDelisted?: boolean;
}

// ── Legacy file-based helpers ────────────────────────────────

const DATA_FILE = path.join(process.cwd(), "data", "wines.json");

function readStore(): StoredWine[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as StoredWine[];
  } catch {
    return [];
  }
}

function writeStore(wines: StoredWine[]): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(wines, null, 2), "utf-8");
  } catch (err) {
    console.error("[wine-store] write error:", err);
  }
}

// ── Helpers ──────────────────────────────────────────────────

const WINE_EMOJI: Record<Wine["type"], string> = {
  red: "🍷",
  white: "🍾",
  sparkling: "🥂",
  rosé: "🌸",
  dessert: "🍯",
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let i = 2;
  while (existingSlugs.has(`${baseSlug}-${i}`)) i++;
  return `${baseSlug}-${i}`;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Get all wines (seed + merchant-created, excluding delisted).
 */
export async function getAllWines(): Promise<Wine[]> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb
        .from("wines")
        .select("*")
        .eq("is_delisted", false)
        .order("created_at", { ascending: false });
      if (data) return data as unknown as Wine[];
    }
  }

  // Legacy: merge seed + custom wines
  const custom = readStore().filter((w) => !w.isDelisted);
  const customSlugs = new Set(custom.map((w) => w.slug));
  // Seed wines that haven't been overridden by custom wines
  const fromSeed = seedWines.filter((w) => !customSlugs.has(w.slug));
  return [...fromSeed, ...custom];
}

/**
 * Get a wine by slug.
 */
export async function getWineBySlug(slug: string): Promise<Wine | null> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb.from("wines").select("*").eq("slug", slug).single();
      return data as unknown as Wine | null;
    }
  }

  // Legacy: check custom first, then seed
  const custom = readStore().find((w) => w.slug === slug);
  if (custom) return custom.isDelisted ? null : custom;
  return seedWines.find((w) => w.slug === slug) ?? null;
}

/**
 * Create a new wine. Returns the created wine or null on failure.
 */
export async function createWine(
  input: CreateWineInput,
  merchantSlug: string,
  merchantName: string
): Promise<Wine | null> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      // Resolve merchant
      const { data: merchant } = await sb
        .from("merchants")
        .select("id")
        .eq("slug", merchantSlug)
        .single();
      if (!merchant) return null;

      const slug = generateSlug(input.name);
      // Check uniqueness
      const { data: existing } = await sb.from("wines").select("slug").eq("slug", slug).single();
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const wineRow = {
        slug: finalSlug,
        name: input.name,
        type: input.type,
        region_zh: input.region_zh,
        region_en: input.region_en,
        grape_variety: input.grape_variety || null,
        vintage: input.vintage || null,
        description_zh: input.description_zh || "",
        description_en: input.description_en || "",
        tags_zh: input.tags_zh || [],
        tags_en: input.tags_en || [],
        emoji: WINE_EMOJI[input.type] || "🍷",
        min_price: input.price,
        merchant_count: 1,
        tasting_notes: input.tasting_notes || null,
      };

      const { data: created, error } = await sb
        .from("wines")
        .insert(wineRow)
        .select()
        .single();
      if (error || !created) {
        console.error("[wine-store] create error:", error?.message);
        return null;
      }

      // Add merchant price
      await sb.from("merchant_prices").insert({
        wine_id: created.id,
        merchant_id: merchant.id,
        price: input.price,
        is_best: true,
        buy_url: input.buy_url || null,
      });

      return created as unknown as Wine;
    }
  }

  // Legacy path
  const allSlugs = new Set([
    ...seedWines.map((w) => w.slug),
    ...readStore().map((w) => w.slug),
  ]);
  const baseSlug = generateSlug(input.name);
  if (!baseSlug) return null;
  const slug = ensureUniqueSlug(baseSlug, allSlugs);

  const newWine: StoredWine = {
    slug,
    name: input.name,
    type: input.type,
    region_zh: input.region_zh,
    region_en: input.region_en,
    grape_variety: input.grape_variety,
    vintage: input.vintage,
    description_zh: input.description_zh || "",
    description_en: input.description_en || "",
    tags_zh: input.tags_zh || [],
    tags_en: input.tags_en || [],
    minPrice: input.price,
    merchantCount: 1,
    emoji: WINE_EMOJI[input.type] || "🍷",
    tasting_notes: input.tasting_notes,
    createdBy: merchantSlug,
    createdAt: new Date().toISOString(),
  };

  const store = readStore();
  store.push(newWine);
  writeStore(store);

  // Also add merchant price entry via price-store pattern (inline for simplicity)
  const pricesFile = path.join(process.cwd(), "data", "prices.json");
  let prices: Record<string, Record<string, { price: number; updatedAt: string }>> = {};
  try {
    prices = JSON.parse(fs.readFileSync(pricesFile, "utf-8"));
  } catch { /* empty */ }
  prices[slug] = {
    [merchantSlug]: { price: input.price, updatedAt: new Date().toISOString() },
  };
  try {
    fs.writeFileSync(pricesFile, JSON.stringify(prices, null, 2), "utf-8");
  } catch (err) {
    console.error("[wine-store] price write error:", err);
  }

  return newWine;
}

/**
 * Update wine info. Only the creating merchant (or any merchant for seed wines) can update.
 * Returns updated wine or null.
 */
export async function updateWine(
  slug: string,
  input: UpdateWineInput,
  merchantSlug: string
): Promise<Wine | null> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.region_zh !== undefined) updateData.region_zh = input.region_zh;
      if (input.region_en !== undefined) updateData.region_en = input.region_en;
      if (input.grape_variety !== undefined) updateData.grape_variety = input.grape_variety;
      if (input.vintage !== undefined) updateData.vintage = input.vintage;
      if (input.description_zh !== undefined) updateData.description_zh = input.description_zh;
      if (input.description_en !== undefined) updateData.description_en = input.description_en;
      if (input.tags_zh !== undefined) updateData.tags_zh = input.tags_zh;
      if (input.tags_en !== undefined) updateData.tags_en = input.tags_en;
      if (input.tasting_notes !== undefined) updateData.tasting_notes = input.tasting_notes;

      const { data, error } = await sb
        .from("wines")
        .update(updateData)
        .eq("slug", slug)
        .select()
        .single();
      if (error || !data) return null;
      return data as unknown as Wine;
    }
  }

  // Legacy path: only custom wines can be edited
  const store = readStore();
  const idx = store.findIndex((w) => w.slug === slug);
  if (idx === -1) return null; // seed wines not editable in legacy mode
  if (store[idx].createdBy !== merchantSlug) return null; // ownership check

  const wine = store[idx];
  if (input.name !== undefined) wine.name = input.name;
  if (input.region_zh !== undefined) wine.region_zh = input.region_zh;
  if (input.region_en !== undefined) wine.region_en = input.region_en;
  if (input.grape_variety !== undefined) wine.grape_variety = input.grape_variety;
  if (input.vintage !== undefined) wine.vintage = input.vintage;
  if (input.description_zh !== undefined) wine.description_zh = input.description_zh;
  if (input.description_en !== undefined) wine.description_en = input.description_en;
  if (input.tags_zh !== undefined) wine.tags_zh = input.tags_zh;
  if (input.tags_en !== undefined) wine.tags_en = input.tags_en;
  if (input.tasting_notes !== undefined) wine.tasting_notes = input.tasting_notes;

  store[idx] = wine;
  writeStore(store);
  return wine;
}

/**
 * Soft-delete (delist) a wine. Returns true on success.
 */
export async function delistWine(slug: string, merchantSlug: string): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { error } = await sb
        .from("wines")
        .update({ is_delisted: true })
        .eq("slug", slug);
      return !error;
    }
  }

  // Legacy: only custom wines can be delisted
  const store = readStore();
  const idx = store.findIndex((w) => w.slug === slug);
  if (idx === -1) return false;
  if (store[idx].createdBy !== merchantSlug) return false;

  store[idx].isDelisted = true;
  writeStore(store);
  return true;
}

/**
 * Check if a slug already exists.
 */
export async function slugExists(slug: string): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb.from("wines").select("slug").eq("slug", slug).single();
      return !!data;
    }
  }

  const allSlugs = new Set([
    ...seedWines.map((w) => w.slug),
    ...readStore().map((w) => w.slug),
  ]);
  return allSlugs.has(slug);
}
