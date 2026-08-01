import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_BOSS_ID = "b055d7ac-1234-4567-89ab-cdef01234567";

interface SkillExecutionPayload {
  user_id: string;
  skill_id: string;
  base_damage?: number;
}

export async function POST(request: Request) {
  try {
    const body: SkillExecutionPayload = await request.json();
    const { user_id, skill_id, base_damage = 1500 } = body;

    if (!user_id || !skill_id) {
      return NextResponse.json(
        { error: "user_id and skill_id are required." },
        { status: 400 }
      );
    }

    const now = new Date();
    let skillMultiplier = 2.5;
    let cooldownMinutes = 5;
    let skillName = "Tactical Skill";

    try {
      const { data: skill } = await supabase
        .from("User_Skills")
        .select("*")
        .eq("skill_id", skill_id)
        .eq("user_id", user_id)
        .single();

      if (skill) {
        skillName = skill.skill_name;
        skillMultiplier = Number(skill.damage_multiplier) || 2.5;
        cooldownMinutes = skill.cooldown_minutes || 5;

        if (skill.last_used_at) {
          const lastUsedMs = new Date(skill.last_used_at).getTime();
          const cdMs = cooldownMinutes * 60 * 1000;
          const elapsed = now.getTime() - lastUsedMs;
          if (elapsed < cdMs) {
            const remainingSecs = Math.ceil((cdMs - elapsed) / 1000);
            return NextResponse.json(
              {
                error: "Skill is currently on cooldown.",
                remaining_seconds: remainingSecs,
              },
              { status: 400 }
            );
          }
        }

        await supabase
          .from("User_Skills")
          .update({ last_used_at: now.toISOString() })
          .eq("skill_id", skill_id);
      }
    } catch (e) {
    }

    const totalSkillDamage = Math.round(base_damage * skillMultiplier);

    let newBossHp = 250000;
    let maxBossHp = 500000;

    try {
      const { data: boss } = await supabase
        .from("Dungeon_Bosses")
        .select("current_hp, max_hp")
        .eq("boss_id", DEFAULT_BOSS_ID)
        .single();

      if (boss) {
        maxBossHp = Number(boss.max_hp);
        const currentHp = Number(boss.current_hp);
        newBossHp = Math.max(0, currentHp - totalSkillDamage);
        const newStatus = newBossHp === 0 ? "Defeated" : "Active";

        await supabase
          .from("Dungeon_Bosses")
          .update({ current_hp: newBossHp, status: newStatus })
          .eq("boss_id", DEFAULT_BOSS_ID);
      }
    } catch (e) {
      newBossHp = Math.max(0, 250000 - totalSkillDamage);
    }

    return NextResponse.json({
      success: true,
      skill_name: skillName,
      damage_dealt: totalSkillDamage,
      boss_current_hp: newBossHp,
      boss_max_hp: maxBossHp,
      cooldown_minutes: cooldownMinutes,
      cooldown_until: new Date(now.getTime() + cooldownMinutes * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to execute tactical skill." },
      { status: 500 }
    );
  }
}
