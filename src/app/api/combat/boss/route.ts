import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBossState, STAGE_BOSSES } from "@/lib/bossState";

export async function GET() {
  const inMemBoss = getBossState();

  try {
    const supabase = await createClient();
    const { data: bossList, error } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .eq("status", "Active")
      .order("stage", { ascending: false })
      .limit(1);

    if (!error && bossList && bossList.length > 0) {
      const activeBoss = bossList[0];
      const stageIdx = (activeBoss.stage || 1) - 1;
      const bossConfig = STAGE_BOSSES[stageIdx % STAGE_BOSSES.length];

      return NextResponse.json({
        boss_id: activeBoss.boss_id,
        boss_name: activeBoss.boss_name || bossConfig.name,
        current_hp: Number(activeBoss.current_hp),
        max_hp: Number(activeBoss.max_hp),
        stage: activeBoss.stage || 1,
        status: activeBoss.status || "Active",
        boss_type: bossConfig.type || "orc",
      });
    }
  } catch (e) {
  }

  return NextResponse.json(inMemBoss);
}
