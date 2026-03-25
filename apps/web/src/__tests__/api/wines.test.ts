import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock supabase + price-store (force mock data path)
vi.mock("@/lib/supabase", () => ({ getSupabase: () => null }));
vi.mock("@/lib/price-store", () => ({
  getMergedPrices: vi.fn().mockResolvedValue([]),
  getUpdatedMinPrice: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/wines/route";

function makeRequest(params?: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/wines");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

describe("GET /api/wines", () => {
  it("returns paginated wine list", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.wines).toBeDefined();
    expect(Array.isArray(data.wines)).toBe(true);
    expect(data.total).toBeGreaterThan(0);
    expect(data.page).toBe(1);
  });

  it("filters by type", async () => {
    const res = await GET(makeRequest({ type: "red" }));
    const data = await res.json();
    for (const w of data.wines) {
      expect(w.type).toBe("red");
    }
  });

  it("filters by search keyword", async () => {
    const res = await GET(makeRequest({ search: "Cabernet" }));
    const data = await res.json();
    expect(data.wines.length).toBeGreaterThan(0);
  });

  it("filters by price range", async () => {
    const res = await GET(makeRequest({ minPrice: "100", maxPrice: "300" }));
    const data = await res.json();
    for (const w of data.wines) {
      expect(w.minPrice).toBeGreaterThanOrEqual(100);
      expect(w.minPrice).toBeLessThanOrEqual(300);
    }
  });

  it("sorts by price ascending", async () => {
    const res = await GET(makeRequest({ sort: "price_asc" }));
    const data = await res.json();
    for (let i = 1; i < data.wines.length; i++) {
      expect(data.wines[i].minPrice).toBeGreaterThanOrEqual(data.wines[i - 1].minPrice);
    }
  });

  it("paginates with limit", async () => {
    const res = await GET(makeRequest({ limit: "3", page: "1" }));
    const data = await res.json();
    expect(data.wines.length).toBeLessThanOrEqual(3);
    expect(data.limit).toBe(3);
  });
});
