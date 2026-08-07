import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export interface PartyMember {
  user_id: string;
  username: string;
  character_class: string;
  gender: "m" | "f";
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
      return NextResponse.json({ party: null, invites: [] });
    }

    const { data: rawInvites } = await supabase
      .from("party_invites")
      .select("*")
      .eq("invitee_id", userId)
      .eq("status", "pending");

    let invitesList: any[] = [];
    if (rawInvites && rawInvites.length > 0) {
      const partyIds = rawInvites.map((inv: any) => inv.party_id);
      const inviterIds = rawInvites.map((inv: any) => inv.inviter_id);

      const { data: inviteParties } = await supabase
        .from("Party")
        .select("*")
        .in("party_id", partyIds);

      const { data: inviterProfiles } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.in.(${inviterIds.join(",")}),user_id.in.(${inviterIds.join(",")})`);

      const partyMap: Record<string, any> = {};
      (inviteParties || []).forEach((p: any) => { partyMap[p.party_id] = p; });

      const inviterMap: Record<string, any> = {};
      (inviterProfiles || []).forEach((p: any) => {
        if (p.id) inviterMap[p.id] = p;
        if (p.user_id) inviterMap[p.user_id] = p;
      });

      invitesList = rawInvites.map((inv: any) => ({
        invite_id: inv.invite_id,
        party_id: inv.party_id,
        party_name: partyMap[inv.party_id]?.party_name || "Raid Party",
        inviter_id: inv.inviter_id,
        inviter_username: inviterMap[inv.inviter_id]?.username || "Leader",
        created_at: inv.created_at,
      }));
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
      return NextResponse.json({ party: null, invites: invitesList });
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

      let equippedWeaponsMap: Record<string, string> = {};
      if (memberUserIds.length > 0) {
        try {
          const { data: invRecs } = await supabase
            .from("user_inventory")
            .select("user_id, item_id, item_data")
            .in("user_id", memberUserIds)
            .eq("is_equipped", true);

          if (invRecs) {
            invRecs.forEach((rec: any) => {
              let weaponUrl = "";
              const dictItem = EQUIPMENT_DICTIONARY.find((i) => i.item_id === rec.item_id);
              if (dictItem && dictItem.type === "weapon" && dictItem.image_url) {
                weaponUrl = dictItem.image_url;
              } else if (rec.item_data && rec.item_data.type === "weapon" && rec.item_data.image_url) {
                weaponUrl = rec.item_data.image_url;
              }
              if (weaponUrl) {
                equippedWeaponsMap[rec.user_id] = weaponUrl;
              }
            });
          }
        } catch (e) {}
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
          gender: (prof.gender || "m") as "m" | "f",
          level: prof.level || 1,
          combat_power: Math.round(cp),
          role: m.role || "member",
          weapon_icon: equippedWeaponsMap[m.user_id] || "/assets/items/weapons/01.png",
        };
      });

      const syncedState: PartyState = {
        party_id: p.party_id,
        party_name: p.party_name,
        leader_id: p.leader_id,
        members: membersList,
        total_party_cp: membersList.reduce((sum, m) => sum + m.combat_power, 0),
        total_party_floor: p.total_party_floor || 1,
        total_party_rvs: p.total_party_rvs || 0,
        party_streak: p.party_streak || 1,
      };

      activePartyCache = syncedState;
      return NextResponse.json({ party: syncedState, invites: invitesList });
    }
  } catch (e) {}

  return NextResponse.json({ party: null, invites: [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      party_name,
      party_id,
      invite_user_id,
      invite_id,
      target_user_id,
      new_role,
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    if (action === "create_party") {
      try {
        const { data: existingParties } = await supabase
          .from("Party")
          .select("party_id")
          .eq("leader_id", currentUserId);

        if (existingParties && existingParties.length > 0) {
          for (const oldP of existingParties) {
            await supabase.from("Party_Members").delete().eq("party_id", oldP.party_id);
            await supabase.from("Party").delete().eq("party_id", oldP.party_id);
          }
        }

        await supabase.from("Party_Members").delete().eq("user_id", currentUserId);
      } catch (e) {}

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

      const leaderGender = (leaderProf && leaderProf.length > 0 ? leaderProf[0].gender : "m") || "m";

      const newParty: PartyState = {
        party_id: newPartyId,
        party_name: party_name || "Vanguard Raid Squad",
        leader_id: leaderId,
        members: [
          {
            user_id: leaderId,
            username: leaderName,
            character_class: leaderClass,
            gender: leaderGender as "m" | "f",
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

    if (action === "invite_member") {
      if (!party_id || !invite_user_id) {
        return NextResponse.json({ error: "party_id and invite_user_id are required" }, { status: 400 });
      }

      try {
        const { data: existingInv } = await supabase
          .from("party_invites")
          .select("*")
          .eq("party_id", party_id)
          .eq("invitee_id", invite_user_id)
          .eq("status", "pending");

        if (!existingInv || existingInv.length === 0) {
          await supabase.from("party_invites").insert({
            party_id: party_id,
            inviter_id: currentUserId,
            invitee_id: invite_user_id,
            status: "pending",
          });
        }
      } catch (e) {}

      return NextResponse.json({ success: true, message: "Party invite sent!" });
    }

    if (action === "accept_party_invite") {
      if (!party_id) {
        return NextResponse.json({ error: "party_id required" }, { status: 400 });
      }

      try {
        await supabase.from("Party_Members").delete().eq("user_id", currentUserId);

        const { data: existingM } = await supabase
          .from("Party_Members")
          .select("*")
          .eq("party_id", party_id)
          .eq("user_id", currentUserId);

        if (!existingM || existingM.length === 0) {
          await supabase.from("Party_Members").insert({
            party_id: party_id,
            user_id: currentUserId,
            role: "member",
          });
        }

        if (invite_id) {
          await supabase.from("party_invites").update({ status: "accepted" }).eq("invite_id", invite_id);
        } else {
          await supabase.from("party_invites").update({ status: "accepted" }).eq("party_id", party_id).eq("invitee_id", currentUserId);
        }
      } catch (e) {}

      return NextResponse.json({ success: true, message: "Party invite accepted!" });
    }

    if (action === "decline_party_invite") {
      try {
        if (invite_id) {
          await supabase.from("party_invites").update({ status: "declined" }).eq("invite_id", invite_id);
        } else if (party_id) {
          await supabase.from("party_invites").update({ status: "declined" }).eq("party_id", party_id).eq("invitee_id", currentUserId);
        }
      } catch (e) {}

      return NextResponse.json({ success: true, message: "Party invite declined." });
    }

    if (action === "rename_party") {
      try {
        await supabase
          .from("Party")
          .update({ party_name: party_name })
          .eq("party_id", party_id);
      } catch (e) {}

      return NextResponse.json({ success: true, party_name });
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

    if (action === "disband_party") {
      try {
        if (party_id) {
          await supabase.from("party_invites").delete().eq("party_id", party_id);
          await supabase.from("Party_Members").delete().eq("party_id", party_id);
          await supabase.from("Party").delete().eq("party_id", party_id);
        }
      } catch (e) {}

      activePartyCache = null;
      return NextResponse.json({ success: true, party: null });
    }

    if (action === "kick_member" || action === "leave_party") {
      const targetId = action === "leave_party" ? currentUserId : target_user_id;

      try {
        const targetPartyId = party_id || (activePartyCache?.party_id);

        if (targetPartyId) {
          const { data: pRec } = await supabase
            .from("Party")
            .select("leader_id")
            .eq("party_id", targetPartyId)
            .limit(1);

          const isLeaderLeaving = action === "leave_party" && pRec && pRec.length > 0 && pRec[0].leader_id === currentUserId;

          if (isLeaderLeaving) {
            await supabase.from("party_invites").delete().eq("party_id", targetPartyId);
            await supabase.from("Party_Members").delete().eq("party_id", targetPartyId);
            await supabase.from("Party").delete().eq("party_id", targetPartyId);
          } else {
            await supabase
              .from("Party_Members")
              .delete()
              .eq("party_id", targetPartyId)
              .eq("user_id", targetId);

            const { data: remaining } = await supabase
              .from("Party_Members")
              .select("*")
              .eq("party_id", targetPartyId);

            if (!remaining || remaining.length === 0) {
              await supabase.from("party_invites").delete().eq("party_id", targetPartyId);
              await supabase.from("Party").delete().eq("party_id", targetPartyId);
            }
          }
        }
      } catch (e) {}

      activePartyCache = null;
      return NextResponse.json({ success: true, party: null });
    }

    return NextResponse.json(activePartyCache || { success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
