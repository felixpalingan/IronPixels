import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

function getSellPriceByRarity(rarity: string): number {
  switch (rarity?.toLowerCase()) {
    case "mythic":
      return 3500;
    case "legendary":
      return 1200;
    case "epic":
      return 400;
    case "rare":
      return 150;
    case "common":
    default:
      return 50;
  }
}

export async function POST(request: Request) {
  try {
    const { inventory_id } = await request.json();

    if (!inventory_id) {
      return NextResponse.json(
        { error: "inventory_id is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Verify ownership: only find item if it belongs to current authenticated user
    const { data: invRecs, error: invFetchErr } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("inventory_id", inventory_id)
      .eq("user_id", userId)
      .limit(1);

    if (invFetchErr || !invRecs || invRecs.length === 0) {
      return NextResponse.json(
        { error: "Item not found in your inventory." },
        { status: 404 }
      );
    }

    const itemRec = invRecs[0];
    const dictItem = EQUIPMENT_DICTIONARY.find((i) => i.item_id === itemRec.item_id);
    const itemData = itemRec.item_data || dictItem;
    const rarity = itemData?.rarity || "common";
    const goldGained = getSellPriceByRarity(rarity);

    // Delete item from user_inventory strictly for this user
    const { error: deleteErr } = await supabase
      .from("user_inventory")
      .delete()
      .eq("inventory_id", inventory_id)
      .eq("user_id", userId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to remove item from inventory." },
        { status: 500 }
      );
    }

    // Update profile gold
    let newGoldTotal = 0;
    try {
      const { data: profs } = await supabase
        .from("profiles")
        .select("gold")
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .limit(1);

      if (profs && profs.length > 0) {
        const currentGold = profs[0].gold || 0;
        newGoldTotal = currentGold + goldGained;

        await supabase
          .from("profiles")
          .update({
            gold: newGoldTotal,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${userId},user_id.eq.${userId}`);
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      inventory_id,
      gold_gained: goldGained,
      new_total_gold: newGoldTotal,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to sell inventory item." },
      { status: 500 }
    );
  }
}
