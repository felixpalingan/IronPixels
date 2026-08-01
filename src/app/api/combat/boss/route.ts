import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_BOSS_ID = "b055d7ac-1234-4567-89ab-cdef01234567";

export async function GET() {
  try {
    const { data: boss, error } = await supabase
      .from("Dungeon_Bosses")
      .select("*")
      .eq("boss_id", DEFAULT_BOSS_ID)
      .single();

    if (!error && boss) {
      return NextResponse.json({
        boss_id: boss.boss_id,
        boss_name: boss.boss_name,
        current_hp: Number(boss.current_hp),
        max_hp: Number(boss.max_hp),
        status: boss.status,
      });
    }
  } catch (e) {
  }

  return NextResponse.json({
    boss_id: DEFAULT_BOSS_ID,
    boss_name: "Shadow Dragon Ignis",
    current_hp: 250000,
    max_hp: 500000,
    status: "Active",
  });
}
