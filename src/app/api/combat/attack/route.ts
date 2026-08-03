import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateBossHp } from "@/lib/bossState";

export async function POST(request: Request) {
  try {
    const { user_id, boss_id, rvs_damage } = await request.json();

    if (!rvs_damage || rvs_damage <= 0) {
      return NextResponse.json(
        { error: "Valid rvs_damage > 0 is required." },
        { status: 400 }
      );
    }

    const { boss, is_defeated, damage_dealt, next_boss } = updateBossHp(rvs_damage);

    try {
      const supabase = await createClient();
      await supabase
        .from("dungeon_bosses")
        .upsert({
          boss_id: boss.boss_id,
          boss_name: boss.boss_name,
          stage: boss.stage,
          current_hp: boss.current_hp,
          max_hp: boss.max_hp,
          status: boss.status,
        });
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      boss_id: boss.boss_id,
      boss_name: boss.boss_name,
      boss_type: boss.boss_type,
      stage: boss.stage,
      rvs_damage_dealt: damage_dealt,
      current_hp: boss.current_hp,
      max_hp: boss.max_hp,
      is_defeated,
      status: boss.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}
