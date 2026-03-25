import { test, expect } from "@playwright/test";

test.describe("Wine Detail Page", () => {
  test("navigates from search to wine detail", async ({ page }) => {
    await page.goto("/zh-HK/search");
    await page.waitForLoadState("networkidle");
    const firstWine = page.locator('a[href*="/wines/"]').first();
    await expect(firstWine).toBeVisible({ timeout: 15000 });
    await firstWine.click();
    await expect(page).toHaveURL(/\/wines\//, { timeout: 10000 });
    // Page content should be visible
    await expect(page.locator("body")).toBeVisible();
  });
});
