import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY, ItemRarity, EquipmentItem } from "@/lib/equipment";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function POST(request: Request) {
  try {
    const { chest_type } = await request.json();

    const CHEST_PRICES: Record<string, number> = {
      bronze: 500,
      silver: 2500,
      void: 10000,
    };

    const price = CHEST_PRICES[chest_type] ?? 500;

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id || DEFAULT_USER_ID;
    let userGold = 500;

    try {
      const { data: profileList } = await supabase
        .from("profiles")
        .select("gold")
        .or(`id.eq.${userId},user_id.eq.${userId}`);

      if (profileList && profileList.length > 0 && profileList[0].gold !== undefined) {
        userGold = Number(profileList[0].gold);
      }
    } catch (e) {}

    const rand = Math.random() * 100;
    let targetRarity: ItemRarity = "common";

    if (chest_type === "bronze") {
      if (rand < 5) targetRarity = "epic";
      else if (rand < 25) targetRarity = "rare";
      else targetRarity = "common";
    } else if (chest_type === "silver") {
      if (rand < 5) targetRarity = "legendary";
      else if (rand < 30) targetRarity = "epic";
      else if (rand < 80) targetRarity = "rare";
      else targetRarity = "common";
    } else if (chest_type === "void") {
      if (rand < 15) targetRarity = "mythic";
      else if (rand < 45) targetRarity = "legendary";
      else if (rand < 85) targetRarity = "epic";
      else targetRarity = "rare";
    }

    const pool = EQUIPMENT_DICTIONARY.filter((item) => item.rarity === targetRarity);
    const selectedItem: EquipmentItem =
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : EQUIPMENT_DICTIONARY[Math.floor(Math.random() * EQUIPMENT_DICTIONARY.length)];

    const newGoldBalance = Math.max(0, userGold - price);

    let dbErrorMsg: string | null = null;
    let insertedInventoryId: string = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      await supabase
        .from("profiles")
        .update({ gold: newGoldBalance })
        .or(`id.eq.${userId},user_id.eq.${userId}`);

      const { data: invInsertData, error: invErr } = await supabase
        .from("user_inventory")
        .insert({
          user_id: userId,
          item_id: selectedItem.item_id,
          is_equipped: false,
        })
        .select("inventory_id")
        .single();

      if (invErr) {
        dbErrorMsg = invErr.message;
      } else if (invInsertData?.inventory_id) {
        insertedInventoryId = invInsertData.inventory_id;
      }
    } catch (e: any) {
      dbErrorMsg = e.message || "Failed to commit to Supabase";
    }

    return NextResponse.json({
      success: true,
      item: selectedItem,
      inventory_id: insertedInventoryId,
      new_gold: newGoldBalance,
      db_status: dbErrorMsg ? "offline_fallback" : "synced",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
