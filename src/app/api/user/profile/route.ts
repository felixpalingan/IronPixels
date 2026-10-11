import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const authUsername = user.user_metadata?.username || user.email?.split("@")[0] || "Warrior";

    const { data: profileList, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile = profileList && profileList.length > 0 ? profileList[0] : null;

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Onboarding required.", needs_onboarding: true },
        { status: 404 }
      );
    }

    // Authoritative once-per-day boss penalty check stored in Supabase profiles.last_penalty_date
    let bossAttackEvent: { damageDealt: number; bossName: string } | null = null;
    let effectiveCurrentHp =
      profile.current_hp !== undefined && profile.current_hp !== null ? Number(profile.current_hp) : 1000;

    const todayDateStr = new Date().toISOString().split("T")[0];
    const lastPenaltyDateStr = profile.last_penalty_date
      ? String(profile.last_penalty_date).split("T")[0]
      : null;

    if (lastPenaltyDateStr !== todayDateStr) {
      // Check if user account was created today (new operatives get day 1 grace period)
      const profileCreatedAtStr = profile.created_at
        ? String(profile.created_at).split("T")[0]
        : null;
      const isNewAccountToday = profileCreatedAtStr === todayDateStr;

      // Check if user logged workout yesterday or today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = yesterday.toISOString().split("T")[0];

      const { data: recentSessions } = await supabase
        .from("workout_sessions")
        .select("session_id")
        .eq("user_id", userId)
        .gte("date", yesterdayDateStr)
        .limit(1);

      const hasRecentWorkout = Boolean(recentSessions && recentSessions.length > 0);

      // Only trigger if not a new account and no workout yesterday/today
      if (!isNewAccountToday && !hasRecentWorkout) {
        const BOSS_PENALTY_DMG = 250;
        effectiveCurrentHp = Math.max(0, effectiveCurrentHp - BOSS_PENALTY_DMG);
        bossAttackEvent = {
          damageDealt: BOSS_PENALTY_DMG,
          bossName: "Demon Lord Ignis",
        };
      }

      // Mark today as checked in DB so it can NEVER trigger again today
      await supabase
        .from("profiles")
        .update({
          last_penalty_date: todayDateStr,
          current_hp: effectiveCurrentHp,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${userId},user_id.eq.${userId}`);
    }

    return NextResponse.json({
      user_id: profile.id || profile.user_id || userId,
      username: profile.username || authUsername,
      character_class: profile.character_class || "WARRIOR",
      gender: profile.gender || "m",
      level: profile.level || 1,
      current_hp: effectiveCurrentHp,
      max_hp: profile.max_hp || 1000,
      exp: profile.exp || 0,
      max_exp: profile.max_exp || 1000,
      gold: profile.gold ?? 500,
      weight_kg: Number(profile.weight_kg) || 75,
      weight_unit: profile.weight_unit || "kg",
      max_floor: profile.max_floor || 1,
      workout_streak: profile.workout_streak || 1,
      available_ap: profile.available_ap ?? 5,
      boss_attack: bossAttackEvent,
      stats: {
        str: profile.str ?? (profile.stats?.str || 85),
        agi: profile.agi ?? (profile.stats?.agi || 70),
        vit: profile.vit ?? (profile.stats?.vit || 60),
        luk: profile.luk ?? (profile.stats?.luk || 50),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json().catch(() => ({}));

    // Handle full operative profile update (username, weight_kg, gender, weight_unit)
    if (
      body?.username !== undefined ||
      body?.weight_kg !== undefined ||
      body?.gender !== undefined ||
      (body?.weight_unit !== undefined && body?.stat_key === undefined && body?.current_hp === undefined)
    ) {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (body.username !== undefined) {
        const trimmed = String(body.username).trim();
        if (trimmed.length < 2 || trimmed.length > 25) {
          return NextResponse.json(
            { error: "Username must be between 2 and 25 characters." },
            { status: 400 }
          );
        }
        updates.username = trimmed;
      }

      if (body.weight_kg !== undefined) {
        const w = Number(body.weight_kg);
        if (isNaN(w) || w < 20 || w > 350) {
          return NextResponse.json(
            { error: "Weight must be between 20 kg and 350 kg." },
            { status: 400 }
          );
        }
        updates.weight_kg = Math.round(w * 10) / 10;
      }

      if (body.gender !== undefined) {
        updates.gender = body.gender === "f" ? "f" : "m";
      }

      if (body.weight_unit !== undefined) {
        updates.weight_unit = body.weight_unit === "lbs" ? "lbs" : "kg";
      }

      const { data: updatedList, error: updateErr } = await supabase
        .from("profiles")
        .update(updates)
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .select("*");

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const updated = updatedList && updatedList.length > 0 ? updatedList[0] : null;

      if (updates.username) {
        try {
          await supabase.auth.updateUser({
            data: { username: updates.username },
          });
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        message: "Operative profile updated successfully.",
        profile: updated,
      });
    }

    // Handle current_hp update (e.g. boss penalty damage)
    if (body?.current_hp !== undefined) {
      const targetHp = Math.max(0, Math.floor(Number(body.current_hp)));
      const { data: updatedList, error: updateErr } = await supabase
        .from("profiles")
        .update({
          current_hp: targetHp,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .select("*");

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        current_hp: targetHp,
        message: `HP updated to ${targetHp}`,
      });
    }

    const { stat_key, amount = 1 } = body;

    const validStats = ["str", "agi", "vit", "luk"] as const;
    type ValidStat = (typeof validStats)[number];

    if (!validStats.includes(stat_key as ValidStat)) {
      return NextResponse.json(
        { error: `Invalid stat_key. Must be one of: ${validStats.join(", ")}` },
        { status: 400 }
      );
    }

    const upgradeAmount = Math.max(1, Math.floor(Number(amount) || 1));

    // 1. Fetch current profile from database
    const { data: profileList, error: fetchErr } = await supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (fetchErr || !profileList || profileList.length === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const profile = profileList[0];
    const currentAp = Number(profile.available_ap ?? 0);

    if (currentAp < upgradeAmount) {
      return NextResponse.json(
        { error: `INSUFFICIENT AP. Required: ${upgradeAmount}, Available: ${currentAp}` },
        { status: 400 }
      );
    }

    const newAp = currentAp - upgradeAmount;
    const currentStatVal = Number(profile[stat_key] ?? (profile.stats?.[stat_key] || 0));
    const newStatVal = currentStatVal + upgradeAmount;

    const currentStatsObj = profile.stats || {
      str: Number(profile.str || 85),
      agi: Number(profile.agi || 70),
      vit: Number(profile.vit || 60),
      luk: Number(profile.luk || 50),
    };

    const newStatsObj = {
      ...currentStatsObj,
      [stat_key]: newStatVal,
    };

    // 2. Atomic CAS update on available_ap
    const { data: updatedList, error: updateErr } = await supabase
      .from("profiles")
      .update({
        available_ap: newAp,
        [stat_key]: newStatVal,
        stats: newStatsObj,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .eq("available_ap", currentAp)
      .gte("available_ap", upgradeAmount)
      .select("*");

    if (updateErr) {
      return NextResponse.json(
        { error: `Failed to upgrade stat: ${updateErr.message}` },
        { status: 500 }
      );
    }

    if (!updatedList || updatedList.length === 0) {
      return NextResponse.json(
        { error: "TRANSACTION CONFLICT. AP was modified by another action. Please try again." },
        { status: 409 }
      );
    }

    const updated = updatedList[0];
    return NextResponse.json({
      success: true,
      profile: {
        user_id: updated.id || updated.user_id || userId,
        username: updated.username,
        character_class: updated.character_class || "WARRIOR",
        gender: updated.gender || "m",
        level: updated.level || 1,
        current_hp: updated.current_hp !== undefined && updated.current_hp !== null ? Number(updated.current_hp) : 1000,
        max_hp: updated.max_hp || 1000,
        exp: updated.exp || 0,
        max_exp: updated.max_exp || 1000,
        gold: updated.gold ?? 500,
        weight_kg: Number(updated.weight_kg) || 75,
        available_ap: updated.available_ap ?? 0,
        stats: {
          str: updated.str ?? (updated.stats?.str || 85),
          agi: updated.agi ?? (updated.stats?.agi || 70),
          vit: updated.vit ?? (updated.stats?.vit || 60),
          luk: updated.luk ?? (updated.stats?.luk || 50),
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to upgrade stat." },
      { status: 500 }
    );
  }
}
