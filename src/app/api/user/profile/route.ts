import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetUserId = user?.id || DEFAULT_USER_ID;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (profile) {
      return NextResponse.json({
        user_id: profile.user_id,
        username: profile.username || "Warrior",
        character_class: profile.character_class || "CYBER KNIGHT",
        level: profile.level || 1,
        current_hp: profile.current_hp || 1000,
        max_hp: profile.max_hp || 1000,
        exp: profile.exp || 0,
        max_exp: profile.max_exp || 1000,
        gold: profile.gold || 12500,
        weight_kg: Number(profile.weight_kg) || 75,
        stats: {
          str: profile.str || 85,
          agi: profile.agi || 72,
          vit: profile.vit || 54,
          luk: profile.luk || 60,
        },
      });
    }
  } catch (err) {
  }

  return NextResponse.json({
    user_id: DEFAULT_USER_ID,
    username: "Felix",
    character_class: "CYBER KNIGHT",
    level: 15,
    current_hp: 850,
    max_hp: 1000,
    exp: 10000,
    max_exp: 15000,
    gold: 12500,
    weight_kg: 75.0,
    stats: { str: 85, agi: 72, vit: 54, luk: 60 },
  });
}
