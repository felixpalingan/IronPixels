import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSkillRemainingSeconds } from "@/lib/skillState";

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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const activeSkills = DEFAULT_SKILLS.map((sk) => {
      const remainingSeconds = getSkillRemainingSeconds(userId, sk.skill_id);
      return {
        ...sk,
        user_id: userId,
        remaining_seconds: remainingSeconds,
        is_ready: remainingSeconds === 0,
      };
    });

    return NextResponse.json(activeSkills);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch skills." },
      { status: 500 }
    );
  }
}
