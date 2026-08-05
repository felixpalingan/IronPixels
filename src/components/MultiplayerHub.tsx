"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Swords, Search, UserPlus, Check, X, Flame, Zap, Shield, Crown, Sparkles, UserCheck, ShieldAlert, Plus, Settings, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { LeaderboardEntry, PartyLeaderboardEntry } from "@/app/api/multiplayer/leaderboard/route";
import { FriendUser } from "@/app/api/multiplayer/friends/route";
import { PartyState } from "@/app/api/multiplayer/party/route";

interface MultiplayerHubProps {
  userCp?: number;
  userLevel?: number;
  userClass?: string;
  userRvs?: number;
}

export function MultiplayerHub({
  userCp = 1250,
  userLevel = 1,
  userClass = "WARRIOR",
  userRvs = 0,
}: MultiplayerHubProps) {
  const [subTab, setSubTab] = useState<"leaderboard" | "friends" | "party">("leaderboard");
  const [lbGroup, setLbGroup] = useState<"user" | "party">("user");
  const [lbMetric, setLbMetric] = useState<"floor" | "rvs" | "streak">("floor");

  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([]);
  const [partyLeaderboardList, setPartyLeaderboardList] = useState<PartyLeaderboardEntry[]>([]);
  const [friendsData, setFriendsData] = useState<{ friends: FriendUser[]; pending: FriendUser[] }>({
    friends: [],
    pending: [],
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [party, setParty] = useState<PartyState | null>(null);
  const [partyNotice, setPartyNotice] = useState<string | null>(null);
  const [inputPartyName, setInputPartyName] = useState<string>("Iron Legion Squad");
  const [isCreatingPartyModal, setIsCreatingPartyModal] = useState<boolean>(false);

  const [inspectUser, setInspectUser] = useState<LeaderboardEntry | null>(null);
  const [inspectParty, setInspectParty] = useState<PartyLeaderboardEntry | null>(null);
  const [friendStatusMap, setFriendStatusMap] = useState<Record<string, string>>({});
  const [isEditingPartyName, setIsEditingPartyName] = useState<boolean>(false);
  const [editPartyNameInput, setEditPartyNameInput] = useState<string>("");
  const [isEditingMainPartyName, setIsEditingMainPartyName] = useState<boolean>(false);
  const [mainPartyNameInput, setMainPartyNameInput] = useState<string>("");

  const fetchLeaderboard = async (group: "user" | "party", metric: "floor" | "rvs" | "streak") => {
    const catQuery = `${group}_${metric}`;
    try {
      const res = await fetch(`/api/multiplayer/leaderboard?category=${catQuery}`);
      if (res.ok) {
        const data = await res.json();
        if (group === "party") {
          const list: PartyLeaderboardEntry[] = Array.isArray(data) ? data : [];
          if (party && !list.some((p) => p.party_id === party.party_id || p.party_name === party.party_name)) {
            const leaderMember = party.members.find((m) => m.role === "leader") || party.members[0];
            list.push({
              party_id: party.party_id,
              party_name: party.party_name,
              leader_name: leaderMember?.username || "Leader",
              member_count: party.members.length,
              total_party_floor: party.total_party_floor || 1,
              total_party_cp: party.total_party_cp || 1250,
              total_party_rvs: party.total_party_rvs || 0,
              party_streak: party.party_streak || 1,
              leader_weapon: "/assets/items/weapons/01.png",
            });
          }
          setPartyLeaderboardList(list);
        } else {
          setLeaderboardList(data);
        }
      }
    } catch (e) {}
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/multiplayer/friends");
      if (res.ok) {
        const data = await res.json();
        setFriendsData(data);
      }
    } catch (e) {}
  };

  const fetchParty = async () => {
    try {
      const res = await fetch("/api/multiplayer/party");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setParty(data);
          localStorage.setItem("ironpixels_active_party", JSON.stringify(data));
          return;
        } else {
          setParty(null);
          localStorage.removeItem("ironpixels_active_party");
          return;
        }
      }
    } catch (e) {}
    setParty(null);
  };

  useEffect(() => {
    fetchLeaderboard(lbGroup, lbMetric);
    fetchFriends();
    fetchParty();
  }, [lbGroup, lbMetric]);

  const handleSearchPlayers = async (queryStr: string) => {
    setSearchQuery(queryStr);
    if (!queryStr.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/multiplayer/friends?query=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {}
  };

  const handleFriendAction = async (targetId: string, action: string) => {
    try {
      await fetch("/api/multiplayer/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, target_user_id: targetId }),
      });
      if (action === "send_request") {
        setFriendStatusMap((prev) => ({ ...prev, [targetId]: "pending_outgoing" }));
      }
      fetchFriends();
      if (searchQuery) {
        handleSearchPlayers(searchQuery);
      }
    } catch (e) {}
  };

  const handlePartyAction = async (action: string, payload?: any) => {
    try {
      const res = await fetch("/api/multiplayer/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "leave_party") {
          setParty(null);
          localStorage.removeItem("ironpixels_active_party");
        } else {
          setParty(data);
          localStorage.setItem("ironpixels_active_party", JSON.stringify(data));
        }
        fetchLeaderboard(lbGroup, lbMetric);
      }
    } catch (e) {}
  };

  const handleCreateNewParty = async () => {
    if (!inputPartyName.trim()) return;
    await handlePartyAction("create_party", { party_name: inputPartyName.trim() });
    setIsCreatingPartyModal(false);
    setPartyNotice(`Guild Party "${inputPartyName.trim()}" successfully created!`);
    setTimeout(() => setPartyNotice(null), 3000);
  };

  const handleInviteToParty = async (friendName: string, friendId: string, friendClass: string, friendCp: number) => {
    if (!party) {
      await handlePartyAction("create_party", { party_name: inputPartyName });
    }
    await handlePartyAction("invite_member", {
      invite_user_id: friendId,
      invite_username: friendName,
      invite_class: friendClass,
      invite_cp: friendCp,
    });
    setPartyNotice(`Invited ${friendName} to your 10-Player Party!`);
    setTimeout(() => setPartyNotice(null), 3000);
  };

  const handleSaveEditedPartyName = () => {
    if (!editPartyNameInput.trim() || !inspectParty) return;
    setInspectParty({ ...inspectParty, party_name: editPartyNameInput.trim() });
    if (party) {
      setParty({ ...party, party_name: editPartyNameInput.trim() });
    }
    setIsEditingPartyName(false);
    setPartyNotice(`Guild Party name updated to "${editPartyNameInput.trim()}"!`);
    setTimeout(() => setPartyNotice(null), 3000);
  };

  const handleSaveMainPartyName = async () => {
    if (!mainPartyNameInput.trim() || !party) return;
    await handlePartyAction("rename_party", { party_name: mainPartyNameInput.trim() });
    setIsEditingMainPartyName(false);
    setPartyNotice(`Guild Party name updated to "${mainPartyNameInput.trim()}"!`);
    setTimeout(() => setPartyNotice(null), 3000);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: "bg-amber-400 text-black border-amber-300 shadow-gold-glow", icon: Crown, label: "#1 GOLD" };
    if (rank === 2) return { bg: "bg-zinc-300 text-black border-zinc-100 shadow-neon", icon: Trophy, label: "#2 SILVER" };
    if (rank === 3) return { bg: "bg-amber-700 text-amber-100 border-amber-600 shadow-red-glow", icon: Sparkles, label: "#3 BRONZE" };
    return { bg: "bg-surface text-zinc-400 border-pixel-border", icon: Shield, label: `#${rank}` };
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none relative">
      <AnimatePresence>
        {inspectUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm border-2 border-pixel-green bg-surface p-5 space-y-4 shadow-neon relative">
              <button
                onClick={() => setInspectUser(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-pixel-border pb-3">
                <div className="w-12 h-12 bg-black border border-pixel-green p-1 flex items-center justify-center shadow-neon">
                  <img
                    src={inspectUser.equipped_weapon || "/assets/items/weapons/01.png"}
                    alt="Hero Weapon"
                    className="w-full h-full object-contain pixelated"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-white uppercase">
                    {inspectUser.username}
                  </h3>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">
                    {inspectUser.character_class} &bull; LEVEL {inspectUser.level}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-black border border-pixel-border p-2 text-center">
                <div>
                  <div className="text-[9px] text-zinc-500 font-bold">MAX FLOOR</div>
                  <div className="font-headline font-black text-sm text-[#00ff41]">
                    FLOOR {inspectUser.max_floor}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-zinc-500 font-bold">DAILY RVS</div>
                  <div className="font-headline font-black text-sm text-amber-400">
                    {formatNumber(inspectUser.daily_rvs)} RVS
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-zinc-500 font-bold">STREAK</div>
                  <div className="font-headline font-black text-sm text-rose-400">
                    {inspectUser.workout_streak} DAYS
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {friendStatusMap[inspectUser.user_id] === "pending_outgoing" ? (
                  <div className="w-full py-2.5 bg-amber-950/40 border border-amber-500 text-amber-400 font-extrabold text-xs text-center uppercase">
                    FRIEND REQUEST SENT
                  </div>
                ) : (
                  <button
                    onClick={() => handleFriendAction(inspectUser.user_id, "send_request")}
                    className="w-full py-2.5 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-neon"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>ADD FRIEND</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleInviteToParty(inspectUser.username, inspectUser.user_id, inspectUser.character_class, inspectUser.combat_power);
                    setInspectUser(null);
                  }}
                  className="w-full py-2.5 border border-purple-500 bg-purple-950/40 hover:bg-purple-600 text-purple-300 hover:text-white font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>INVITE TO PARTY</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inspectParty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm border-2 border-purple-500 bg-surface p-5 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.5)] relative">
              <button
                onClick={() => setInspectParty(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-purple-900 pb-3">
                <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>GUILD PARTY PROFILE</span>
                </div>

                {isEditingPartyName ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={editPartyNameInput}
                      onChange={(e) => setEditPartyNameInput(e.target.value)}
                      className="flex-1 bg-black border border-purple-500 px-2 py-1 text-xs text-white"
                    />
                    <button
                      onClick={handleSaveEditedPartyName}
                      className="px-2 py-1 bg-purple-600 text-white text-xs font-bold"
                    >
                      SAVE
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-black text-xl text-white uppercase">
                      {inspectParty.party_name}
                    </h3>
                    {inspectParty.leader_name === "Felix" && (
                      <button
                        onClick={() => {
                          setEditPartyNameInput(inspectParty.party_name);
                          setIsEditingPartyName(true);
                        }}
                        className="text-xs text-purple-400 hover:text-white flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>EDIT</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">
                  GUILD OWNER: <span className="text-amber-400">{inspectParty.leader_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black border border-purple-900 p-2.5 text-center">
                <div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase">TOTAL PARTY FLOOR</div>
                  <div className="font-headline font-black text-sm text-[#00ff41]">
                    FLOOR {inspectParty.total_party_floor}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase">PARTY MEMBERS</div>
                  <div className="font-headline font-black text-sm text-purple-300">
                    {inspectParty.member_count} / 10 WARRIORS
                  </div>
                </div>
              </div>

              {inspectParty.leader_name === "Felix" ? (
                <div className="border border-purple-500/60 bg-purple-950/30 p-3 space-y-2">
                  <div className="text-[10px] text-purple-300 font-extrabold uppercase flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" />
                    <span>OWNER PARTY SETTINGS</span>
                  </div>
                  <div className="text-[9px] text-zinc-400">
                    You are the Guild Leader of this Party. You can rename the party, manage member slots, or kick players.
                  </div>
                  <button
                    onClick={() => {
                      handlePartyAction("leave_party");
                      setInspectParty(null);
                    }}
                    className="w-full py-2 bg-red-950/60 border border-red-600 text-red-400 font-bold text-xs uppercase hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                  >
                    DISBAND GUILD PARTY
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPartyNotice(`Join request sent to Party Leader ${inspectParty.leader_name}!`);
                    setTimeout(() => setPartyNotice(null), 3000);
                    setInspectParty(null);
                  }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-headline font-bold text-xs uppercase tracking-wider shadow-neon cursor-pointer"
                >
                  REQUEST TO JOIN PARTY
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border border-pixel-border bg-surface p-3 flex items-center justify-between shadow-neon">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 border border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41] flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="font-headline font-black text-sm text-white uppercase tracking-wider">
              MULTIPLAYER REALM & GUILDS
            </div>
            <div className="text-[10px] text-zinc-400 font-bold">
              RANKINGS, FRIENDS & 10-PLAYER PARTIES
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingPartyModal(true)}
          className="px-2.5 py-1.5 border border-purple-500 bg-purple-950/60 hover:bg-purple-600 text-purple-300 hover:text-white font-headline font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>CREATE PARTY</span>
        </button>
      </div>

      {partyNotice && (
        <div className="bg-[#00ff41]/20 border border-[#00ff41] p-2.5 text-xs font-bold text-[#00ff41] text-center shadow-neon animate-pulse">
          {partyNotice}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 bg-surface border border-pixel-border p-1">
        <button
          onClick={() => setSubTab("leaderboard")}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold transition-all ${
            subTab === "leaderboard"
              ? "bg-gold-loot text-black shadow-gold-glow"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>LEADERBOARD</span>
        </button>

        <button
          onClick={() => setSubTab("friends")}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold transition-all relative ${
            subTab === "friends"
              ? "bg-[#00ff41] text-black shadow-neon"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>FRIENDS</span>
          {friendsData.pending.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
              {friendsData.pending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab("party")}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold transition-all ${
            subTab === "party"
              ? "bg-health-red text-white shadow-red-glow"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>PARTY RAID</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === "leaderboard" && (
          <motion.div
            key="lb"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-1 bg-surface border border-pixel-border p-1">
              <button
                onClick={() => setLbGroup("user")}
                className={`py-2 text-xs font-headline font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  lbGroup === "user"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>SOLO WARRIORS (USER)</span>
              </button>

              <button
                onClick={() => setLbGroup("party")}
                className={`py-2 text-xs font-headline font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  lbGroup === "party"
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>GUILD PARTIES (PARTY)</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-black border border-pixel-border p-1">
              <button
                onClick={() => setLbMetric("floor")}
                className={`py-1.5 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                  lbMetric === "floor"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Swords className="w-3 h-3" />
                <span>TOP FLOOR</span>
              </button>

              <button
                onClick={() => setLbMetric("rvs")}
                className={`py-1.5 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                  lbMetric === "rvs"
                    ? "bg-amber-400 text-black shadow-gold-glow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>DAILY RVS</span>
              </button>

              <button
                onClick={() => setLbMetric("streak")}
                className={`py-1.5 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                  lbMetric === "streak"
                    ? "bg-rose-500 text-white shadow-red-glow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>STREAK</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {lbGroup === "party" ? (
                partyLeaderboardList.map((entry, idx) => {
                  const rank = idx + 1;
                  const badge = getRankBadge(rank);
                  const BadgeIcon = badge.icon;

                  return (
                    <div
                      key={entry.party_id}
                      onClick={() => setInspectParty(entry)}
                      className="border border-purple-500/60 bg-purple-950/20 p-3 flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:border-purple-400 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 border flex items-center justify-center font-extrabold text-xs ${badge.bg}`}
                        >
                          <BadgeIcon className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-2">
                          {entry.leader_weapon && (
                            <div className="w-8 h-8 bg-black border border-purple-800 p-0.5 flex items-center justify-center">
                              <img
                                src={entry.leader_weapon}
                                alt="Weapon"
                                className="w-full h-full object-contain pixelated"
                              />
                            </div>
                          )}

                          <div>
                            <div className="font-headline font-extrabold text-xs text-purple-300 flex items-center gap-1.5 uppercase">
                              <span>{entry.party_name}</span>
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold">
                              Leader: {entry.leader_name} &bull; {entry.member_count}/10 Members
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {lbMetric === "floor" && (
                          <div className="font-headline font-black text-sm text-[#00ff41]">
                            FLOOR {entry.total_party_floor}
                          </div>
                        )}
                        {lbMetric === "rvs" && (
                          <div className="font-headline font-black text-sm text-amber-400">
                            {formatNumber(entry.total_party_rvs)} RVS
                          </div>
                        )}
                        {lbMetric === "streak" && (
                          <div className="font-headline font-black text-sm text-rose-400 flex items-center gap-1 justify-end">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{entry.party_streak} DAYS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                leaderboardList.map((entry, idx) => {
                  const rank = idx + 1;
                  const badge = getRankBadge(rank);
                  const BadgeIcon = badge.icon;

                  return (
                    <div
                      key={entry.user_id}
                      onClick={() => setInspectUser(entry)}
                      className={`border border-pixel-border bg-surface p-3 flex items-center justify-between transition-all hover:border-[#00ff41] cursor-pointer ${
                        rank <= 3 ? "shadow-neon border-pixel-green/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 border flex items-center justify-center font-extrabold text-xs ${badge.bg}`}
                        >
                          <BadgeIcon className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-2">
                          {entry.equipped_weapon && (
                            <div className="w-8 h-8 bg-black border border-pixel-border p-0.5 flex items-center justify-center">
                              <img
                                src={entry.equipped_weapon}
                                alt="Weapon"
                                className="w-full h-full object-contain pixelated"
                              />
                            </div>
                          )}

                          <div>
                            <div className="font-headline font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{entry.username}</span>
                              <span className="text-[9px] text-zinc-400 font-normal">
                                Lv.{entry.level}
                              </span>
                            </div>
                            <div className="text-[9px] text-zinc-500 uppercase font-bold">
                              {entry.character_class}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {lbMetric === "floor" && (
                          <div className="font-headline font-black text-sm text-[#00ff41]">
                            FLOOR {entry.max_floor}
                          </div>
                        )}
                        {lbMetric === "rvs" && (
                          <div className="font-headline font-black text-sm text-amber-400">
                            {formatNumber(entry.daily_rvs)} RVS
                          </div>
                        )}
                        {lbMetric === "streak" && (
                          <div className="font-headline font-black text-sm text-rose-400 flex items-center gap-1 justify-end">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{entry.workout_streak} DAYS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {subTab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search players by username..."
                value={searchQuery}
                onChange={(e) => handleSearchPlayers(e.target.value)}
                className="w-full bg-black border border-pixel-border focus:border-[#00ff41] px-3 py-2.5 pl-9 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => handleSearchPlayers("")}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSearching ? (
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  SEARCH RESULTS ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="border border-dashed border-pixel-border p-4 text-center text-xs text-zinc-500">
                    No players found matching "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      className="border border-pixel-border bg-surface p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-black border border-pixel-border p-0.5 flex items-center justify-center">
                          <img
                            src={user.weapon_icon || "/assets/items/weapons/01.png"}
                            alt="Weapon"
                            className="w-full h-full object-contain pixelated"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">
                            {user.username} (Lv.{user.level})
                          </div>
                          <div className="text-[9px] text-zinc-400 font-bold">
                            {user.character_class} &bull; {formatNumber(user.combat_power)} CP
                          </div>
                        </div>
                      </div>

                      {user.status === "friend" ? (
                        <div className="px-2.5 py-1 bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41] font-bold text-[10px] uppercase flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>FRIEND</span>
                        </div>
                      ) : user.status.startsWith("pending") || friendStatusMap[user.user_id] === "pending_outgoing" ? (
                        <div className="px-2.5 py-1 bg-amber-950/40 border border-amber-500 text-amber-400 font-bold text-[10px] uppercase">
                          PENDING
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFriendAction(user.user_id, "send_request")}
                          className="px-2.5 py-1 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black font-bold text-[10px] uppercase flex items-center gap-1 transition-all cursor-pointer shadow-neon"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>ADD</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {friendsData.pending.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>PENDING FRIEND REQUESTS ({friendsData.pending.length})</span>
                    </div>

                    {friendsData.pending.map((req) => (
                      <div
                        key={req.user_id}
                        className="border border-amber-500/60 bg-amber-950/20 p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-white">
                            {req.username} (Lv.{req.level})
                          </div>
                          <div className="text-[9px] text-zinc-400 font-bold">
                            {req.character_class} &bull; {formatNumber(req.combat_power)} CP
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleFriendAction(req.user_id, "accept_request")}
                            className="px-2 py-1 bg-[#00ff41] text-black font-bold text-[10px] uppercase shadow-neon cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>ACCEPT</span>
                          </button>
                          <button
                            onClick={() => handleFriendAction(req.user_id, "reject_request")}
                            className="px-2 py-1 bg-red-950 border border-red-600 text-red-400 font-bold text-[10px] uppercase cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-[10px] text-[#00ff41] font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>MY FRIENDS LIST ({friendsData.friends.length})</span>
                    <span className="text-zinc-500 text-[9px]">ACTIVE WARRIORS</span>
                  </div>

                  {friendsData.friends.length === 0 ? (
                    <div className="border border-dashed border-pixel-border p-6 text-center text-xs text-zinc-500 space-y-2">
                      <Users className="w-6 h-6 mx-auto text-zinc-600" />
                      <div>YOU HAVE NO FRIENDS ADDED YET.</div>
                      <div className="text-[10px] text-zinc-600">
                        Use the search bar above to find gym friends by username!
                      </div>
                    </div>
                  ) : (
                    friendsData.friends.map((friend) => (
                      <div
                        key={friend.user_id}
                        className="border border-pixel-border bg-surface p-3 flex items-center justify-between hover:border-[#00ff41] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-black border border-pixel-border p-0.5 flex items-center justify-center">
                            <img
                              src={friend.weapon_icon || "/assets/items/weapons/01.png"}
                              alt="Weapon"
                              className="w-full h-full object-contain pixelated"
                            />
                          </div>

                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-2">
                              <span>{friend.username}</span>
                              <span className="text-[9px] bg-[#00ff41]/20 border border-[#00ff41]/60 text-[#00ff41] px-1 py-0.2 font-extrabold">
                                ONLINE
                              </span>
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold">
                              Lv.{friend.level} {friend.character_class} &bull; {formatNumber(friend.combat_power)} CP
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInviteToParty(friend.username, friend.user_id, friend.character_class, friend.combat_power)}
                          className="px-2.5 py-1 border border-purple-500 bg-purple-950/40 hover:bg-purple-600 text-purple-300 hover:text-white font-bold text-[10px] uppercase flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Swords className="w-3 h-3" />
                          <span>PARTY</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {subTab === "party" && (
          <motion.div
            key="party"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {party ? (
              <div className="border-2 border-purple-500 bg-surface p-4 space-y-4 shadow-[0_0_25px_rgba(168,85,247,0.4)] relative">
                <div className="flex items-start justify-between border-b border-purple-900 pb-3">
                  <div>
                    <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>ACTIVE GUILD PARTY (MAX 10 WARRIORS)</span>
                    </div>

                    {isEditingMainPartyName ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={mainPartyNameInput}
                          onChange={(e) => setMainPartyNameInput(e.target.value)}
                          className="bg-black border border-purple-500 focus:border-purple-300 px-2 py-1 text-xs text-white outline-none"
                          placeholder="Enter new party name..."
                        />
                        <button
                          onClick={handleSaveMainPartyName}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase cursor-pointer"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setIsEditingMainPartyName(false)}
                          className="px-2 py-1 bg-zinc-800 text-zinc-300 font-bold text-xs uppercase cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <h3 className="font-headline font-black text-xl text-white uppercase">
                          {party.party_name}
                        </h3>
                        {party.members.some(
                          (m) =>
                            m.user_id === "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c" &&
                            (m.role === "leader" || m.role === "co_leader")
                        ) && (
                          <button
                            onClick={() => {
                              setMainPartyNameInput(party.party_name);
                              setIsEditingMainPartyName(true);
                            }}
                            className="px-2 py-0.5 bg-purple-950/60 border border-purple-500 hover:bg-purple-600 text-purple-300 hover:text-white text-[10px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>RENAME</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {party.members.some(
                      (m) => m.user_id === "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c" && m.role === "leader"
                    ) && (
                      <button
                        onClick={() => handlePartyAction("leave_party")}
                        className="px-2.5 py-1 bg-red-950 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase transition-all cursor-pointer"
                        title="Disband Party as Leader"
                      >
                        DISBAND PARTY
                      </button>
                    )}

                    <button
                      onClick={() => handlePartyAction("leave_party")}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      LEAVE PARTY
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-black border border-purple-900 p-3 text-center">
                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">COMBINED PARTY CP</div>
                    <div className="font-headline font-black text-base text-[#00ff41]">
                      {formatNumber(party.total_party_cp)} CP
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">PARTY MEMBERS</div>
                    <div className="font-headline font-black text-base text-purple-300">
                      {party.members.length} / 10 WARRIORS
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>PARTY ROSTER ({party.members.length}/10)</span>
                    <span className="text-zinc-500 text-[9px]">SHARED HEALTH & CP</span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {party.members.map((member, idx) => (
                      <div
                        key={member.user_id}
                        className="bg-black/60 border border-purple-900/60 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {idx === 0 ? (
                            <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          ) : (
                            <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{member.username}</span>
                              {member.role === "leader" || idx === 0 ? (
                                <span className="text-[8px] bg-amber-400 text-black px-1 font-extrabold">
                                  LEADER
                                </span>
                              ) : member.role === "co_leader" ? (
                                <span className="text-[8px] bg-purple-500 text-white px-1 font-extrabold">
                                  CO-LEADER
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold">
                              {member.character_class} &bull; {formatNumber(member.combat_power)} CP
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {member.user_id !== "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c" && (
                            <div className="flex items-center gap-1">
                              {member.role === "co_leader" ? (
                                <button
                                  onClick={() => handlePartyAction("update_role", { target_user_id: member.user_id, new_role: "member" })}
                                  className="px-1.5 py-0.5 border border-amber-500 bg-amber-950/60 hover:bg-amber-500 hover:text-black text-amber-300 text-[8px] font-extrabold uppercase transition-all cursor-pointer"
                                  title="Demote to Member"
                                >
                                  DEMOTE
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePartyAction("update_role", { target_user_id: member.user_id, new_role: "co_leader" })}
                                  className="px-1.5 py-0.5 border border-purple-500 bg-purple-950/60 hover:bg-purple-600 text-purple-300 hover:text-white text-[8px] font-extrabold uppercase transition-all cursor-pointer"
                                  title="Promote to Second-in-Command"
                                >
                                  + CO-LEADER
                                </button>
                              )}

                              <button
                                onClick={() => handlePartyAction("kick_member", { target_user_id: member.user_id })}
                                className="px-1.5 py-0.5 border border-red-600 bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white text-[8px] font-extrabold uppercase transition-all cursor-pointer"
                                title="Kick Member from Party"
                              >
                                KICK
                              </button>
                            </div>
                          )}

                          <div className="text-[10px] text-[#00ff41] font-bold">
                            ONLINE
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-pixel-border bg-surface p-6 text-center space-y-4">
                <Shield className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />

                <div>
                  <h3 className="font-headline font-black text-base text-white uppercase">
                    NO GUILD PARTY JOINED YET
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    Form a 10-player Guild Party with your gym friends to combine your Combat Power and defeat mega raid bosses together!
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingPartyModal(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-headline font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer transition-all"
                >
                  CREATE A 10-PLAYER GUILD PARTY
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatingPartyModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm border-2 border-purple-500 bg-surface p-5 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.5)] relative">
              <button
                onClick={() => setIsCreatingPartyModal(false)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="font-headline font-black text-lg text-purple-300 uppercase">
                  CREATE GUILD PARTY
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Set a name for your 10-Player Guild Squad.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">GUILD PARTY NAME</label>
                <input
                  type="text"
                  value={inputPartyName}
                  onChange={(e) => setInputPartyName(e.target.value)}
                  className="w-full bg-black border border-purple-500 focus:border-purple-300 px-3 py-2 text-xs text-white outline-none"
                  placeholder="e.g. Apex Cyber Vanguard"
                />
              </div>

              <button
                onClick={handleCreateNewParty}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-headline font-extrabold text-xs uppercase tracking-wider shadow-neon cursor-pointer"
              >
                CREATE PARTY (MAX 10 WARRIORS)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
