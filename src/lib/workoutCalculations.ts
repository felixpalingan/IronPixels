import { EXERCISE_DATABASE, getExerciseScalingStat } from "./exercisesData";

export interface SetRvsParams {
  weight: number;
  reps: number;
  multiplier?: number;
  category?: string;
  equipment?: string;
  userWeightKg?: number;
  userStr?: number;
  userAgi?: number;
}

/**
 * Calculates RVS (Real Volume Score) for an individual set based on
 * weight lifted, repetitions, bodyweight ratio, exercise coefficient, and hero stats.
 */
export function calculateSetRvs({
  weight,
  reps,
  multiplier = 1.0,
  category = "Chest",
  equipment = "Barbell",
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

  const actualWeight = isAgilityEx && safeWeight <= 0 ? safeUserWeight : Math.max(1, safeWeight);
  const bodyweightRatio = actualWeight / safeUserWeight;

  const relevantStat = isAgilityEx ? safeAgi : safeStr;
  const statMultiplier = relevantStat / 50;

  return Math.round(actualWeight * safeReps * bodyweightRatio * 0.1 * safeMultiplier * statMultiplier);
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
      (d) => (rawId && d.id === rawId) || (rawName && d.name.toLowerCase() === rawName.toLowerCase())
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
