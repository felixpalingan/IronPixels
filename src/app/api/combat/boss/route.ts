import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBossState } from "@/lib/bossState";

export async function GET() {
  const state = getBossState();

  try {
    const supabase = await createClient();
    const { data: bossList, error } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .eq("status", "Active")
      .order("stage", { ascending: false })
      .limit(1);

    if (!error && bossList && bossList.length > 0) {
      const active = bossList[0];
      // Return the in-memory state which has sprite_config
      return NextResponse.json({
        ...state,
        boss_id: active.boss_id || state.boss_id,
        current_hp: Number(active.current_hp ?? state.current_hp),
        max_hp: Number(active.max_hp ?? state.max_hp),
        stage: active.stage || state.stage,
        status: active.status || state.status,
      });
    }
  } catch (e) {}

  return NextResponse.json(state);
}
