import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      const defaultProf = {
        user_id: userId,
        username: authUsername,
        character_class: "WARRIOR",
        gender: "m",
        level: 1,
        current_hp: 1000,
        max_hp: 1000,
        exp: 0,
        max_exp: 1000,
        gold: 500,
        weight_kg: 75,
        available_ap: 5,
        stats: { str: 85, agi: 70, vit: 60, luk: 50 },
      };
      return NextResponse.json(defaultProf);
    }

    return NextResponse.json({
      user_id: profile.id || profile.user_id || userId,
      username: profile.username || authUsername,
      character_class: profile.character_class || "WARRIOR",
      gender: profile.gender || "m",
      level: profile.level || 1,
      current_hp: profile.current_hp || 1000,
      max_hp: profile.max_hp || 1000,
      exp: profile.exp || 0,
      max_exp: profile.max_exp || 1000,
      gold: profile.gold ?? 500,
      weight_kg: Number(profile.weight_kg) || 75,
      available_ap: profile.available_ap ?? 5,
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
