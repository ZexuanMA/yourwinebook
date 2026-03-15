import type { Wine, Merchant, Scene, MerchantPrice } from "./mock-data";

/** Resolved wine data for display (locale already applied) */
export interface WineCardData {
  slug: string;
  name: string;
  region: string;
  tags: string[];
  description: string;
  minPrice: number;
  merchantCount: number;
  emoji: string;
  badge?: string;
}

/** Convert a bilingual Wine to a locale-specific WineCardData */
export function toWineCard(wine: Wine, locale: string): WineCardData {
  const isZh = locale === "zh-HK";
  return {
    slug: wine.slug,
    name: wine.name,
    region: isZh ? wine.region_zh : wine.region_en,
    tags: isZh ? wine.tags_zh : wine.tags_en,
    description: isZh ? wine.description_zh : wine.description_en,
    minPrice: wine.minPrice,
    merchantCount: wine.merchantCount,
    emoji: wine.emoji,
    badge: wine.badge,
  };
}

/** Get localized merchant description */
export function getMerchantLocale(merchant: Merchant, locale: string) {
  const isZh = locale === "zh-HK";
  return {
    ...merchant,
    description: isZh ? merchant.description_zh : merchant.description_en,
    details: isZh ? merchant.details_zh : merchant.details_en,
  };
}

/** Get localized scene */
export function getSceneLocale(scene: Scene, locale: string) {
  const isZh = locale === "zh-HK";
  return {
    slug: scene.slug,
    emoji: scene.emoji,
    title: isZh ? scene.title_zh : scene.title_en,
    description: isZh ? scene.description_zh : scene.description_en,
  };
}

/** Get localized tasting notes from a Wine */
export function getTastingNotes(wine: Wine, locale: string) {
  const isZh = locale === "zh-HK";
  const tn = wine.tasting_notes;
  if (!tn) return null;
  return {
    appearance: isZh ? tn.appearance_zh : tn.appearance_en,
    nose: isZh ? tn.nose_zh : tn.nose_en,
    palate: isZh ? tn.palate_zh : tn.palate_en,
    food: isZh ? tn.food_zh : tn.food_en,
  };
}

/** Get localized region story */
export function getRegionStory(wine: Wine, locale: string) {
  const isZh = locale === "zh-HK";
  return isZh ? wine.region_story_zh : wine.region_story_en;
}

/** Get full region string with grape variety */
export function getFullRegion(wine: Wine, locale: string) {
  const isZh = locale === "zh-HK";
  const region = isZh ? wine.region_zh : wine.region_en;
  if (wine.grape_variety) {
    return `${region} · ${wine.grape_variety}`;
  }
  return region;
}

/** Format price for display */
export function formatMerchantPrices(
  prices: MerchantPrice[] | undefined
): MerchantPrice[] {
  if (!prices || prices.length === 0) return [];
  return prices;
}
