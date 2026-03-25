import { describe, it, expect, vi } from "vitest";

// Mock supabase (force mock data path)
vi.mock("@/lib/supabase", () => ({ getSupabase: () => null }));
vi.mock("@/lib/price-store", () => ({
  getMergedPrices: vi.fn().mockResolvedValue([]),
  getUpdatedMinPrice: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/scenes/route";

describe("GET /api/scenes", () => {
  it("returns scene list", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(4);
  });

  it("each scene has required fields", async () => {
    const res = await GET();
    const data = await res.json();
    for (const s of data) {
      expect(s.slug).toBeTruthy();
      expect(s.emoji).toBeTruthy();
      expect(s.title_zh).toBeTruthy();
      expect(s.title_en).toBeTruthy();
    }
  });
});
