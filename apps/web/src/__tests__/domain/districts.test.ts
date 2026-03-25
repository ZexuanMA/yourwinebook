import { describe, it, expect } from "vitest";
import { HK_DISTRICTS } from "@ywb/domain";

describe("HK_DISTRICTS", () => {
  it("has 10 districts", () => {
    expect(HK_DISTRICTS.length).toBe(10);
  });

  it("each district has required fields", () => {
    for (const d of HK_DISTRICTS) {
      expect(d.slug).toBeTruthy();
      expect(d.name_zh).toBeTruthy();
      expect(d.name_en).toBeTruthy();
      expect(typeof d.lat).toBe("number");
      expect(typeof d.lng).toBe("number");
    }
  });

  it("slugs are unique", () => {
    const slugs = HK_DISTRICTS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("coordinates are within Hong Kong bounds", () => {
    for (const d of HK_DISTRICTS) {
      // HK latitude: ~22.15 - ~22.56
      expect(d.lat).toBeGreaterThan(22.1);
      expect(d.lat).toBeLessThan(22.6);
      // HK longitude: ~113.8 - ~114.4
      expect(d.lng).toBeGreaterThan(113.8);
      expect(d.lng).toBeLessThan(114.5);
    }
  });

  it("includes Central", () => {
    const central = HK_DISTRICTS.find((d) => d.slug === "central");
    expect(central).toBeDefined();
    expect(central!.name_zh).toBe("中環");
    expect(central!.name_en).toBe("Central");
  });
});
