import { calculateSetRvs, calculateWorkoutSessionTotals } from "../src/lib/workoutCalculations";

export function runWorkoutCalculationsTests(): { passed: number; failed: number } {
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

  console.log("\n🧪 Running Workout Calculations Test Suite...");

  // Test 1: Zero reps returns 0 RVS
  const zeroRepsRvs = calculateSetRvs({
    weight: 100,
    reps: 0,
    category: "Chest",
    equipment: "Barbell",
    userWeightKg: 75,
  });
  assert(zeroRepsRvs === 0, "Set with 0 reps should yield 0 RVS");

  // Test 2: Standard Barbell Bench Press calculation
  const benchRvs = calculateSetRvs({
    weight: 80,
    reps: 10,
    category: "Chest",
    equipment: "Barbell",
    multiplier: 1.0,
    userWeightKg: 80,
    userStr: 100,
  });
  // actualWeight = 80kg, reps = 10, baseLoad = 80*0.75 = 60kg, intensityRatio = 1.333, strMultiplier = 2.0 -> 80 * 10 * 0.12 * 1.333 * 2.0 = 256 RVS
  assert(benchRvs === 256, `Bench Press RVS expected 256, received ${benchRvs}`);

  // Test 3: Bodyweight exercise with 0 weight uses bodyweight
  const pullupRvs = calculateSetRvs({
    weight: 0,
    reps: 10,
    category: "Back",
    equipment: "Bodyweight",
    multiplier: 1.0,
    userWeightKg: 75,
    userAgi: 75,
  });
  assert(pullupRvs > 0, `Pull-up with 0 added weight should use bodyweight and yield >0 RVS (got ${pullupRvs})`);

  // Test 4: Extreme input sanitization (security bounds)
  const extremeRvs = calculateSetRvs({
    weight: 999999, // Should be clamped to 1000
    reps: 5000,     // Should be clamped to 200
    multiplier: 50, // Should be clamped to 3.0
    userWeightKg: 75,
  });
  assert(extremeRvs > 0 && !isNaN(extremeRvs) && isFinite(extremeRvs), "Extreme inputs must be bounded safely");

  // Test 5: Session totals ignore incomplete sets
  const sessionResult = calculateWorkoutSessionTotals({
    exercisesLog: [
      {
        exercise_name: "Barbell Squat",
        category: "Legs",
        equipment: "Barbell",
        sets: [
          { weight_kg: 100, reps: 5, completed: true },
          { weight_kg: 100, reps: 5, completed: false }, // Ignored!
          { weight_kg: 100, reps: 5, completed: true },
        ],
      },
    ],
    userWeightKg: 80,
    userStr: 85,
  });

  assert(sessionResult.totalSets === 2, `Total completed sets should be 2, received ${sessionResult.totalSets}`);
  assert(sessionResult.totalVolumeKg === 1000, `Total volume should be 1000kg (2 sets * 5 reps * 100kg), received ${sessionResult.totalVolumeKg}`);
  assert(sessionResult.totalReps === 10, `Total completed reps should be 10, received ${sessionResult.totalReps}`);
  assert(sessionResult.totalRvs > 0, `Total session RVS should be > 0, received ${sessionResult.totalRvs}`);

  // Test 6: Farmer's Carry distance-based tracking (weight + meters)
  const farmersResult = calculateWorkoutSessionTotals({
    exercisesLog: [
      {
        exercise_name: "Dumbbell Farmer's Walk",
        category: "Core",
        equipment: "Dumbbell",
        sets: [
          { weight_kg: 24, distance_meters: 30, completed: true },
          { weight_kg: 24, distance_meters: 30, completed: true },
        ],
      },
    ],
    userWeightKg: 75,
    userStr: 85,
  });

  assert(farmersResult.totalSets === 2, "Farmer's Carry should count 2 completed sets");
  assert(farmersResult.totalVolumeKg === 1440, `Farmer's Carry volume expected 1440kg (2 sets * 24kg * 30m), got ${farmersResult.totalVolumeKg}`);
  assert(farmersResult.sanitizedExercisesLog[0]?.is_distance_based === true, "Farmer's Carry should be marked as distance-based");
  assert(farmersResult.sanitizedExercisesLog[0]?.sets[0]?.distance_meters === 30, "Farmer's Carry set should preserve distance in meters");
  assert(farmersResult.totalRvs > 0, `Farmer's Carry session RVS should be > 0 (got ${farmersResult.totalRvs})`);

  return { passed, failed };
}
