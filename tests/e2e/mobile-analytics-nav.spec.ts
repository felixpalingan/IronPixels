import { test, expect } from "@playwright/test";
import { setupAuthenticatedApp } from "./fixtures";

test.describe("Mobile Stats View & Persistent BottomNav", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test("stats page fits mobile viewport without horizontal overflow and bottom nav stays persistent on scroll", async ({ page }) => {
    // Set explicit mobile viewport (small 360x640 device)
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");

    const bottomNav = page.getByRole("navigation", { name: "Navigasi Utama Aplikasi" });
    await expect(bottomNav).toBeVisible();

    // 1. Click STATS tab
    const statsTabBtn = bottomNav.getByRole("button", { name: "STATS" });
    await expect(statsTabBtn).toBeVisible();
    await statsTabBtn.click();

    // 2. Wait for Stats View to mount
    await expect(page.getByText("HERO GYM ANALYTICS")).toBeVisible();
    await expect(page.getByText("28-DAY WORKOUT HEATMAP")).toBeVisible();
    await expect(page.getByText("PROGRESSIVE OVERLOAD", { exact: true })).toBeVisible();

    // 3. Verify ZERO horizontal scroll on the entire page
    const hasHorizontalOverflow = await page.evaluate(() => {
      const docEl = document.documentElement;
      return docEl.scrollWidth > docEl.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 4. Scroll down towards the bottom
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);

    // Verify BottomNav is still visible and pinned
    await expect(bottomNav).toBeVisible();

    // 5. Scroll UP back to top (where user reported it disappearing)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    // Verify BottomNav is still visible and interactive
    await expect(bottomNav).toBeVisible();

    // 6. Test interaction: click "QUESTS" from bottomNav while at top
    const questsTabBtn = bottomNav.getByRole("button", { name: "QUESTS" });
    await expect(questsTabBtn).toBeVisible();
    await questsTabBtn.click({ force: true });

    // Verify successfully switched to Quests
    await expect(page.getByRole("button", { name: "LOG WORKOUT" })).toBeVisible();
  });
});

