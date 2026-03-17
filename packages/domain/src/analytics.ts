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
