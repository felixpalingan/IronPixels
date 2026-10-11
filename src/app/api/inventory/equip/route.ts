import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export async function POST(request: Request) {
  try {
    const { inventory_id, item_id, item_type, is_equipped, new_current_hp } = await request.json();

    if (!inventory_id || !item_id) {
      return NextResponse.json(
        { error: "inventory_id and item_id are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

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

      // Handle proportional current_hp update
      if (new_current_hp !== undefined && !isNaN(Number(new_current_hp))) {
        const hpToSet = Math.max(0, Math.floor(Number(new_current_hp)));
        await supabase
          .from("profiles")
          .update({ current_hp: hpToSet, updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},user_id.eq.${userId}`);
      } else {
        // Fallback: Calculate proportional HP on server if not provided by client
        const { data: profileList } = await supabase
          .from("profiles")
          .select("current_hp, max_hp")
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .limit(1);

        if (profileList && profileList.length > 0) {
          const profile = profileList[0];
          const baseMaxHp = Number(profile.max_hp) || 1000;
          const currentHp = Number(profile.current_hp ?? baseMaxHp);

          const { data: allItems } = await supabase
            .from("user_inventory")
            .select("item_id, is_equipped")
            .eq("user_id", userId);

          let newBonusHp = 0;
          if (allItems) {
            allItems.filter((r) => r.is_equipped).forEach((r) => {
              const cfg = EQUIPMENT_DICTIONARY.find((i) => i.item_id === r.item_id);
              if (cfg?.bonus_hp) newBonusHp += cfg.bonus_hp;
            });
          }

          const newTotalMax = baseMaxHp + newBonusHp;
          if (currentHp > 0) {
            // Keep at same percentage or cap
            const hpRatio = Math.min(1, currentHp / Math.max(1, baseMaxHp));
            const calculatedHp = Math.min(newTotalMax, Math.round(hpRatio * newTotalMax));
            await supabase
              .from("profiles")
              .update({ current_hp: calculatedHp, updated_at: new Date().toISOString() })
              .or(`id.eq.${userId},user_id.eq.${userId}`);
          }
        }
      }
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
