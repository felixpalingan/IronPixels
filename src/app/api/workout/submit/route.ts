import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { calculateSessionRVS, ExerciseLogInput } from "@/lib/rvsEngine";

interface SessionPayload {
  user_id: string;
  exercises: ExerciseLogInput[];
}

export async function POST(request: Request) {
  try {
    const body: SessionPayload = await request.json();
    const { user_id, exercises } = body;

    if (!user_id || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: user_id and exercises are required." },
        { status: 400 }
      );
    }

    const sessionCalc = await calculateSessionRVS(user_id, exercises);

    try {
      const { data: sessionData, error: sessionErr } = await supabase
        .from("Workout_Sessions")
        .insert({
          user_id,
          total_volume_kg: sessionCalc.total_volume_kg,
          total_rvs: sessionCalc.total_rvs,
          exercise_count: sessionCalc.total_exercises,
          status: "completed",
        })
        .select("session_id")
        .single();

      if (sessionData && sessionData.session_id) {
        const sessionId = sessionData.session_id;

        for (const exRes of sessionCalc.exercise_results) {
          const { data: logData } = await supabase
            .from("Session_Exercises")
            .insert({
              session_id: sessionId,
              exercise_id: exRes.exercise_id,
              sets_count: exRes.sets_count,
              reps_count: exRes.reps_count,
              weight_lifted: exRes.weight_lifted,
              rvs_generated: exRes.rvs_generated,
            })
            .select("log_id")
            .single();

          if (logData && logData.log_id) {
            const logId = logData.log_id;
            const setsPayload = exRes.sets.map((s) => ({
              log_id: logId,
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              rvs_generated: s.rvs_generated,
            }));

            await supabase.from("Session_Sets").insert(setsPayload);
          }
        }
      }
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      user_id,
      result: sessionCalc,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit workout session." },
      { status: 500 }
    );
  }
}
