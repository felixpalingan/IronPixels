import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured in environment, verify authorization
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wrvazjrpvwaippcsqxvg.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_JcebXyaBailBLK8l1o44wg_wXpN6bVr";

  const startTime = Date.now();

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Perform queries to keep PostgreSQL / Supabase active and prevent pausing
    const [profilesRes, bossesRes, exercisesRes] = await Promise.allSettled([
      supabase.from("profiles").select("id").limit(1),
      supabase.from("dungeon_bosses").select("boss_id").limit(1),
      supabase.from("user_inventory").select("inventory_id").limit(1),
    ]);

    const durationMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    const results = {
      profiles: profilesRes.status === "fulfilled" && !profilesRes.value.error ? "ok" : "error/skipped",
      bosses: bossesRes.status === "fulfilled" && !bossesRes.value.error ? "ok" : "error/skipped",
      inventory: exercisesRes.status === "fulfilled" && !exercisesRes.value.error ? "ok" : "error/skipped",
    };

    return NextResponse.json({
      success: true,
      message: "Supabase keep-alive ping completed successfully.",
      timestamp,
      durationMs,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Keep-alive ping failed.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
