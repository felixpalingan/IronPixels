import { test, expect } from "@playwright/test";

test.describe("Public Pages & Visitor Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Abort external analytics to prevent teardown hang
    await page.route(/(va\.vercel-scripts\.com|supabase\.co\/realtime)/, (route) => route.abort());
  });

  test("visitor can view /about landing and switch language", async ({ page }) => {
    await page.goto("/about");

    // 1. Verify About landing page loads with main heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/IRONPIXELS/i).first()).toBeVisible();

    // 2. Language Switcher: switch to English and verify headline
    const enButton = page.getByRole("group", { name: "Language Selector" }).getByRole("button", { name: "EN", exact: true });
    if (await enButton.isVisible()) {
      await enButton.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(/LIFT HEAVY IN REAL LIFE/i);
    }
  });

  test("visitor can open /login page directly and see operative terminal", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByPlaceholder("ENTER ID...")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: /ENTER DUNGEON/i })).toBeVisible();
  });

  test("visitor can open /register page directly and see enlistment terminal", async ({ page }) => {
    await page.goto("/register");

    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByPlaceholder("ENTER USERNAME...")).toBeVisible();
    await expect(page.getByPlaceholder("ENTER EMAIL...")).toBeVisible();
    await expect(page.getByRole("button", { name: /CREATE RECRUIT ACCOUNT/i })).toBeVisible();
  });
});
