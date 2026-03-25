import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("loads search page", async ({ page }) => {
    await page.goto("/zh-HK/search");
    await expect(page.locator("body")).toBeVisible();
    // Page should have loaded successfully
    expect(await page.title()).toBeTruthy();
  });

  test("search input is functional", async ({ page }) => {
    await page.goto("/zh-HK/search");
    // Wait for client hydration
    await page.waitForLoadState("networkidle");
    const input = page.locator("input").first();
    await expect(input).toBeVisible({ timeout: 10000 });
  });

  test("displays wine cards after loading", async ({ page }) => {
    await page.goto("/zh-HK/search");
    // Wait for API data to load (client component fetches /api/wines)
    await page.waitForLoadState("networkidle");
    // Wine cards link to /zh-HK/wines/xxx
    const wineCards = page.locator('a[href*="/wines/"]');
    await expect(wineCards.first()).toBeVisible({ timeout: 15000 });
  });
});
