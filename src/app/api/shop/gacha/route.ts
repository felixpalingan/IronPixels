import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY, ItemRarity, EquipmentItem } from "@/lib/equipment";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function POST(request: Request) {
  try {
    const { chest_type } = await request.json();

    const CHEST_PRICES: Record<string, number> = {
      bronze: 0,
      silver: 0,
      void: 0,
    };

    const price = CHEST_PRICES[chest_type] ?? 0;

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id || DEFAULT_USER_ID;
    let userGold = 12500;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("gold")
        .eq("user_id", userId)
        .single();

      if (profile && profile.gold !== undefined) {
        userGold = Number(profile.gold);
      }
    } catch (e) {
    }

    const rand = Math.random() * 100;
    let targetRarity: ItemRarity = "common";

    if (chest_type === "bronze") {
      if (rand < 5) targetRarity = "epic";
      else if (rand < 30) targetRarity = "rare";
      else targetRarity = "common";
    } else if (chest_type === "silver") {
      if (rand < 5) targetRarity = "legendary";
      else if (rand < 25) targetRarity = "epic";
      else if (rand < 85) targetRarity = "rare";
      else targetRarity = "common";
    } else if (chest_type === "void") {
      if (rand < 60) targetRarity = "legendary";
      else targetRarity = "epic";
    }

    const pool = EQUIPMENT_DICTIONARY.filter((item) => item.rarity === targetRarity);
    const selectedItem: EquipmentItem =
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : EQUIPMENT_DICTIONARY[Math.floor(Math.random() * EQUIPMENT_DICTIONARY.length)];

    const newGoldBalance = Math.max(0, userGold - price);

    try {
      await supabase
        .from("profiles")
        .update({ gold: newGoldBalance })
        .eq("user_id", userId);

      await supabase.from("user_inventory").insert({
        user_id: userId,
        item_id: selectedItem.item_id,
        is_equipped: false,
      });
    } catch (e) {
    }

    const newInventoryRecord = {
      inventory_id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      item_id: selectedItem.item_id,
      is_equipped: false,
      item: selectedItem,
    };

    return NextResponse.json({
      success: true,
      new_gold: newGoldBalance,
      drawn_item: newInventoryRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process Gacha purchase." },
      { status: 500 }
    );
  }
}
