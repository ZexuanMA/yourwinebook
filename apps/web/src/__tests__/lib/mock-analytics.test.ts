import { describe, it, expect } from "vitest";
import {
  dailyStats,
  topPages,
  topWines,
  recentSessions,
  summaryStats,
  trafficSources,
  deviceBreakdown,
} from "@/lib/mock-analytics";

describe("dailyStats", () => {
  it("has 30 days of data", () => {
    expect(dailyStats.length).toBe(30);
  });

  it("each entry has positive values", () => {
    for (const d of dailyStats) {
      expect(d.date).toBeTruthy();
      expect(d.pageViews).toBeGreaterThan(0);
      expect(d.visitors).toBeGreaterThan(0);
      expect(d.sessions).toBeGreaterThan(0);
    }
  });

  it("visitors <= sessions <= pageViews", () => {
    for (const d of dailyStats) {
      expect(d.visitors).toBeLessThanOrEqual(d.sessions);
      expect(d.sessions).toBeLessThanOrEqual(d.pageViews);
    }
  });
});

describe("topPages", () => {
  it("has at least 5 entries", () => {
    expect(topPages.length).toBeGreaterThanOrEqual(5);
  });

  it("each entry has valid bounce rate", () => {
    for (const p of topPages) {
      expect(p.bounceRate).toBeGreaterThanOrEqual(0);
      expect(p.bounceRate).toBeLessThanOrEqual(100);
    }
  });
});

describe("topWines", () => {
  it("each wine has views and clickouts", () => {
    for (const w of topWines) {
      expect(w.slug).toBeTruthy();
      expect(w.views).toBeGreaterThan(0);
      expect(w.clickouts).toBeGreaterThan(0);
      expect(w.clickouts).toBeLessThanOrEqual(w.views);
    }
  });
});

describe("summaryStats", () => {
  it("has all expected keys", () => {
    expect(summaryStats.pageViews).toBeDefined();
    expect(summaryStats.visitors).toBeDefined();
    expect(summaryStats.sessions).toBeDefined();
    expect(summaryStats.avgDuration).toBeDefined();
    expect(summaryStats.bounceRate).toBeDefined();
    expect(summaryStats.clickouts).toBeDefined();
  });
});

describe("trafficSources", () => {
  it("percentages sum to 100", () => {
    const total = trafficSources.reduce((s, t) => s + t.value, 0);
    expect(total).toBe(100);
  });
});

describe("deviceBreakdown", () => {
  it("percentages sum to 100", () => {
    const total = deviceBreakdown.reduce((s, d) => s + d.value, 0);
    expect(total).toBe(100);
  });
});
