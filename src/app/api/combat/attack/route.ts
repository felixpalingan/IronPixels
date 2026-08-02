import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_BOSS_ID = "b055d7ac-1234-4567-89ab-cdef01234567";

interface AttackPayload {
  user_id: string;
  boss_id?: string;
  rvs_damage: number;
}

export async function POST(request: Request) {
  try {
    const body: AttackPayload = await request.json();
    const { user_id, boss_id = DEFAULT_BOSS_ID, rvs_damage } = body;

    if (!user_id || !rvs_damage || rvs_damage <= 0) {
      return NextResponse.json(
        { error: "Invalid payload: user_id and positive rvs_damage are required." },
        { status: 400 }
      );
    }

    let currentHp = 250000;
    let maxHp = 500000;

    try {
      const { data: boss } = await supabase
        .from("Dungeon_Bosses")
        .select("current_hp, max_hp")
        .eq("boss_id", boss_id)
        .single();

      if (boss) {
        currentHp = Number(boss.current_hp);
        maxHp = Number(boss.max_hp);
      }
    } catch (e) {
    }

    const damageDealt = Math.round(rvs_damage);
    const newHp = Math.max(0, currentHp - damageDealt);
    const isDefeated = newHp === 0;
    const newStatus = isDefeated ? "Defeated" : "Active";

    try {
      await supabase
        .from("Dungeon_Bosses")
        .update({ current_hp: newHp, status: newStatus })
        .eq("boss_id", boss_id);
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      boss_id,
      user_id,
      rvs_damage_dealt: damageDealt,
      current_hp: newHp,
      max_hp: maxHp,
      is_defeated: isDefeated,
      status: newStatus,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}
