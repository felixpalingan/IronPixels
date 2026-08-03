import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      const defaultProf = {
        user_id: userId,
        username: "Felix",
        character_class: "WARRIOR",
        level: 1,
        current_hp: 1000,
        max_hp: 1000,
        exp: 0,
        max_exp: 1000,
        gold: 12500,
        weight_kg: 75,
        available_ap: 5,
        stats: { str: 85, agi: 72, vit: 54, luk: 60 },
      };
      return NextResponse.json(defaultProf);
    }

    return NextResponse.json({
      user_id: profile.id,
      username: profile.username,
      character_class: profile.character_class,
      level: profile.level,
      current_hp: profile.current_hp,
      max_hp: profile.max_hp,
      exp: profile.exp,
      max_exp: profile.max_exp,
      gold: profile.gold,
      weight_kg: Number(profile.weight_kg),
      available_ap: profile.available_ap,
      stats: profile.stats || { str: 85, agi: 72, vit: 54, luk: 60 },
    });
  } catch (err: any) {
    return NextResponse.json({
      user_id: "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      username: "Felix",
      character_class: "WARRIOR",
      level: 1,
      current_hp: 1000,
      max_hp: 1000,
      exp: 0,
      max_exp: 1000,
      gold: 12500,
      weight_kg: 75,
      available_ap: 5,
      stats: { str: 85, agi: 72, vit: 54, luk: 60 },
    });
  }
}
