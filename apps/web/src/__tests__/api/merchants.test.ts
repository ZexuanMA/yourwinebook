import { describe, it, expect, vi } from "vitest";

// Mock supabase (force mock data path)
vi.mock("@/lib/supabase", () => ({ getSupabase: () => null }));
vi.mock("@/lib/price-store", () => ({
  getMergedPrices: vi.fn().mockResolvedValue([]),
  getUpdatedMinPrice: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/merchants/route";

describe("GET /api/merchants", () => {
  it("returns merchant list", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("each merchant has required fields", async () => {
    const res = await GET();
    const data = await res.json();
    for (const m of data) {
      expect(m.slug).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.description_zh).toBeTruthy();
      expect(m.description_en).toBeTruthy();
    }
  });
});
