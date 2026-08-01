import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { calculateRVS, SetItem } from "@/lib/rvsEngine";

interface WorkoutPayload {
  user_id: string;
  exercise_id: string;
  sets: SetItem[];
}

export async function POST(request: Request) {
  try {
    const body: WorkoutPayload = await request.json();
    const { user_id, exercise_id, sets } = body;

    if (!user_id || !exercise_id || !sets || sets.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: user_id, exercise_id, and sets are required." },
        { status: 400 }
      );
    }

    const calcResult = await calculateRVS(user_id, exercise_id, sets);

    try {
      await supabase.from("Workout_Sessions").insert({
        user_id,
        exercise_id,
        sets: calcResult.total_sets,
        reps: calcResult.total_reps,
        weight_lifted: calcResult.total_volume_kg,
        rvs_generated: calcResult.total_rvs,
      });
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      user_id,
      exercise_id,
      result: calcResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process workout session." },
      { status: 500 }
    );
  }
}
