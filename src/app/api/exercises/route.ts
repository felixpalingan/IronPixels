import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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

  try {
    let dbQuery = supabase.from("Exercise_Dictionary").select("exercise_id, exercise_name, tier, movement_coefficient");
    if (query.trim()) {
      dbQuery = dbQuery.ilike("exercise_name", `%${query.trim()}%`);
    }

    const { data: exercises, error } = await dbQuery;

    if (!error && exercises && exercises.length > 0) {
      return NextResponse.json(exercises);
    }
  } catch (err) {
  }

  const filtered = DEFAULT_EXERCISES.filter((ex) =>
    ex.exercise_name.toLowerCase().includes(query.toLowerCase())
  );

  return NextResponse.json(filtered.length > 0 ? filtered : DEFAULT_EXERCISES);
}
