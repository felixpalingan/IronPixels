import { test, expect } from "@playwright/test";

test.describe("Centralized API Security & Middleware Gates", () => {
  test("unauthenticated requests to protected endpoints return 401 Unauthorized", async ({ request }) => {
    // 1. Combat Attack endpoint
    const resCombat = await request.post("/api/combat/attack", {
      data: { enemyId: "boss-1", damage: 100 },
    });
    expect(resCombat.status()).toBe(401);
    const bodyCombat = await resCombat.json();
    expect(bodyCombat.error).toMatch(/unauthorized/i);

    // 2. Workout Submit endpoint
    const resWorkout = await request.post("/api/workout/submit", {
      data: { exercises: [] },
    });
    expect(resWorkout.status()).toBe(401);
    const bodyWorkout = await resWorkout.json();
    expect(bodyWorkout.error).toMatch(/unauthorized/i);

    // 3. Shop Gacha endpoint
    const resGacha = await request.post("/api/shop/gacha", {
      data: { pullType: "single" },
    });
    expect(resGacha.status()).toBe(401);
    const bodyGacha = await resGacha.json();
    expect(bodyGacha.error).toMatch(/unauthorized/i);

    // 4. User Profile endpoint
    const resProfile = await request.get("/api/user/profile");
    expect(resProfile.status()).toBe(401);
  });

  test("public API whitelist allows unauthenticated access", async ({ request }) => {
    // 1. Exercises public catalog
    const resExercises = await request.get("/api/exercises");
    expect(resExercises.status()).toBe(200);
    const exercisesData = await resExercises.json();
    expect(Array.isArray(exercisesData)).toBe(true);
    expect(exercisesData.length).toBeGreaterThan(0);

    // 2. Public leaderboard ranking
    const resLeaderboard = await request.get("/api/multiplayer/leaderboard?category=user_floor");
    // Should not return 401 Unauthorized
    expect(resLeaderboard.status()).not.toBe(401);
  });
});
