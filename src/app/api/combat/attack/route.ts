import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildFloorEnemy } from "@/lib/bossState";

export async function POST(request: Request) {
  try {
    const { user_id, party_id, rvs_damage, mode = "solo" } = await request.json();

    if (!rvs_damage || rvs_damage <= 0) {
      return NextResponse.json(
        { error: "Valid rvs_damage > 0 is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user_id || user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    let bossKey = `solo_${currentUserId}`;
    let resolvedPartyId = party_id;

    if (mode === "party") {
      if (!resolvedPartyId) {
        const { data: memberRec } = await supabase
          .from("Party_Members")
          .select("party_id")
          .eq("user_id", currentUserId)
          .limit(1);

        if (memberRec && memberRec.length > 0) {
          resolvedPartyId = memberRec[0].party_id;
        } else {
          const { data: leaderRec } = await supabase
            .from("Party")
            .select("party_id")
            .eq("leader_id", currentUserId)
            .limit(1);

          if (leaderRec && leaderRec.length > 0) {
            resolvedPartyId = leaderRec[0].party_id;
          }
        }
      }

      if (resolvedPartyId) {
        bossKey = `party_${resolvedPartyId}`;
      } else {
        bossKey = `party_solo_${currentUserId}`;
      }
    }

    const { data: dbBosses } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .eq("boss_id", bossKey)
      .limit(1);

    let currentEnemy: any;
    if (!dbBosses || dbBosses.length === 0) {
      const initE = buildFloorEnemy(1, mode);
      currentEnemy = {
        boss_id: bossKey,
        boss_name: initE.display_name,
        stage: 1,
        current_hp: initE.current_hp,
        max_hp: initE.max_hp,
        status: "Active",
        category: initE.category,
        mode,
        sprite_config: initE.sprite_config,
      };

      try {
        await supabase.from("dungeon_bosses").insert({
          ...currentEnemy,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {}
    } else {
      currentEnemy = dbBosses[0];
    }

    const dmg = Math.round(rvs_damage);
    const newHp = Math.max(0, Number(currentEnemy.current_hp) - dmg);
    const isDefeated = newHp === 0;

    if (isDefeated) {
      const nextFloor = currentEnemy.stage + 1;
      const nextEnemy = buildFloorEnemy(nextFloor, mode);

      const nextRecord = {
        boss_name: nextEnemy.display_name,
        stage: nextFloor,
        current_hp: nextEnemy.current_hp,
        max_hp: nextEnemy.max_hp,
        status: "Active",
        category: nextEnemy.category,
        sprite_config: nextEnemy.sprite_config,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase
          .from("dungeon_bosses")
          .update(nextRecord)
          .eq("boss_id", bossKey);
      } catch (e) {}

      if (mode === "party" && resolvedPartyId) {
        try {
          await supabase
            .from("Party")
            .update({
              total_party_floor: nextFloor,
              updated_at: new Date().toISOString(),
            })
            .eq("party_id", resolvedPartyId);
        } catch (e) {}
      } else if (mode === "solo") {
        try {
          await supabase
            .from("profiles")
            .update({ max_floor: nextFloor })
            .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`);
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        boss_id: bossKey,
        boss_name: nextEnemy.display_name,
        boss_type: nextEnemy.sprite_config.spriteKey,
        stage: nextFloor,
        rvs_damage_dealt: dmg,
        current_hp: nextEnemy.current_hp,
        max_hp: nextEnemy.max_hp,
        is_defeated: true,
        status: "Active",
        category: nextEnemy.category,
        sprite_config: nextEnemy.sprite_config,
        mode,
      });
    }

    try {
      await supabase
        .from("dungeon_bosses")
        .update({
          current_hp: newHp,
          updated_at: new Date().toISOString(),
        })
        .eq("boss_id", bossKey);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      boss_id: bossKey,
      boss_name: currentEnemy.boss_name,
      boss_type: currentEnemy.sprite_config?.spriteKey || "goblin",
      stage: currentEnemy.stage,
      rvs_damage_dealt: dmg,
      current_hp: newHp,
      max_hp: Number(currentEnemy.max_hp),
      is_defeated: false,
      status: "Active",
      category: currentEnemy.category || "mob",
      sprite_config: currentEnemy.sprite_config,
      mode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}
