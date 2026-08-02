import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setSkillCooldown, getSkillRemainingSeconds } from "@/lib/skillState";
import { updateBossHp } from "@/lib/bossState";

const DEFAULT_BOSS_ID = "b055d7ac-1234-4567-89ab-cdef01234567";

export async function POST(request: Request) {
  try {
    const { user_id = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c", skill_id, cooldown_minutes = 3, damage_multiplier = 2.5, base_damage = 1500 } = await request.json();

    if (!skill_id) {
      return NextResponse.json(
        { error: "skill_id is required." },
        { status: 400 }
      );
    }

    const currentCd = getSkillRemainingSeconds(user_id, skill_id);
    if (currentCd > 0) {
      return NextResponse.json(
        { error: "Skill is currently on cooldown.", remaining_seconds: currentCd },
        { status: 400 }
      );
    }

    setSkillCooldown(user_id, skill_id, cooldown_minutes);

    const totalSkillDamage = Math.round(base_damage * damage_multiplier);
    const { boss, is_defeated } = updateBossHp(totalSkillDamage);

    try {
      const supabase = await createClient();
      await supabase
        .from("user_skills")
        .update({ last_used_at: new Date().toISOString() })
        .eq("skill_id", skill_id)
        .eq("user_id", user_id);
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      skill_id,
      damage_dealt: totalSkillDamage,
      boss_current_hp: boss.current_hp,
      boss_max_hp: boss.max_hp,
      is_defeated,
      remaining_seconds: cooldown_minutes * 60,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute skill." },
      { status: 500 }
    );
  }
}
