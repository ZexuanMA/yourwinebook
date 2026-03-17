// Wine type literals
export const WINE_TYPES = ["red", "white", "sparkling", "rosé", "dessert"] as const;
export type WineType = (typeof WINE_TYPES)[number];

// Tasting notes structure
export interface TastingNotes {
  appearance_zh?: string;
  appearance_en?: string;
  nose_zh?: string;
  nose_en?: string;
  palate_zh?: string;
  palate_en?: string;
  food_zh?: string[];
  food_en?: string[];
}

// Database row — mirrors Supabase schema
export interface WineRow {
  id: string;
  slug: string;
  name: string;
  type: WineType;
  region_zh: string;
  region_en: string;
  grape_variety: string | null;
  vintage: number | null;
  description_zh: string;
  description_en: string;
  tasting_notes: Record<string, unknown> | null;
  region_story_zh: string | null;
  region_story_en: string | null;
  min_price: number | null;
  merchant_count: number;
  emoji: string;
  badge: string | null;
  is_featured: boolean;
  created_at: string;
}

// Frontend wine model (used by mock-data and API responses)
export interface Wine {
  slug: string;
  name: string;
  region_zh: string;
  region_en: string;
  tags_zh: string[];
  tags_en: string[];
  description_zh: string;
  description_en: string;
  minPrice: number;
  merchantCount: number;
  emoji: string;
  badge?: string;
  type: WineType;
  grape_variety?: string;
  vintage?: number;
  is_featured?: boolean;
  tasting_notes?: TastingNotes;
  region_story_zh?: string;
  region_story_en?: string;
}

// Merchant price comparison
export interface MerchantPrice {
  merchant: string;
  merchantSlug: string;
  price: number;
  isBest: boolean;
}

// Database row for merchant prices
export interface MerchantPriceRow {
  id: string;
  wine_id: string;
  merchant_id: string;
  price: number;
  url: string | null;
  is_best: boolean;
  updated_at: string;
  merchants?: MerchantRow;
}

// Forward reference (avoid circular)
import type { MerchantRow } from "./merchant";

// Tag
export interface Tag {
  slug: string;
  name_zh: string;
  name_en: string;
}

export interface TagRow {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
}

// Filters for wine listing
export interface WineFilters {
  type?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest";
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedWines {
  wines: Wine[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
