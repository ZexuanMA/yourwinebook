import { getSupabase } from "./supabase";
import {
  wines as mockWines,
  merchants as mockMerchants,
  scenes as mockScenes,
  partners as mockPartners,
} from "./mock-data";
import { getMergedPrices, getUpdatedMinPrice } from "./price-store";
import type { Wine, Merchant, MerchantPrice, Scene } from "./mock-data";
import type { WineFilters, PaginatedWines, MerchantApplicationInput } from "./types";

// ============================================================
// Helpers
// ============================================================

/** Apply price-store overrides to wine minPrice values */
async function applyPriceUpdates(wineList: Wine[]): Promise<Wine[]> {
  const updates = await Promise.all(
    wineList.map(async (w) => {
      const updated = await getUpdatedMinPrice(w.slug);
      return updated !== null ? { ...w, minPrice: updated } : w;
    })
  );
  return updates;
}

// ============================================================
// Wines
// ============================================================

export async function getWines(filters?: WineFilters): Promise<Wine[]> {
  const paginated = await getWinesPaginated(filters);
  return paginated.wines;
}

export async function getWinesPaginated(filters?: WineFilters): Promise<PaginatedWines> {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const sort = filters?.sort ?? "name_asc";

  const sb = getSupabase();
  if (sb) {
    let query = sb.from("wines").select("*", { count: "exact" });
    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,region_zh.ilike.%${filters.search}%,region_en.ilike.%${filters.search}%,grape_variety.ilike.%${filters.search}%`
      );
    }
    if (filters?.region) {
      query = query.or(
        `region_zh.ilike.%${filters.region}%,region_en.ilike.%${filters.region}%`
      );
    }
    if (filters?.minPrice) query = query.gte("min_price", filters.minPrice);
    if (filters?.maxPrice) query = query.lte("min_price", filters.maxPrice);

    // Sorting
    const [field, dir] = sortToSupabase(sort);
    query = query.order(field, { ascending: dir === "asc" });

    // Pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, count } = await query;
    if (data) {
      const total = count ?? data.length;
      return {
        wines: data.map(rowToWine),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  }

  // Mock data path — apply price overrides
  let result = await applyPriceUpdates([...mockWines]);
  if (filters?.type) result = result.filter((w) => w.type === filters.type);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (w) =>
        w.name.toLowerCase().includes(s) ||
        w.region_zh.toLowerCase().includes(s) ||
        w.region_en.toLowerCase().includes(s) ||
        (w.grape_variety?.toLowerCase().includes(s) ?? false)
    );
  }
  if (filters?.region) {
    const r = filters.region.toLowerCase();
    result = result.filter(
      (w) =>
        w.region_zh.toLowerCase().includes(r) ||
        w.region_en.toLowerCase().includes(r)
    );
  }
  if (filters?.minPrice) result = result.filter((w) => w.minPrice >= filters.minPrice!);
  if (filters?.maxPrice) result = result.filter((w) => w.minPrice <= filters.maxPrice!);

  // Sort
  result.sort((a, b) => {
    switch (sort) {
      case "price_asc": return a.minPrice - b.minPrice;
      case "price_desc": return b.minPrice - a.minPrice;
      case "name_desc": return b.name.localeCompare(a.name);
      case "newest": return (b.vintage ?? 0) - (a.vintage ?? 0);
      case "name_asc":
      default: return a.name.localeCompare(b.name);
    }
  });

  const total = result.length;
  const start = (page - 1) * limit;
  const paged = result.slice(start, start + limit);

  return { wines: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
}

function sortToSupabase(sort: string): [string, string] {
  switch (sort) {
    case "price_asc": return ["min_price", "asc"];
    case "price_desc": return ["min_price", "desc"];
    case "name_desc": return ["name", "desc"];
    case "newest": return ["vintage", "desc"];
    case "name_asc":
    default: return ["name", "asc"];
  }
}

/** Get unique regions from wine data (for filter dropdown) */
export async function getRegions(): Promise<string[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from("wines").select("region_en");
    if (data) {
      const regions = new Set(data.map((r: { region_en: string }) => {
        // Extract country from "Country · Subregion · Type"
        const parts = r.region_en.split(" · ");
        return parts[0];
      }));
      return [...regions].sort();
    }
  }
  // Mock
  const regions = new Set(
    mockWines.map((w) => {
      const parts = w.region_en.split(" · ");
      return parts[0];
    })
  );
  return [...regions].sort();
}

/** Search suggestions for autocomplete */
export async function getSearchSuggestions(query: string): Promise<{ name: string; slug: string; type: string }[]> {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();

  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("wines")
      .select("name, slug, type")
      .or(`name.ilike.%${query}%,grape_variety.ilike.%${query}%`)
      .limit(6);
    if (data) return data;
  }

  return mockWines
    .filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.grape_variety?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, 6)
    .map((w) => ({ name: w.name, slug: w.slug, type: w.type }));
}

export async function getWineBySlug(slug: string): Promise<Wine | null> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from("wines").select("*").eq("slug", slug).single();
    if (data) return rowToWine(data);
    return null;
  }
  const wine = mockWines.find((w) => w.slug === slug) ?? null;
  if (!wine) return null;
  const updated = await getUpdatedMinPrice(wine.slug);
  return updated !== null ? { ...wine, minPrice: updated } : wine;
}

export async function getFeaturedWines(): Promise<Wine[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("wines")
      .select("*")
      .eq("is_featured", true)
      .order("name")
      .limit(3);
    if (data) return data.map(rowToWine);
  }
  return await applyPriceUpdates(mockWines.filter((w) => w.is_featured).slice(0, 3));
}

export async function getSimilarWines(slug: string, limit = 3): Promise<Wine[]> {
  const sb = getSupabase();
  if (sb) {
    const { data: wine } = await sb.from("wines").select("type").eq("slug", slug).single();
    if (wine) {
      const { data } = await sb
        .from("wines")
        .select("*")
        .eq("type", wine.type)
        .neq("slug", slug)
        .limit(limit);
      if (data) return data.map(rowToWine);
    }
  }
  const current = mockWines.find((w) => w.slug === slug);
  if (!current) return await applyPriceUpdates(mockWines.slice(0, limit));
  return await applyPriceUpdates(
    mockWines
      .filter((w) => w.slug !== slug && w.type === current.type)
      .slice(0, limit)
  );
}

// ============================================================
// Wine Prices
// ============================================================

export async function getWinePrices(slug: string): Promise<MerchantPrice[]> {
  const sb = getSupabase();
  if (sb) {
    const { data: wine } = await sb.from("wines").select("id").eq("slug", slug).single();
    if (wine) {
      const { data } = await sb
        .from("merchant_prices")
        .select("*, merchants(name, slug)")
        .eq("wine_id", wine.id)
        .order("price");
      if (data) {
        return data.map((row: Record<string, unknown>) => ({
          merchant: (row.merchants as Record<string, string>)?.name ?? "",
          merchantSlug: (row.merchants as Record<string, string>)?.slug ?? "",
          price: row.price as number,
          isBest: row.is_best as boolean,
        }));
      }
    }
  }
  return await getMergedPrices(slug);
}

// ============================================================
// Merchants
// ============================================================

export async function getMerchants(): Promise<Merchant[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from("merchants").select("*").order("name");
    if (data) return data.map(rowToMerchant);
  }
  return mockMerchants;
}

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from("merchants").select("*").eq("slug", slug).single();
    if (data) return rowToMerchant(data);
    return null;
  }
  return mockMerchants.find((m) => m.slug === slug) ?? null;
}

export async function getMerchantWines(merchantSlug: string): Promise<Wine[]> {
  const sb = getSupabase();
  if (sb) {
    const { data: merchant } = await sb
      .from("merchants")
      .select("id")
      .eq("slug", merchantSlug)
      .single();
    if (merchant) {
      const { data: prices } = await sb
        .from("merchant_prices")
        .select("wine_id")
        .eq("merchant_id", merchant.id);
      if (prices && prices.length > 0) {
        const wineIds = prices.map((p: { wine_id: string }) => p.wine_id);
        const { data: wineData } = await sb
          .from("wines")
          .select("*")
          .in("id", wineIds);
        if (wineData) return wineData.map(rowToWine);
      }
    }
  }
  // For mock: return all wines (merchants share the same catalog)
  return await applyPriceUpdates([...mockWines]);
}

export async function getPartners(): Promise<string[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from("merchants").select("name").order("name");
    if (data) return data.map((m: { name: string }) => m.name);
  }
  return mockPartners;
}

// ============================================================
// Scenes
// ============================================================

export async function getScenes(): Promise<Scene[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from("scenes").select("*").order("created_at");
    if (data) {
      // Need to also fetch wine associations
      const scenesWithWines: Scene[] = [];
      for (const row of data) {
        const { data: sw } = await sb
          .from("scene_wines")
          .select("wines(slug)")
          .eq("scene_id", row.id)
          .order("sort_order");
        scenesWithWines.push({
          slug: row.slug,
          title_zh: row.title_zh,
          title_en: row.title_en,
          description_zh: row.description_zh,
          description_en: row.description_en,
          emoji: row.emoji,
          wineSlugs: sw?.map((s: Record<string, unknown>) => (s.wines as { slug: string })?.slug).filter(Boolean) ?? [],
        });
      }
      return scenesWithWines;
    }
  }
  return mockScenes;
}

export async function getSceneBySlug(slug: string): Promise<Scene | null> {
  const scenes = await getScenes();
  return scenes.find((s) => s.slug === slug) ?? null;
}

export async function getSceneWines(sceneSlug: string): Promise<Wine[]> {
  const scene = await getSceneBySlug(sceneSlug);
  if (!scene) return [];
  const allWines = await getWines();
  return scene.wineSlugs
    .map((slug) => allWines.find((w) => w.slug === slug))
    .filter((w): w is Wine => !!w);
}

// ============================================================
// Merchant Applications
// ============================================================

export async function submitMerchantApplication(
  input: MerchantApplicationInput
): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("merchant_applications").insert(input);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
  // Mock: just succeed
  console.log("Mock merchant application submitted:", input);
  return { success: true };
}

// ============================================================
// Row → Domain converters
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToWine(row: any): Wine {
  const tn = row.tasting_notes as Record<string, unknown> | null;
  return {
    slug: row.slug,
    name: row.name,
    type: row.type,
    region_zh: row.region_zh,
    region_en: row.region_en,
    grape_variety: row.grape_variety ?? undefined,
    vintage: row.vintage ?? undefined,
    tags_zh: (row.tags_zh as string[]) ?? [],
    tags_en: (row.tags_en as string[]) ?? [],
    description_zh: row.description_zh,
    description_en: row.description_en,
    minPrice: row.min_price ?? 0,
    merchantCount: row.merchant_count ?? 0,
    emoji: row.emoji ?? "🍷",
    badge: row.badge ?? undefined,
    is_featured: row.is_featured ?? false,
    tasting_notes: tn
      ? {
          appearance_zh: tn.appearance_zh as string | undefined,
          appearance_en: tn.appearance_en as string | undefined,
          nose_zh: tn.nose_zh as string | undefined,
          nose_en: tn.nose_en as string | undefined,
          palate_zh: tn.palate_zh as string | undefined,
          palate_en: tn.palate_en as string | undefined,
          food_zh: tn.food_zh as string[] | undefined,
          food_en: tn.food_en as string[] | undefined,
        }
      : undefined,
    region_story_zh: row.region_story_zh ?? undefined,
    region_story_en: row.region_story_en ?? undefined,
  };
}

function rowToMerchant(row: any): Merchant {
  return {
    slug: row.slug,
    name: row.name,
    description_zh: row.description_zh,
    description_en: row.description_en,
    details_zh: row.details_zh ?? [],
    details_en: row.details_en ?? [],
    winesListed: row.wines_listed ?? 0,
    bestPrices: row.best_prices ?? 0,
    rating: row.rating ?? 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
