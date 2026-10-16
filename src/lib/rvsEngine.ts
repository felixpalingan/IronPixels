import { createClient } from "@/lib/supabase/server";
import { getExerciseScalingStat, EXERCISE_DATABASE } from "@/lib/exercisesData";
import { calculateSetRvs } from "@/lib/workoutCalculations";

export interface SetItem {
  set_number: number;
  weight_kg: number;
  reps: number;
}

export interface ExerciseLogInput {
  exercise_id: string;
  sets: SetItem[];
}

export interface ExerciseCalcResult {
  exercise_id: string;
  movement_coefficient: number;
  scaling_stat: "STR" | "AGI";
  sets_count: number;
  reps_count: number;
  weight_lifted: number;
  rvs_generated: number;
  sets: Array<SetItem & { rvs_generated: number }>;
}

export async function calculateSessionRVS(userId: string, exercises: ExerciseLogInput[]) {
  let userWeightKg = 75.0;
  let userStr = 85;
  let userAgi = 70;

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight_kg, str, agi")
      .eq("user_id", userId)
      .single();

    if (profile) {
      if (profile.weight_kg) userWeightKg = parseFloat(profile.weight_kg);
      if (profile.str) userStr = Number(profile.str);
      if (profile.agi) userAgi = Number(profile.agi);
    }
  } catch (e) {
  }

  let totalSessionVolume = 0;
  let totalSessionRVS = 0;
  let totalSessionSets = 0;
  let totalSessionReps = 0;

  const exerciseResults: ExerciseCalcResult[] = [];

  for (const ex of exercises) {
    const exDef = EXERCISE_DATABASE.find((d) => d.id === ex.exercise_id);
    const coeff = exDef?.rvsMultiplier || 1.0;
    const scalingStat = getExerciseScalingStat(exDef || { category: "Chest", equipment: "Barbell" });

    let exVolume = 0;
    let exRVS = 0;
    let exReps = 0;

    const setsResult = ex.sets.map((set, idx) => {
      const w = set.weight_kg || 0;
      const r = set.reps || 0;
      let setRVS = 0;

      if (r > 0 && userWeightKg > 0) {
        setRVS = calculateSetRvs({
          weight: w,
          reps: r,
          multiplier: coeff,
          category: exDef?.category || "Chest",
          equipment: exDef?.equipment || "Barbell",
          exerciseName: exDef?.name || "",
          movementType: exDef?.movementType,
          isUnilateral: exDef?.isUnilateral,
          userWeightKg,
          userStr,
          userAgi,
        });
      }

      exVolume += w * r;
      exRVS += setRVS;
      exReps += r;

      return {
        set_number: idx + 1,
        weight_kg: w,
        reps: r,
        rvs_generated: Math.round(setRVS * 100) / 100,
      };
    });

    totalSessionVolume += exVolume;
    totalSessionRVS += exRVS;
    totalSessionSets += setsResult.length;
    totalSessionReps += exReps;

    exerciseResults.push({
      exercise_id: ex.exercise_id,
      movement_coefficient: coeff,
      scaling_stat: scalingStat,
      sets_count: setsResult.length,
      reps_count: exReps,
      weight_lifted: exVolume,
      rvs_generated: Math.round(exRVS * 100) / 100,
      sets: setsResult,
    });
  }

  return {
    user_weight_kg: userWeightKg,
    total_volume_kg: totalSessionVolume,
    total_rvs: Math.round(totalSessionRVS * 100) / 100,
    total_sets: totalSessionSets,
    total_reps: totalSessionReps,
    total_exercises: exercises.length,
    exercise_results: exerciseResults,
  };
}
