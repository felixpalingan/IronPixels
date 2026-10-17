import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateWorkoutSessionTotals } from "@/lib/workoutCalculations";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { date, duration_minutes, exercises_log } = body;

    if (!Array.isArray(exercises_log) || exercises_log.length === 0) {
      return NextResponse.json(
        { error: "Invalid workout payload. exercises_log must be a non-empty array." },
        { status: 400 }
      );
    }

    // Retrieve user's current character profile stats from DB
    const { data: profileList } = await supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    const existingProfile = profileList && profileList.length > 0 ? profileList[0] : null;

    const userWeightKg = Number(existingProfile?.weight_kg) || 75;
    const userStr = Number(existingProfile?.str ?? existingProfile?.stats?.str) || 85;
    const userAgi = Number(existingProfile?.agi ?? existingProfile?.stats?.agi) || 70;

    // Server-side authoritative recalculation of volume and RVS
    const recalculated = calculateWorkoutSessionTotals({
      exercisesLog: exercises_log,
      userWeightKg,
      userStr,
      userAgi,
    });

    const serverRvs = recalculated.totalRvs;
    const serverVolume = recalculated.totalVolumeKg;

    if (serverRvs <= 0) {
      return NextResponse.json(
        { error: "No completed workout sets found. RVS must be greater than 0." },
        { status: 400 }
      );
    }

    const safeDuration = Math.min(360, Math.max(1, Number(duration_minutes) || 45));
    const safeDate = date || new Date().toISOString().split("T")[0];

    const sessionId = body?.session_id || `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const sessionRecord = {
      session_id: sessionId,
      user_id: userId,
      date: safeDate,
      duration_minutes: safeDuration,
      total_rvs: serverRvs,
      total_volume_kg: serverVolume,
      exercises_log: recalculated.sanitizedExercisesLog,
      status: "completed",
    };

    let updatedProfile = null;

    // Resolve party ID if user is in an active party
    let resolvedPartyId: string | null = null;
    try {
      const { data: memberRec } = await supabase
        .from("Party_Members")
        .select("party_id")
        .eq("user_id", userId)
        .limit(1);
      if (memberRec && memberRec.length > 0) {
        resolvedPartyId = memberRec[0].party_id;
      }
    } catch (e) {}

    // Calculate progression values
    const p = existingProfile;
    const earnedGold = Math.round(serverVolume / 10);
    const healAmount = Math.round(serverRvs * 1.5);

    let newExp = (p?.exp || 0) + serverRvs;
    let newLevel = p?.level || 1;
    let newMaxExp = p?.max_exp || 1000;
    let newAp = p?.available_ap || 0;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.5);
      newAp += 5;
    }

    const { data: equippedRows } = await supabase
      .from("user_inventory")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_equipped", true);

    let gearBonusHp = 0;
    if (equippedRows && equippedRows.length > 0) {
      for (const eq of equippedRows) {
        const itemConfig = EQUIPMENT_DICTIONARY.find((i) => i.item_id === eq.item_id);
        if (itemConfig?.bonus_hp) {
          gearBonusHp += itemConfig.bonus_hp;
        }
      }
    }

    const effectiveMaxHp = (p?.max_hp || 1000) + gearBonusHp;
    const newHp = effectiveMaxHp;
    const newGold = (p?.gold || 0) + earnedGold;
    const newDailyRvs = Number(p?.daily_rvs || 0) + serverRvs;

    // 1. Attempt atomic database stored procedure RPC
    let rpcSucceeded = false;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "submit_workout_transaction",
        {
          p_user_id: userId,
          p_session_id: sessionId,
          p_date: safeDate,
          p_duration_minutes: safeDuration,
          p_total_rvs: serverRvs,
          p_total_volume_kg: serverVolume,
          p_exercises_log: recalculated.sanitizedExercisesLog,
          p_earned_gold: earnedGold,
          p_new_exp: newExp,
          p_new_max_exp: newMaxExp,
          p_new_level: newLevel,
          p_new_ap: newAp,
          p_new_hp: newHp,
          p_safe_date: safeDate,
          p_party_id: resolvedPartyId,
        }
      );

      if (!rpcError && rpcData?.success) {
        updatedProfile = rpcData.profile;
        rpcSucceeded = true;
      }
    } catch (rpcErr) {
      console.warn("RPC submit_workout_transaction unavailable, executing resilient fallback:", rpcErr);
    }

    // 2. Strict sequential fallback with transaction compensation (rollback):
    if (!rpcSucceeded) {
      // Step A: Insert workout session. If it fails, abort immediately (do NOT award gold/exp without a valid session!).
      const { error: wsErr } = await supabase.from("workout_sessions").insert(sessionRecord);
      if (wsErr) {
        console.error("Critical: failed to insert workout session:", wsErr);
        return NextResponse.json(
          { error: "Database transaction failed: could not record workout session." },
          { status: 500 }
        );
      }

      // Step B: Update profile progression.
      const updatePayload = {
        current_hp: newHp,
        exp: newExp,
        max_exp: newMaxExp,
        level: newLevel,
        gold: newGold,
        available_ap: newAp,
        daily_rvs: newDailyRvs,
        last_penalty_date: safeDate,
        updated_at: new Date().toISOString(),
      };

      const { data: profUpdate, error: profErr } = await supabase
        .from("profiles")
        .update(updatePayload)
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .select("*");

      if (profErr || !profUpdate || profUpdate.length === 0) {
        console.error("Critical: failed to update profile, rolling back session:", profErr);
        // Compensating transaction: roll back the inserted session to prevent orphan record
        await supabase.from("workout_sessions").delete().eq("session_id", sessionId);
        return NextResponse.json(
          { error: "Database transaction failed: could not commit hero profile progression." },
          { status: 500 }
        );
      }

      updatedProfile = profUpdate[0];

      // Step C: Update Party RVS if in a party
      if (resolvedPartyId) {
        try {
          const { data: partyRec } = await supabase
            .from("Party")
            .select("total_party_rvs")
            .eq("party_id", resolvedPartyId)
            .single();

          if (partyRec) {
            await supabase
              .from("Party")
              .update({
                total_party_rvs: (partyRec.total_party_rvs || 0) + serverRvs,
                updated_at: new Date().toISOString(),
              })
              .eq("party_id", resolvedPartyId);
          }
        } catch (partyErr) {
          console.error("Failed to update party RVS:", partyErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      session: sessionRecord,
      profile: updatedProfile,
      server_calculated: {
        total_rvs: serverRvs,
        total_volume_kg: serverVolume,
        earned_gold: Math.round(serverVolume / 10),
        healed_hp: Math.round(serverRvs * 1.5),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log workout session." },
      { status: 500 }
    );
  }
}
