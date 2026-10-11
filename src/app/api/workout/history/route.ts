import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

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

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let sessionId = searchParams.get("session_id");

    if (!sessionId) {
      try {
        const body = await request.json();
        sessionId = body?.session_id;
      } catch (e) {}
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id parameter" }, { status: 400 });
    }

    const userId = user.id;

    const { error } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      message: "Workout session permanently deleted",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete workout session" },
      { status: 500 }
    );
  }
}

