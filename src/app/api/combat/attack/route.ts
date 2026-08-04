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
          .lte("stage", boss.stage);

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
    } catch (e) {}

    const result = is_defeated ? next_boss : boss;

    return NextResponse.json({
      success: true,
      boss_id: result.boss_id,
      boss_name: result.boss_name,
      boss_type: result.boss_type,
      stage: result.stage,
      rvs_damage_dealt: damage_dealt,
      current_hp: result.current_hp,
      max_hp: result.max_hp,
      is_defeated,
      status: result.status,
      category: result.category,
      sprite_config: result.sprite_config,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}
