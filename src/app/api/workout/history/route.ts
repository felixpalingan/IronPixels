import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: sessions, error } = await supabase
      .from("Workout_Sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ sessions: [] });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err: any) {
    return NextResponse.json({ sessions: [] });
  }
}
