import {
  kgToLbs,
  lbsToKg,
  formatWeightWithUnit,
  toDisplayWeight,
  toCanonicalKg,
} from "../src/lib/unitConversion";

export function runUnitConversionTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log("\n🧪 Running Unit Conversion Test Suite...");

  // Test 1: 100 kg to lbs
  const lbsVal = kgToLbs(100);
  assert(lbsVal === 220.5, `100 kg to lbs expected 220.5, received ${lbsVal}`);

  // Test 2: 220.5 lbs to kg
  const kgVal = lbsToKg(220.5);
  assert(kgVal === 100, `220.5 lbs to kg expected 100, received ${kgVal}`);

  // Test 3: Zero or invalid weight handling
  assert(kgToLbs(0) === 0, "0 kg should return 0 lbs");
  assert(lbsToKg(0) === 0, "0 lbs should return 0 kg");

  // Test 4: Format with unit
  const formattedKg = formatWeightWithUnit(100, "kg");
  assert(formattedKg === "100 KG", `formatWeightWithUnit(100, 'kg') expected '100 KG', got '${formattedKg}'`);

  const formattedLbs = formatWeightWithUnit(100, "lbs");
  assert(formattedLbs === "220.5 LBS", `formatWeightWithUnit(100, 'lbs') expected '220.5 LBS', got '${formattedLbs}'`);

  // Test 5: toDisplayWeight
  assert(toDisplayWeight(60, "kg") === 60, "Display weight in KG for 60kg should be 60");
  assert(toDisplayWeight(60, "lbs") === 132.3, `Display weight in LBS for 60kg expected 132.3, got ${toDisplayWeight(60, "lbs")}`);

  // Test 6: toCanonicalKg (convert user input to storage KG)
  assert(toCanonicalKg(60, "kg") === 60, "60 input in KG should remain 60 KG");
  assert(toCanonicalKg(132.3, "lbs") === 60, `132.3 input in LBS should convert back to 60 KG, got ${toCanonicalKg(132.3, "lbs")}`);

  return { passed, failed };
}
