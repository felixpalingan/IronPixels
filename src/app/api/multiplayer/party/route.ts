import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface PartyMember {
  user_id: string;
  username: string;
  character_class: string;
  level: number;
  combat_power: number;
  role: "leader" | "co_leader" | "member";
  weapon_icon?: string;
}

export interface PartyState {
  party_id: string;
  party_name: string;
  leader_id: string;
  members: PartyMember[];
  total_party_cp: number;
  total_party_floor: number;
  total_party_rvs: number;
  party_streak: number;
}

let activePartyCache: PartyState | null = null;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(null);
    }

    const { data: memberRecord } = await supabase
      .from("Party_Members")
      .select("party_id")
      .eq("user_id", userId)
      .limit(1);

    let partyId = memberRecord && memberRecord.length > 0 ? memberRecord[0].party_id : null;

    if (!partyId) {
      const { data: leaderRecord } = await supabase
        .from("Party")
        .select("party_id")
        .eq("leader_id", userId)
        .limit(1);

      if (leaderRecord && leaderRecord.length > 0) {
        partyId = leaderRecord[0].party_id;
      }
    }

    if (!partyId) {
      return NextResponse.json(null);
    }

    const { data: dbParty } = await supabase
      .from("Party")
      .select("*")
      .eq("party_id", partyId)
      .limit(1);

    if (dbParty && dbParty.length > 0) {
      const p = dbParty[0];
      const { data: dbMembers } = await supabase
        .from("Party_Members")
        .select("*")
        .eq("party_id", p.party_id);

      const memberUserIds = (dbMembers || []).map((m: any) => m.user_id);
      let memberProfilesMap: Record<string, any> = {};

      if (memberUserIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("*")
          .or(`id.in.(${memberUserIds.join(",")}),user_id.in.(${memberUserIds.join(",")})`);

        if (profs) {
          profs.forEach((prof: any) => {
            if (prof.id) memberProfilesMap[prof.id] = prof;
            if (prof.user_id) memberProfilesMap[prof.user_id] = prof;
          });
        }
      }

      const membersList: PartyMember[] = (dbMembers || []).map((m: any) => {
        const prof = memberProfilesMap[m.user_id] || {};
        const cp =
          (prof.level || 1) * 100 +
          (prof.str || 85) * 3.5 +
          (prof.agi || 70) * 2.5 +
          (prof.vit || 60) * 2.5;

        return {
          user_id: m.user_id,
          username: prof.username || "Warrior",
          character_class: prof.character_class || "WARRIOR",
          level: prof.level || 1,
          combat_power: Math.round(cp),
          role: m.role || "member",
          weapon_icon: "/assets/items/weapons/01.png",
        };
      });

      const syncedState: PartyState = {
        party_id: p.party_id,
        party_name: p.party_name,
        leader_id: p.leader_id,
        members: membersList,
        total_party_cp: p.total_party_cp || 1250,
        total_party_floor: p.total_party_floor || 1,
        total_party_rvs: p.total_party_rvs || 0,
        party_streak: p.party_streak || 1,
      };

      activePartyCache = syncedState;
      return NextResponse.json(syncedState);
    }
  } catch (e) {}

  return NextResponse.json(null);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      party_name,
      invite_user_id,
      invite_username,
      invite_class,
      invite_cp,
      target_user_id,
      new_role,
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    if (action === "create_party") {
      const newPartyId = crypto.randomUUID();
      const leaderId = currentUserId;

      let leaderName = "Leader";
      let leaderClass = "WARRIOR";

      const { data: leaderProf } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${leaderId},user_id.eq.${leaderId}`)
        .limit(1);

      if (leaderProf && leaderProf.length > 0) {
        leaderName = leaderProf[0].username || "Leader";
        leaderClass = leaderProf[0].character_class || "WARRIOR";
      }

      const newParty: PartyState = {
        party_id: newPartyId,
        party_name: party_name || "Vanguard Raid Squad",
        leader_id: leaderId,
        members: [
          {
            user_id: leaderId,
            username: leaderName,
            character_class: leaderClass,
            level: 1,
            combat_power: 1250,
            role: "leader",
            weapon_icon: "/assets/items/weapons/01.png",
          },
        ],
        total_party_cp: 1250,
        total_party_floor: 1,
        total_party_rvs: 0,
        party_streak: 1,
      };

      activePartyCache = newParty;

      try {
        await supabase.from("Party").insert({
          party_id: newPartyId,
          party_name: newParty.party_name,
          leader_id: leaderId,
          total_party_floor: 1,
          total_party_cp: 1250,
        });

        await supabase.from("Party_Members").insert({
          party_id: newPartyId,
          user_id: leaderId,
          role: "leader",
        });
      } catch (e) {}

      return NextResponse.json(newParty);
    }

    if (action === "rename_party" && activePartyCache) {
      activePartyCache.party_name = party_name || activePartyCache.party_name;

      try {
        await supabase
          .from("Party")
          .update({ party_name: activePartyCache.party_name })
          .eq("party_id", activePartyCache.party_id);
      } catch (e) {}

      return NextResponse.json(activePartyCache);
    }

    if (action === "invite_member" && activePartyCache) {
      if (activePartyCache.members.length >= 10) {
        return NextResponse.json({ error: "Party is full! Max 10 members." }, { status: 400 });
      }

      const existing = activePartyCache.members.find((m) => m.user_id === invite_user_id);
      if (!existing) {
        const newMemberId = invite_user_id || crypto.randomUUID();
        const newMember: PartyMember = {
          user_id: newMemberId,
          username: invite_username || "Guild Knight",
          character_class: invite_class || "SHADOW NINJA",
          level: 30,
          combat_power: invite_cp || 10000,
          role: "member",
          weapon_icon: "/assets/items/weapons/18.png",
        };
        activePartyCache.members.push(newMember);

        try {
          await supabase.from("Party_Members").insert({
            party_id: activePartyCache.party_id,
            user_id: newMemberId,
            role: "member",
          });
        } catch (e) {}
      }

      activePartyCache.total_party_cp = activePartyCache.members.reduce(
        (sum, m) => sum + m.combat_power,
        0
      );

      try {
        await supabase
          .from("Party")
          .update({ total_party_cp: activePartyCache.total_party_cp })
          .eq("party_id", activePartyCache.party_id);
      } catch (e) {}

      return NextResponse.json(activePartyCache);
    }

    if (action === "update_role" && activePartyCache) {
      const member = activePartyCache.members.find((m) => m.user_id === target_user_id);
      if (member && (new_role === "co_leader" || new_role === "member")) {
        member.role = new_role;

        try {
          await supabase
            .from("Party_Members")
            .update({ role: new_role })
            .eq("party_id", activePartyCache.party_id)
            .eq("user_id", target_user_id);
        } catch (e) {}
      }

      return NextResponse.json(activePartyCache);
    }

    if (action === "kick_member" && activePartyCache) {
      activePartyCache.members = activePartyCache.members.filter((m) => m.user_id !== target_user_id);
      activePartyCache.total_party_cp = activePartyCache.members.reduce((sum, m) => sum + m.combat_power, 0);

      try {
        await supabase
          .from("Party_Members")
          .delete()
          .eq("party_id", activePartyCache.party_id)
          .eq("user_id", target_user_id);

        await supabase
          .from("Party")
          .update({ total_party_cp: activePartyCache.total_party_cp })
          .eq("party_id", activePartyCache.party_id);
      } catch (e) {}

      return NextResponse.json(activePartyCache);
    }

    if (action === "leave_party") {
      if (activePartyCache) {
        try {
          await supabase
            .from("Party_Members")
            .delete()
            .eq("party_id", activePartyCache.party_id)
            .eq("user_id", "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c");
        } catch (e) {}
      }

      activePartyCache = null;
      return NextResponse.json({ success: true, party: null });
    }

    return NextResponse.json(activePartyCache);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
