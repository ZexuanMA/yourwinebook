import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows brand title", async ({ page }) => {
    await page.goto("/zh-HK");
    await expect(page).toHaveTitle(/Your Wine Book/i);
  });

  test("shows hero search section", async ({ page }) => {
    await page.goto("/zh-HK");
    const search = page.locator('input[type="search"], input[placeholder]').first();
    await expect(search).toBeVisible();
  });

  test("shows scene cards", async ({ page }) => {
    await page.goto("/zh-HK");
    // Scene cards should exist (gift, dinner, everyday, explore)
    const sceneLinks = page.locator('a[href*="/scenes/"]');
    await expect(sceneLinks.first()).toBeVisible();
  });

  test("shows featured wines section", async ({ page }) => {
    await page.goto("/zh-HK");
    // Wine cards should be visible
    const wineLinks = page.locator('a[href*="/wines/"]');
    const count = await wineLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("navbar has language switch", async ({ page }) => {
    await page.goto("/zh-HK");
    // Look for EN/中 toggle
    const langButton = page.locator('button:has-text("EN"), a:has-text("EN")').first();
    await expect(langButton).toBeVisible();
  });

  test("AI advisor link is accessible", async ({ page }) => {
    await page.goto("/zh-HK");
    const aiLink = page.locator('a[href*="/ai"]').first();
    await expect(aiLink).toBeVisible();
  });
});
