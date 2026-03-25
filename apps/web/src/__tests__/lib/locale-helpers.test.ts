import { describe, it, expect } from "vitest";
import {
  toWineCard,
  getMerchantLocale,
  getSceneLocale,
  getTastingNotes,
  getRegionStory,
  getFullRegion,
  formatMerchantPrices,
} from "@/lib/locale-helpers";
import type { Wine, Merchant, Scene, MerchantPrice } from "@/lib/mock-data";

const sampleWine: Wine = {
  slug: "test-wine",
  name: "Test Cabernet",
  region_zh: "法國 · 波爾多",
  region_en: "France · Bordeaux",
  tags_zh: ["紅酒", "經典"],
  tags_en: ["Red", "Classic"],
  description_zh: "中文描述",
  description_en: "English description",
  minPrice: 198,
  merchantCount: 3,
  emoji: "🍷",
  badge: "Best Value",
  type: "red",
  grape_variety: "Cabernet Sauvignon",
  vintage: 2019,
  tasting_notes: {
    appearance_zh: "深紅色",
    appearance_en: "Deep ruby",
    nose_zh: "黑莓、雪松",
    nose_en: "Blackberry, cedar",
    palate_zh: "中等酒體",
    palate_en: "Medium body",
    food_zh: ["牛排", "羊肉"],
    food_en: ["Steak", "Lamb"],
  },
  region_story_zh: "波爾多的故事",
  region_story_en: "Story of Bordeaux",
};

const sampleMerchant: Merchant = {
  slug: "test-merchant",
  name: "Test Merchant",
  description_zh: "中文商家描述",
  description_en: "English merchant description",
  details_zh: ["自營倉庫", "全港送貨"],
  details_en: ["Own warehouse", "HK-wide delivery"],
  winesListed: 50,
  bestPrices: 10,
  rating: 4.5,
};

const sampleScene: Scene = {
  slug: "gift",
  title_zh: "送禮之選",
  title_en: "Gift Picks",
  description_zh: "送禮場景描述",
  description_en: "Gift scene description",
  emoji: "🎁",
  wineSlugs: ["test-wine"],
};

describe("toWineCard()", () => {
  it("returns zh-HK locale fields", () => {
    const card = toWineCard(sampleWine, "zh-HK");
    expect(card.region).toBe("法國 · 波爾多");
    expect(card.tags).toEqual(["紅酒", "經典"]);
    expect(card.description).toBe("中文描述");
    expect(card.slug).toBe("test-wine");
    expect(card.name).toBe("Test Cabernet");
    expect(card.minPrice).toBe(198);
    expect(card.merchantCount).toBe(3);
    expect(card.emoji).toBe("🍷");
    expect(card.badge).toBe("Best Value");
  });

  it("returns en locale fields", () => {
    const card = toWineCard(sampleWine, "en");
    expect(card.region).toBe("France · Bordeaux");
    expect(card.tags).toEqual(["Red", "Classic"]);
    expect(card.description).toBe("English description");
  });
});

describe("getMerchantLocale()", () => {
  it("returns zh-HK locale fields", () => {
    const m = getMerchantLocale(sampleMerchant, "zh-HK");
    expect(m.description).toBe("中文商家描述");
    expect(m.details).toEqual(["自營倉庫", "全港送貨"]);
    expect(m.slug).toBe("test-merchant");
  });

  it("returns en locale fields", () => {
    const m = getMerchantLocale(sampleMerchant, "en");
    expect(m.description).toBe("English merchant description");
    expect(m.details).toEqual(["Own warehouse", "HK-wide delivery"]);
  });
});

describe("getSceneLocale()", () => {
  it("returns zh-HK locale fields", () => {
    const s = getSceneLocale(sampleScene, "zh-HK");
    expect(s.title).toBe("送禮之選");
    expect(s.description).toBe("送禮場景描述");
    expect(s.emoji).toBe("🎁");
    expect(s.slug).toBe("gift");
  });

  it("returns en locale fields", () => {
    const s = getSceneLocale(sampleScene, "en");
    expect(s.title).toBe("Gift Picks");
    expect(s.description).toBe("Gift scene description");
  });
});

describe("getTastingNotes()", () => {
  it("returns zh-HK tasting notes", () => {
    const tn = getTastingNotes(sampleWine, "zh-HK");
    expect(tn).not.toBeNull();
    expect(tn!.appearance).toBe("深紅色");
    expect(tn!.nose).toBe("黑莓、雪松");
    expect(tn!.palate).toBe("中等酒體");
    expect(tn!.food).toEqual(["牛排", "羊肉"]);
  });

  it("returns en tasting notes", () => {
    const tn = getTastingNotes(sampleWine, "en");
    expect(tn!.appearance).toBe("Deep ruby");
    expect(tn!.food).toEqual(["Steak", "Lamb"]);
  });

  it("returns null when wine has no tasting notes", () => {
    const noTn = { ...sampleWine, tasting_notes: undefined };
    expect(getTastingNotes(noTn, "zh-HK")).toBeNull();
  });
});

describe("getRegionStory()", () => {
  it("returns zh-HK story", () => {
    expect(getRegionStory(sampleWine, "zh-HK")).toBe("波爾多的故事");
  });

  it("returns en story", () => {
    expect(getRegionStory(sampleWine, "en")).toBe("Story of Bordeaux");
  });

  it("returns undefined when no story", () => {
    const noStory = { ...sampleWine, region_story_zh: undefined, region_story_en: undefined };
    expect(getRegionStory(noStory, "zh-HK")).toBeUndefined();
  });
});

describe("getFullRegion()", () => {
  it("includes grape variety when available", () => {
    expect(getFullRegion(sampleWine, "en")).toBe("France · Bordeaux · Cabernet Sauvignon");
  });

  it("returns region only when no grape variety", () => {
    const noGrape = { ...sampleWine, grape_variety: undefined };
    expect(getFullRegion(noGrape, "zh-HK")).toBe("法國 · 波爾多");
  });
});

describe("formatMerchantPrices()", () => {
  it("returns empty array for undefined", () => {
    expect(formatMerchantPrices(undefined)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(formatMerchantPrices([])).toEqual([]);
  });

  it("passes through valid prices", () => {
    const prices: MerchantPrice[] = [
      { merchant: "A", merchantSlug: "a", price: 100, isBest: true },
      { merchant: "B", merchantSlug: "b", price: 120, isBest: false },
    ];
    expect(formatMerchantPrices(prices)).toEqual(prices);
  });
});
