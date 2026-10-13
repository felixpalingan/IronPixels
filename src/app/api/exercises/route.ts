import { NextResponse } from "next/server";
import { EXERCISE_DATABASE } from "@/lib/exercisesData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  const all = EXERCISE_DATABASE.map((ex) => ({
    exercise_id: ex.id,
    exercise_name: ex.name,
    category: ex.category,
    difficulty_label: ex.difficultyLabel,
    equipment: ex.equipment,
    target_muscles: ex.targetMuscles,
    movement_coefficient: ex.rvsMultiplier,
    aliases: ex.aliases || [],
  }));

  if (!query) {
    return NextResponse.json(all);
  }

  const filtered = all.filter((ex) =>
    ex.exercise_name.toLowerCase().includes(query) ||
    ex.category.toLowerCase().includes(query) ||
    ex.aliases.some((a) => a.toLowerCase().includes(query))
  );

  return NextResponse.json(filtered.length > 0 ? filtered : all);
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
