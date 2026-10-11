import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // 1. Fetch current profile
    const { data: profileList, error: fetchErr } = await supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (fetchErr || !profileList || profileList.length === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const profile = profileList[0];
    const REVIVE_COST = 500;
    const currentGold = Number(profile.gold ?? 0);

    if (currentGold < REVIVE_COST) {
      return NextResponse.json(
        {
          error: `INSUFFICIENT GOLD. Revive Potion costs ${REVIVE_COST} Gold, but you only have ${currentGold} Gold. Log a workout session to revive for free!`,
        },
        { status: 400 }
      );
    }

    const maxHp = Number(profile.max_hp) || 1000;
    const newGold = currentGold - REVIVE_COST;

    // 2. Atomic update to restore HP and deduct gold
    const { data: updatedList, error: updateErr } = await supabase
      .from("profiles")
      .update({
        current_hp: maxHp,
        gold: newGold,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .gte("gold", REVIVE_COST)
      .select("*");

    if (updateErr) {
      return NextResponse.json(
        { error: `Failed to revive hero: ${updateErr.message}` },
        { status: 500 }
      );
    }

    if (!updatedList || updatedList.length === 0) {
      return NextResponse.json(
        { error: "TRANSACTION FAILED. Gold was modified by another operation. Please retry." },
        { status: 409 }
      );
    }

    const updated = updatedList[0];

    return NextResponse.json({
      success: true,
      message: "HERO RESURRECTED! Full HP has been restored with the Revive Potion.",
      profile: {
        user_id: updated.id || updated.user_id || userId,
        username: updated.username,
        character_class: updated.character_class || "WARRIOR",
        gender: updated.gender || "m",
        level: updated.level || 1,
        current_hp: updated.current_hp,
        max_hp: updated.max_hp || 1000,
        exp: updated.exp || 0,
        max_exp: updated.max_exp || 1000,
        gold: updated.gold,
        weight_kg: Number(updated.weight_kg) || 75,
        weight_unit: updated.weight_unit || "kg",
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
      { error: err?.message || "Failed to revive hero." },
      { status: 500 }
    );
  }
}
