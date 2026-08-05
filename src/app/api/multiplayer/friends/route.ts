import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface FriendUser {
  user_id: string;
  username: string;
  character_class: string;
  gender?: string;
  level: number;
  combat_power: number;
  status: "friend" | "pending_incoming" | "pending_outgoing" | "none";
  weapon_icon?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase() || "";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    if (query) {
      const { data: dbProfiles } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${query}%`)
        .neq("id", currentUserId);

      const results: FriendUser[] = (dbProfiles || []).map((prof: any) => {
        const cp =
          (prof.level || 1) * 100 +
          (prof.str || 85) * 3.5 +
          (prof.agi || 70) * 2.5 +
          (prof.vit || 60) * 2.5;

        return {
          user_id: prof.id || prof.user_id,
          username: prof.username || "Warrior",
          character_class: prof.character_class || "WARRIOR",
          gender: prof.gender || "m",
          level: prof.level || 1,
          combat_power: Math.round(cp),
          status: "none",
          weapon_icon: "/assets/items/weapons/01.png",
        };
      });

      return NextResponse.json(results);
    }

    const { data: dbFriends } = await supabase
      .from("friends")
      .select("*")
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    const friendIds = (dbFriends || [])
      .filter((f: any) => f.status === "accepted")
      .map((f: any) => (f.user_id === currentUserId ? f.friend_id : f.user_id));

    const pendingIds = (dbFriends || [])
      .filter((f: any) => f.status === "pending")
      .map((f: any) => (f.user_id === currentUserId ? f.friend_id : f.user_id));

    let friendsList: FriendUser[] = [];
    let pendingList: FriendUser[] = [];

    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds);

      friendsList = (friendProfiles || []).map((prof: any) => {
        const cp = (prof.level || 1) * 100 + (prof.str || 85) * 3.5 + (prof.agi || 70) * 2.5 + (prof.vit || 60) * 2.5;
        return {
          user_id: prof.id,
          username: prof.username || "Warrior",
          character_class: prof.character_class || "WARRIOR",
          gender: prof.gender || "m",
          level: prof.level || 1,
          combat_power: Math.round(cp),
          status: "friend",
          weapon_icon: "/assets/items/weapons/01.png",
        };
      });
    }

    if (pendingIds.length > 0) {
      const { data: pendingProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", pendingIds);

      pendingList = (pendingProfiles || []).map((prof: any) => {
        const cp = (prof.level || 1) * 100 + (prof.str || 85) * 3.5 + (prof.agi || 70) * 2.5 + (prof.vit || 60) * 2.5;
        return {
          user_id: prof.id,
          username: prof.username || "Warrior",
          character_class: prof.character_class || "WARRIOR",
          gender: prof.gender || "m",
          level: prof.level || 1,
          combat_power: Math.round(cp),
          status: "pending_incoming",
          weapon_icon: "/assets/items/weapons/01.png",
        };
      });
    }

    return NextResponse.json({
      friends: friendsList,
      pending: pendingList,
    });
  } catch (e) {
    return NextResponse.json({ friends: [], pending: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { action, target_user_id } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c";

    if (action === "send_request") {
      try {
        await supabase.from("friends").insert({
          user_id: currentUserId,
          friend_id: target_user_id,
          status: "pending",
        });
      } catch (e) {}
      return NextResponse.json({ success: true, status: "pending_outgoing" });
    }

    if (action === "accept_request") {
      try {
        await supabase
          .from("friends")
          .update({ status: "accepted" })
          .or(`and(user_id.eq.${target_user_id},friend_id.eq.${currentUserId}),and(user_id.eq.${currentUserId},friend_id.eq.${target_user_id})`);
      } catch (e) {}
      return NextResponse.json({ success: true, status: "friend" });
    }

    if (action === "remove_friend" || action === "reject_request") {
      try {
        await supabase
          .from("friends")
          .delete()
          .or(`and(user_id.eq.${target_user_id},friend_id.eq.${currentUserId}),and(user_id.eq.${currentUserId},friend_id.eq.${target_user_id})`);
      } catch (e) {}
      return NextResponse.json({ success: true, status: "none" });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
