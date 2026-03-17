/**
 * SQLite-backed analytics store.
 *
 * Why SQLite + WAL:
 *  - WAL mode: concurrent reads never block, writes serialised at OS level — safe at 400+ concurrency
 *  - Raw events kept forever (no MAX_EVENTS cap)
 *  - SQL aggregations are orders of magnitude faster than JS array scans
 *  - No external service required; trivial to migrate to Postgres later
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ── DB init ───────────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "data", "analytics.db");

function openDb(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);

  // WAL mode: readers and writers don't block each other
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL"); // safe with WAL, ~3× faster than FULL

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      type        TEXT NOT NULL,
      path        TEXT,
      page_label  TEXT,
      wine_slug   TEXT,
      wine_name   TEXT,
      wine_emoji  TEXT,
      merchant    TEXT,
      session_id  TEXT NOT NULL,
      timestamp   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_type      ON events (type);
    CREATE INDEX IF NOT EXISTS idx_ts        ON events (timestamp);
    CREATE INDEX IF NOT EXISTS idx_wine_slug ON events (wine_slug);
    CREATE INDEX IF NOT EXISTS idx_merchant  ON events (merchant);
    CREATE INDEX IF NOT EXISTS idx_session   ON events (session_id);
  `);

  return db;
}

// Singleton — reuse the connection across hot-reloads in dev
const globalForDb = global as unknown as { _analyticsDb?: Database.Database };
function getDb(): Database.Database {
  if (!globalForDb._analyticsDb || !globalForDb._analyticsDb.open) {
    globalForDb._analyticsDb = openDb();
  }
  return globalForDb._analyticsDb;
}

// ── Types (public, unchanged so API routes need no edits) ─────────────────────

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

// ── Write ─────────────────────────────────────────────────────────────────────

export function trackEvent(event: TrackEvent): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO events (type, path, page_label, wine_slug, wine_name, wine_emoji, merchant, session_id, timestamp)
    VALUES (@type, @path, @pageLabel, @wineSlug, @wineName, @wineEmoji, @merchant, @sessionId, @timestamp)
  `).run(event);
}

// ── Admin analytics summary ───────────────────────────────────────────────────

export interface AnalyticsSummary {
  daily: Array<{ date: string; pageViews: number; visitors: number; sessions: number }>;
  pages: Array<{ path: string; label: string; views: number }>;
  wines: Array<{ slug: string; name: string; emoji: string; views: number; clickouts: number }>;
  recentPageViews: Array<{ id: string; path: string; label: string; sessionId: string; timestamp: string }>;
  totals: { pageViews: number; uniqueSessions: number; wineViews: number; priceClicks: number };
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getDb();

  // Daily — last 30 days (SQLite date functions work on ISO strings)
  const dailyRows = db.prepare(`
    SELECT
      strftime('%m/%d', timestamp) AS date,
      COUNT(CASE WHEN type = 'pageview' THEN 1 END) AS pageViews,
      COUNT(DISTINCT CASE WHEN type = 'pageview' THEN session_id END) AS visitors
    FROM events
    WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY strftime('%Y-%m-%d', timestamp)
    ORDER BY strftime('%Y-%m-%d', timestamp)
  `).all() as Array<{ date: string; pageViews: number; visitors: number }>;

  // Fill gaps so the chart always has 30 data points
  const dailyMap = new Map<string, { pageViews: number; visitors: number }>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    dailyMap.set(key, { pageViews: 0, visitors: 0 });
  }
  for (const r of dailyRows) dailyMap.set(r.date, { pageViews: r.pageViews, visitors: r.visitors });
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date, pageViews: v.pageViews, visitors: v.visitors, sessions: v.visitors,
  }));

  // Top pages
  const pages = (db.prepare(`
    SELECT path, page_label AS label, COUNT(*) AS views
    FROM events
    WHERE type = 'pageview' AND path IS NOT NULL
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10
  `).all() as Array<{ path: string; label: string; views: number }>);

  // Top wines
  const wines = (db.prepare(`
    SELECT
      wine_slug AS slug,
      MAX(wine_name) AS name,
      MAX(wine_emoji) AS emoji,
      COUNT(CASE WHEN type = 'wine_view'   THEN 1 END) AS views,
      COUNT(CASE WHEN type = 'price_click' THEN 1 END) AS clickouts
    FROM events
    WHERE wine_slug IS NOT NULL
    GROUP BY wine_slug
    ORDER BY views DESC
    LIMIT 10
  `).all() as Array<{ slug: string; name: string; emoji: string; views: number; clickouts: number }>);

  // Recent page views (last 20)
  const recentPageViews = (db.prepare(`
    SELECT id, path, page_label AS label, session_id AS sessionId, timestamp
    FROM events
    WHERE type = 'pageview'
    ORDER BY id DESC
    LIMIT 20
  `).all() as Array<{ id: number; path: string; label: string; sessionId: string; timestamp: string }>)
    .map((r) => ({ ...r, id: String(r.id) }));

  // Totals
  const totals = db.prepare(`
    SELECT
      COUNT(CASE WHEN type = 'pageview'    THEN 1 END) AS pageViews,
      COUNT(DISTINCT session_id)                        AS uniqueSessions,
      COUNT(CASE WHEN type = 'wine_view'   THEN 1 END) AS wineViews,
      COUNT(CASE WHEN type = 'price_click' THEN 1 END) AS priceClicks
    FROM events
  `).get() as { pageViews: number; uniqueSessions: number; wineViews: number; priceClicks: number };

  return { daily, pages, wines, recentPageViews, totals };
}

// ── Merchant analytics ────────────────────────────────────────────────────────

export interface MerchantAnalyticsSummary {
  wineStats: Array<{ slug: string; name: string; emoji: string; views: number; clickouts: number }>;
  totals: { wineViews: number; priceClicks: number };
  recentClicks: Array<{ wineSlug: string; wineName: string; wineEmoji: string; sessionId: string; timestamp: string }>;
}

export function getMerchantAnalyticsSummary(
  merchantSlug: string,
  merchantWineSlugs: string[],
): MerchantAnalyticsSummary {
  const db = getDb();

  if (merchantWineSlugs.length === 0) {
    return { wineStats: [], totals: { wineViews: 0, priceClicks: 0 }, recentClicks: [] };
  }

  const placeholders = merchantWineSlugs.map(() => "?").join(",");

  const wineRows = db.prepare(`
    SELECT
      wine_slug AS slug,
      MAX(wine_name)  AS name,
      MAX(wine_emoji) AS emoji,
      COUNT(CASE WHEN type = 'wine_view'   THEN 1 END) AS views,
      COUNT(CASE WHEN type = 'price_click' AND merchant = ? THEN 1 END) AS clickouts
    FROM events
    WHERE wine_slug IN (${placeholders})
    GROUP BY wine_slug
    ORDER BY views DESC
  `).all(merchantSlug, ...merchantWineSlugs) as Array<{
    slug: string; name: string | null; emoji: string | null; views: number; clickouts: number;
  }>;

  const wineStats = wineRows.map((r) => ({
    slug: r.slug,
    name: r.name ?? r.slug,
    emoji: r.emoji ?? "🍷",
    views: r.views,
    clickouts: r.clickouts,
  }));

  const totals = {
    wineViews: wineStats.reduce((s, w) => s + w.views, 0),
    priceClicks: wineStats.reduce((s, w) => s + w.clickouts, 0),
  };

  const recentClicks = (db.prepare(`
    SELECT wine_slug, wine_name, wine_emoji, session_id AS sessionId, timestamp
    FROM events
    WHERE type = 'price_click' AND merchant = ?
    ORDER BY id DESC
    LIMIT 20
  `).all(merchantSlug) as Array<{
    wine_slug: string; wine_name: string | null; wine_emoji: string | null; sessionId: string; timestamp: string;
  }>).map((r) => ({
    wineSlug: r.wine_slug,
    wineName: r.wine_name ?? "",
    wineEmoji: r.wine_emoji ?? "🍷",
    sessionId: r.sessionId,
    timestamp: r.timestamp,
  }));

  return { wineStats, totals, recentClicks };
}

// ── Per-merchant stats for admin ──────────────────────────────────────────────

export interface PerMerchantStats {
  slug: string;
  wineViews: number;
  priceClicks: number;
}

export function getPerMerchantStats(merchantWineMap: Record<string, string[]>): PerMerchantStats[] {
  const db = getDb();

  return Object.entries(merchantWineMap).map(([slug, wineSlugs]) => {
    if (wineSlugs.length === 0) return { slug, wineViews: 0, priceClicks: 0 };

    const placeholders = wineSlugs.map(() => "?").join(",");
    const { wineViews } = db.prepare(`
      SELECT COUNT(*) AS wineViews
      FROM events
      WHERE type = 'wine_view' AND wine_slug IN (${placeholders})
    `).get(...wineSlugs) as { wineViews: number };

    const { priceClicks } = db.prepare(`
      SELECT COUNT(*) AS priceClicks
      FROM events
      WHERE type = 'price_click' AND merchant = ?
    `).get(slug) as { priceClicks: number };

    return { slug, wineViews, priceClicks };
  });
}
