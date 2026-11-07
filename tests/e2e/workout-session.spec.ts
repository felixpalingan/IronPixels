import { test, expect } from "@playwright/test";
import { setupAuthenticatedApp } from "./fixtures";

test.describe("Workout Session Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test("lifter can start workout session, log set, verify rest timer, and finish session", async ({ page }) => {
    await page.goto("/");

    // 1. Navigate to Quests tab via BottomNav
    const bottomNav = page.getByRole("navigation", { name: "Navigasi Utama Aplikasi" });
    await expect(bottomNav).toBeVisible();
    await bottomNav.getByRole("button", { name: "QUESTS" }).click();

    // 2. Click LOG WORKOUT subview
    const logWorkoutBtn = page.getByRole("button", { name: "LOG WORKOUT" });
    await expect(logWorkoutBtn).toBeVisible();
    await logWorkoutBtn.click();

    // 3. Start workout session
    const startSessionBtn = page.getByRole("button", { name: /MULAI SESI LATIHAN/i });
    await expect(startSessionBtn).toBeVisible();
    await startSessionBtn.click();

    // 4. Verify session is active (banner changes to active state)
    await expect(page.getByText(/SESI LATIHAN SEDANG BERJALAN/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /BATALKAN SESI \(CANCEL\)/i })).toBeVisible();

    // 5. Open exercise picker
    const chooseExerciseBtn = page.getByRole("button", { name: /CHOOSE EXERCISE FROM DATABASE/i });
    await expect(chooseExerciseBtn).toBeVisible();
    await chooseExerciseBtn.click();

    // 6. Verify exercise database dialog is open and click first ADD EXERCISE button
    await expect(page.getByRole("dialog", { name: /EXERCISE DATABASE/i })).toBeVisible();
    const addExerciseBtn = page.getByRole("button", { name: "ADD EXERCISE" }).first();
    await expect(addExerciseBtn).toBeVisible();
    await addExerciseBtn.click();

    // 7. Modal closes, exercise appears in tracker
    await expect(page.getByRole("dialog")).toBeHidden();

    // 8. Find weight and reps input fields for Set #1
    const weightInput = page.locator('input[inputmode="decimal"]').first();
    const repsInput = page.locator('input[inputmode="numeric"]').first();
    await expect(weightInput).toBeVisible();
    await expect(repsInput).toBeVisible();

    await weightInput.fill("60");
    await repsInput.fill("10");

    // 9. Click LOG SET
    const logSetBtn = page.getByRole("button", { name: /LOG SET/i }).first();
    await expect(logSetBtn).toBeVisible();
    await logSetBtn.click();

    // 10. Verify set is DONE and Floating Rest Timer appears
    await expect(page.getByRole("button", { name: /DONE/i }).first()).toBeVisible();
    const restTimer = page.getByRole("region", { name: /Rest Timer/i });
    await expect(restTimer).toBeVisible();

    // 11. Test Rest Timer controls (SKIP button dismisses timer using accessible name)
    const skipBtn = restTimer.getByRole("button", { name: /Lewati waktu istirahat|SKIP/i });
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    await expect(restTimer).toBeHidden();

    // 12. Complete and submit workout
    const finishBtn = page.getByRole("button", { name: /SELESAIKAN & SERANG BOSS/i });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // 13. Verify victory modal appears
    await expect(page.getByRole("heading", { name: "GYM RAID VICTORY!" })).toBeVisible();
  });

  test("lifter can log distance-based Farmer's Carry with meters and verify metric display", async ({ page }) => {
    await page.goto("/");

    // 1. Navigate to Quests tab
    const bottomNav = page.getByRole("navigation", { name: "Navigasi Utama Aplikasi" });
    await bottomNav.getByRole("button", { name: "QUESTS" }).click({ force: true });

    // 2. Click LOG WORKOUT
    const logWorkoutBtn = page.getByRole("button", { name: "LOG WORKOUT" });
    await expect(logWorkoutBtn).toBeVisible();
    await logWorkoutBtn.click();

    // 3. Start workout session
    const startSessionBtn = page.getByRole("button", { name: /MULAI SESI LATIHAN/i });
    await expect(startSessionBtn).toBeVisible();
    await startSessionBtn.click();

    // 4. Open exercise picker
    const chooseExerciseBtn = page.getByRole("button", { name: /CHOOSE EXERCISE FROM DATABASE/i });
    await expect(chooseExerciseBtn).toBeVisible();
    await chooseExerciseBtn.click();

    // 5. Search for farmer
    const searchInput = page.getByPlaceholder(/Search by name/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Farmer");

    // 6. Click ADD EXERCISE for Dumbbell Farmer's Walk
    const addExerciseBtn = page.getByRole("button", { name: "ADD EXERCISE" }).first();
    await expect(addExerciseBtn).toBeVisible();
    await addExerciseBtn.click();

    // 7. Verify distance-based UI headers and tips
    await expect(page.getByText(/JARAK \(M\)/i)).toBeVisible();
    await expect(page.getByText(/TIPS FARMER'S CARRY/i)).toBeVisible();

    // 8. Fill weight (24kg) and distance (30m)
    const weightInput = page.locator('input[inputmode="decimal"]').first();
    const distanceInput = page.locator('input[inputmode="numeric"]').first();
    await expect(weightInput).toBeVisible();
    await expect(distanceInput).toBeVisible();

    await weightInput.fill("24");
    await distanceInput.fill("30");

    // 9. Log set and finish
    const logSetBtn = page.getByRole("button", { name: /LOG SET/i }).first();
    await expect(logSetBtn).toBeVisible();
    await logSetBtn.click();

    await expect(page.getByRole("button", { name: /DONE/i }).first()).toBeVisible();

    const finishBtn = page.getByRole("button", { name: /SELESAIKAN & SERANG BOSS/i });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    await expect(page.getByRole("heading", { name: "GYM RAID VICTORY!" })).toBeVisible();
  });
});
