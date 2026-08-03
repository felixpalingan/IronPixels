import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLASS_BASE_STATS = {
  WARRIOR: { str: 90, agi: 50, vit: 85, luk: 45 },
  ROGUE: { str: 60, agi: 95, vit: 45, luk: 85 },
  "CYBER KNIGHT": { str: 75, agi: 75, vit: 70, luk: 70 },
};

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || DEFAULT_USER_ID;
    const body = await request.json();
    const { weight_kg, character_class, username } = body;

    const parsedWeight = parseFloat(weight_kg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return NextResponse.json(
        { error: "Weight must be a positive number." },
        { status: 400 }
      );
    }

    const selectedClass = (character_class || "CYBER KNIGHT").toUpperCase();
    const stats = CLASS_BASE_STATS[selectedClass as keyof typeof CLASS_BASE_STATS] || CLASS_BASE_STATS["CYBER KNIGHT"];

    const baseUsername = username || user?.email?.split("@")[0] || "Warrior";

    const profileData = {
      user_id: userId,
      username: baseUsername,
      character_class: selectedClass,
      weight_kg: parsedWeight,
      level: 1,
      current_hp: 1000,
      max_hp: 1000,
      exp: 0,
      max_exp: 1000,
      gold: 12500,
      str: stats.str,
      agi: stats.agi,
      vit: stats.vit,
      luk: stats.luk,
    };

    let dbErrorMsg: string | null = null;

    try {
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (upsertErr) {
        dbErrorMsg = upsertErr.message;
      }
    } catch (e: any) {
      dbErrorMsg = e.message || "Failed to commit profile to Supabase";
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully.",
      user: profileData,
      db_status: dbErrorMsg ? `DB_ERROR: ${dbErrorMsg}` : "SAVED_TO_SUPABASE",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to complete onboarding." },
      { status: 500 }
    );
  }
}
