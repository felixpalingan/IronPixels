import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSessionRVS, ExerciseLogInput } from "@/lib/rvsEngine";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

interface SessionPayload {
  user_id?: string;
  exercises: ExerciseLogInput[];
}

export async function POST(request: Request) {
  try {
    const body: SessionPayload = await request.json();
    const { exercises } = body;

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = body.user_id || authData?.user?.id || DEFAULT_USER_ID;

    if (!exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: exercises array is required." },
        { status: 400 }
      );
    }

    const sessionCalc = await calculateSessionRVS(userId, exercises);

    try {
      for (const exRes of sessionCalc.exercise_results) {
        await supabase.from("workout_logs").insert({
          user_id: userId,
          exercise_name: exRes.exercise_id || "Bench Press",
          weight_kg: exRes.weight_lifted,
          reps: exRes.reps_count,
          sets: exRes.sets_count,
          rvs_score: exRes.rvs_generated,
        });
      }
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      result: sessionCalc,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit workout session." },
      { status: 500 }
    );
  }
}
