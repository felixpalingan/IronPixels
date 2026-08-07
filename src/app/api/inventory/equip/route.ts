import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function POST(request: Request) {
  try {
    const { inventory_id, item_id, item_type, is_equipped } = await request.json();

    if (!inventory_id || !item_id) {
      return NextResponse.json(
        { error: "inventory_id and item_id are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id || DEFAULT_USER_ID;

    try {
      if (is_equipped && item_type) {
        const { data: userItems } = await supabase
          .from("user_inventory")
          .select("*")
          .eq("user_id", userId);

        if (userItems && userItems.length > 0) {
          if (item_type === "accessory") {
            const equippedAccs = userItems.filter((rec: any) => {
              const itemConfig = EQUIPMENT_DICTIONARY.find((i) => i.item_id === rec.item_id);
              const type = itemConfig?.type || rec.item_data?.type;
              return type === "accessory" && rec.is_equipped && rec.inventory_id !== inventory_id;
            });

            // If there are already 2 accessories equipped, un-equip the oldest 1 so max 2 accessories remain equipped
            if (equippedAccs.length >= 2) {
              const idsToUnequip = equippedAccs.slice(0, equippedAccs.length - 1).map((r: any) => r.inventory_id);
              if (idsToUnequip.length > 0) {
                await supabase
                  .from("user_inventory")
                  .update({ is_equipped: false })
                  .in("inventory_id", idsToUnequip);
              }
            }
          } else {
            // Weapons and Armor max limit 1
            const sameTypeEquippedIds = userItems
              .filter((rec: any) => {
                const itemConfig = EQUIPMENT_DICTIONARY.find((i) => i.item_id === rec.item_id);
                const type = itemConfig?.type || rec.item_data?.type;
                return type === item_type && rec.is_equipped && rec.inventory_id !== inventory_id;
              })
              .map((rec: any) => rec.inventory_id);

            if (sameTypeEquippedIds.length > 0) {
              await supabase
                .from("user_inventory")
                .update({ is_equipped: false })
                .in("inventory_id", sameTypeEquippedIds);
            }
          }
        }
      }

      await supabase
        .from("user_inventory")
        .update({ is_equipped: Boolean(is_equipped) })
        .eq("inventory_id", inventory_id)
        .eq("user_id", userId);
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      inventory_id,
      item_id,
      is_equipped,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update item equipment status." },
      { status: 500 }
    );
  }
}
