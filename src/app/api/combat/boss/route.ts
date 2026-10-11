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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    let bossKey = `solo_${userId}`;
    let activePartyId: string | null = partyIdParam;

    if (mode === "party") {
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

    // 1. Determine current floor from query param, party floor, or profile max_floor
    let currentFloor: number = targetFloor || 1;
    if (!targetFloor) {
      if (mode === "party" && activePartyId) {
        const { data: partyRec } = await supabase
          .from("Party")
          .select("total_party_floor")
          .eq("party_id", activePartyId)
          .single();
        currentFloor = partyRec?.total_party_floor || 1;
      } else {
        const { data: profRec } = await supabase
          .from("profiles")
          .select("max_floor")
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .single();
        currentFloor = profRec?.max_floor || 1;
      }
    }

    // 2. Fetch canonical stage from dungeon_bosses table
    const { data: stageRows } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .eq("stage", currentFloor)
      .limit(1);

    if (stageRows && stageRows.length > 0) {
      const stageData = stageRows[0];
      const maxHp = Number(mode === "party" ? stageData.max_hp * 2 : stageData.max_hp);
      return NextResponse.json({
        boss_id: stageData.boss_id,
        boss_name: stageData.boss_name,
        stage: stageData.stage,
        current_hp: maxHp,
        max_hp: maxHp,
        status: "Active",
        category: stageData.category || "mob",
        sprite_config: stageData.sprite_config,
        boss_type: stageData.sprite_config?.spriteKey || "imp",
        mode,
      });
    }

    // Fallback for endless stages beyond 20
    const fallbackEnemy = buildFloorEnemy(currentFloor, mode);
    return NextResponse.json({
      boss_id: fallbackEnemy.enemy_id,
      boss_name: fallbackEnemy.display_name,
      stage: fallbackEnemy.floor,
      current_hp: fallbackEnemy.current_hp,
      max_hp: fallbackEnemy.max_hp,
      status: fallbackEnemy.status,
      category: fallbackEnemy.category,
      sprite_config: fallbackEnemy.sprite_config,
      boss_type: fallbackEnemy.sprite_config.spriteKey,
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
