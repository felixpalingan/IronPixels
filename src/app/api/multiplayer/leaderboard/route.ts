import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  character_class: string;
  level: number;
  max_floor: number;
  combat_power: number;
  daily_rvs: number;
  workout_streak: number;
  avatar_url?: string;
  equipped_weapon?: string;
}

export interface PartyLeaderboardEntry {
  party_id: string;
  party_name: string;
  leader_name: string;
  member_count: number;
  total_party_floor: number;
  total_party_cp: number;
  total_party_rvs: number;
  party_streak: number;
  leader_weapon?: string;
}

let cachedUserLeaderboard: LeaderboardEntry[] = [
  {
    user_id: "user-top-1",
    username: "Vanguard_Zero",
    character_class: "CYBER KNIGHT",
    level: 48,
    max_floor: 28,
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
    max_floor: 24,
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
    max_floor: 20,
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
    max_floor: 16,
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
    max_floor: 12,
    combat_power: 10800,
    daily_rvs: 850,
    workout_streak: 9,
    equipped_weapon: "/assets/items/weapons/14.png",
  },
];

let cachedPartyLeaderboard: PartyLeaderboardEntry[] = [
  {
    party_id: "party-top-1",
    party_name: "Apex Cyber Vanguard",
    leader_name: "Vanguard_Zero",
    member_count: 4,
    total_party_floor: 38,
    total_party_cp: 59800,
    total_party_rvs: 4700,
    party_streak: 28,
    leader_weapon: "/assets/items/weapons/37.png",
  },
  {
    party_id: "party-top-2",
    party_name: "Iron Titan Legion",
    leader_name: "IronSlayer99",
    member_count: 4,
    total_party_floor: 32,
    total_party_cp: 52300,
    total_party_rvs: 4100,
    party_streak: 22,
    leader_weapon: "/assets/items/weapons/31.png",
  },
  {
    party_id: "party-top-3",
    party_name: "Shadow Assassins Squad",
    leader_name: "ShadowKage",
    member_count: 3,
    total_party_floor: 25,
    total_party_cp: 35500,
    total_party_rvs: 2800,
    party_streak: 16,
    leader_weapon: "/assets/items/weapons/24.png",
  },
  {
    party_id: "party-top-4",
    party_name: "IronPixels Champions",
    leader_name: "Felix",
    member_count: 2,
    total_party_floor: 15,
    total_party_cp: 16650,
    total_party_rvs: 1350,
    party_streak: 10,
    leader_weapon: "/assets/items/weapons/01.png",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "user_floor";

  try {
    const supabase = await createClient();

    if (category.startsWith("party")) {
      const { data: dbParties } = await supabase
        .from("Party")
        .select("*");

      if (dbParties && dbParties.length > 0) {
        const fetchedPartyList: PartyLeaderboardEntry[] = dbParties.map((p: any) => ({
          party_id: p.party_id,
          party_name: p.party_name || "Guild Squad",
          leader_name: p.leader_id === "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c" ? "Felix" : "Leader",
          member_count: 2,
          total_party_floor: p.total_party_floor || 15,
          total_party_cp: p.total_party_cp || 16650,
          total_party_rvs: p.total_party_rvs || 1350,
          party_streak: p.party_streak || 10,
          leader_weapon: "/assets/items/weapons/01.png",
        }));

        cachedPartyLeaderboard = fetchedPartyList;
      }

      let partyList = [...cachedPartyLeaderboard];
      if (category === "party_rvs") {
        partyList.sort((a, b) => b.total_party_rvs - a.total_party_rvs);
      } else if (category === "party_streak") {
        partyList.sort((a, b) => b.party_streak - a.party_streak);
      } else {
        partyList.sort((a, b) => b.total_party_floor - a.total_party_floor);
      }

      return NextResponse.json(partyList);
    }

    const { data: dbProfiles } = await supabase
      .from("profiles")
      .select("*");

    if (dbProfiles && dbProfiles.length > 0) {
      const fetchedUserList: LeaderboardEntry[] = dbProfiles.map((prof: any) => {
        const cp =
          (prof.level || 1) * 100 +
          (prof.str || 85) * 3.5 +
          (prof.agi || 70) * 2.5 +
          (prof.vit || 60) * 2.5;

        return {
          user_id: prof.id || prof.user_id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          username: prof.username || "Felix",
          character_class: prof.character_class || "WARRIOR",
          level: prof.level || 1,
          max_floor: prof.max_floor || 5,
          combat_power: Math.round(cp),
          daily_rvs: prof.daily_rvs || 500,
          workout_streak: prof.workout_streak || 3,
          equipped_weapon: "/assets/items/weapons/01.png",
        };
      });

      cachedUserLeaderboard = fetchedUserList;
    }
  } catch (e) {}

  let list = [...cachedUserLeaderboard];

  if (category === "user_rvs" || category === "rvs") {
    list.sort((a, b) => b.daily_rvs - a.daily_rvs);
  } else if (category === "user_streak" || category === "streak") {
    list.sort((a, b) => b.workout_streak - a.workout_streak);
  } else {
    list.sort((a, b) => b.max_floor - a.max_floor);
  }

  return NextResponse.json(list.slice(0, 20));
}
