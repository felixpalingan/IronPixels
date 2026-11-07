import { calculateStreaks, normalizeDateString } from "../src/lib/streakCalculator";

export function runStreakCalculatorTests() {
  console.log("--- RUNNING STREAK CALCULATOR TESTS ---");
  let passed = 0;
  let total = 0;

  function assert(desc: string, cond: boolean) {
    total++;
    if (cond) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ ${desc}`);
    }
  }

  // 1. Empty dates array
  const emptyRes = calculateStreaks([]);
  assert("Empty dates array returns 0 streak", emptyRes.currentStreak === 0 && emptyRes.longestStreak === 0 && emptyRes.lastWorkoutDate === null);

  // 2. Single workout day
  const singleRes = calculateStreaks(["2026-10-31"], "2026-10-31");
  assert("Single workout day on ref date returns streak 1", singleRes.currentStreak === 1 && singleRes.longestStreak === 1 && singleRes.lastWorkoutDate === "2026-10-31");

  // 3. User's exact dates: Oct 15, Oct 23, Oct 30, Oct 31
  const userDates = ["2026-10-15", "2026-10-23", "2026-10-30", "2026-10-31"];
  const userStreakAtEnd = calculateStreaks(userDates, "2026-10-31");
  assert("Oct 30 & Oct 31 consecutive gives longestStreak = 2 and currentStreak = 2", userStreakAtEnd.longestStreak === 2 && userStreakAtEnd.currentStreak === 2);

  // 4. Broken current streak due to elapsed days, but longest streak preserved
  const userStreakLater = calculateStreaks(userDates, "2026-11-07");
  assert("Longest streak stays 2 even after workout streak gap", userStreakLater.longestStreak === 2 && userStreakLater.currentStreak === 0);

  // 5. Multiple workouts on the same day do not falsely increment streak
  const duplicateDates = ["2026-10-30", "2026-10-30T10:00:00Z", "2026-10-31", "2026-10-31 18:00:00"];
  const dupRes = calculateStreaks(duplicateDates, "2026-10-31");
  assert("Duplicate sessions on same date do not inflate streak", dupRes.longestStreak === 2 && dupRes.currentStreak === 2);

  // 6. Streak of 5 consecutive days
  const fiveDays = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"];
  const fiveRes = calculateStreaks(fiveDays, "2026-11-05");
  assert("5 consecutive days returns 5 current and longest streak", fiveRes.currentStreak === 5 && fiveRes.longestStreak === 5);

  // 7. Last workout was yesterday: current streak is still alive
  const yesterdayRes = calculateStreaks(["2026-11-04", "2026-11-05"], "2026-11-06");
  assert("Last workout yesterday maintains active streak", yesterdayRes.currentStreak === 2);

  console.log(`STREAK CALCULATOR TESTS RESULT: ${passed}/${total} PASSED\n`);
  return { passed, total };
}

if (require.main === module) {
  const result = runStreakCalculatorTests();
  if (result.passed !== result.total) {
    process.exit(1);
  }
}

