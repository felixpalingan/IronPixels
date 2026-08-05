import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";
    const authUsername = user?.user_metadata?.username || user?.email?.split("@")[0] || "Warrior";

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      const defaultProf = {
        user_id: userId,
        username: authUsername,
        character_class: "WARRIOR",
        gender: "m",
        level: 1,
        current_hp: 1000,
        max_hp: 1000,
        exp: 0,
        max_exp: 1000,
        gold: 500,
        weight_kg: 75,
        available_ap: 5,
        stats: { str: 85, agi: 70, vit: 60, luk: 50 },
      };
      return NextResponse.json(defaultProf);
    }

    return NextResponse.json({
      user_id: profile.id,
      username: profile.username || authUsername,
      character_class: profile.character_class || "WARRIOR",
      gender: profile.gender || "m",
      level: profile.level || 1,
      current_hp: profile.current_hp || 1000,
      max_hp: profile.max_hp || 1000,
      exp: profile.exp || 0,
      max_exp: profile.max_exp || 1000,
      gold: profile.gold ?? 500,
      weight_kg: Number(profile.weight_kg) || 75,
      available_ap: profile.available_ap ?? 5,
      stats: {
        str: profile.str ?? 85,
        agi: profile.agi ?? 70,
        vit: profile.vit ?? 60,
        luk: profile.luk ?? 50,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      user_id: "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      username: "Warrior",
      character_class: "WARRIOR",
      gender: "m",
      level: 1,
      current_hp: 1000,
      max_hp: 1000,
      exp: 0,
      max_exp: 1000,
      gold: 500,
      weight_kg: 75,
      available_ap: 5,
      stats: { str: 85, agi: 70, vit: 60, luk: 50 },
    });
  }
}
