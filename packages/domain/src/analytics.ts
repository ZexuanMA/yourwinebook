// ── PostHog event names (shared across Web & Mobile) ──

/** Store funnel events */
export const STORE_EVENTS = {
  LOCATION_PERMISSION_REQUESTED: "location_permission_requested",
  LOCATION_PERMISSION_GRANTED: "location_permission_granted",
  LOCATION_PERMISSION_DENIED: "location_permission_denied",
  STORE_LIST_VIEWED: "store_list_viewed",
  STORE_CARD_CLICKED: "store_card_clicked",
  STORE_DETAIL_VIEWED: "store_detail_viewed",
  STORE_BOOKMARKED: "store_bookmarked",
  STORE_UNBOOKMARKED: "store_unbookmarked",
  STORE_NAVIGATE_CLICKED: "store_navigate_clicked",
} as const;

/** Community funnel events */
export const COMMUNITY_EVENTS = {
  FEED_VIEWED: "feed_viewed",
  POST_CARD_CLICKED: "post_card_clicked",
  POST_DETAIL_VIEWED: "post_detail_viewed",
  POST_CREATE_STARTED: "post_create_started",
  POST_CREATE_SUBMITTED: "post_create_submitted",
  POST_CREATE_SUCCESS: "post_create_success",
  POST_CREATE_FAILED: "post_create_failed",
  POST_LIKED: "post_liked",
  POST_UNLIKED: "post_unliked",
  POST_BOOKMARKED: "post_bookmarked",
  POST_UNBOOKMARKED: "post_unbookmarked",
  COMMENT_SUBMITTED: "comment_submitted",
  COMMENT_SUCCESS: "comment_success",
  COMMENT_FAILED: "comment_failed",
  REPORT_SUBMITTED: "report_submitted",
  USER_BLOCKED: "user_blocked",
  USER_UNBLOCKED: "user_unblocked",
} as const;

/** Auth events */
export const AUTH_EVENTS = {
  LOGIN: "user_logged_in",
  REGISTER: "user_registered",
  LOGOUT: "user_logged_out",
} as const;

// ── Legacy analytics (SQLite-based, Web only) ──

// Event types
export const EVENT_TYPES = ["pageview", "wine_view", "price_click"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Track event payload
export interface TrackEvent {
  type: EventType;
  path?: string;
  pageLabel?: string;
  wineSlug?: string;
  wineName?: string;
  wineEmoji?: string;
  merchant?: string;
  sessionId: string;
  timestamp: string;
}

// Admin analytics summary
export interface AnalyticsSummary {
  daily: Array<{ date: string; pageViews: number; visitors: number; sessions: number }>;
  pages: Array<{ path: string; label: string; views: number }>;
  wines: Array<{ slug: string; name: string; emoji: string; views: number; clickouts: number }>;
  recentPageViews: Array<{ id: string; path: string; label: string; sessionId: string; timestamp: string }>;
  totals: { pageViews: number; uniqueSessions: number; wineViews: number; priceClicks: number };
}

// Merchant analytics summary
export interface MerchantAnalyticsSummary {
  wineStats: Array<{ slug: string; name: string; emoji: string; views: number; clickouts: number }>;
  totals: { wineViews: number; priceClicks: number };
  recentClicks: Array<{ wineSlug: string; wineName: string; wineEmoji: string; sessionId: string; timestamp: string }>;
}

// Per-merchant stats for admin dashboard
export interface PerMerchantStats {
  slug: string;
  wineViews: number;
  priceClicks: number;
}
