import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { user_id, username, character_class, gender, weight_kg } = body;

    const userId = user_id || user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";
    const resolvedUsername =
      username ||
      user?.user_metadata?.username ||
      user?.email?.split("@")[0] ||
      "Warrior";

    const selectedClass = character_class || "WARRIOR";
    const selectedGender = gender || "m";
    const selectedWeight = Number(weight_kg) || 75;

    const profileData = {
      id: userId,
      user_id: userId,
      username: resolvedUsername,
      character_class: selectedClass,
      gender: selectedGender,
      weight_kg: selectedWeight,
      gold: 500,
      level: 1,
      current_hp: 1000,
      max_hp: 1000,
      exp: 0,
      max_exp: 1000,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });

    if (upsertErr) {
      await supabase
        .from("profiles")
        .update({
          username: resolvedUsername,
          character_class: selectedClass,
          gender: selectedGender,
          weight_kg: selectedWeight,
        })
        .or(`id.eq.${userId},user_id.eq.${userId}`);
    }

    try {
      await supabase
        .from("user_inventory")
        .delete()
        .eq("user_id", userId);

      const starterWeaponId = EQUIPMENT_DICTIONARY[0]?.item_id || "e1010001-0000-0000-0000-000000000001";
      const starterArmorId = EQUIPMENT_DICTIONARY[1]?.item_id || "e1010002-0000-0000-0000-000000000002";
      const starterAccId = EQUIPMENT_DICTIONARY[2]?.item_id || "e1010003-0000-0000-0000-000000000003";

      const starterItems = [
        { user_id: userId, item_id: starterWeaponId, is_equipped: true },
        { user_id: userId, item_id: starterArmorId, is_equipped: true },
        { user_id: userId, item_id: starterAccId, is_equipped: true },
      ];

      for (const item of starterItems) {
        await supabase.from("user_inventory").insert(item);
      }
    } catch (e) {}

    return NextResponse.json({ success: true, profile: profileData, user: profileData });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit onboarding." },
      { status: 500 }
    );
  }
}
