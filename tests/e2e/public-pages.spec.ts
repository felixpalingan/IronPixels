import { test, expect } from "@playwright/test";

test.describe("Public Pages & Visitor Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Abort external analytics to prevent teardown hang
    await page.route(/(va\.vercel-scripts\.com|supabase\.co\/realtime)/, (route) => route.abort());
  });

  test("unauthenticated visitor visiting '/' receives 200 OK and sees public hero landing", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(page.url()).not.toContain("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/IRONPIXELS/i).first()).toBeVisible();
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

  test("visitor can open /login page directly and see operative terminal and protocol briefing", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByPlaceholder("ENTER ID...")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: /ENTER DUNGEON/i })).toBeVisible();
    await expect(page.getByText("OPERATIVE PROTOCOL BRIEFING")).toBeVisible();
    await expect(page.getByText(/Real Volume/i)).toBeVisible();

    // Verify Breadcrumb schema
    const breadcrumbScript = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    expect(breadcrumbScript.some((txt) => txt.includes("BreadcrumbList"))).toBe(true);
  });

  test("visitor can open /register page directly and see enlistment terminal and protocol briefing", async ({ page }) => {
    await page.goto("/register");

    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByPlaceholder("ENTER USERNAME...")).toBeVisible();
    await expect(page.getByPlaceholder("ENTER EMAIL...")).toBeVisible();
    await expect(page.getByRole("button", { name: /CREATE RECRUIT ACCOUNT/i })).toBeVisible();
    await expect(page.getByText("RECRUIT ENLISTMENT PROTOCOL")).toBeVisible();
    await expect(page.getByText(/Relative Volume Score/i)).toBeVisible();

    // Verify Breadcrumb schema
    const breadcrumbScript = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    expect(breadcrumbScript.some((txt) => txt.includes("BreadcrumbList"))).toBe(true);
  });

  test("llms.txt serves 200 OK and structured markdown for AI engines", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("# IronPixels");
    expect(text).toContain("Relative Volume Score (RVS)");
    expect(text).toContain("https://iron-pixels.vercel.app/about");
  });

  test("robots.txt serves 200 OK with explicit AI search crawler rules", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("User-Agent: GPTBot");
    expect(text).toContain("User-Agent: ClaudeBot");
    expect(text).toContain("User-Agent: PerplexityBot");
    expect(text).toContain("Allow: /llms.txt");
  });

  test("about page below-the-fold images have loading lazy attributes", async ({ page }) => {
    await page.goto("/about");
    const lazyImages = page.locator('img[loading="lazy"]');
    const count = await lazyImages.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
