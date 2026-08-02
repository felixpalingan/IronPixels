import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

const DEMO_PROFILE = {
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
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetUserId = user?.id || DEFAULT_USER_ID;

    const { data: userData, error: userError } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (!userError && userData) {
      const { data: userStats } = await supabase
        .from("User_Stats")
        .select("str, agi, vit, luk")
        .eq("user_id", targetUserId)
        .single();

      const { data: gearData } = await supabase
        .from("Equipped_Gear")
        .select("slot, name, icon")
        .eq("user_id", targetUserId);

      return NextResponse.json({
        user_id: userData.user_id,
        username: userData.username,
        character_class: userData.character_class || "CYBER KNIGHT",
        level: userData.level || 1,
        current_hp: userData.current_hp || 1000,
        max_hp: userData.max_hp || 1000,
        exp: userData.exp || 0,
        max_exp: userData.max_exp || 1000,
        gold: userData.gold || 500,
        weight_kg: Number(userData.weight_kg) || 70,
        stats: userStats || { str: 75, agi: 75, vit: 70, luk: 70 },
        equipped_gear: gearData && gearData.length > 0 ? gearData : DEMO_PROFILE.equipped_gear,
      });
    }
  } catch (err) {
  }

  return NextResponse.json(DEMO_PROFILE);
}
