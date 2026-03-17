/**
 * React Query key factory.
 * Shared across Web and Mobile to ensure consistent cache keys.
 *
 * Convention: each entity has a "root" key (list scope) and specific sub-keys.
 * Use .all for list queries, .detail(slug) for single items, etc.
 */

export const wineKeys = {
  all: ["wines"] as const,
  lists: () => [...wineKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...wineKeys.lists(), filters] as const,
  details: () => [...wineKeys.all, "detail"] as const,
  detail: (slug: string) => [...wineKeys.details(), slug] as const,
  prices: (slug: string) => [...wineKeys.all, "prices", slug] as const,
  similar: (slug: string) => [...wineKeys.all, "similar", slug] as const,
  featured: () => [...wineKeys.all, "featured"] as const,
  search: (query: string) => [...wineKeys.all, "search", query] as const,
  regions: () => [...wineKeys.all, "regions"] as const,
};

export const merchantKeys = {
  all: ["merchants"] as const,
  lists: () => [...merchantKeys.all, "list"] as const,
  details: () => [...merchantKeys.all, "detail"] as const,
  detail: (slug: string) => [...merchantKeys.details(), slug] as const,
  wines: (slug: string) => [...merchantKeys.all, "wines", slug] as const,
  stats: (slug: string) => [...merchantKeys.all, "stats", slug] as const,
};

export const sceneKeys = {
  all: ["scenes"] as const,
  wines: (slug: string) => [...sceneKeys.all, "wines", slug] as const,
};

export const storeKeys = {
  all: ["stores"] as const,
  nearby: (lat: number, lng: number, radius?: number) =>
    [...storeKeys.all, "nearby", { lat, lng, radius }] as const,
  detail: (id: string) => [...storeKeys.all, "detail", id] as const,
};

export const postKeys = {
  all: ["posts"] as const,
  feed: (cursor?: string) => [...postKeys.all, "feed", cursor] as const,
  detail: (id: string) => [...postKeys.all, "detail", id] as const,
  comments: (postId: string) => [...postKeys.all, "comments", postId] as const,
  userPosts: (userId: string) => [...postKeys.all, "user", userId] as const,
};

export const profileKeys = {
  me: ["profile", "me"] as const,
  user: (id: string) => ["profile", id] as const,
  bookmarks: () => ["profile", "bookmarks"] as const,
  wineBookmarks: () => ["profile", "bookmarks", "wines"] as const,
  merchantBookmarks: () => ["profile", "bookmarks", "merchants"] as const,
  storeBookmarks: () => ["profile", "bookmarks", "stores"] as const,
  postBookmarks: () => ["profile", "bookmarks", "posts"] as const,
};

export const applicationKeys = {
  all: ["applications"] as const,
  detail: (id: string) => [...applicationKeys.all, id] as const,
};

export const analyticsKeys = {
  summary: ["analytics", "summary"] as const,
  merchants: ["analytics", "merchants"] as const,
  merchant: (slug: string) => ["analytics", "merchant", slug] as const,
};
