import { describe, it, expect } from "vitest";
import {
  wines,
  merchants,
  scenes,
  winePrices,
  partners,
} from "@/lib/mock-data";

describe("Mock wines", () => {
  it("has at least 30 wines", () => {
    expect(wines.length).toBeGreaterThanOrEqual(30);
  });

  it("each wine has required fields", () => {
    for (const w of wines) {
      expect(w.slug).toBeTruthy();
      expect(w.name).toBeTruthy();
      expect(w.region_zh).toBeTruthy();
      expect(w.region_en).toBeTruthy();
      expect(w.emoji).toBeTruthy();
      expect(["red", "white", "sparkling", "rosé", "dessert"]).toContain(w.type);
      expect(w.minPrice).toBeGreaterThan(0);
    }
  });

  it("wine slugs are unique", () => {
    const slugs = wines.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has featured wines", () => {
    const featured = wines.filter((w) => w.is_featured);
    expect(featured.length).toBeGreaterThan(0);
  });

  it("some wines have tasting notes", () => {
    const withNotes = wines.filter((w) => w.tasting_notes);
    expect(withNotes.length).toBeGreaterThan(0);
  });
});

describe("Mock merchants", () => {
  it("has 6 merchants", () => {
    expect(merchants.length).toBe(6);
  });

  it("merchant slugs are unique", () => {
    const slugs = merchants.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("each merchant has bilingual descriptions", () => {
    for (const m of merchants) {
      expect(m.description_zh).toBeTruthy();
      expect(m.description_en).toBeTruthy();
    }
  });
});

describe("Mock scenes", () => {
  it("has 4 scenes", () => {
    expect(scenes.length).toBe(4);
  });

  it("each scene has wine slugs", () => {
    for (const s of scenes) {
      expect(s.wineSlugs.length).toBeGreaterThan(0);
    }
  });

  it("scene slugs match expected values", () => {
    const slugs = scenes.map((s) => s.slug);
    expect(slugs).toContain("gift");
    expect(slugs).toContain("dinner");
    expect(slugs).toContain("everyday");
    expect(slugs).toContain("explore");
  });
});

describe("Mock wine prices", () => {
  it("has price data for some wines", () => {
    const keys = Object.keys(winePrices);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("each price entry has merchant and price", () => {
    for (const [slug, prices] of Object.entries(winePrices)) {
      expect(slug).toBeTruthy();
      for (const p of prices) {
        expect(p.merchant).toBeTruthy();
        expect(p.merchantSlug).toBeTruthy();
        expect(p.price).toBeGreaterThan(0);
        expect(typeof p.isBest).toBe("boolean");
      }
    }
  });

  it("each wine has exactly one best price", () => {
    for (const prices of Object.values(winePrices)) {
      const bestCount = prices.filter((p) => p.isBest).length;
      expect(bestCount).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Mock partners", () => {
  it("has partner names", () => {
    expect(partners.length).toBeGreaterThan(0);
    for (const p of partners) {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(0);
    }
  });
});

describe("Mock data types", () => {
  it("wines have consistent type values", () => {
    const validTypes = ["red", "white", "sparkling", "rosé", "dessert"];
    for (const w of wines) {
      expect(validTypes).toContain(w.type);
    }
  });
});
