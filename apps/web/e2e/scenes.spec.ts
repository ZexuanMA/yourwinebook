import { test, expect } from "@playwright/test";

test.describe("Scene Pages", () => {
  test("scene page loads successfully", async ({ page }) => {
    const res = await page.goto("/zh-HK/scenes/gift");
    expect(res?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    // Page should have content
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  test("all 4 scene slugs return 200", async ({ page }) => {
    const scenes = ["gift", "dinner", "everyday", "explore"];
    for (const slug of scenes) {
      const res = await page.goto(`/zh-HK/scenes/${slug}`);
      expect(res?.status()).toBe(200);
    }
  });
});
