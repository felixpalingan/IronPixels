import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { username, character_class, gender, weight_kg } = body;

    const userId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";
    const resolvedUsername =
      username ||
      user?.user_metadata?.username ||
      user?.email?.split("@")[0] ||
      "Warrior";

    const profileData = {
      id: userId,
      user_id: userId,
      username: resolvedUsername,
      character_class: character_class || "WARRIOR",
      gender: gender || "m",
      weight_kg: Number(weight_kg) || 75,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from("profiles").upsert(profileData);

      const starterItems = [
        { user_id: userId, item_id: "wep-novice-sword", is_equipped: true },
        { user_id: userId, item_id: "arm-iron-plate", is_equipped: true },
        { user_id: userId, item_id: "acc-#00ff41-ring", is_equipped: true },
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
