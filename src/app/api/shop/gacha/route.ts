import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY, ItemRarity, EquipmentItem } from "@/lib/equipment";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await request.json().catch(() => ({}));
    const { chest_type } = body;

    const CHEST_PRICES: Record<string, number> = {
      bronze: 500,
      silver: 2000,
      void: 6000,
    };

    const price = CHEST_PRICES[chest_type];
    if (price === undefined) {
      return NextResponse.json(
        { error: "Invalid chest type. Available chests: bronze, silver, void." },
        { status: 400 }
      );
    }

    // 1. Fetch current profile
    const { data: profileList, error: profErr } = await supabase
      .from("profiles")
      .select("id, user_id, gold")
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (profErr || !profileList || profileList.length === 0) {
      return NextResponse.json(
        { error: "User profile not found. Please log in or complete onboarding." },
        { status: 404 }
      );
    }

    const profile = profileList[0];
    const currentGold = Number(profile.gold ?? 0);

    if (currentGold < price) {
      return NextResponse.json(
        {
          error: `INSUFFICIENT GOLD. Chest costs ${price} Gold, but you only have ${currentGold} Gold.`,
        },
        { status: 400 }
      );
    }

    const targetProfileId = profile.id;
    const newGoldBalance = currentGold - price;

    // 2. Atomic Optimistic Concurrency Control (CAS):
    // Only deduct if gold in DB matches currentGold and is >= price
    const { data: updateData, error: updateErr } = await supabase
      .from("profiles")
      .update({
        gold: newGoldBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetProfileId)
      .eq("gold", currentGold)
      .gte("gold", price)
      .select("gold");

    if (updateErr) {
      return NextResponse.json(
        { error: `Database error during gold deduction: ${updateErr.message}` },
        { status: 500 }
      );
    }

    if (!updateData || updateData.length === 0) {
      return NextResponse.json(
        {
          error: "TRANSACTION CONFLICT. Your gold was updated concurrently by another request. Please try again.",
        },
        { status: 409 }
      );
    }

    // 3. Roll random gacha drop
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

    // 4. Insert item into user_inventory
    const { data: invInsertData, error: invErr } = await supabase
      .from("user_inventory")
      .insert({
        user_id: userId,
        item_id: selectedItem.item_id,
        is_equipped: false,
      })
      .select("inventory_id")
      .single();

    if (invErr || !invInsertData) {
      // Compensating transaction: refund gold so user is never cheated
      console.error("Gacha inventory delivery failed, refunding gold:", invErr);
      await supabase
        .from("profiles")
        .update({
          gold: currentGold,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetProfileId);

      return NextResponse.json(
        { error: "Failed to store item in inventory. Gold has been refunded." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item: selectedItem,
      inventory_id: invInsertData.inventory_id,
      new_gold: newGoldBalance,
      db_status: "synced",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gacha request failed." }, { status: 500 });
  }
}
