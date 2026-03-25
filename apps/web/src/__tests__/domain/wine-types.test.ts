import { describe, it, expect } from "vitest";
import {
  WINE_TYPES,
  MERCHANT_STATUSES,
  APPLICATION_STATUSES,
  USER_STATUSES,
  LOCALES,
} from "@ywb/domain";

describe("WINE_TYPES", () => {
  it("includes all 5 wine types", () => {
    expect(WINE_TYPES).toContain("red");
    expect(WINE_TYPES).toContain("white");
    expect(WINE_TYPES).toContain("sparkling");
    expect(WINE_TYPES).toContain("rosé");
    expect(WINE_TYPES).toContain("dessert");
    expect(WINE_TYPES.length).toBe(5);
  });
});

describe("MERCHANT_STATUSES", () => {
  it("includes active, inactive, pending", () => {
    expect(MERCHANT_STATUSES).toContain("active");
    expect(MERCHANT_STATUSES).toContain("inactive");
    expect(MERCHANT_STATUSES).toContain("pending");
  });
});

describe("APPLICATION_STATUSES", () => {
  it("includes workflow statuses", () => {
    expect(APPLICATION_STATUSES).toContain("pending");
    expect(APPLICATION_STATUSES).toContain("contacted");
    expect(APPLICATION_STATUSES).toContain("approved");
    expect(APPLICATION_STATUSES).toContain("rejected");
  });
});

describe("USER_STATUSES", () => {
  it("includes active and suspended", () => {
    expect(USER_STATUSES).toContain("active");
    expect(USER_STATUSES).toContain("suspended");
  });
});

describe("LOCALES", () => {
  it("supports zh-HK and en", () => {
    expect(LOCALES).toContain("zh-HK");
    expect(LOCALES).toContain("en");
    expect(LOCALES.length).toBe(2);
  });
});
