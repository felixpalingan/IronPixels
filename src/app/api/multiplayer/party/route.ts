import { NextResponse } from "next/server";

export interface PartyMember {
  user_id: string;
  username: string;
  character_class: string;
  level: number;
  combat_power: number;
  role: "leader" | "member";
  weapon_icon?: string;
}

export interface PartyState {
  party_id: string;
  party_name: string;
  members: PartyMember[];
  total_party_cp: number;
}

let activeParty: PartyState | null = {
  party_id: "party-default-1",
  party_name: "Iron Legion Squad",
  members: [
    {
      user_id: "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      username: "Felix (You)",
      character_class: "WARRIOR",
      level: 1,
      combat_power: 1250,
      role: "leader",
      weapon_icon: "/assets/items/weapons/01.png",
    },
    {
      user_id: "demo-f-1",
      username: "IronSlayer99",
      character_class: "TITAN BERSERKER",
      level: 42,
      combat_power: 15400,
      role: "member",
      weapon_icon: "/assets/items/weapons/31.png",
    },
  ],
  total_party_cp: 16650,
};

export async function GET() {
  if (activeParty) {
    const totalCp = activeParty.members.reduce((sum, m) => sum + m.combat_power, 0);
    activeParty.total_party_cp = totalCp;
  }
  return NextResponse.json(activeParty);
}

export async function POST(request: Request) {
  try {
    const { action, party_name, invite_user_id, invite_username, invite_class, invite_cp } = await request.json();

    if (action === "create_party") {
      activeParty = {
        party_id: `party-${Date.now()}`,
        party_name: party_name || "Vanguard Raid Squad",
        members: [
          {
            user_id: "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            username: "Felix (You)",
            character_class: "WARRIOR",
            level: 1,
            combat_power: 1250,
            role: "leader",
            weapon_icon: "/assets/items/weapons/01.png",
          },
        ],
        total_party_cp: 1250,
      };
      return NextResponse.json(activeParty);
    }

    if (action === "invite_member" && activeParty) {
      if (activeParty.members.length >= 4) {
        return NextResponse.json({ error: "Party is full! Max 4 members." }, { status: 400 });
      }

      const existing = activeParty.members.find((m) => m.user_id === invite_user_id);
      if (!existing) {
        activeParty.members.push({
          user_id: invite_user_id || `party-m-${Date.now()}`,
          username: invite_username || "Guild Knight",
          character_class: invite_class || "SHADOW NINJA",
          level: 30,
          combat_power: invite_cp || 10000,
          role: "member",
          weapon_icon: "/assets/items/weapons/18.png",
        });
      }

      const totalCp = activeParty.members.reduce((sum, m) => sum + m.combat_power, 0);
      activeParty.total_party_cp = totalCp;

      return NextResponse.json(activeParty);
    }

    if (action === "leave_party") {
      activeParty = null;
      return NextResponse.json({ success: true, party: null });
    }

    return NextResponse.json(activeParty);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
