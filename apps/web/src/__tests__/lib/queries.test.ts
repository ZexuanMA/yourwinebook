import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase to return null (force mock data path)
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => null,
}));

// Mock price-store to avoid file I/O
vi.mock("@/lib/price-store", () => ({
  getMergedPrices: vi.fn().mockResolvedValue([]),
  getUpdatedMinPrice: vi.fn().mockResolvedValue(null),
}));

import {
  getWinesPaginated,
  getWineBySlug,
  getFeaturedWines,
  getSimilarWines,
  getMerchants,
  getMerchantBySlug,
  getScenes,
  getRegions,
  getSearchSuggestions,
  getPartners,
  getSceneWines,
} from "@/lib/queries";

describe("getWinesPaginated() — mock data path", () => {
  it("returns paginated results", async () => {
    const result = await getWinesPaginated({ page: 1, limit: 5 });
    expect(result.wines.length).toBeLessThanOrEqual(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.total).toBeGreaterThan(0);
    expect(result.totalPages).toBeGreaterThan(0);
  });

  it("filters by type", async () => {
    const result = await getWinesPaginated({ type: "red" });
    for (const w of result.wines) {
      expect(w.type).toBe("red");
    }
  });

  it("filters by search keyword", async () => {
    const result = await getWinesPaginated({ search: "Cabernet" });
    expect(result.wines.length).toBeGreaterThan(0);
    for (const w of result.wines) {
      const match =
        w.name.toLowerCase().includes("cabernet") ||
        w.region_zh.toLowerCase().includes("cabernet") ||
        w.region_en.toLowerCase().includes("cabernet") ||
        (w.grape_variety?.toLowerCase().includes("cabernet") ?? false);
      expect(match).toBe(true);
    }
  });

  it("sorts by price ascending", async () => {
    const result = await getWinesPaginated({ sort: "price_asc" });
    for (let i = 1; i < result.wines.length; i++) {
      expect(result.wines[i].minPrice).toBeGreaterThanOrEqual(result.wines[i - 1].minPrice);
    }
  });

  it("sorts by price descending", async () => {
    const result = await getWinesPaginated({ sort: "price_desc" });
    for (let i = 1; i < result.wines.length; i++) {
      expect(result.wines[i].minPrice).toBeLessThanOrEqual(result.wines[i - 1].minPrice);
    }
  });

  it("filters by price range", async () => {
    const result = await getWinesPaginated({ minPrice: 100, maxPrice: 300 });
    for (const w of result.wines) {
      expect(w.minPrice).toBeGreaterThanOrEqual(100);
      expect(w.minPrice).toBeLessThanOrEqual(300);
    }
  });

  it("paginates correctly", async () => {
    const p1 = await getWinesPaginated({ page: 1, limit: 3 });
    const p2 = await getWinesPaginated({ page: 2, limit: 3 });
    if (p1.total > 3) {
      // Pages should have different wines
      const p1Slugs = p1.wines.map((w) => w.slug);
      const p2Slugs = p2.wines.map((w) => w.slug);
      const overlap = p1Slugs.filter((s) => p2Slugs.includes(s));
      expect(overlap.length).toBe(0);
    }
  });
});

describe("getWineBySlug() — mock data path", () => {
  it("returns wine for valid slug", async () => {
    const wines = await getWinesPaginated({ limit: 1 });
    if (wines.wines.length > 0) {
      const wine = await getWineBySlug(wines.wines[0].slug);
      expect(wine).not.toBeNull();
      expect(wine!.slug).toBe(wines.wines[0].slug);
    }
  });

  it("returns null for non-existent slug", async () => {
    const wine = await getWineBySlug("non-existent-wine-slug-12345");
    expect(wine).toBeNull();
  });
});

describe("getFeaturedWines() — mock data path", () => {
  it("returns featured wines (max 3)", async () => {
    const featured = await getFeaturedWines();
    expect(featured.length).toBeLessThanOrEqual(3);
    for (const w of featured) {
      expect(w.is_featured).toBe(true);
    }
  });
});

describe("getSimilarWines() — mock data path", () => {
  it("returns wines of same type excluding the target", async () => {
    const all = await getWinesPaginated({ limit: 50 });
    const target = all.wines.find((w) => w.type === "red");
    if (target) {
      const similar = await getSimilarWines(target.slug, 3);
      expect(similar.length).toBeLessThanOrEqual(3);
      for (const w of similar) {
        expect(w.slug).not.toBe(target.slug);
        expect(w.type).toBe("red");
      }
    }
  });
});

describe("getMerchants() — mock data path", () => {
  it("returns merchant list", async () => {
    const merchants = await getMerchants();
    expect(merchants.length).toBeGreaterThan(0);
    for (const m of merchants) {
      expect(m.slug).toBeDefined();
      expect(m.name).toBeDefined();
    }
  });
});

describe("getMerchantBySlug() — mock data path", () => {
  it("returns merchant for valid slug", async () => {
    const merchants = await getMerchants();
    const m = await getMerchantBySlug(merchants[0].slug);
    expect(m).not.toBeNull();
    expect(m!.slug).toBe(merchants[0].slug);
  });

  it("returns null for invalid slug", async () => {
    const m = await getMerchantBySlug("non-existent-merchant");
    expect(m).toBeNull();
  });
});

describe("getScenes() — mock data path", () => {
  it("returns scene list", async () => {
    const scenes = await getScenes();
    expect(scenes.length).toBeGreaterThan(0);
    for (const s of scenes) {
      expect(s.slug).toBeDefined();
      expect(s.emoji).toBeDefined();
    }
  });
});

describe("getSceneWines() — mock data path", () => {
  it("returns wines for a valid scene", async () => {
    const scenes = await getScenes();
    if (scenes.length > 0 && scenes[0].wineSlugs.length > 0) {
      const wines = await getSceneWines(scenes[0].slug);
      expect(wines.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array for non-existent scene", async () => {
    const wines = await getSceneWines("non-existent-scene");
    expect(wines).toEqual([]);
  });
});

describe("getRegions() — mock data path", () => {
  it("returns sorted region list", async () => {
    const regions = await getRegions();
    expect(regions.length).toBeGreaterThan(0);
    // Check sorted
    for (let i = 1; i < regions.length; i++) {
      expect(regions[i] >= regions[i - 1]).toBe(true);
    }
  });
});

describe("getSearchSuggestions() — mock data path", () => {
  it("returns suggestions for valid query", async () => {
    const suggestions = await getSearchSuggestions("cab");
    // Should find Cabernet-related wines
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(s.name).toBeDefined();
      expect(s.slug).toBeDefined();
    }
  });

  it("returns max 6 suggestions", async () => {
    const suggestions = await getSearchSuggestions("a");
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });

  it("returns empty for short query", async () => {
    const suggestions = await getSearchSuggestions("a");
    // "a" is 1 char, but the function checks length < 2
    expect(suggestions).toEqual([]);
  });

  it("returns empty for empty query", async () => {
    const suggestions = await getSearchSuggestions("");
    expect(suggestions).toEqual([]);
  });
});

describe("getPartners() — mock data path", () => {
  it("returns partner names", async () => {
    const partners = await getPartners();
    expect(partners.length).toBeGreaterThan(0);
    for (const p of partners) {
      expect(typeof p).toBe("string");
    }
  });
});
