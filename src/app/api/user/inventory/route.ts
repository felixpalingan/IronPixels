import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

const DEFAULT_USER_ID = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetUserId = user?.id || DEFAULT_USER_ID;

    const { data: inventory, error } = await supabase
      .from("user_inventory")
      .select("inventory_id, user_id, item_id, is_equipped, equipment_dictionary(*)")
      .or(`user_id.eq.${targetUserId},user_id.eq.${DEFAULT_USER_ID}`)
      .order("created_at", { ascending: false });

    if (!error && inventory && inventory.length > 0) {
      const formatted = inventory.map((rec: any) => {
        const itemDetail = rec.equipment_dictionary || EQUIPMENT_DICTIONARY.find(e => e.item_id === rec.item_id) || EQUIPMENT_DICTIONARY[0];
        return {
          inventory_id: rec.inventory_id,
          user_id: rec.user_id,
          item_id: rec.item_id,
          is_equipped: rec.is_equipped,
          item: itemDetail,
        };
      });
      return NextResponse.json(formatted);
    }
  } catch (err) {
  }

  const defaultInventory = [
    {
      inventory_id: "inv-init-1",
      user_id: DEFAULT_USER_ID,
      item_id: EQUIPMENT_DICTIONARY[0].item_id,
      is_equipped: true,
      item: EQUIPMENT_DICTIONARY[0],
    },
    {
      inventory_id: "inv-init-2",
      user_id: DEFAULT_USER_ID,
      item_id: EQUIPMENT_DICTIONARY[1].item_id,
      is_equipped: true,
      item: EQUIPMENT_DICTIONARY[1],
    },
    {
      inventory_id: "inv-init-3",
      user_id: DEFAULT_USER_ID,
      item_id: EQUIPMENT_DICTIONARY[2].item_id,
      is_equipped: true,
      item: EQUIPMENT_DICTIONARY[2],
    },
  ];

  return NextResponse.json(defaultInventory);
}
