import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

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
    return NextResponse.json(
      { error: err.message || "Failed to fetch inventory." },
      { status: 500 }
    );
  }
}
