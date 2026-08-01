import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || DEFAULT_USER_ID;

  try {
    const { data: user, error: userError } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!userError && user) {
      const { data: stats } = await supabase
        .from("User_Stats")
        .select("str, agi, vit, luk")
        .eq("user_id", userId)
        .single();

      const { data: gear } = await supabase
        .from("Equipped_Gear")
        .select("slot, name, icon")
        .eq("user_id", userId);

      return NextResponse.json({
        user_id: user.user_id,
        username: user.username,
        character_class: user.character_class || "CYBER KNIGHT",
        level: user.level || 15,
        current_hp: user.current_hp || 850,
        max_hp: user.max_hp || 1000,
        exp: user.exp || 10000,
        max_exp: user.max_exp || 15000,
        gold: user.gold || 12500,
        weight_kg: user.weight_kg || 75.0,
        stats: stats || { str: 85, agi: 72, vit: 54, luk: 60 },
        equipped_gear: gear || [
          { slot: "weapon", name: "Iron Blade...", icon: "sword" },
          { slot: "armor", name: "Chainmail", icon: "shield" },
          { slot: "accessory", name: "Vitality A...", icon: "heart" },
        ],
      });
    }
  } catch (e) {
  }

  return NextResponse.json({
    user_id: userId,
    username: "Felix",
    character_class: "CYBER KNIGHT",
    level: 15,
    current_hp: 850,
    max_hp: 1000,
    exp: 10000,
    max_exp: 15000,
    gold: 12500,
    weight_kg: 75.0,
    stats: {
      str: 85,
      agi: 72,
      vit: 54,
      luk: 60,
    },
    equipped_gear: [
      { slot: "weapon", name: "Iron Blade...", icon: "sword" },
      { slot: "armor", name: "Chainmail", icon: "shield" },
      { slot: "accessory", name: "Vitality A...", icon: "heart" },
    ],
  });
}
