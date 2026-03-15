import fs from "fs";
import path from "path";

export type EventType = "pageview" | "wine_view" | "price_click";

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

interface AnalyticsData {
  events: TrackEvent[];
}

const DATA_FILE = path.join(process.cwd(), "data", "analytics.json");
const MAX_EVENTS = 2000;

function readStore(): AnalyticsData {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as AnalyticsData;
  } catch {
    return { events: [] };
  }
}

function writeStore(data: AnalyticsData): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[analytics-store] write error:", err);
  }
}

export function trackEvent(event: TrackEvent): void {
  const data = readStore();
  data.events.push(event);
  if (data.events.length > MAX_EVENTS) {
    data.events = data.events.slice(-MAX_EVENTS);
  }
  writeStore(data);
}

export interface AnalyticsSummary {
  daily: Array<{ date: string; pageViews: number; visitors: number; sessions: number }>;
  pages: Array<{ path: string; label: string; views: number }>;
  wines: Array<{ slug: string; name: string; emoji: string; views: number; clickouts: number }>;
  recentPageViews: Array<{ id: string; path: string; label: string; sessionId: string; timestamp: string }>;
  totals: { pageViews: number; uniqueSessions: number; wineViews: number; priceClicks: number };
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const { events } = readStore();

  // Daily (last 30 days)
  const now = new Date();
  const dailyMap = new Map<string, { pageViews: number; sessionIds: Set<string> }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    dailyMap.set(key, { pageViews: 0, sessionIds: new Set() });
  }
  for (const e of events) {
    if (e.type !== "pageview") continue;
    const d = new Date(e.timestamp);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    const entry = dailyMap.get(key);
    if (entry) { entry.pageViews++; entry.sessionIds.add(e.sessionId); }
  }
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date, pageViews: v.pageViews, visitors: v.sessionIds.size, sessions: v.sessionIds.size,
  }));

  // Pages
  const pageMap = new Map<string, { label: string; views: number }>();
  for (const e of events) {
    if (e.type !== "pageview" || !e.path) continue;
    const existing = pageMap.get(e.path);
    if (existing) existing.views++;
    else pageMap.set(e.path, { label: e.pageLabel ?? e.path, views: 1 });
  }
  const pages = Array.from(pageMap.entries())
    .map(([p, v]) => ({ path: p, label: v.label, views: v.views }))
    .sort((a, b) => b.views - a.views).slice(0, 10);

  // Wines
  const wineMap = new Map<string, { name: string; emoji: string; views: number; clickouts: number }>();
  for (const e of events) {
    if (!e.wineSlug) continue;
    const existing = wineMap.get(e.wineSlug);
    if (existing) {
      if (e.type === "wine_view") existing.views++;
      if (e.type === "price_click") existing.clickouts++;
    } else {
      wineMap.set(e.wineSlug, { name: e.wineName ?? e.wineSlug, emoji: e.wineEmoji ?? "🍷", views: e.type === "wine_view" ? 1 : 0, clickouts: e.type === "price_click" ? 1 : 0 });
    }
  }
  const wines = Array.from(wineMap.entries())
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.views - a.views).slice(0, 10);

  // Recent page views (last 20)
  const recentPageViews = events
    .filter((e) => e.type === "pageview")
    .slice(-20).reverse()
    .map((e, i) => ({ id: String(i), path: e.path ?? "/", label: e.pageLabel ?? e.path ?? "/", sessionId: e.sessionId, timestamp: e.timestamp }));

  // Totals
  const allSessions = new Set(events.map((e) => e.sessionId));
  const totals = {
    pageViews: events.filter((e) => e.type === "pageview").length,
    uniqueSessions: allSessions.size,
    wineViews: events.filter((e) => e.type === "wine_view").length,
    priceClicks: events.filter((e) => e.type === "price_click").length,
  };

  return { daily, pages, wines, recentPageViews, totals };
}
