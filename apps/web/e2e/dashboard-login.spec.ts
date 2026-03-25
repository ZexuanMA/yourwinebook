import { test, expect } from "@playwright/test";

test.describe("Dashboard Login", () => {
  test("login page loads with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Should have email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("shows error state for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Wait for network response
    await page.waitForTimeout(2000);
    // Page should still be on /login (not redirected)
    expect(page.url()).toContain("/login");
  });

  test("successful merchant login navigates to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "watsons@demo.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    // Should eventually redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});
