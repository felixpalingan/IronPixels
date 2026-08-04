import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  character_class: string;
  level: number;
  combat_power: number;
  daily_rvs: number;
  workout_streak: number;
  avatar_url?: string;
  equipped_weapon?: string;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    user_id: "user-top-1",
    username: "Vanguard_Zero",
    character_class: "CYBER KNIGHT",
    level: 48,
    combat_power: 18500,
    daily_rvs: 1450,
    workout_streak: 24,
    equipped_weapon: "/assets/items/weapons/37.png",
  },
  {
    user_id: "user-top-2",
    username: "IronSlayer99",
    character_class: "TITAN BERSERKER",
    level: 42,
    combat_power: 15400,
    daily_rvs: 1200,
    workout_streak: 19,
    equipped_weapon: "/assets/items/weapons/31.png",
  },
  {
    user_id: "user-top-3",
    username: "ShadowKage",
    character_class: "SHADOW NINJA",
    level: 39,
    combat_power: 13900,
    daily_rvs: 1100,
    workout_streak: 15,
    equipped_weapon: "/assets/items/weapons/24.png",
  },
  {
    user_id: "user-top-4",
    username: "CyberAegis",
    character_class: "IRON VANGUARD",
    level: 36,
    combat_power: 12200,
    daily_rvs: 950,
    workout_streak: 12,
    equipped_weapon: "/assets/items/weapons/18.png",
  },
  {
    user_id: "user-top-5",
    username: "PhoenixRider",
    character_class: "WARRIOR",
    level: 32,
    combat_power: 10800,
    daily_rvs: 850,
    workout_streak: 9,
    equipped_weapon: "/assets/items/weapons/14.png",
  },
  {
    user_id: "user-top-6",
    username: "GlacialStorm",
    character_class: "SHADOW NINJA",
    level: 28,
    combat_power: 9400,
    daily_rvs: 720,
    workout_streak: 7,
    equipped_weapon: "/assets/items/weapons/22.png",
  },
  {
    user_id: "user-top-7",
    username: "RagnarokStriker",
    character_class: "TITAN BERSERKER",
    level: 25,
    combat_power: 8300,
    daily_rvs: 650,
    workout_streak: 5,
    equipped_weapon: "/assets/items/weapons/08.png",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "cp";

  let list = [...MOCK_LEADERBOARD];

  try {
    const supabase = await createClient();
    const { data: dbProfiles } = await supabase.from("profiles").select("*");

    if (dbProfiles && dbProfiles.length > 0) {
      dbProfiles.forEach((prof) => {
        const cp =
          (prof.level || 1) * 100 +
          (prof.str || 85) * 3.5 +
          (prof.agi || 70) * 2.5 +
          (prof.vit || 60) * 2.5;

        list.push({
          user_id: prof.user_id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          username: prof.username || "Felix",
          character_class: prof.character_class || "WARRIOR",
          level: prof.level || 1,
          combat_power: Math.round(cp),
          daily_rvs: 500,
          workout_streak: prof.workout_streak || 3,
          equipped_weapon: "/assets/items/weapons/01.png",
        });
      });
    }
  } catch (e) {}

  if (category === "rvs") {
    list.sort((a, b) => b.daily_rvs - a.daily_rvs);
  } else if (category === "streak") {
    list.sort((a, b) => b.workout_streak - a.workout_streak);
  } else {
    list.sort((a, b) => b.combat_power - a.combat_power);
  }

  return NextResponse.json(list.slice(0, 20));
}
