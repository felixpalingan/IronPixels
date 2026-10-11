import { runWorkoutCalculationsTests } from "./workoutCalculations.test";
import { runUnitConversionTests } from "./unitConversion.test";

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
