import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { inventory_id, item_id, item_type, is_equipped } = await request.json();

    if (!inventory_id || !item_id) {
      return NextResponse.json(
        { error: "inventory_id and item_id UUIDs are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (authData?.user) {
      const userId = authData.user.id;

      if (is_equipped && item_type) {
        const { data: userItems } = await supabase
          .from("user_inventory")
          .select("inventory_id, equipment_dictionary(type)")
          .eq("user_id", userId);

        if (userItems) {
          const sameTypeEquippedIds = userItems
            .filter((rec: any) => rec.equipment_dictionary?.type === item_type)
            .map((rec: any) => rec.inventory_id);

          if (sameTypeEquippedIds.length > 0) {
            await supabase
              .from("user_inventory")
              .update({ is_equipped: false })
              .in("inventory_id", sameTypeEquippedIds);
          }
        }
      }

      await supabase
        .from("user_inventory")
        .update({ is_equipped })
        .eq("inventory_id", inventory_id)
        .eq("user_id", userId);
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
