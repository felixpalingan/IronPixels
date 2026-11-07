import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";
import { calculateStreaks } from "@/lib/streakCalculator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const target = decodeURIComponent(rawId).trim();

    if (!target) {
      return NextResponse.json({ error: "Missing user identifier." }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch user profile by ID (UUID) or username
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
    
    let query = supabase.from("profiles").select("*");
    if (isUuid) {
      query = query.or(`id.eq.${target},user_id.eq.${target}`);
    } else {
      query = query.ilike("username", target);
    }

    const { data: profileList, error: profError } = await query.limit(1);

    if (profError) {
      return NextResponse.json({ error: profError.message }, { status: 500 });
    }

    const profile = profileList && profileList.length > 0 ? profileList[0] : null;
    if (!profile) {
      return NextResponse.json({ error: "Hero profile not found." }, { status: 404 });
    }

    const userId = profile.id || profile.user_id;

    // 2. Fetch equipped inventory items
    const { data: invRows } = await supabase
      .from("user_inventory")
      .select("inventory_id, item_id, is_equipped")
      .eq("user_id", userId)
      .eq("is_equipped", true);

    const equippedGear = (invRows || []).map((inv) => {
      const itemConfig = EQUIPMENT_DICTIONARY.find((item) => item.item_id === inv.item_id);
      return {
        inventory_id: inv.inventory_id,
        item_id: inv.item_id,
        item_name: itemConfig?.item_name || "Unknown Gear",
        type: itemConfig?.type || "accessory",
        rarity: itemConfig?.rarity || "common",
        bonus_str: itemConfig?.bonus_str || 0,
        bonus_agi: itemConfig?.bonus_agi || 0,
        bonus_vit: itemConfig?.bonus_vit || 0,
        bonus_luk: itemConfig?.bonus_luk || 0,
        bonus_hp: itemConfig?.bonus_hp || 0,
        icon: itemConfig?.icon || "sword",
        image_url: itemConfig?.image_url || "/assets/items/weapons/01.png",
        description: itemConfig?.description || "",
      };
    });

    // 3. Fetch workout sessions history
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("session_id, date, duration_minutes, total_rvs, total_volume_kg, exercises_log, created_at")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(60);

    const sessionList = sessions || [];

    // 4. Calculate Authoritative Streaks & Lifetime Metrics
    const allDates = sessionList.map((s) => s.date).filter(Boolean);
    const streakResult = calculateStreaks(allDates);

    const lifetimeVolume = sessionList.reduce(
      (sum, s) => sum + (Number(s.total_volume_kg) || 0),
      0
    );
    const lifetimeRvs = sessionList.reduce(
      (sum, s) => sum + (Number(s.total_rvs) || 0),
      0
    );

    // Compute Combat Power (CP)
    const str = Number(profile.str ?? profile.stats?.str) || 85;
    const agi = Number(profile.agi ?? profile.stats?.agi) || 70;
    const vit = Number(profile.vit ?? profile.stats?.vit) || 60;
    const luk = Number(profile.luk ?? profile.stats?.luk) || 50;
    const level = Number(profile.level) || 1;

    const gearBonusStr = equippedGear.reduce((sum, g) => sum + g.bonus_str, 0);
    const gearBonusAgi = equippedGear.reduce((sum, g) => sum + g.bonus_agi, 0);
    const gearBonusVit = equippedGear.reduce((sum, g) => sum + g.bonus_vit, 0);

    const totalStr = str + gearBonusStr;
    const totalAgi = agi + gearBonusAgi;
    const totalVit = vit + gearBonusVit;

    const combatPower = Math.round(
      level * 100 + totalStr * 3.5 + totalAgi * 2.5 + totalVit * 2.5
    );

    // 5. Fetch party information if user belongs to one
    let partyInfo: { party_id: string; party_name: string } | null = null;
    try {
      const { data: memberRows } = await supabase
        .from("Party_Members")
        .select("party_id, Party(party_id, party_name)")
        .eq("user_id", userId)
        .limit(1);

      if (memberRows && memberRows.length > 0 && memberRows[0].Party) {
        const party = memberRows[0].Party as any;
        partyInfo = {
          party_id: party.party_id,
          party_name: party.party_name || "Guild Squad",
        };
      }
    } catch (e) {
      // Non-critical if party lookup fails
    }

    return NextResponse.json({
      hero: {
        user_id: userId,
        username: profile.username || "Operative",
        character_class: profile.character_class || "WARRIOR",
        gender: profile.gender || "m",
        level,
        current_hp: profile.current_hp ?? 1000,
        max_hp: (profile.max_hp ?? 1000) + equippedGear.reduce((sum, g) => sum + g.bonus_hp, 0),
        exp: profile.exp || 0,
        max_exp: profile.max_exp || 1000,
        gold: profile.gold ?? 500,
        max_floor: profile.max_floor || 1,
        daily_rvs: Number(profile.daily_rvs || 0),
        workout_streak: Math.max(Number(profile.workout_streak || 1), streakResult.currentStreak),
        longest_streak: Math.max(
          Number(profile.longest_streak || 1),
          streakResult.longestStreak,
          Number(profile.workout_streak || 1)
        ),
        combat_power: combatPower,
        stats: {
          str: totalStr,
          agi: totalAgi,
          vit: totalVit,
          luk,
          base_str: str,
          base_agi: agi,
          base_vit: vit,
          base_luk: luk,
        },
        created_at: profile.created_at,
        party: partyInfo,
      },
      equipped_gear: equippedGear,
      workout_sessions: sessionList,
      metrics: {
        total_sessions: sessionList.length,
        lifetime_volume_kg: lifetimeVolume,
        lifetime_rvs: lifetimeRvs,
        active_streak: Math.max(Number(profile.workout_streak || 1), streakResult.currentStreak),
        longest_streak: Math.max(
          Number(profile.longest_streak || 1),
          streakResult.longestStreak
        ),
        recent_activity_dates: allDates,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve public hero profile." },
      { status: 500 }
    );
  }
}

