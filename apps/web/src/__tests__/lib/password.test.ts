import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isHashed } from "@/lib/password";

describe("isHashed()", () => {
  it("recognizes $2a$ bcrypt prefix", () => {
    expect(isHashed("$2a$10$abcdefghijklmnopqrstuv")).toBe(true);
  });

  it("recognizes $2b$ bcrypt prefix", () => {
    expect(isHashed("$2b$10$abcdefghijklmnopqrstuv")).toBe(true);
  });

  it("recognizes $2y$ bcrypt prefix", () => {
    expect(isHashed("$2y$10$abcdefghijklmnopqrstuv")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isHashed("demo123")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isHashed("")).toBe(false);
  });
});

describe("hashPassword()", () => {
  it("produces a bcrypt hash", async () => {
    const hash = await hashPassword("test123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("produces different hashes for same input (salt)", async () => {
    const h1 = await hashPassword("test123");
    const h2 = await hashPassword("test123");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword()", () => {
  it("verifies against bcrypt hash", async () => {
    const hash = await hashPassword("secret");
    expect(await verifyPassword("secret", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("verifies against plain text (migration fallback)", async () => {
    expect(await verifyPassword("demo123", "demo123")).toBe(true);
    expect(await verifyPassword("wrong", "demo123")).toBe(false);
  });
});
