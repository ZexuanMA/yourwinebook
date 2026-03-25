import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock supabase (force mock data path)
vi.mock("@/lib/supabase", () => ({ getSupabase: () => null }));
vi.mock("@/lib/price-store", () => ({
  getMergedPrices: vi.fn().mockResolvedValue([]),
  getUpdatedMinPrice: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/search/route";

function makeRequest(params?: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/search");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

describe("GET /api/search", () => {
  it("returns regions when action=regions", async () => {
    const res = await GET(makeRequest({ action: "regions" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.regions).toBeDefined();
    expect(Array.isArray(data.regions)).toBe(true);
    expect(data.regions.length).toBeGreaterThan(0);
  });

  it("returns suggestions for valid query", async () => {
    const res = await GET(makeRequest({ q: "Cab" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toBeDefined();
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  it("returns empty suggestions for short query", async () => {
    const res = await GET(makeRequest({ q: "a" }));
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });

  it("returns empty suggestions for no query", async () => {
    const res = await GET(makeRequest());
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });
});
