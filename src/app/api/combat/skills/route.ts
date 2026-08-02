import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSkillRemainingSeconds } from "@/lib/skillState";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

const DEFAULT_SKILLS = [
  {
    skill_id: "s-default-1",
    skill_name: "Heavy Blade Slash",
    damage_multiplier: 2.5,
    cooldown_minutes: 3,
    icon: "sword",
  },
  {
    skill_id: "s-default-2",
    skill_name: "Shield Thrust Strike",
    damage_multiplier: 1.8,
    cooldown_minutes: 2,
    icon: "shield",
  },
  {
    skill_id: "s-default-3",
    skill_name: "Flame Arrow Volley",
    damage_multiplier: 4.0,
    cooldown_minutes: 5,
    icon: "flame",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || DEFAULT_USER_ID;

  try {
    const supabase = await createClient();
    const { data: skills } = await supabase
      .from("user_skills")
      .select("*")
      .eq("user_id", userId);

    if (skills && skills.length > 0) {
      const formattedSkills = skills.map((sk) => {
        const remainingSeconds = getSkillRemainingSeconds(userId, sk.skill_id);
        return {
          skill_id: sk.skill_id,
          user_id: sk.user_id,
          skill_name: sk.skill_name,
          damage_multiplier: Number(sk.damage_multiplier),
          cooldown_minutes: sk.cooldown_minutes,
          remaining_seconds: remainingSeconds,
          is_ready: remainingSeconds === 0,
        };
      });
      return NextResponse.json(formattedSkills);
    }
  } catch (e) {
  }

  const fallbackSkills = DEFAULT_SKILLS.map((sk) => {
    const remainingSeconds = getSkillRemainingSeconds(userId, sk.skill_id);
    return {
      ...sk,
      user_id: userId,
      remaining_seconds: remainingSeconds,
      is_ready: remainingSeconds === 0,
    };
  });

  return NextResponse.json(fallbackSkills);
}
