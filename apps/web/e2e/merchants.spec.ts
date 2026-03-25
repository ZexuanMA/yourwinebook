import { test, expect } from "@playwright/test";

test.describe("Merchants Page", () => {
  test("loads merchant list", async ({ page }) => {
    await page.goto("/zh-HK/merchants");
    const merchantCards = page.locator('a[href*="/merchants/"]');
    await expect(merchantCards.first()).toBeVisible({ timeout: 10000 });
    const count = await merchantCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("navigates to merchant detail", async ({ page }) => {
    await page.goto("/zh-HK/merchants");
    const firstMerchant = page.locator('a[href*="/merchants/"]').first();
    await expect(firstMerchant).toBeVisible({ timeout: 10000 });
    await firstMerchant.click();
    await expect(page).toHaveURL(/\/merchants\//);
  });
});
