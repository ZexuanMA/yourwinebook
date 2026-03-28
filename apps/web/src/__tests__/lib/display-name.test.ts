import { describe, it, expect } from "vitest";
import { normalizeDisplayName, getDisplayInitial } from "@/lib/display-name";

describe("normalizeDisplayName()", () => {
  it("returns trimmed string when valid", () => {
    expect(normalizeDisplayName("  Alice  ")).toBe("Alice");
  });

  it("falls back to email local part", () => {
    expect(normalizeDisplayName(null, "alice@example.com")).toBe("alice");
  });

  it("falls back to default when both empty", () => {
    expect(normalizeDisplayName(null, null)).toBe("User");
  });

  it("uses custom fallback", () => {
    expect(normalizeDisplayName("", "", "Anonymous")).toBe("Anonymous");
  });

  it("handles non-string value", () => {
    expect(normalizeDisplayName(42, "test@x.com")).toBe("test");
  });

  it("handles empty string value", () => {
    expect(normalizeDisplayName("", "bob@example.com")).toBe("bob");
  });

  it("handles whitespace-only value", () => {
    expect(normalizeDisplayName("   ", null, "Guest")).toBe("Guest");
  });
});

describe("getDisplayInitial()", () => {
  it("returns first character uppercase-agnostic", () => {
    expect(getDisplayInitial("Alice")).toBe("A");
  });

  it("returns fallback for non-string", () => {
    expect(getDisplayInitial(null)).toBe("U");
  });

  it("returns custom fallback for empty", () => {
    expect(getDisplayInitial("", "?")).toBe("?");
  });

  it("handles unicode characters", () => {
    expect(getDisplayInitial("陳大文")).toBe("陳");
  });

  it("handles emoji", () => {
    expect(getDisplayInitial("😀hello")).toBe("😀");
  });

  it("handles whitespace-only string", () => {
    expect(getDisplayInitial("   ")).toBe("U");
  });
});
