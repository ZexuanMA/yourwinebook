// Merchant statuses
export const MERCHANT_STATUSES = ["active", "inactive", "pending"] as const;
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];

// Database row — mirrors Supabase schema
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

// Frontend merchant model
export interface Merchant {
  slug: string;
  name: string;
  description_zh: string;
  description_en: string;
  details_zh: string[];
  details_en: string[];
  winesListed: number;
  bestPrices: number;
  rating: number;
}

// Merchant account (stored, includes password)
export interface StoredMerchant {
  slug: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  description?: string;
  status: MerchantStatus;
  joinDate: string;
  preferredLang?: Locale;
}

// Merchant account (public, no password)
export type PublicMerchant = Omit<StoredMerchant, "password"> & { role: "merchant" };

import type { Locale } from "./common";
