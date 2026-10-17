import { test as base, expect, Page } from "@playwright/test";

export const MOCK_USER_PROFILE = {
  user_id: "e2e-test-hero-uuid",
  username: "PixelKnight",
  character_class: "WARRIOR",
  gender: "m",
  level: 10,
  current_hp: 1200,
  max_hp: 1200,
  exp: 450,
  max_exp: 1000,
  gold: 750,
  weight_kg: 75,
  weight_unit: "kg",
  max_floor: 3,
  workout_streak: 5,
  available_ap: 5,
  stats: {
    str: 95,
    agi: 70,
    vit: 80,
    luk: 55,
  },
};

export async function setupAuthenticatedApp(page: Page) {
  // Prevent context teardown hangs by aborting realtime websockets and analytics
  await page.route(/(va\.vercel-scripts\.com|supabase\.co\/realtime)/, (route) => route.abort());

  // Set non-production test cookie
  await page.context().addCookies([
    {
      name: "ironpixels_e2e_test",
      value: "1",
      domain: "localhost",
      path: "/",
    },
    {
      name: "ironpixels_onboarded",
      value: MOCK_USER_PROFILE.user_id,
      domain: "localhost",
      path: "/",
    },
  ]);

  // Mock API routes to ensure deterministic, zero-flake execution
  await page.route("**/api/user/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER_PROFILE),
    });
  });

  await page.route("**/api/user/inventory", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/multiplayer/leaderboard*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/combat/boss*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        enemy_id: "boss-floor-3",
        display_name: "Skeleton Commander",
        floor: 3,
        current_hp: 5000,
        max_hp: 5000,
        status: "Active",
        category: "boss",
        mode: "solo",
      }),
    });
  });

  await page.route("**/api/combat/attack", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        damageDealt: 180,
        remainingHp: 4820,
        bossHp: 4820,
        isDefeated: false,
      }),
    });
  });

  await page.route("**/api/combat/execute-skill", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        damageDealt: 650,
      }),
    });
  });

  await page.route("**/api/workout/submit", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Workout session recorded successfully",
        totalRvs: 250,
        totalVolume: 500,
        newExp: 700,
        newGold: 850,
      }),
    });
  });

  // Seed localStorage before navigation so app renders without delay
  await page.addInitScript((mockProfile) => {
    localStorage.setItem("ironpixels_profile", JSON.stringify(mockProfile));
    localStorage.setItem("ironpixels_weight_unit", "kg");
    localStorage.setItem("ironpixels_available_ap", "5");
  }, MOCK_USER_PROFILE);
}

export { expect };
