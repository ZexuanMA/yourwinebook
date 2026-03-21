/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per key.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up stale entries (every 5 minutes)
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 300_000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 300_000);
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Check rate limit for a given key (e.g. IP or user ID).
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  scheduleCleanup();

  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (t) => now - t < config.windowMs
  );

  if (entry.timestamps.length >= config.max) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = config.windowMs - (now - oldest);
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return {
    allowed: true,
    remaining: config.max - entry.timestamps.length,
  };
}

/**
 * Get client identifier from request.
 * Uses X-Forwarded-For (behind nginx) or falls back to a generic key.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

// ── Preset configs ──────────────────────────────────────────

/** Auth endpoints: 10 attempts per 15 minutes */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  max: 10,
  windowMs: 15 * 60 * 1000,
};

/** Post creation: 5 posts per 10 minutes */
export const POST_CREATE_RATE_LIMIT: RateLimitConfig = {
  max: 5,
  windowMs: 10 * 60 * 1000,
};

/** Comment creation: 20 comments per 5 minutes */
export const COMMENT_RATE_LIMIT: RateLimitConfig = {
  max: 20,
  windowMs: 5 * 60 * 1000,
};

/** Like toggle: 60 per minute (rapid tapping) */
export const LIKE_RATE_LIMIT: RateLimitConfig = {
  max: 60,
  windowMs: 60 * 1000,
};

/** Application submit: 3 per hour */
export const APPLICATION_RATE_LIMIT: RateLimitConfig = {
  max: 3,
  windowMs: 60 * 60 * 1000,
};

/** Track events: 120 per minute (pageview spam) */
export const TRACK_RATE_LIMIT: RateLimitConfig = {
  max: 120,
  windowMs: 60 * 1000,
};

/** Register: 5 per hour per IP */
export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  max: 5,
  windowMs: 60 * 60 * 1000,
};
