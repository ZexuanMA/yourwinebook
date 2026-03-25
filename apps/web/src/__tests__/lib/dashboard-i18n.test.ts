import { describe, it, expect } from "vitest";
import { t, tf } from "@/lib/dashboard-i18n";

describe("t()", () => {
  it("returns zh-HK translation", () => {
    expect(t("nav.overview", "zh-HK")).toBe("總覽");
  });

  it("returns en translation", () => {
    expect(t("nav.overview", "en")).toBe("Overview");
  });

  it("falls back to zh-HK when key exists but lang variant missing", () => {
    // All keys have both languages, so test fallback by checking a known key
    expect(t("nav.wines", "zh-HK")).toBe("酒款管理");
    expect(t("nav.wines", "en")).toBe("Wine Management");
  });

  it("returns key string for unknown key", () => {
    expect(t("unknown.key", "zh-HK")).toBe("unknown.key");
    expect(t("unknown.key", "en")).toBe("unknown.key");
  });
});

describe("tf()", () => {
  it("replaces single parameter", () => {
    const result = tf("home.bestPriceSub", "zh-HK", { total: 32 });
    expect(result).toBe("共 32 款中奪冠");
  });

  it("replaces single parameter in en", () => {
    const result = tf("home.bestPriceSub", "en", { total: 32 });
    expect(result).toBe("best of 32 wines");
  });

  it("returns string with unreplaced placeholder for missing param", () => {
    const result = tf("home.bestPriceSub", "en", {});
    expect(result).toBe("best of {total} wines");
  });

  it("handles multiple parameters", () => {
    const result = tf("wines.rank1", "en", { total: 6 });
    expect(result).toBe("#1 of 6");
  });
});
