import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface FriendUser {
  user_id: string;
  username: string;
  character_class: string;
  level: number;
  combat_power: number;
  status: "friend" | "pending_incoming" | "pending_outgoing" | "none";
  weapon_icon?: string;
}

const DEMO_PLAYERS: FriendUser[] = [
  {
    user_id: "demo-f-1",
    username: "IronSlayer99",
    character_class: "TITAN BERSERKER",
    level: 42,
    combat_power: 15400,
    status: "friend",
    weapon_icon: "/assets/items/weapons/31.png",
  },
  {
    user_id: "demo-f-2",
    username: "CyberAegis",
    character_class: "IRON VANGUARD",
    level: 36,
    combat_power: 12200,
    status: "friend",
    weapon_icon: "/assets/items/weapons/18.png",
  },
  {
    user_id: "demo-f-3",
    username: "ShadowKage",
    character_class: "SHADOW NINJA",
    level: 39,
    combat_power: 13900,
    status: "pending_incoming",
    weapon_icon: "/assets/items/weapons/24.png",
  },
  {
    user_id: "demo-f-4",
    username: "Vanguard_Zero",
    character_class: "CYBER KNIGHT",
    level: 48,
    combat_power: 18500,
    status: "none",
    weapon_icon: "/assets/items/weapons/37.png",
  },
  {
    user_id: "demo-f-5",
    username: "PhoenixRider",
    character_class: "WARRIOR",
    level: 32,
    combat_power: 10800,
    status: "none",
    weapon_icon: "/assets/items/weapons/14.png",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase() || "";

  if (query) {
    const matched = DEMO_PLAYERS.filter((p) =>
      p.username.toLowerCase().includes(query)
    );
    return NextResponse.json(matched);
  }

  const friends = DEMO_PLAYERS.filter((p) => p.status === "friend");
  const pending = DEMO_PLAYERS.filter((p) => p.status === "pending_incoming");

  return NextResponse.json({
    friends,
    pending,
  });
}

export async function POST(request: Request) {
  try {
    const { action, target_user_id } = await request.json();

    if (action === "send_request") {
      const target = DEMO_PLAYERS.find((p) => p.user_id === target_user_id);
      if (target) target.status = "pending_outgoing";
      return NextResponse.json({ success: true, status: "pending_outgoing" });
    }

    if (action === "accept_request") {
      const target = DEMO_PLAYERS.find((p) => p.user_id === target_user_id);
      if (target) target.status = "friend";
      return NextResponse.json({ success: true, status: "friend" });
    }

    if (action === "remove_friend" || action === "reject_request") {
      const target = DEMO_PLAYERS.find((p) => p.user_id === target_user_id);
      if (target) target.status = "none";
      return NextResponse.json({ success: true, status: "none" });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
