import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    let { data: sessions, error } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !sessions || sessions.length === 0) {
      const { data: legacySessions } = await supabase
        .from("Workout_Sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (legacySessions && legacySessions.length > 0) {
        sessions = legacySessions;
      }
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err: any) {
    return NextResponse.json({ sessions: [] });
  }
}
