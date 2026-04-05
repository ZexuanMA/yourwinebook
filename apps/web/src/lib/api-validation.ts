import { z } from "zod";

// ── Wine list filters ────────────────────────────────────────────────────────

export const wineFiltersSchema = z.object({
  type: z.enum(["red", "white", "sparkling", "rosé", "dessert"]).optional(),
  region: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "name_asc", "name_desc", "newest"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

// ── Pagination (community posts, etc.) ───────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Community posts GET ──────────────────────────────────────────────────────

export const communityPostsQuerySchema = paginationSchema.extend({
  authorId: z.string().optional(),
  authorType: z.enum(["user", "merchant"]).optional(),
  wineSlug: z.string().optional(),
  tag: z.string().optional(),
});

// ── Community post creation ──────────────────────────────────────────────────

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  wineSlug: z.string().optional(),
  wineName: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).default([]),
});

// ── Auth: login ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Auth: register ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().optional(),
});

// ── Password change ──────────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// ── Admin moderate ───────────────────────────────────────────────────────────

export const moderateSchema = z.object({
  action: z.enum(["hide_post", "unhide_post", "hide_comment", "unhide_comment", "ban_user", "unban_user"]),
  target_id: z.string().min(1),
  reason: z.string().optional(),
});

// ── Merchant store creation ──────────────────────────────────────────────────

export const createStoreSchema = z.object({
  name: z.string().min(1),
  address_zh: z.string().min(1),
  address_en: z.string().optional(),
  district_zh: z.string().optional(),
  district_en: z.string().optional(),
  phone: z.string().optional(),
  hours: z.record(z.string(), z.unknown()).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

// ── Helper: parse search params into a plain object ──────────────────────────

export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}
