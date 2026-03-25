import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getClientIp, type RateLimitConfig } from "@/lib/rate-limit";

describe("checkRateLimit()", () => {
  const config: RateLimitConfig = { max: 3, windowMs: 60_000 };

  // Use unique keys per test to avoid cross-test contamination
  let keyCounter = 0;
  function uniqueKey() {
    return `test-key-${++keyCounter}-${Date.now()}`;
  }

  it("allows requests under limit", () => {
    const key = uniqueKey();
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("decrements remaining on each call", () => {
    const key = uniqueKey();
    checkRateLimit(key, config);
    const r2 = checkRateLimit(key, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks after max requests", () => {
    const key = uniqueKey();
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const r4 = checkRateLimit(key, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterMs).toBeDefined();
    expect(r4.retryAfterMs!).toBeGreaterThan(0);
    expect(r4.retryAfterMs!).toBeLessThanOrEqual(60_000);
  });

  it("allows again after window expires", () => {
    const key = uniqueKey();
    const shortConfig: RateLimitConfig = { max: 1, windowMs: 100 };
    checkRateLimit(key, shortConfig);

    // Advance time
    vi.useFakeTimers();
    vi.advanceTimersByTime(150);
    const result = checkRateLimit(key, shortConfig);
    expect(result.allowed).toBe(true);
    vi.useRealTimers();
  });

  it("uses separate counters for different keys", () => {
    const k1 = uniqueKey();
    const k2 = uniqueKey();
    checkRateLimit(k1, config);
    checkRateLimit(k1, config);
    checkRateLimit(k1, config);

    const r = checkRateLimit(k2, config);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });
});

describe("getClientIp()", () => {
  it("extracts IP from X-Forwarded-For header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no forwarded header", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("trims whitespace from IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  5.6.7.8  , 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("5.6.7.8");
  });
});
