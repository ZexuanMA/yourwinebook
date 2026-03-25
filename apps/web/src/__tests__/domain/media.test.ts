import { describe, it, expect } from "vitest";
import { validateFiles, BUCKET_CONFIGS, POST_LIMITS, COMPRESSION_TARGETS } from "@ywb/domain";

describe("validateFiles()", () => {
  it("returns error for empty file array", () => {
    const errors = validateFiles("posts", []);
    expect(errors.length).toBe(1);
    expect(errors[0].field).toBe("files");
    expect(errors[0].message).toContain("At least one file");
  });

  it("accepts valid post image", () => {
    const errors = validateFiles("posts", [
      { mimeType: "image/jpeg", sizeBytes: 1024 * 1024 },
    ]);
    expect(errors).toEqual([]);
  });

  it("rejects invalid mime type", () => {
    const errors = validateFiles("posts", [
      { mimeType: "application/pdf", sizeBytes: 1024 },
    ]);
    expect(errors.length).toBe(1);
    expect(errors[0].field).toContain("mimeType");
  });

  it("rejects file exceeding size limit", () => {
    const errors = validateFiles("posts", [
      { mimeType: "image/jpeg", sizeBytes: 11 * 1024 * 1024 }, // 11 MB > 10 MB limit
    ]);
    expect(errors.length).toBe(1);
    expect(errors[0].field).toContain("sizeBytes");
  });

  it("rejects zero-size file", () => {
    const errors = validateFiles("posts", [
      { mimeType: "image/jpeg", sizeBytes: 0 },
    ]);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("greater than 0");
  });

  it("rejects too many files", () => {
    const files = Array.from({ length: 10 }, () => ({
      mimeType: "image/jpeg" as const,
      sizeBytes: 1024,
    }));
    const errors = validateFiles("posts", files);
    expect(errors.some((e) => e.message.includes("Maximum"))).toBe(true);
  });

  it("validates avatar bucket constraints", () => {
    expect(BUCKET_CONFIGS.avatars.maxFiles).toBe(1);
    const errors = validateFiles("avatars", [
      { mimeType: "image/png", sizeBytes: 500_000 },
      { mimeType: "image/png", sizeBytes: 500_000 },
    ]);
    expect(errors.some((e) => e.message.includes("Maximum 1"))).toBe(true);
  });

  it("allows SVG for merchants bucket", () => {
    const errors = validateFiles("merchants", [
      { mimeType: "image/svg+xml", sizeBytes: 1024 },
    ]);
    expect(errors).toEqual([]);
  });

  it("collects multiple errors", () => {
    const errors = validateFiles("avatars", [
      { mimeType: "application/pdf", sizeBytes: 0 },
    ]);
    expect(errors.length).toBe(2); // bad mime + zero size
  });
});

describe("BUCKET_CONFIGS", () => {
  it("has correct post limits", () => {
    expect(BUCKET_CONFIGS.posts.maxSizeBytes).toBe(10 * 1024 * 1024);
    expect(BUCKET_CONFIGS.posts.maxFiles).toBe(9);
  });

  it("has correct avatar limits", () => {
    expect(BUCKET_CONFIGS.avatars.maxSizeBytes).toBe(2 * 1024 * 1024);
    expect(BUCKET_CONFIGS.avatars.maxFiles).toBe(1);
  });
});

describe("POST_LIMITS", () => {
  it("has expected content constraints", () => {
    expect(POST_LIMITS.maxContentLength).toBe(2000);
    expect(POST_LIMITS.maxMediaCount).toBe(9);
    expect(POST_LIMITS.maxProductReferences).toBe(10);
  });
});

describe("COMPRESSION_TARGETS", () => {
  it("has expected values", () => {
    expect(COMPRESSION_TARGETS.postMaxDimension).toBe(2048);
    expect(COMPRESSION_TARGETS.avatarMaxDimension).toBe(512);
  });
});
