import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { user_id, date, duration_minutes, total_rvs, total_volume_kg, exercises_log } = body;

    const userId = user?.id || user_id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    if (!total_rvs || total_rvs <= 0) {
      return NextResponse.json(
        { error: "Invalid workout payload. Total RVS must be greater than 0." },
        { status: 400 }
      );
    }

    const sessionRecord = {
      user_id: userId,
      date: date || new Date().toISOString().split("T")[0],
      duration_minutes: duration_minutes || 45,
      total_rvs: total_rvs || 0,
      total_volume_kg: total_volume_kg || 0,
      exercises_log: exercises_log || [],
      status: "completed",
    };

    let updatedProfile = null;

    try {
      const { error: wsErr } = await supabase.from("workout_sessions").insert(sessionRecord);
      if (wsErr) {
        await supabase.from("Workout_Sessions").insert(sessionRecord);
      }

      const { data: profileList } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${userId},user_id.eq.${userId}`);

      if (profileList && profileList.length > 0) {
        const p = profileList[0];
        const earnedGold = Math.round((total_volume_kg || 0) / 10);
        const healAmount = Math.round(total_rvs * 1.5);

        let newExp = (p.exp || 0) + total_rvs;
        let newLevel = p.level || 1;
        let newMaxExp = p.max_exp || 1000;
        let newAp = p.available_ap || 0;

        while (newExp >= newMaxExp) {
          newExp -= newMaxExp;
          newLevel += 1;
          newMaxExp = Math.round(newMaxExp * 1.5);
          newAp += 5;
        }

        const maxHp = p.max_hp || 1000;
        const newHp = Math.min(maxHp, (p.current_hp || 1000) + healAmount);
        const newGold = (p.gold || 0) + earnedGold;
        const newDailyRvs = Number(p.daily_rvs || 0) + total_rvs;

        const updatePayload = {
          current_hp: newHp,
          exp: newExp,
          max_exp: newMaxExp,
          level: newLevel,
          gold: newGold,
          available_ap: newAp,
          daily_rvs: newDailyRvs,
          updated_at: new Date().toISOString(),
        };

        const { data: profUpdate } = await supabase
          .from("profiles")
          .update(updatePayload)
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .select("*")
          .single();

        if (profUpdate) {
          updatedProfile = profUpdate;
        }
      }
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      session: sessionRecord,
      profile: updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log workout session." },
      { status: 500 }
    );
  }
}
