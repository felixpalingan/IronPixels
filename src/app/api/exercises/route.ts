import { NextResponse } from "next/server";

const DEFAULT_EXERCISES = [
  {
    exercise_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    exercise_name: "Barbell Bench Press",
    tier: "Tier B",
    movement_coefficient: 1.2,
  },
  {
    exercise_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    exercise_name: "Barbell Squat",
    tier: "Tier B",
    movement_coefficient: 1.5,
  },
  {
    exercise_id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    exercise_name: "Bicep Curl",
    tier: "Tier A",
    movement_coefficient: 2.5,
  },
  {
    exercise_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    exercise_name: "Lateral Raise",
    tier: "Tier A",
    movement_coefficient: 2.8,
  },
  {
    exercise_id: "e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b",
    exercise_name: "Leg Press",
    tier: "Tier C",
    movement_coefficient: 0.7,
  },
  {
    exercise_id: "f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c",
    exercise_name: "Lat Pulldown",
    tier: "Tier C",
    movement_coefficient: 0.8,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const filtered = DEFAULT_EXERCISES.filter((ex) =>
    ex.exercise_name.toLowerCase().includes(query.toLowerCase())
  );

  return NextResponse.json(filtered.length > 0 ? filtered : DEFAULT_EXERCISES);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, equipment, target_muscles, rvs_multiplier } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Exercise name and category are required." },
        { status: 400 }
      );
    }

    const customExercise = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      category,
      difficultyRank: 2,
      difficultyLabel: "Intermediate",
      equipment: equipment || "Bodyweight",
      targetMuscles: target_muscles ? [target_muscles] : [category],
      instructions: [
        `Perform ${name} with proper form, maintaining controlled tempo and tight core.`,
        "Exhale on contraction, inhale on extension.",
      ],
      rvsMultiplier: Number(rvs_multiplier) || 1.0,
      isCustom: true,
    };

    return NextResponse.json({
      success: true,
      exercise: customExercise,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create custom exercise." },
      { status: 500 }
    );
  }
}
