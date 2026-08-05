import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  character_class: string;
  gender?: string;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "user_floor";

  try {
    const supabase = await createClient();

    if (category.startsWith("party")) {
      let partyList: PartyLeaderboardEntry[] = [];

      try {
        const { data: dbParties } = await supabase.from("Party").select("*");
        if (dbParties && dbParties.length > 0) {
          partyList = dbParties.map((p: any) => ({
            party_id: p.party_id,
            party_name: p.party_name || "Guild Squad",
            leader_name: p.leader_name || "Leader",
            member_count: 2,
            total_party_floor: p.total_party_floor || 15,
            total_party_cp: p.total_party_cp || 16650,
            total_party_rvs: p.total_party_rvs || 1350,
            party_streak: p.party_streak || 10,
            leader_weapon: "/assets/items/weapons/01.png",
          }));
        }
      } catch (e) {}

      if (category === "party_rvs") {
        partyList.sort((a, b) => b.total_party_rvs - a.total_party_rvs);
      } else if (category === "party_streak") {
        partyList.sort((a, b) => b.party_streak - a.party_streak);
      } else {
        partyList.sort((a, b) => b.total_party_floor - a.total_party_floor);
      }

      return NextResponse.json(partyList);
    }

    let userList: LeaderboardEntry[] = [];

    try {
      const { data: dbProfiles } = await supabase.from("profiles").select("*");
      if (dbProfiles && dbProfiles.length > 0) {
        userList = dbProfiles.map((prof: any) => {
          const cp =
            (prof.level || 1) * 100 +
            (prof.str || 85) * 3.5 +
            (prof.agi || 70) * 2.5 +
            (prof.vit || 60) * 2.5;

          return {
            user_id: prof.id || prof.user_id,
            username: prof.username || "Warrior",
            character_class: prof.character_class || "WARRIOR",
            gender: prof.gender || "m",
            level: prof.level || 1,
            max_floor: prof.max_floor || 1,
            combat_power: Math.round(cp),
            daily_rvs: Number(prof.daily_rvs || 0),
            workout_streak: prof.workout_streak || 1,
            equipped_weapon: "/assets/items/weapons/01.png",
          };
        });
      }
    } catch (e) {}

    if (category === "user_rvs" || category === "rvs") {
      userList.sort((a, b) => b.daily_rvs - a.daily_rvs);
    } else if (category === "user_streak" || category === "streak") {
      userList.sort((a, b) => b.workout_streak - a.workout_streak);
    } else {
      userList.sort((a, b) => b.max_floor - a.max_floor);
    }

    return NextResponse.json(userList);
  } catch (e) {
    return NextResponse.json([]);
  }
}
