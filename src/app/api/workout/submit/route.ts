import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, date, duration_minutes, total_rvs, total_volume_kg, exercises_log } = body;

    if (!user_id || !total_rvs) {
      return NextResponse.json(
        { error: "Invalid workout payload." },
        { status: 400 }
      );
    }

    const sessionRecord = {
      session_id: `ws-${Date.now()}`,
      user_id,
      date: date || new Date().toISOString().split("T")[0],
      duration_minutes: duration_minutes || 45,
      total_rvs: total_rvs || 0,
      total_volume_kg: total_volume_kg || 0,
      exercises_log: exercises_log || [],
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      await supabase.from("workout_sessions").insert(sessionRecord);
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      session: sessionRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log workout session." },
      { status: 500 }
    );
  }
}
