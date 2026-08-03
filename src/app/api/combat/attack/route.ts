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

      if (is_defeated) {
        await supabase
          .from("dungeon_bosses")
          .update({ current_hp: 0, status: "Defeated" })
          .eq("boss_id", boss_id || boss.boss_id);

        await supabase
          .from("dungeon_bosses")
          .upsert({
            boss_id: next_boss.boss_id,
            boss_name: next_boss.boss_name,
            stage: next_boss.stage,
            current_hp: next_boss.max_hp,
            max_hp: next_boss.max_hp,
            status: "Active",
          });
      } else {
        await supabase
          .from("dungeon_bosses")
          .update({
            current_hp: boss.current_hp,
            status: boss.status,
          })
          .eq("boss_id", boss_id || boss.boss_id);
      }
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      boss_id: is_defeated ? next_boss.boss_id : boss.boss_id,
      boss_name: is_defeated ? next_boss.boss_name : boss.boss_name,
      boss_type: is_defeated ? next_boss.boss_type : boss.boss_type,
      stage: is_defeated ? next_boss.stage : boss.stage,
      rvs_damage_dealt: damage_dealt,
      current_hp: is_defeated ? next_boss.current_hp : boss.current_hp,
      max_hp: is_defeated ? next_boss.max_hp : boss.max_hp,
      is_defeated,
      status: is_defeated ? next_boss.status : boss.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}
