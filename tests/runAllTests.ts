import { runWorkoutCalculationsTests } from "./workoutCalculations.test";
import { runUnitConversionTests } from "./unitConversion.test";
import { runRateLimitTests } from "./rateLimit.test";
import { runProgressiveOverloadTests } from "./progressiveOverload.test";
import { runOfflineSyncTests } from "./offlineSync.test";
import { runStreakCalculatorTests } from "./streakCalculator.test";

function main() {
  console.log("==================================================");
  console.log("⚔️  IRONPIXELS AUTOMATED TEST SUITE RUNNER  ⚔️");
  console.log("==================================================");

  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;

  // 1. Run Workout Calculations tests
  const res1 = runWorkoutCalculationsTests();
  totalPassed += res1.passed;
  totalFailed += res1.failed;

  // 2. Run Unit Conversion tests
  const res2 = runUnitConversionTests();
  totalPassed += res2.passed;
  totalFailed += res2.failed;

  // 3. Run Rate Limiter & API Security tests
  const res3 = runRateLimitTests();
  totalPassed += res3.passed;
  totalFailed += res3.failed;

  // 4. Run Progressive Overload & 1RM Estimation tests
  const res4 = runProgressiveOverloadTests();
  totalPassed += res4.passed;
  totalFailed += res4.failed;

  // 5. Run Offline Sync & Auto-Retry tests
  const res5 = runOfflineSyncTests();
  totalPassed += res5.passed;
  totalFailed += res5.failed;

  // 6. Run Streak Calculator tests
  const res6 = runStreakCalculatorTests();
  totalPassed += res6.passed;
  totalFailed += (res6.total - res6.passed);

  const duration = Date.now() - startTime;

  console.log("\n==================================================");
  console.log("📊 TEST EXECUTION SUMMARY");
  console.log("==================================================");
  console.log(`  Total Tests Run: ${totalPassed + totalFailed}`);
  console.log(`  Passed:          ${totalPassed} ✅`);
  console.log(`  Failed:          ${totalFailed} ${totalFailed > 0 ? "❌" : "✨"}`);
  console.log(`  Execution Time:  ${duration}ms`);
  console.log("==================================================");

  if (totalFailed > 0) {
    console.error("\n💥 SOME TESTS FAILED! ABORTING.");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL IRONPIXELS ENGINE TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  }
}

main();
