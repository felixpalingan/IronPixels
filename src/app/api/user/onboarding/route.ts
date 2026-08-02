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
    if (!CLASS_BASE_STATS[selectedClass as keyof typeof CLASS_BASE_STATS]) {
      return NextResponse.json(
        { error: "Invalid character class selected." },
        { status: 400 }
      );
    }

    const baseUsername = username || user?.email?.split("@")[0] || "Warrior";
    const uniqueUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

    const userProfile = {
      user_id: userId,
      username: user?.email ? baseUsername : uniqueUsername,
      character_class: selectedClass,
      weight_kg: parsedWeight,
      level: 1,
      current_hp: 1000,
      max_hp: 1000,
      exp: 0,
      max_exp: 1000,
      gold: 500,
    };

    try {
      await supabase
        .from("Users")
        .upsert(userProfile, { onConflict: "user_id" });
    } catch (e) {
    }

    const stats = CLASS_BASE_STATS[selectedClass as keyof typeof CLASS_BASE_STATS];
    try {
      await supabase
        .from("User_Stats")
        .upsert({ user_id: userId, ...stats }, { onConflict: "user_id" });
    } catch (e) {
    }

    const defaultSkills = [
      {
        skill_id: "11111111-1111-1111-1111-111111111111",
        user_id: userId,
        skill_name: "Heavy Blade Slash",
        damage_multiplier: 2.5,
        cooldown_minutes: 5,
      },
      {
        skill_id: "22222222-2222-2222-2222-222222222222",
        user_id: userId,
        skill_name: "Shield Thrust Strike",
        damage_multiplier: 1.8,
        cooldown_minutes: 3,
      },
      {
        skill_id: "33333333-3333-3333-3333-333333333333",
        user_id: userId,
        skill_name: "Flame Arrow Volley",
        damage_multiplier: 4.0,
        cooldown_minutes: 10,
      },
    ];

    try {
      await supabase.from("User_Skills").upsert(defaultSkills, { onConflict: "skill_id" });
    } catch (e) {
    }

    const res = NextResponse.json({
      success: true,
      message: "Onboarding completed successfully.",
      user: userProfile,
      stats,
    });

    res.cookies.set("ironpixels_onboarded", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error during onboarding." },
      { status: 500 }
    );
  }
}
