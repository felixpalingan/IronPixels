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
  const [lbMetric, setLbMetric] = useState<"cp" | "rvs" | "streak">("cp");

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

  const fetchLeaderboard = async (group: "user" | "party", metric: "cp" | "rvs" | "streak") => {
    const catQuery = `${group}_${metric}`;
    try {
      const res = await fetch(`/api/multiplayer/leaderboard?category=${catQuery}`);
      if (res.ok) {
        const data = await res.json();
        if (group === "party") {
          setPartyLeaderboardList(data);
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
        setParty(data);
      }
    } catch (e) {}
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
        } else {
          setParty(data);
        }
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
    setPartyNotice(`Invited ${friendName} to your 4-Player Party!`);
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
                  {inspectUser.equipped_weapon ? (
                    <img src={inspectUser.equipped_weapon} alt="Weapon" className="w-full h-full object-contain pixelated" />
                  ) : (
                    <Trophy className="w-6 h-6 text-pixel-green" />
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-pixel-green font-extrabold uppercase tracking-widest">
                    WARRIOR PROFILE
                  </div>
                  <h3 className="font-headline font-black text-xl text-white">
                    {inspectUser.username}
                  </h3>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">
                    {inspectUser.character_class} &bull; Lv. {inspectUser.level}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-black border border-pixel-border p-2 text-center">
                <div>
                  <div className="text-[9px] text-zinc-500 font-bold">COMBAT POWER</div>
                  <div className="font-headline font-black text-sm text-[#00ff41]">
                    {formatNumber(inspectUser.combat_power)} CP
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
                    handleInviteToParty(
                      inspectUser.username,
                      inspectUser.user_id,
                      inspectUser.character_class,
                      inspectUser.combat_power
                    );
                    setInspectUser(null);
                  }}
                  className="w-full py-2.5 border border-purple-500 bg-purple-950/40 hover:bg-purple-600 text-purple-300 hover:text-white font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
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
                  <div className="text-[9px] text-zinc-500 font-bold uppercase">COMBINED PARTY CP</div>
                  <div className="font-headline font-black text-sm text-[#00ff41]">
                    {formatNumber(inspectParty.total_party_cp)} CP
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase">PARTY MEMBERS</div>
                  <div className="font-headline font-black text-sm text-purple-300">
                    {inspectParty.member_count} / 4 WARRIORS
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
                    setInspectParty(null);
                    setTimeout(() => setPartyNotice(null), 3000);
                  }}
                  className="w-full py-3 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-neon"
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
          <div className="w-9 h-9 border border-pixel-green bg-pixel-green/10 text-pixel-green flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="font-headline font-black text-sm text-white uppercase tracking-wider">
              MULTIPLAYER REALM
            </div>
            <div className="text-[10px] text-zinc-400 font-bold">
              FRIENDS, PARTY RAIDS & 6 LEADERBOARDS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black border border-pixel-green/60 px-2.5 py-1 text-pixel-green text-xs font-bold shadow-neon">
          <Zap className="w-3.5 h-3.5" />
          <span>{formatNumber(userCp)} CP</span>
        </div>
      </div>

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
                onClick={() => setLbMetric("cp")}
                className={`py-1.5 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                  lbMetric === "cp"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>TOP CP</span>
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
                              Leader: {entry.leader_name} &bull; {entry.member_count}/4 Members
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {lbMetric === "cp" && (
                          <div className="font-headline font-black text-sm text-[#00ff41]">
                            {formatNumber(entry.total_party_cp)} CP
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
                        {lbMetric === "cp" && (
                          <div className="font-headline font-black text-sm text-[#00ff41]">
                            {formatNumber(entry.combat_power)} CP
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
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchPlayers(e.target.value)}
                placeholder="Search player username to add..."
                className="w-full pl-9 pr-4 py-2.5 bg-black border border-pixel-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            {isSearching && (
              <div className="space-y-2 border border-pixel-border bg-surface p-3">
                <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                  SEARCH RESULTS ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic">No warriors found matching "{searchQuery}"</div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      className="border border-pixel-border bg-black p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{user.username}</span>
                          <span className="text-[9px] text-[#00ff41]">Lv.{user.level}</span>
                        </div>
                        <div className="text-[9px] text-zinc-400">{user.character_class} ({formatNumber(user.combat_power)} CP)</div>
                      </div>

                      {user.status === "friend" ? (
                        <span className="text-[10px] text-pixel-green font-bold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          FRIENDS
                        </span>
                      ) : user.status === "pending_outgoing" ? (
                        <span className="text-[10px] text-amber-400 font-bold">REQUEST SENT</span>
                      ) : (
                        <button
                          onClick={() => handleFriendAction(user.user_id, "send_request")}
                          className="px-2.5 py-1 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-[#00ff41] hover:text-black cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          ADD FRIEND
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {friendsData.pending.length > 0 && (
              <div className="border border-amber-500/60 bg-amber-950/20 p-3 space-y-2">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  PENDING FRIEND REQUESTS ({friendsData.pending.length})
                </div>
                {friendsData.pending.map((req) => (
                  <div
                    key={req.user_id}
                    className="border border-amber-500/40 bg-black/80 p-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{req.username}</div>
                      <div className="text-[9px] text-zinc-400">{req.character_class} ({formatNumber(req.combat_power)} CP)</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleFriendAction(req.user_id, "accept_request")}
                        className="px-2 py-1 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-[#00ff41] hover:text-black cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        ACCEPT
                      </button>
                      <button
                        onClick={() => handleFriendAction(req.user_id, "reject_request")}
                        className="px-2 py-1 border border-red-500 bg-red-950/40 text-red-400 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-red-600 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                MY FRIENDS ({friendsData.friends.length})
              </div>

              {friendsData.friends.length === 0 ? (
                <div className="text-xs text-zinc-500 italic p-4 text-center border border-dashed border-pixel-border">
                  No friends added yet. Use the search bar above to invite warriors!
                </div>
              ) : (
                friendsData.friends.map((friend) => (
                  <div
                    key={friend.user_id}
                    className="border border-pixel-border bg-surface p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {friend.weapon_icon && (
                        <div className="w-9 h-9 bg-black border border-pixel-border p-1 flex items-center justify-center">
                          <img
                            src={friend.weapon_icon}
                            alt="Weapon"
                            className="w-full h-full object-contain pixelated"
                          />
                        </div>
                      )}

                      <div>
                        <div className="font-headline font-bold text-xs text-white flex items-center gap-2">
                          <span>{friend.username}</span>
                          <span className="text-[9px] text-[#00ff41] font-bold">
                            Lv.{friend.level}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-400 font-bold">
                          {friend.character_class} &bull; {formatNumber(friend.combat_power)} CP
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInviteToParty(friend.username, friend.user_id, friend.character_class, friend.combat_power)}
                      className="px-2.5 py-1 border border-[#00ff41] bg-[#00ff41]/10 hover:bg-[#00ff41] text-[#00ff41] hover:text-black text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-neon"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>INVITE TO PARTY</span>
                    </button>
                  </div>
                ))
              )}
            </div>
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
            {partyNotice && (
              <div className="bg-[#00ff41]/20 border border-[#00ff41] p-2 text-xs font-bold text-[#00ff41] text-center animate-pulse">
                {partyNotice}
              </div>
            )}

            {isCreatingPartyModal && (
              <div className="border border-[#00ff41] bg-surface p-4 space-y-3 shadow-neon">
                <div className="text-xs text-[#00ff41] font-extrabold uppercase tracking-wider">
                  CREATE CUSTOM GUILD PARTY
                </div>
                <input
                  type="text"
                  value={inputPartyName}
                  onChange={(e) => setInputPartyName(e.target.value)}
                  placeholder="Enter Party Guild Name..."
                  className="w-full px-3 py-2 bg-black border border-pixel-border text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewParty}
                    className="flex-1 py-2 bg-[#00ff41] text-black font-extrabold text-xs uppercase shadow-neon cursor-pointer"
                  >
                    CONFIRM & CREATE
                  </button>
                  <button
                    onClick={() => setIsCreatingPartyModal(false)}
                    className="px-3 py-2 border border-zinc-700 bg-black text-zinc-400 text-xs font-bold uppercase cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {!party ? (
              <div className="border border-pixel-border bg-surface p-6 text-center space-y-4 shadow-neon">
                <div className="w-14 h-14 border border-red-500 bg-red-950/40 text-red-400 flex items-center justify-center mx-auto shadow-red-glow">
                  <Swords className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-headline font-extrabold text-xl text-white uppercase tracking-wider">
                    NO ACTIVE RAID PARTY
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Assemble a 4-Player Guild Party to tackle World Boss Raids with combined Combat Power!
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingPartyModal(true)}
                  className="w-full py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer"
                >
                  CREATE 4-PLAYER PARTY
                </button>
              </div>
            ) : (
              <div className="border-2 border-red-600 bg-surface p-4 space-y-4 shadow-red-glow">
                <div className="flex items-center justify-between border-b border-red-900 pb-2">
                  <div>
                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">
                      ACTIVE RAID SQUAD (4-SLOT MAX)
                    </span>
                    <h3 className="font-headline font-black text-lg text-white uppercase">
                      {party.party_name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">COMBINED PARTY CP</div>
                    <div className="font-headline font-black text-base text-[#00ff41]">
                      {formatNumber(party.total_party_cp)} CP
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {party.members.map((member) => (
                    <div
                      key={member.user_id}
                      className="border border-pixel-border bg-black p-2.5 flex items-center gap-2 relative"
                    >
                      <div className="w-8 h-8 bg-surface border border-pixel-border flex items-center justify-center p-0.5">
                        {member.weapon_icon ? (
                          <img src={member.weapon_icon} alt="Weapon" className="w-full h-full object-contain pixelated" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#00ff41]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[11px] text-white truncate flex items-center gap-1">
                          <span>{member.username}</span>
                          {member.role === "leader" && (
                            <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[9px] text-[#00ff41] font-bold">
                          {formatNumber(member.combat_power)} CP
                        </div>
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, 4 - party.members.length) }).map((_, emptyIdx) => (
                    <div
                      key={emptyIdx}
                      className="border border-dashed border-zinc-800 bg-black/40 p-2.5 flex items-center justify-center text-center"
                    >
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">
                        EMPTY SLOT #{party.members.length + emptyIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSubTab("friends")}
                    className="flex-1 py-2.5 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-neon"
                  >
                    + INVITE FRIENDS
                  </button>

                  <button
                    onClick={() => handlePartyAction("leave_party")}
                    className="py-2.5 px-4 border border-red-600 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white font-headline font-bold text-xs uppercase transition-all cursor-pointer"
                  >
                    LEAVE PARTY
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
