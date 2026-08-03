import { createClient } from "@/lib/supabase/server";

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
  sets_count: number;
  reps_count: number;
  weight_lifted: number;
  rvs_generated: number;
  sets: Array<SetItem & { rvs_generated: number }>;
}

export async function calculateSessionRVS(userId: string, exercises: ExerciseLogInput[]) {
  let userWeightKg = 75.0;
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight_kg")
      .eq("user_id", userId)
      .single();

    if (profile && profile.weight_kg) {
      userWeightKg = parseFloat(profile.weight_kg);
    }
  } catch (e) {
  }

  let totalSessionVolume = 0;
  let totalSessionRVS = 0;
  let totalSessionSets = 0;
  let totalSessionReps = 0;

  const exerciseResults: ExerciseCalcResult[] = [];

  for (const ex of exercises) {
    let coeff = 1.2;

    let exVolume = 0;
    let exRVS = 0;
    let exReps = 0;

    const setsResult = ex.sets.map((set, idx) => {
      const w = set.weight_kg || 0;
      const r = set.reps || 0;
      let setRVS = 0;
      if (w > 0 && r > 0 && userWeightKg > 0) {
        setRVS = (w / userWeightKg) * r * coeff;
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
