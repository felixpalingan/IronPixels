import { NextResponse } from "next/server";
import { updateBossHp } from "@/lib/bossState";

export async function POST(request: Request) {
  try {
    const { user_id, boss_id, rvs_damage, mode = "solo" } = await request.json();

    if (!rvs_damage || rvs_damage <= 0) {
      return NextResponse.json(
        { error: "Valid rvs_damage > 0 is required." },
        { status: 400 }
      );
    }

    if (mode === "both") {
      const soloResult = updateBossHp(rvs_damage, "solo");
      const partyResult = updateBossHp(rvs_damage, "party");

      return NextResponse.json({
        success: true,
        solo: soloResult,
        party: partyResult,
      });
    }

    const targetMode: "solo" | "party" = mode === "party" ? "party" : "solo";
    const { boss, is_defeated, damage_dealt, next_boss } = updateBossHp(rvs_damage, targetMode);

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
      mode: targetMode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}
