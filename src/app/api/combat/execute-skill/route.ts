import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setSkillCooldown, getSkillRemainingSeconds } from "@/lib/skillState";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const body = await request.json();
    const { skill_id, cooldown_minutes = 3, damage_multiplier = 2.5, base_damage = 1500 } = body;

    if (!skill_id) {
      return NextResponse.json(
        { error: "skill_id is required." },
        { status: 400 }
      );
    }

    const currentCd = getSkillRemainingSeconds(userId, skill_id);
    if (currentCd > 0) {
      return NextResponse.json(
        { error: "Skill is currently on cooldown.", remaining_seconds: currentCd },
        { status: 400 }
      );
    }

    setSkillCooldown(userId, skill_id, cooldown_minutes);

    const totalSkillDamage = Math.round(base_damage * damage_multiplier);

    try {
      await supabase
        .from("user_skills")
        .update({ last_used_at: new Date().toISOString() })
        .eq("skill_id", skill_id)
        .or(`user_id.eq.${userId}`);
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      skill_id,
      damage_dealt: totalSkillDamage,
      remaining_seconds: cooldown_minutes * 60,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute skill." },
      { status: 500 }
    );
  }
}
