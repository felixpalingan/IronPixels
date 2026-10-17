import { test, expect } from "@playwright/test";
import { setupAuthenticatedApp } from "./fixtures";

test.describe("High-Contrast Outdoor Profile Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test("lifter can toggle high-contrast outdoor mode in settings and verify persistent html.high-contrast class", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Open Settings modal from header
    const settingsBtn = page.getByRole("button", { name: "Buka Pengaturan" });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // 2. Verify modal opened and switch to SYSTEM tab
    await expect(page.getByText(/GUILD HQ \/\/ ACCOUNT SETTINGS/i)).toBeVisible();
    const systemTab = page.getByRole("button", { name: "SYSTEM" });
    await expect(systemTab).toBeVisible();
    await systemTab.click();

    // 3. Verify High-Contrast Gym / Outdoor section is visible
    await expect(page.getByText(/HIGH-CONTRAST GYM \/ OUTDOOR/i)).toBeVisible();

    // 4. Find the high-contrast toggle button
    const contrastToggle = page.locator('button[aria-pressed]').filter({ hasText: /ACTIVE|DISABLED/i });
    await expect(contrastToggle).toBeVisible();
    await expect(contrastToggle).toHaveText(/DISABLED/i);

    // Verify document does not have high-contrast class initially
    const isInitiallyHighContrast = await page.evaluate(() =>
      document.documentElement.classList.contains("high-contrast")
    );
    expect(isInitiallyHighContrast).toBe(false);

    // 5. Click toggle to ACTIVATE high-contrast mode
    await contrastToggle.click();
    await expect(contrastToggle).toHaveText(/ACTIVE \(ON\)/i);

    // Verify documentElement now has high-contrast class
    const isNowHighContrast = await page.evaluate(() =>
      document.documentElement.classList.contains("high-contrast")
    );
    expect(isNowHighContrast).toBe(true);

    // Verify localStorage has persisted ironpixels_high_contrast = "true"
    const savedSetting = await page.evaluate(() =>
      localStorage.getItem("ironpixels_high_contrast")
    );
    expect(savedSetting).toBe("true");

    // 6. Click toggle to DISABLE high-contrast mode
    await contrastToggle.click();
    await expect(contrastToggle).toHaveText(/DISABLED/i);

    const isFinallyHighContrast = await page.evaluate(() =>
      document.documentElement.classList.contains("high-contrast")
    );
    expect(isFinallyHighContrast).toBe(false);

    const revertedSetting = await page.evaluate(() =>
      localStorage.getItem("ironpixels_high_contrast")
    );
    expect(revertedSetting).toBe("false");
  });

  test("pre-hydration script applies high-contrast class on initial page load when preference is saved", async ({
    page,
  }) => {
    // Inject saved preference into localStorage before document load
    await page.addInitScript(() => {
      localStorage.setItem("ironpixels_high_contrast", "true");
    });

    await page.goto("/");

    // Verify documentElement has high-contrast class applied immediately via pre-hydration script
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("high-contrast")
    );
    expect(hasClass).toBe(true);
  });
});
