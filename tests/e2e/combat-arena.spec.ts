import { test, expect } from "@playwright/test";
import { setupAuthenticatedApp } from "./fixtures";

test.describe("Combat Arena Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test("warrior can enter dungeon arena and cast equipped skills against boss", async ({ page }) => {
    await page.goto("/");

    // 1. Navigate to Quests tab via BottomNav
    const bottomNav = page.getByRole("navigation", { name: "Navigasi Utama Aplikasi" });
    await expect(bottomNav).toBeVisible();
    await bottomNav.getByRole("button", { name: "QUESTS" }).click();

    // 2. Click DUNGEON subview button
    const dungeonBtn = page.getByRole("button", { name: "DUNGEON" });
    await expect(dungeonBtn).toBeVisible();
    await dungeonBtn.click();

    // 3. Verify Dungeon floor header and HP bar
    await expect(page.getByText(/FLOOR \d+:/i)).toBeVisible();
    await expect(page.getByText(/MOB HP|BOSS HP/i)).toBeVisible();

    // 4. Verify Tactical Skill Bar is visible with equipped skills
    await expect(page.getByText(/EQUIPPED GEAR SKILLS/i)).toBeVisible();
    const heavySlashSkill = page.getByRole("button", { name: /Heavy Iron Slash/i });
    await expect(heavySlashSkill).toBeVisible();

    // 5. Cast skill
    await heavySlashSkill.click();

    // 6. Verify skill is triggered (goes on cooldown or action is registered)
    await expect(heavySlashSkill).toBeDisabled();
  });
});
