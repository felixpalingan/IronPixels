import {
  calculateEstimated1RM,
  isBodyweightExercise,
  matchesExercise,
  calculateExerciseSessionSummary,
  generateOverloadTargets,
  analyzeProgressiveOverload,
} from "../src/lib/progressiveOverload";
import { EXERCISE_DATABASE } from "../src/lib/exercisesData";

export function runProgressiveOverloadTests(): { passed: number; failed: number } {
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

  console.log("\n🧪 Running Progressive Overload & 1RM Estimation Test Suite...");

  // 1. Single rep exact 1RM
  const singleRep1RM = calculateEstimated1RM(100, 1);
  assert(singleRep1RM === 100, `Single rep 100kg x 1 should equal 100kg 1RM (got ${singleRep1RM})`);

  // 2. Multi-rep Epley calculation: 100kg x 10 reps -> 100 * (1 + 10/30) = 133.3 -> 133kg
  const multiRepEpley = calculateEstimated1RM(100, 10, { formula: "epley" });
  assert(multiRepEpley === 133, `100kg x 10 reps (Epley) expected 133kg 1RM (got ${multiRepEpley})`);

  // 3. Brzycki calculation: 100kg x 10 reps -> 100 * (36 / 27) = 133.3 -> 133kg
  const multiRepBrzycki = calculateEstimated1RM(100, 10, { formula: "brzycki" });
  assert(multiRepBrzycki === 133, `100kg x 10 reps (Brzycki) expected 133kg 1RM (got ${multiRepBrzycki})`);

  // 4. Bodyweight exercise with 0 added weight uses user bodyweight
  const bwPullup1RM = calculateEstimated1RM(0, 10, {
    isBodyweight: true,
    userBodyweightKg: 75,
  });
  // 75 * (1 + 10/30) = 100kg
  assert(bwPullup1RM === 100, `Bodyweight pull-up (75kg BW x 10 reps) expected 100kg 1RM (got ${bwPullup1RM})`);

  // 5. Weighted bodyweight exercise (75kg BW + 15kg dip belt = 90kg effective load)
  const weightedDip1RM = calculateEstimated1RM(15, 6, {
    isBodyweight: true,
    userBodyweightKg: 75,
  });
  // 90 * (1 + 6/30) = 90 * 1.2 = 108kg
  assert(weightedDip1RM === 108, `Weighted dip (+15kg @ 75kg BW x 6 reps) expected 108kg 1RM (got ${weightedDip1RM})`);

  // 6. High rep endurance capping: 50 reps should not produce infinite 1RM (capped at 15 reps)
  const highRep1RM = calculateEstimated1RM(50, 50);
  const cappedRep1RM = calculateEstimated1RM(50, 15);
  assert(highRep1RM === cappedRep1RM, `Reps > 15 should be capped to 15 reps for 1RM estimation (got ${highRep1RM} vs ${cappedRep1RM})`);

  // 7. Session summary selects set with best 1RM (even if raw weight is lower)
  const benchDef = EXERCISE_DATABASE.find((e) => e.id === "barbell-bench-press") || EXERCISE_DATABASE[0];
  const testSession = {
    date: "2026-10-25",
    exercises_log: [
      {
        definitionId: "barbell-bench-press",
        sets: [
          { set_number: 1, weight_kg: 85, reps: 1 }, // 1RM = 85kg
          { set_number: 2, weight_kg: 80, reps: 10 }, // 1RM = 107kg (BEST SET!)
          { set_number: 3, weight_kg: 70, reps: 12 }, // 1RM = 98kg
        ],
      },
    ],
  };

  const summary = calculateExerciseSessionSummary(testSession, benchDef);
  assert(summary !== null, "Exercise session summary should not be null");
  if (summary) {
    assert(summary.est1RM === 107, `Best set 1RM should be 107kg (got ${summary.est1RM})`);
    assert(summary.bestWeight === 80, `Best set weight should be 80kg (got ${summary.bestWeight})`);
    assert(summary.bestReps === 10, `Best set reps should be 10 (got ${summary.bestReps})`);
    assert(summary.totalSets === 3, `Total sets should be 3 (got ${summary.totalSets})`);
    // raw volume: 85*1 + 80*10 + 70*12 = 85 + 800 + 840 = 1725
    assert(summary.rawVolumeKg === 1725, `Raw volume should be 1725kg (got ${summary.rawVolumeKg})`);
  }

  // 8. Overload Targets (Double Progression)
  if (summary) {
    const targets = generateOverloadTargets(summary, benchDef);
    assert(targets.loadTarget.targetWeightKg === 82.5, `Next load target should be +2.5kg = 82.5kg (got ${targets.loadTarget.targetWeightKg})`);
    assert(targets.repTarget.targetReps === 11, `Next rep target should be +1 rep = 11 reps (got ${targets.repTarget.targetReps})`);
    assert(targets.loadTarget.est1RM > summary.est1RM, `Load target est1RM should exceed previous 1RM`);
    assert(targets.repTarget.est1RM > summary.est1RM, `Rep target est1RM should exceed previous 1RM`);
  }

  // 9. Full analysis with multiple sessions, progress calculation, and plateau check
  const multiSessions = [
    {
      date: "2026-10-10",
      exercises_log: [
        { definitionId: "barbell-bench-press", sets: [{ weight_kg: 70, reps: 8 }] }, // 1RM = 89kg
      ],
    },
    {
      date: "2026-10-17",
      exercises_log: [
        { definitionId: "barbell-bench-press", sets: [{ weight_kg: 75, reps: 8 }] }, // 1RM = 95kg
      ],
    },
    {
      date: "2026-10-24",
      exercises_log: [
        { definitionId: "barbell-bench-press", sets: [{ weight_kg: 80, reps: 8 }] }, // 1RM = 101kg
      ],
    },
  ];

  const analysis = analyzeProgressiveOverload(multiSessions, "barbell-bench-press", {
    userBodyweightKg: 75,
  });

  assert(analysis.historyPoints.length === 3, `Should have 3 history points (got ${analysis.historyPoints.length})`);
  assert(analysis.currentEst1RM === 101, `Current est 1RM should be 101kg (got ${analysis.currentEst1RM})`);
  assert(analysis.initialEst1RM === 89, `Initial est 1RM should be 89kg (got ${analysis.initialEst1RM})`);
  assert(analysis.progressPct > 0, `Progress % should be positive (got ${analysis.progressPct}%)`);
  assert(!analysis.isPlateau, `Progressing trend should not be flagged as plateau`);

  // 10. Plateau detection when 3 consecutive sessions don't increase 1RM
  const plateauSessions = [
    {
      date: "2026-10-10",
      exercises_log: [
        { definitionId: "barbell-bench-press", sets: [{ weight_kg: 80, reps: 8 }] }, // 1RM = 101kg
      ],
    },
    {
      date: "2026-10-17",
      exercises_log: [
        { definitionId: "barbell-bench-press", sets: [{ weight_kg: 80, reps: 8 }] }, // 1RM = 101kg
      ],
    },
    {
      date: "2026-10-24",
      exercises_log: [
        { definitionId: "barbell-bench-press", sets: [{ weight_kg: 80, reps: 7 }] }, // 1RM = 99kg
      ],
    },
  ];

  const plateauAnalysis = analyzeProgressiveOverload(plateauSessions, "barbell-bench-press");
  assert(plateauAnalysis.isPlateau === true, `Stagnant 1RM sessions should trigger plateau flag`);

  return { passed, failed };
}

