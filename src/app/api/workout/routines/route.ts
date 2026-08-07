import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

const DEFAULT_ROUTINE_PRESETS = [
  {
    routine_id: "preset-push-day",
    user_id: "system",
    routine_name: "Push Day Blast (Chest, Shoulders, Triceps)",
    description: "Focus on pushing power, upper chest hypertrophy, and shoulder stability.",
    target_split: "Push",
    is_preset: true,
    exercises: [
      { definitionId: "barbell-bench-press", defaultSets: 4, defaultWeight: 60, defaultReps: 10 },
      { definitionId: "barbell-incline-bench-press", defaultSets: 3, defaultWeight: 50, defaultReps: 10 },
      { definitionId: "overhead-press", defaultSets: 3, defaultWeight: 40, defaultReps: 8 },
      { definitionId: "tricep-rope-pushdown", defaultSets: 3, defaultWeight: 25, defaultReps: 12 },
    ],
  },
  {
    routine_id: "preset-pull-day",
    user_id: "system",
    routine_name: "Pull Day Power (Back, Rear Delts, Biceps)",
    description: "Maximize lat width, upper back thickness, and grip strength.",
    target_split: "Pull",
    is_preset: true,
    exercises: [
      { definitionId: "barbell-deadlift", defaultSets: 4, defaultWeight: 80, defaultReps: 6 },
      { definitionId: "lat-pulldown", defaultSets: 4, defaultWeight: 50, defaultReps: 10 },
      { definitionId: "bent-over-barbell-row", defaultSets: 3, defaultWeight: 55, defaultReps: 10 },
      { definitionId: "barbell-bicep-curl", defaultSets: 3, defaultWeight: 30, defaultReps: 12 },
    ],
  },
  {
    routine_id: "preset-legs-day",
    user_id: "system",
    routine_name: "Leg Day Domination (Quads, Glutes, Hamstrings)",
    description: "Build massive leg strength and core stability.",
    target_split: "Legs",
    is_preset: true,
    exercises: [
      { definitionId: "barbell-back-squat", defaultSets: 4, defaultWeight: 70, defaultReps: 8 },
      { definitionId: "leg-press-machine", defaultSets: 4, defaultWeight: 120, defaultReps: 10 },
      { definitionId: "bulgarian-split-squat", defaultSets: 3, defaultWeight: 16, defaultReps: 10 },
      { definitionId: "lying-leg-curl", defaultSets: 3, defaultWeight: 40, defaultReps: 12 },
    ],
  },
  {
    routine_id: "preset-full-body",
    user_id: "system",
    routine_name: "Full Body Champion (Squat, Press, Row)",
    description: "High efficiency full body workout for maximum RVS damage.",
    target_split: "Full Body",
    is_preset: true,
    exercises: [
      { definitionId: "barbell-back-squat", defaultSets: 3, defaultWeight: 70, defaultReps: 8 },
      { definitionId: "barbell-bench-press", defaultSets: 3, defaultWeight: 60, defaultReps: 10 },
      { definitionId: "pull-up", defaultSets: 3, defaultWeight: 0, defaultReps: 8 },
      { definitionId: "dumbbell-seated-shoulder-press", defaultSets: 3, defaultWeight: 20, defaultReps: 10 },
    ],
  },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || DEFAULT_USER_ID;

    let userRoutines: any[] = [];
    try {
      const { data: dbRoutines } = await supabase
        .from("workout_routines")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (dbRoutines) {
        userRoutines = dbRoutines;
      }
    } catch (e) {}

    const allRoutines = [...userRoutines, ...DEFAULT_ROUTINE_PRESETS];

    return NextResponse.json({
      success: true,
      routines: allRoutines,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch workout routines." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { routine_name, description, target_split = "Custom", exercises } = body;

    if (!routine_name || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: "routine_name and exercises list are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || DEFAULT_USER_ID;

    const newRoutine = {
      user_id: userId,
      routine_name,
      description: description || `Custom ${target_split} routine.`,
      target_split,
      exercises,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let insertedRecord = {
      ...newRoutine,
      routine_id: `routine-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    try {
      const { data: insertedData } = await supabase
        .from("workout_routines")
        .insert(newRoutine)
        .select("*")
        .single();

      if (insertedData) {
        insertedRecord = insertedData;
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      routine: insertedRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save workout routine." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routineId = searchParams.get("routine_id");

    if (!routineId) {
      return NextResponse.json(
        { error: "routine_id parameter is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || DEFAULT_USER_ID;

    try {
      await supabase
        .from("workout_routines")
        .delete()
        .eq("routine_id", routineId)
        .eq("user_id", userId);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      deleted_id: routineId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete workout routine." },
      { status: 500 }
    );
  }
}
