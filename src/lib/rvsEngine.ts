import { supabase } from "@/lib/supabaseClient";

export interface SetItem {
  set_number: number;
  weight_kg: number;
  reps: number;
}

export async function calculateRVS(userId: string, exerciseId: string, sets: SetItem[]) {
  let userWeightKg = 75.0;
  try {
    const { data: user } = await supabase
      .from("Users")
      .select("weight_kg")
      .eq("user_id", userId)
      .single();

    if (user && user.weight_kg) {
      userWeightKg = parseFloat(user.weight_kg);
    }
  } catch (e) {
  }

  let movementCoefficient = 1.0;
  try {
    const { data: exercise } = await supabase
      .from("Exercise_Dictionary")
      .select("movement_coefficient")
      .eq("exercise_id", exerciseId)
      .single();

    if (exercise && exercise.movement_coefficient) {
      movementCoefficient = parseFloat(exercise.movement_coefficient);
    }
  } catch (e) {
  }

  let totalRVS = 0;
  let totalVolumeKg = 0;
  let totalReps = 0;

  for (const set of sets) {
    if (set.weight_kg > 0 && set.reps > 0 && userWeightKg > 0) {
      const setRVS = (set.weight_kg / userWeightKg) * set.reps * movementCoefficient;
      totalRVS += setRVS;
      totalVolumeKg += set.weight_kg * set.reps;
      totalReps += set.reps;
    }
  }

  return {
    user_weight_kg: userWeightKg,
    movement_coefficient: movementCoefficient,
    total_rvs: Math.round(totalRVS * 100) / 100,
    total_volume_kg: totalVolumeKg,
    total_sets: sets.length,
    total_reps: totalReps,
  };
}
