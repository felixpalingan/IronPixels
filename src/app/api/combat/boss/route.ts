import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBossState } from "@/lib/bossState";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: boss } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (boss) {
      return NextResponse.json({
        boss_id: boss.boss_id,
        boss_name: boss.boss_name,
        current_hp: Number(boss.current_hp),
        max_hp: Number(boss.max_hp),
        stage: boss.stage || 1,
        status: boss.status,
      });
    }
  } catch (e) {
  }

  const inMemBoss = getBossState();
  return NextResponse.json(inMemBoss);
}
