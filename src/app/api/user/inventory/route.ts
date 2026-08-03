import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    const { data: invRows, error } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId);

    if (error || !invRows || invRows.length === 0) {
      return NextResponse.json([]);
    }

    const records = invRows
      .map((row) => {
        const itemConfig = EQUIPMENT_DICTIONARY.find((item) => item.item_id === row.item_id);
        if (!itemConfig) return null;
        return {
          inventory_id: row.inventory_id,
          user_id: row.user_id,
          item_id: row.item_id,
          is_equipped: Boolean(row.is_equipped),
          item: itemConfig,
        };
      })
      .filter(Boolean);

    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json([]);
  }
}
