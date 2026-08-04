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
          total_party_floor: p.total_party_floor || 1,
          total_party_cp: p.total_party_cp || 1250,
          total_party_rvs: p.total_party_rvs || 0,
          party_streak: p.party_streak || 1,
          leader_weapon: "/assets/items/weapons/01.png",
        }));

        if (category === "party_rvs") {
          fetchedPartyList.sort((a, b) => b.total_party_rvs - a.total_party_rvs);
        } else if (category === "party_streak") {
          fetchedPartyList.sort((a, b) => b.party_streak - a.party_streak);
        } else {
          fetchedPartyList.sort((a, b) => b.total_party_floor - a.total_party_floor);
        }

        return NextResponse.json(fetchedPartyList);
      }

      return NextResponse.json([]);
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
          max_floor: prof.max_floor || 1,
          combat_power: Math.round(cp),
          daily_rvs: prof.daily_rvs || 0,
          workout_streak: prof.workout_streak || 1,
          equipped_weapon: "/assets/items/weapons/01.png",
        };
      });

      if (category === "user_rvs" || category === "rvs") {
        fetchedUserList.sort((a, b) => b.daily_rvs - a.daily_rvs);
      } else if (category === "user_streak" || category === "streak") {
        fetchedUserList.sort((a, b) => b.workout_streak - a.workout_streak);
      } else {
        fetchedUserList.sort((a, b) => b.max_floor - a.max_floor);
      }

      return NextResponse.json(fetchedUserList);
    }

    return NextResponse.json([]);
  } catch (e) {
    return NextResponse.json([]);
  }
}
