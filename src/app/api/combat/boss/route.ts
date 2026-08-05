import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildFloorEnemy } from "@/lib/bossState";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") as "solo" | "party") || "solo";
  const partyIdParam = searchParams.get("party_id");
  const floorParam = searchParams.get("floor");
  const targetFloor = floorParam ? parseInt(floorParam, 10) : undefined;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    let bossKey = `solo_${userId}`;

    if (mode === "party") {
      let activePartyId = partyIdParam;
      if (!activePartyId) {
        const { data: memberRec } = await supabase
          .from("Party_Members")
          .select("party_id")
          .eq("user_id", userId)
          .limit(1);

        if (memberRec && memberRec.length > 0) {
          activePartyId = memberRec[0].party_id;
        } else {
          const { data: leaderRec } = await supabase
            .from("Party")
            .select("party_id")
            .eq("leader_id", userId)
            .limit(1);

          if (leaderRec && leaderRec.length > 0) {
            activePartyId = leaderRec[0].party_id;
          }
        }
      }

      if (activePartyId) {
        bossKey = `party_${activePartyId}`;
      } else {
        bossKey = `party_solo_${userId}`;
      }
    }

    const { data: dbBosses } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .eq("boss_id", bossKey)
      .limit(1);

    if (!dbBosses || dbBosses.length === 0) {
      const initialEnemy = buildFloorEnemy(targetFloor || 1, mode);
      const insertRecord = {
        boss_id: bossKey,
        boss_name: initialEnemy.display_name,
        stage: initialEnemy.floor,
        current_hp: initialEnemy.current_hp,
        max_hp: initialEnemy.max_hp,
        status: "Active",
        category: initialEnemy.category,
        mode,
        sprite_config: initialEnemy.sprite_config,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from("dungeon_bosses").insert(insertRecord);
      } catch (e) {}

      return NextResponse.json({
        ...insertRecord,
        boss_type: initialEnemy.sprite_config.spriteKey,
      });
    }

    let existingBoss = dbBosses[0];

    if (targetFloor && targetFloor > existingBoss.stage) {
      const advancedEnemy = buildFloorEnemy(targetFloor, mode);
      const updateRecord = {
        boss_name: advancedEnemy.display_name,
        stage: advancedEnemy.floor,
        current_hp: advancedEnemy.current_hp,
        max_hp: advancedEnemy.max_hp,
        status: "Active",
        category: advancedEnemy.category,
        sprite_config: advancedEnemy.sprite_config,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase
          .from("dungeon_bosses")
          .update(updateRecord)
          .eq("boss_id", bossKey);
      } catch (e) {}

      existingBoss = { ...existingBoss, ...updateRecord };
    }

    return NextResponse.json({
      boss_id: existingBoss.boss_id,
      boss_name: existingBoss.boss_name,
      stage: existingBoss.stage,
      current_hp: Number(existingBoss.current_hp),
      max_hp: Number(existingBoss.max_hp),
      status: existingBoss.status || "Active",
      category: existingBoss.category || "mob",
      sprite_config: existingBoss.sprite_config,
      boss_type: existingBoss.sprite_config?.spriteKey || "goblin",
      mode,
    });
  } catch (err: any) {
    const fallback = buildFloorEnemy(1, mode);
    return NextResponse.json({
      boss_id: `fallback_${mode}`,
      boss_name: fallback.display_name,
      stage: 1,
      current_hp: fallback.current_hp,
      max_hp: fallback.max_hp,
      status: "Active",
      category: fallback.category,
      sprite_config: fallback.sprite_config,
      boss_type: fallback.sprite_config.spriteKey,
      mode,
    });
  }
}
