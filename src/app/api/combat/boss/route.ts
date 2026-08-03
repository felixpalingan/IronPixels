import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBossState, STAGE_BOSSES } from "@/lib/bossState";

export async function GET() {
  const inMemBoss = getBossState();

  try {
    const supabase = await createClient();
    const { data: boss, error } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && boss && boss.length > 0) {
      const dbBoss = boss[0];
      const stageIdx = (dbBoss.stage || 1) - 1;
      const bossConfig = STAGE_BOSSES[stageIdx % STAGE_BOSSES.length];

      return NextResponse.json({
        boss_id: dbBoss.boss_id,
        boss_name: dbBoss.boss_name || bossConfig.name,
        current_hp: Number(dbBoss.current_hp),
        max_hp: Number(dbBoss.max_hp),
        stage: dbBoss.stage || 1,
        status: dbBoss.status || "Active",
        boss_type: bossConfig.type || "orc",
      });
    }
  } catch (e) {
  }

  return NextResponse.json(inMemBoss);
}
