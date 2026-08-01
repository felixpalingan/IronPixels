import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

const DEFAULT_SKILLS = [
  {
    skill_id: "s1111111-1111-1111-1111-111111111111",
    skill_name: "Heavy Cleave",
    damage_multiplier: 2.5,
    cooldown_minutes: 5,
    last_used_at: null,
    icon: "sword",
  },
  {
    skill_id: "s2222222-2222-2222-2222-222222222222",
    skill_name: "Iron Shield Bash",
    damage_multiplier: 1.8,
    cooldown_minutes: 3,
    last_used_at: null,
    icon: "shield",
  },
  {
    skill_id: "s3333333-3333-3333-3333-333333333333",
    skill_name: "Dragon Flare",
    damage_multiplier: 4.0,
    cooldown_minutes: 10,
    last_used_at: null,
    icon: "flame",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || DEFAULT_USER_ID;
  const now = new Date().getTime();

  try {
    const { data: skills, error } = await supabase
      .from("User_Skills")
      .select("*")
      .eq("user_id", userId);

    if (!error && skills && skills.length > 0) {
      const formattedSkills = skills.map((sk) => {
        let remainingSeconds = 0;
        if (sk.last_used_at) {
          const lastUsedMs = new Date(sk.last_used_at).getTime();
          const cdMs = sk.cooldown_minutes * 60 * 1000;
          const elapsed = now - lastUsedMs;
          if (elapsed < cdMs) {
            remainingSeconds = Math.ceil((cdMs - elapsed) / 1000);
          }
        }
        return {
          skill_id: sk.skill_id,
          user_id: sk.user_id,
          skill_name: sk.skill_name,
          damage_multiplier: Number(sk.damage_multiplier),
          cooldown_minutes: sk.cooldown_minutes,
          last_used_at: sk.last_used_at,
          remaining_seconds: remainingSeconds,
          is_ready: remainingSeconds === 0,
        };
      });
      return NextResponse.json(formattedSkills);
    }
  } catch (e) {
  }

  const fallbackSkills = DEFAULT_SKILLS.map((sk) => ({
    ...sk,
    user_id: userId,
    remaining_seconds: 0,
    is_ready: true,
  }));

  return NextResponse.json(fallbackSkills);
}
