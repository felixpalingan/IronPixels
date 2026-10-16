import {
  EXERCISE_DATABASE,
  getExerciseScalingStat,
  getExerciseMovementType,
  isExerciseUnilateral,
  MovementType,
} from "./exercisesData";

export interface SetRvsParams {
  weight: number;
  reps: number;
  multiplier?: number;
  category?: string;
  equipment?: string;
  exerciseName?: string;
  movementType?: MovementType;
  isUnilateral?: boolean;
  userWeightKg?: number;
  userStr?: number;
  userAgi?: number;
}

/**
 * Calculates RVS (Real Volume Score) for an individual set based on
 * weight lifted, repetitions, bodyweight ratio, exercise coefficient, movement category (compound vs isolation),
 * and hero stats.
 */
export function calculateSetRvs({
  weight,
  reps,
  multiplier = 1.0,
  category = "Chest",
  equipment = "Barbell",
  exerciseName = "",
  movementType,
  isUnilateral,
  userWeightKg = 75,
  userStr = 85,
  userAgi = 70,
}: SetRvsParams): number {
  if (reps <= 0) return 0;

  // Security bounds against malicious payloads
  const safeWeight = Math.min(1000, Math.max(0, Number(weight) || 0));
  const safeReps = Math.min(200, Math.max(0, Math.round(Number(reps) || 0)));
  const safeMultiplier = Math.min(3.0, Math.max(0.2, Number(multiplier) || 1.0));
  const safeUserWeight = Math.max(40, Number(userWeightKg) || 75);
  const safeStr = Math.max(1, Number(userStr) || 85);
  const safeAgi = Math.max(1, Number(userAgi) || 70);

  const scalingStat = getExerciseScalingStat({ category, equipment });
  const isAgilityEx = scalingStat === "AGI";
  const relevantStat = isAgilityEx ? safeAgi : safeStr;
  const statMultiplier = relevantStat / 50;

  const isBodyweight = equipment === "Bodyweight";

  // If pure bodyweight calisthenics / agility movement (e.g. push-ups, pull-ups, planks)
  if (isBodyweight && safeWeight <= 0) {
    return Math.round(safeUserWeight * safeReps * 0.12 * safeMultiplier * statMultiplier);
  }

  // If weighted bodyweight (e.g. weighted pull-ups +10kg), combine bodyweight with added weight
  const actualWeight = isBodyweight ? safeUserWeight + safeWeight : Math.max(1, safeWeight);
  const resolvedMovementType =
    movementType || getExerciseMovementType({ category, equipment, name: exerciseName });
  const resolvedIsUnilateral =
    typeof isUnilateral === "boolean"
      ? isUnilateral
      : isExerciseUnilateral({ name: exerciseName });

  let baseLoadKg: number;
  let movementMultiplier: number;

  if (resolvedMovementType === "isolation") {
    if (resolvedIsUnilateral) {
      // Unilateral isolation (e.g. Dumbbell Hammer Curl 1 hand, Lateral Raise)
      // Normal baseline ~12% BW (for 56kg BW = ~6.7kg)
      baseLoadKg = safeUserWeight * 0.12;
      movementMultiplier = 2.2;
    } else {
      // Bilateral isolation (e.g. Barbell Bicep Curl, Leg Extension)
      // Normal baseline ~25% BW (for 56kg BW = 14kg)
      baseLoadKg = safeUserWeight * 0.25;
      movementMultiplier = 1.8;
    }
  } else {
    // Compound movements
    if (resolvedIsUnilateral) {
      // Unilateral compound (e.g. Bulgarian Split Squat, Lunges, Single-Arm Dumbbell Row)
      // Normal single-limb baseline ~30% BW (for 56kg BW = ~16.8kg)
      baseLoadKg = safeUserWeight * 0.3;
      movementMultiplier = 1.6;
    } else if (equipment === "Dumbbell") {
      // Dumbbell compound (e.g. Goblet Squat, DB Flat Bench Press per hand)
      // Normal baseline ~40% BW (for 56kg BW = ~22.4kg)
      baseLoadKg = safeUserWeight * 0.4;
      movementMultiplier = 1.25;
    } else {
      // Standard heavy compound (e.g. Barbell Squat, Deadlift, Bench Press)
      // Normal baseline ~75% BW (for 56kg BW = 42kg)
      baseLoadKg = safeUserWeight * 0.75;
      movementMultiplier = 1.0;
    }
  }

  // Intensity ratio clamped to reasonable limits
  const intensityRatio = Math.max(0.65, Math.min(2.2, actualWeight / Math.max(1, baseLoadKg)));

  return Math.round(
    actualWeight *
      safeReps *
      0.12 *
      intensityRatio *
      movementMultiplier *
      safeMultiplier *
      statMultiplier
  );
}

export interface ExerciseSetLogInput {
  set_number?: number;
  weight_kg?: number;
  weight?: number;
  reps?: number;
  completed?: boolean;
}

export interface ExerciseItemLogInput {
  exercise_id?: string;
  definitionId?: string;
  id?: string;
  exercise_name?: string;
  name?: string;
  category?: string;
  equipment?: string;
  rvs_multiplier?: number;
  rvsMultiplier?: number;
  multiplier?: number;
  sets?: ExerciseSetLogInput[];
}

export interface WorkoutTotalsResult {
  totalVolumeKg: number;
  totalRvs: number;
  totalSets: number;
  totalReps: number;
  sanitizedExercisesLog: Array<{
    exercise_name: string;
    category: string;
    equipment?: string;
    sets: Array<{
      set_number: number;
      weight_kg: number;
      reps: number;
      completed: boolean;
      rvs: number;
    }>;
  }>;
}

/**
 * Iterates through exercises log and recalculates total volume (kg) and total RVS.
 * Server-authoritative: does not trust client-provided totals.
 */
export function calculateWorkoutSessionTotals({
  exercisesLog,
  userWeightKg = 75,
  userStr = 85,
  userAgi = 70,
}: {
  exercisesLog: ExerciseItemLogInput[];
  userWeightKg?: number;
  userStr?: number;
  userAgi?: number;
}): WorkoutTotalsResult {
  if (!Array.isArray(exercisesLog)) {
    return {
      totalVolumeKg: 0,
      totalRvs: 0,
      totalSets: 0,
      totalReps: 0,
      sanitizedExercisesLog: [],
    };
  }

  let totalVolumeKg = 0;
  let totalRvs = 0;
  let totalSets = 0;
  let totalReps = 0;

  const sanitizedExercisesLog: WorkoutTotalsResult["sanitizedExercisesLog"] = [];

  for (const ex of exercisesLog) {
    const rawId = ex.exercise_id || ex.definitionId || ex.id;
    const rawName = (ex.exercise_name || ex.name || "").trim();

    // Look up canonical definition from database
    const def = EXERCISE_DATABASE.find(
      (d) =>
        (rawId && d.id === rawId) ||
        (rawName && d.name.toLowerCase() === rawName.toLowerCase()) ||
        (rawName && d.aliases?.some((a) => a.toLowerCase() === rawName.toLowerCase()))
    );

    const category = def?.category || ex.category || "Chest";
    const equipment = def?.equipment || ex.equipment || "Barbell";
    const exerciseName = def?.name || rawName || "Unknown Exercise";
    const multiplier = def?.rvsMultiplier ?? ex.rvs_multiplier ?? ex.rvsMultiplier ?? ex.multiplier ?? 1.0;

    const rawSets = Array.isArray(ex.sets) ? ex.sets : [];
    const sanitizedSets: Array<{
      set_number: number;
      weight_kg: number;
      reps: number;
      completed: boolean;
      rvs: number;
    }> = [];

    for (let i = 0; i < rawSets.length; i++) {
      const s = rawSets[i];
      // If completed property is explicitly false, set was not done
      const isCompleted = s.completed !== false;
      const weight = Math.min(1000, Math.max(0, Number(s.weight_kg ?? s.weight ?? 0)));
      const reps = Math.min(200, Math.max(0, Math.round(Number(s.reps ?? 0))));

      if (isCompleted && reps > 0) {
        const setRvs = calculateSetRvs({
          weight,
          reps,
          multiplier,
          category,
          equipment,
          exerciseName,
          movementType: def?.movementType,
          isUnilateral: def?.isUnilateral,
          userWeightKg,
          userStr,
          userAgi,
        });

        totalVolumeKg += Math.round(weight * reps);
        totalRvs += setRvs;
        totalSets += 1;
        totalReps += reps;

        sanitizedSets.push({
          set_number: sanitizedSets.length + 1,
          weight_kg: weight,
          reps,
          completed: true,
          rvs: setRvs,
        });
      }
    }

    if (sanitizedSets.length > 0) {
      sanitizedExercisesLog.push({
        exercise_name: exerciseName,
        category,
        equipment,
        sets: sanitizedSets,
      });
    }
  }

  return {
    totalVolumeKg,
    totalRvs,
    totalSets,
    totalReps,
    sanitizedExercisesLog,
  };
}
