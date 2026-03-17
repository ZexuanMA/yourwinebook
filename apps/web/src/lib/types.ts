// Database row types — mirrors the Supabase schema.
// Used by queries.ts to type Supabase responses.

export interface WineRow {
  id: string;
  slug: string;
  name: string;
  type: "red" | "white" | "sparkling" | "rosé" | "dessert";
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

export interface MerchantRow {
  id: string;
  slug: string;
  name: string;
  description_zh: string;
  description_en: string;
  details_zh: string[];
  details_en: string[];
  wines_listed: number;
  best_prices: number;
  rating: number;
  website: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface SceneRow {
  id: string;
  slug: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  emoji: string;
  created_at: string;
}

export interface MerchantPriceRow {
  id: string;
  wine_id: string;
  merchant_id: string;
  price: number;
  url: string | null;
  is_best: boolean;
  updated_at: string;
  // Joined fields
  merchants?: MerchantRow;
}

export interface TagRow {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
}

export interface MerchantApplicationInput {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  wine_count?: number;
  message?: string;
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
  wines: import("./mock-data").Wine[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
