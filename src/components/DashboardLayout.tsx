"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, Coins, Swords, Dumbbell, ShieldAlert, HeartPulse, X, Zap, Award, ArrowRight, History, Trophy, Crown, Shield, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { PixelAvatar } from "@/components/PixelAvatar";
import { StatRadarChart } from "@/components/StatRadarChart";
import { EquippedGearGrid } from "@/components/EquippedGearGrid";
import { WorkoutTrackerForm } from "@/components/WorkoutTrackerForm";
import { WorkoutHistoryList } from "@/components/WorkoutHistoryList";
import { CombatArena } from "@/components/CombatArena";
import { BottomNav } from "@/components/BottomNav";
import { SettingsModal } from "@/components/SettingsModal";
import { BlacksmithShop } from "@/components/BlacksmithShop";
import { InventoryGrid } from "@/components/InventoryGrid";
import { DailyQuestsWidget } from "@/components/DailyQuestsWidget";
import { MultiplayerHub } from "@/components/MultiplayerHub";
import { AnalyticsView } from "@/components/AnalyticsView";
import { EQUIPMENT_DICTIONARY, InventoryRecord, ItemType } from "@/lib/equipment";

interface UserProfileData {
  user_id: string;
  username: string;
  character_class: string;
  gender?: "m" | "f";
  level: number;
  current_hp: number;
  max_hp: number;
  exp: number;
  max_exp: number;
  gold: number;
  weight_kg: number;
  available_ap?: number;
  stats: {
    str: number;
    agi: number;
    vit: number;
    luk: number;
  };
}

export function DashboardLayout() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("hub");
  const [subView, setSubView] = useState<"workout" | "history" | "combat">("workout");
  const [lastSessionDamage, setLastSessionDamage] = useState<number>(0);
  const [dailyRvs, setDailyRvs] = useState<number>(0);
  const [availableAp, setAvailableAp] = useState<number>(5);
  const [sessionVictoryModal, setSessionVictoryModal] = useState<{
    totalRvs: number;
    totalVolume: number;
    healedHp: number;
  } | null>(null);
  const [bossAttackModal, setBossAttackModal] = useState<{
    damageDealt: number;
    bossName: string;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const INITIAL_INVENTORY: InventoryRecord[] = [];

  const [userInventory, setUserInventory] = useState<InventoryRecord[]>(INITIAL_INVENTORY);
  const [userGold, setUserGold] = useState<number>(500);
  const [topWarriors, setTopWarriors] = useState<any[]>([]);
  const [topParties, setTopParties] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRvsKey = `ironpixels_daily_rvs_${todayStr}`;
  const bossCheckKey = `ironpixels_boss_check_${todayStr}`;

  useEffect(() => {
    try {
      const savedRvs = localStorage.getItem(todayRvsKey);
      if (savedRvs) {
        setDailyRvs(Number(savedRvs));
      }

      const savedAp = localStorage.getItem("ironpixels_available_ap");
      if (savedAp !== null) {
        setAvailableAp(Number(savedAp));
      }
    } catch (e) {}

    const localProf = localStorage.getItem("ironpixels_profile");
    let currentProf: UserProfileData | null = null;
    if (localProf) {
      try {
        const parsedProf = JSON.parse(localProf);
        if (parsedProf) {
          currentProf = parsedProf;
          setProfile(parsedProf);
          setUserGold(parsedProf.gold ?? 500);
          if (parsedProf.available_ap !== undefined) setAvailableAp(parsedProf.available_ap);
        }
      } catch (e) {}
    }

    const localInv = localStorage.getItem("ironpixels_inventory");
    if (localInv) {
      try {
        const parsedInv = JSON.parse(localInv);
        if (Array.isArray(parsedInv) && parsedInv.length > 0) {
          setUserInventory(parsedInv);
        }
      } catch (e) {}
    }

    async function fetchData() {
      try {
        const resProf = await fetch("/api/user/profile");
        if (resProf.ok) {
          const dataProf = await resProf.json();
          setProfile(dataProf);
          currentProf = dataProf;
          localStorage.setItem("ironpixels_profile", JSON.stringify(dataProf));
          setUserGold(dataProf.gold ?? 500);
          if (dataProf.available_ap !== undefined) setAvailableAp(dataProf.available_ap);
        }

        const resInv = await fetch("/api/user/inventory");
        if (resInv.ok) {
          const dataInv = await resInv.json();
          if (Array.isArray(dataInv) && dataInv.length > 0) {
            setUserInventory(dataInv);
            localStorage.setItem("ironpixels_inventory", JSON.stringify(dataInv));
          }
        }

        const resLead = await fetch("/api/multiplayer/leaderboard?category=user_floor");
        if (resLead.ok) {
          const dataLead = await resLead.json();
          if (Array.isArray(dataLead)) setTopWarriors(dataLead.slice(0, 3));
        }

        const resPartyLead = await fetch("/api/multiplayer/leaderboard?category=party_floor");
        if (resPartyLead.ok) {
          const dataPartyLead = await resPartyLead.json();
          if (Array.isArray(dataPartyLead)) setTopParties(dataPartyLead.slice(0, 3));
        }
      } catch (err) {}

      try {
        const hasCheckedToday = localStorage.getItem(bossCheckKey);
        if (!hasCheckedToday) {
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
          const yesterdayRvs = localStorage.getItem(`ironpixels_daily_rvs_${yesterdayStr}`);

          if (!yesterdayRvs || Number(yesterdayRvs) === 0) {
            const BOSS_PENALTY_DMG = 250;
            setBossAttackModal({
              damageDealt: BOSS_PENALTY_DMG,
              bossName: "Demon Lord Ignis",
            });

            if (currentProf) {
              const newHp = Math.max(50, currentProf.current_hp - BOSS_PENALTY_DMG);
              const updatedProf = { ...currentProf, current_hp: newHp };
              setProfile(updatedProf);
              localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));
            }
          }
          localStorage.setItem(bossCheckKey, "true");
        }
      } catch (e) {}
    }

    fetchData();
  }, [todayRvsKey, bossCheckKey]);

  const baseStats = profile?.stats || { str: 85, agi: 72, vit: 54, luk: 60 };
  const baseMaxHp = profile?.max_hp || 1000;

  const weaponEquipped = userInventory.find((rec) => rec.is_equipped && rec.item?.type === "weapon");
  const armorEquipped = userInventory.find((rec) => rec.is_equipped && rec.item?.type === "armor");
  const accsEquipped = userInventory.filter((rec) => rec.is_equipped && rec.item?.type === "accessory").slice(0, 2);

  const activeFourSlotEquipped = [
    weaponEquipped,
    armorEquipped,
    ...accsEquipped,
  ].filter(Boolean) as InventoryRecord[];

  const bonusStats = activeFourSlotEquipped.reduce(
    (acc, rec) => {
      acc.str += rec.item?.bonus_str || 0;
      acc.agi += rec.item?.bonus_agi || 0;
      acc.vit += rec.item?.bonus_vit || 0;
      acc.luk += rec.item?.bonus_luk || 0;
      acc.hp += rec.item?.bonus_hp || 0;
      return acc;
    },
    { str: 0, agi: 0, vit: 0, luk: 0, hp: 0 }
  );

  const totalStats = {
    str: baseStats.str + bonusStats.str,
    agi: baseStats.agi + bonusStats.agi,
    vit: baseStats.vit + bonusStats.vit,
    luk: baseStats.luk + bonusStats.luk,
  };

  const totalMaxHp = baseMaxHp + bonusStats.hp;

  const userData = {
    user_id: profile?.user_id || "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    username: profile?.username || "Felix",
    character_class: profile?.character_class || "WARRIOR",
    gender: profile?.gender || "m",
    level: profile?.level || 1,
    current_hp: Math.min(totalMaxHp, profile?.current_hp || 1000),
    max_hp: totalMaxHp,
    exp: profile?.exp || 0,
    max_exp: profile?.max_exp || 1000,
    gold: userGold,
    weight_kg: profile?.weight_kg || 75,
    stats: totalStats,
    equipped_gear: activeFourSlotEquipped.map((rec) => ({
      slot: rec.item.type,
      name: rec.item.item_name,
      icon: rec.item.icon,
      image_url: rec.item.image_url,
    })),
  };

  const totalCp = Math.round(
    userData.level * 100 +
      userData.stats.str * 3.5 +
      userData.stats.agi * 2.5 +
      userData.stats.vit * 2.5 +
      userData.stats.luk * 2.0 +
      activeFourSlotEquipped.length * 150 +
      dailyRvs
  );

  const getClassPerkInfo = (clsName: string) => {
    const nameUpper = clsName.toUpperCase();
    if (nameUpper.includes("WARRIOR") || nameUpper.includes("CYBER") || nameUpper.includes("KNIGHT")) {
      return { label: "CYBER KNIGHT PERK", perk: "+15% RVS STR Damage Bonus", color: "text-amber-400 border-amber-400/40 bg-amber-950/20" };
    }
    if (nameUpper.includes("ROGUE") || nameUpper.includes("NINJA") || nameUpper.includes("ELF")) {
      return { label: "SHADOW NINJA PERK", perk: "+20% Critical Hit Chance (AGI)", color: "text-fuchsia-400 border-fuchsia-400/40 bg-fuchsia-950/20" };
    }
    if (nameUpper.includes("PALADIN") || nameUpper.includes("VANGUARD") || nameUpper.includes("LIZARD")) {
      return { label: "IRON VANGUARD PERK", perk: "+250 MAX HP & Defensive Shield", color: "text-[#00ff41] border-[#00ff41]/40 bg-[#00ff41]/10" };
    }
    return { label: "TITAN BERSERKER PERK", perk: "+20% Extra Gold & Exp Loot", color: "text-sky-400 border-sky-400/40 bg-sky-950/20" };
  };

  const classPerk = getClassPerkInfo(userData.character_class);

  const gearSkills = activeFourSlotEquipped
    .map((rec) => ({
      name: rec.item?.granted_skill_name || rec.item?.item_name,
      icon: rec.item?.granted_skill_icon || rec.item?.image_url,
      slotType: rec.item?.type as "weapon" | "armor" | "accessory",
    }))
    .filter((s) => Boolean(s.name));

  const hpPercent = Math.min(100, Math.max(0, (userData.current_hp / userData.max_hp) * 100));
  const expPercent = Math.min(100, Math.max(0, (userData.exp / userData.max_exp) * 100));
  const isCriticalHp = hpPercent < 20;

  const handleUpgradeStat = (statKey: "str" | "agi" | "vit" | "luk") => {
    if (availableAp <= 0) return;

    const nextAp = availableAp - 1;
    setAvailableAp(nextAp);
    try {
      localStorage.setItem("ironpixels_available_ap", nextAp.toString());
    } catch (e) {}

    if (profile) {
      const updatedStats = {
        ...profile.stats,
        [statKey]: (profile.stats[statKey] || 0) + 1,
      };
      const updatedProf = {
        ...profile,
        available_ap: nextAp,
        stats: updatedStats,
      };
      setProfile(updatedProf);
      localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));

      try {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            available_ap: nextAp,
            [statKey]: updatedStats[statKey],
            stats: updatedStats,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${userData.user_id},user_id.eq.${userData.user_id}`)
          .then(() => {});
      } catch (e) {}
    }
  };

  const handleClaimQuestReward = (reward: { gold: number; exp: number }) => {
    if (reward.gold > 0) {
      setUserGold((prev) => prev + reward.gold);
    }

    if (profile) {
      let newExp = profile.exp + reward.exp;
      let newLevel = profile.level;
      let newMaxExp = profile.max_exp;
      let addedAp = 0;

      if (newExp >= newMaxExp) {
        newExp = newExp - newMaxExp;
        newLevel += 1;
        newMaxExp = Math.round(newMaxExp * 1.5);
        addedAp = 5;
        setAvailableAp((prev) => prev + 5);
      }

      const newGoldTotal = profile.gold + reward.gold;

      const updatedProf = {
        ...profile,
        level: newLevel,
        exp: newExp,
        max_exp: newMaxExp,
        available_ap: (profile.available_ap || 0) + addedAp,
        gold: newGoldTotal,
      };

      setProfile(updatedProf);
      localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));

      try {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            gold: newGoldTotal,
            exp: newExp,
            level: newLevel,
            max_exp: newMaxExp,
            available_ap: updatedProf.available_ap,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${userData.user_id},user_id.eq.${userData.user_id}`)
          .then(() => {});
      } catch (e) {}
    }
  };

  const handleFinishWorkout = (summary: {
    totalRvs: number;
    totalVolume: number;
    exercisesLog: Array<{
      exercise_name: string;
      category?: string;
      sets: Array<{ set_number: number; weight_kg: number; reps: number }>;
    }>;
  }) => {
    setLastSessionDamage(summary.totalRvs);

    const healAmount = Math.round(summary.totalRvs * 1.5);
    const newHp = Math.min(userData.max_hp, userData.current_hp + healAmount);

    setSessionVictoryModal({
      totalRvs: summary.totalRvs,
      totalVolume: summary.totalVolume,
      healedHp: healAmount,
    });

    const newTotalRvs = dailyRvs + summary.totalRvs;
    setDailyRvs(newTotalRvs);
    try {
      localStorage.setItem(todayRvsKey, newTotalRvs.toString());
    } catch (e) {}

    const earnedGold = Math.round(summary.totalVolume / 10);
    setUserGold((prev) => prev + earnedGold);

    try {
      const newSessionRecord = {
        session_id: `ws-${Date.now()}`,
        date: todayStr,
        duration_minutes: 45,
        total_rvs: summary.totalRvs,
        total_volume_kg: summary.totalVolume,
        exercises_log: summary.exercisesLog || [],
      };
      const existingHistory = JSON.parse(localStorage.getItem("ironpixels_workout_history") || "[]");
      const updatedHistory = [newSessionRecord, ...existingHistory];
      localStorage.setItem("ironpixels_workout_history", JSON.stringify(updatedHistory));
    } catch (e) {}

    if (profile) {
      const updatedProf = {
        ...profile,
        current_hp: newHp,
        exp: profile.exp + summary.totalRvs,
        gold: profile.gold + earnedGold,
      };
      setProfile(updatedProf);
      localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));
    }

    try {
      fetch("/api/workout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.user_id,
          date: todayStr,
          duration_minutes: 45,
          total_rvs: summary.totalRvs,
          total_volume_kg: summary.totalVolume,
          exercises_log: summary.exercisesLog || [],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.profile) {
            setProfile(data.profile);
            localStorage.setItem("ironpixels_profile", JSON.stringify(data.profile));
            if (data.profile.gold !== undefined) setUserGold(data.profile.gold);
          }
        })
        .catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      setSessionVictoryModal(null);
      setSubView("combat");
    }, 2800);
  };

  const handleToggleEquip = async (inventoryId: string, currentEquippedState: boolean, itemType: ItemType) => {
    const nextEquippedState = !currentEquippedState;

    setUserInventory((prev) => {
      let updated: InventoryRecord[];

      if (nextEquippedState) {
        if (itemType === "accessory") {
          const equippedAccs = prev.filter((rec) => rec.is_equipped && rec.item.type === "accessory");
          if (equippedAccs.length >= 2) {
            const oldestAccId = equippedAccs[0].inventory_id;
            updated = prev.map((rec) => {
              if (rec.inventory_id === inventoryId) return { ...rec, is_equipped: true };
              if (rec.inventory_id === oldestAccId) return { ...rec, is_equipped: false };
              return rec;
            });
          } else {
            updated = prev.map((rec) => (rec.inventory_id === inventoryId ? { ...rec, is_equipped: true } : rec));
          }
        } else {
          updated = prev.map((rec) => {
            if (rec.inventory_id === inventoryId) return { ...rec, is_equipped: true };
            if (rec.is_equipped && rec.item.type === itemType) return { ...rec, is_equipped: false };
            return rec;
          });
        }
      } else {
        updated = prev.map((rec) => (rec.inventory_id === inventoryId ? { ...rec, is_equipped: false } : rec));
      }

      localStorage.setItem("ironpixels_inventory", JSON.stringify(updated));
      return updated;
    });

    const targetRec = userInventory.find((r) => r.inventory_id === inventoryId);
    if (targetRec) {
      try {
        await fetch("/api/inventory/equip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventory_id: inventoryId,
            item_id: targetRec.item_id,
            item_type: itemType,
            is_equipped: nextEquippedState,
          }),
        });
      } catch (err) {}
    }
  };

  const handleAddItemToInventory = (newItem: InventoryRecord) => {
    setUserInventory((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem("ironpixels_inventory", JSON.stringify(updated));
      return updated;
    });
  };

  const handleFullHeal = () => {
    if (profile) {
      const updatedProf = { ...profile, current_hp: totalMaxHp };
      setProfile(updatedProf);
      localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));
    }
  };

  const handleSellItem = async (inventoryId: string, sellGoldValue: number) => {
    setUserInventory((prev) => {
      const updated = prev.filter((rec) => rec.inventory_id !== inventoryId);
      localStorage.setItem("ironpixels_inventory", JSON.stringify(updated));
      return updated;
    });

    setUserGold((prev) => {
      const newGold = prev + sellGoldValue;
      if (profile) {
        const updatedProf = { ...profile, gold: newGold };
        setProfile(updatedProf);
        localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));
      }
      return newGold;
    });

    try {
      await fetch("/api/inventory/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_id: inventoryId }),
      });
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-background text-white flex justify-center selection:bg-pixel-green selection:text-black relative">
      {isCriticalHp && (
        <div className="pointer-events-none fixed inset-0 border-4 border-red-600/80 shadow-[inset_0_0_80px_rgba(255,0,0,0.5)] animate-pulse z-30" />
      )}

      <div className="w-full max-w-[600px] min-h-screen flex flex-col justify-between border-x border-pixel-border/30 pb-20 relative z-10">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-pixel-border/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.png"
              alt="IronPixels Logo"
              className="w-8 h-8 object-contain border border-pixel-green/80 shadow-neon bg-black p-0.5"
            />
            <span className="font-headline font-extrabold tracking-wider text-lg text-pixel-green uppercase">
              IRONPIXELS
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 border border-pixel-border bg-surface hover:border-pixel-green transition-colors text-pixel-green"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {isCriticalHp && (
          <div className="bg-red-950/90 border-b border-red-600 px-4 py-2 text-xs font-mono font-bold text-red-300 flex items-center justify-between z-40 animate-pulse">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>CRITICAL STATUS: HERO EXHAUSTED ({hpPercent.toFixed(0)}% HP). COMPLETE A WORKOUT TO HEAL!</span>
            </div>
          </div>
        )}

        <main className="p-4 flex-1 relative">
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            userData={userData}
          />

          <AnimatePresence>
            {bossAttackModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              >
                <div className="w-full max-w-sm border-2 border-red-600 bg-surface p-6 text-center space-y-4 shadow-[0_0_50px_rgba(255,0,0,0.6)] font-mono relative">
                  <button
                    onClick={() => setBossAttackModal(null)}
                    className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="w-14 h-14 border-2 border-red-600 bg-red-950/60 text-red-500 flex items-center justify-center mx-auto shadow-red-glow animate-bounce">
                    <ShieldAlert className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-headline font-extrabold text-2xl text-red-500 uppercase tracking-wider">
                      DAILY BOSS ATTACK!
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      NO GYM WORKOUT WAS LOGGED YESTERDAY.
                    </p>
                  </div>

                  <div className="bg-black/80 border border-red-900 p-3 space-y-2 text-left">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">ATTACKER:</span>
                      <span className="text-red-400 font-bold">{bossAttackModal.bossName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">HERO DAMAGE TAKEN:</span>
                      <span className="text-red-500 font-bold">-{formatNumber(bossAttackModal.damageDealt)} HP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setBossAttackModal(null)}
                    className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-headline font-black text-xs uppercase tracking-wider shadow-red-glow"
                  >
                    ACKNOWLEDGE DAMAGE & RECOVER
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sessionVictoryModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              >
                <div className="w-full max-w-sm border-2 border-pixel-green bg-surface p-6 text-center space-y-4 shadow-neon font-mono">
                  <div className="w-14 h-14 border-2 border-pixel-green bg-pixel-green/20 text-pixel-green flex items-center justify-center mx-auto shadow-neon animate-bounce">
                    <Swords className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-headline font-extrabold text-2xl text-pixel-green uppercase tracking-wider">
                      GYM RAID VICTORY!
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      SESSION COMPLETED. PREPARING ATTACK...
                    </p>
                  </div>

                  <div className="bg-black/60 border border-pixel-border p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">TOTAL RVS DAMAGE:</span>
                      <span className="text-pixel-green font-bold">{formatNumber(sessionVictoryModal.totalRvs)} RVS</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">HERO HEAL RECOVERED:</span>
                      <span className="text-[#00ff41] font-bold flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5" />
                        +{formatNumber(sessionVictoryModal.healedHp)} HP
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">TOTAL VOLUME LIFTED:</span>
                      <span className="text-[#00ff41] font-bold">{formatNumber(sessionVictoryModal.totalVolume)} KG</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">GOLD LOOT REWARD:</span>
                      <span className="text-gold-loot font-bold">+{formatNumber(Math.round(sessionVictoryModal.totalVolume / 10))} GOLD</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">
                    UNLEASHING RVS DAMAGE ON BOSS...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === "hub" && (
              <motion.div
                key="hub"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="border border-pixel-border bg-surface p-4 relative overflow-hidden font-mono shadow-neon space-y-3">
                  <div className="flex items-start gap-4">
                    <PixelAvatar
                      className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 border-2 border-pixel-border"
                      isCritical={isCriticalHp}
                      characterClass={userData.character_class}
                      gender={userData.gender}
                    />

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline font-black text-lg text-white uppercase tracking-wider truncate">
                            {userData.username}
                          </h2>
                          <span className="px-2 py-0.5 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] font-headline font-black text-xs uppercase shadow-neon">
                            LVL.{userData.level}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-amber-400 bg-amber-950/60 text-amber-300 font-bold text-xs shadow-gold-glow">
                          <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{formatNumber(userGold)} GOLD</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase">
                        <span className="px-1.5 py-0.2 border border-zinc-700 bg-black text-zinc-300">
                          {userData.gender === "f" ? "FEMALE" : "MALE"} {userData.character_class}
                        </span>
                        <span className="text-[#00ff41] truncate">{classPerk.perk}</span>
                      </div>

                      {/* HP METER BAR */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-health-red flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 animate-pulse" />
                            HP HEALTH METER
                          </span>
                          <span className="text-white">
                            {formatNumber(userData.current_hp)} / {formatNumber(userData.max_hp)} ({Math.round((userData.current_hp / Math.max(1, userData.max_hp)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-black h-2.5 border border-pixel-border overflow-hidden p-0.5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCriticalHp
                                ? "bg-health-red shadow-red-glow animate-pulse"
                                : "bg-[#00ff41] shadow-neon"
                            }`}
                            style={{ width: `${Math.round((userData.current_hp / Math.max(1, userData.max_hp)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* EXP METER BAR */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-sky-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-sky-400" />
                            EXP HERO PROGRESS
                          </span>
                          <span className="text-white">
                            {formatNumber(userData.exp)} / {formatNumber(userData.max_exp)} ({Math.round((userData.exp / Math.max(1, userData.max_exp)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-black h-2 border border-pixel-border overflow-hidden p-0.5">
                          <div
                            className="h-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-300"
                            style={{ width: `${Math.round((userData.exp / Math.max(1, userData.max_exp)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HERO OVERVIEW CARDS */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pixel-border/50 text-center text-xs">
                    <div className="p-2 border border-pixel-border/60 bg-black/60">
                      <div className="text-[9px] text-zinc-400 uppercase font-bold">COMBAT POWER</div>
                      <div className="font-headline font-black text-amber-300 text-sm">{formatNumber(totalCp)} CP</div>
                    </div>
                    <div className="p-2 border border-pixel-border/60 bg-black/60">
                      <div className="text-[9px] text-zinc-400 uppercase font-bold">DAILY RVS POWER</div>
                      <div className="font-headline font-black text-[#00ff41] text-sm">+{formatNumber(dailyRvs)} RVS</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <button
                    onClick={() => {
                      setActiveTab("quests");
                      setSubView("workout");
                    }}
                    className="p-3 border border-[#00ff41]/80 bg-surface hover:bg-[#00ff41]/10 text-white flex items-center justify-between group transition-all cursor-pointer shadow-neon"
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#00ff41]" />
                      <div className="text-left">
                        <div className="font-headline font-extrabold text-xs uppercase">WORKOUT TRACKER</div>
                        <div className="text-[9px] text-zinc-400">LOG GYM SETS</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#00ff41] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("quests");
                      setSubView("combat");
                    }}
                    className="p-3 border border-health-red/80 bg-surface hover:bg-health-red/10 text-white flex items-center justify-between group transition-all cursor-pointer shadow-red-glow"
                  >
                    <div className="flex items-center gap-2">
                      <Swords className="w-5 h-5 text-health-red" />
                      <div className="text-left">
                        <div className="font-headline font-extrabold text-xs uppercase">DUNGEON</div>
                        <div className="text-[9px] text-zinc-400">CLEAR DUNGEON FLOORS</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-health-red group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <StatRadarChart
                  stats={userData.stats}
                  availableAp={availableAp}
                  onUpgradeStat={handleUpgradeStat}
                />

                <DailyQuestsWidget
                  dailyRvs={dailyRvs}
                  currentHp={userData.current_hp}
                  maxHp={userData.max_hp}
                  onClaimReward={handleClaimQuestReward}
                />

                <EquippedGearGrid gear={userData.equipped_gear} />

                <div className="border border-pixel-border bg-surface p-3 space-y-3 font-mono shadow-neon">
                  <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <Trophy className="w-4 h-4 text-gold-loot animate-pulse" />
                      <span>TOP 3 WARRIORS & GUILD PARTIES</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("multiplayer")}
                      className="text-[10px] text-[#00ff41] font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>VIEW ALL 6 RANKINGS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#00ff41]" />
                        <span>TOP SOLO WARRIORS (CLICK TO INSPECT)</span>
                      </div>

                      {topWarriors.length === 0 ? (
                        <div className="p-3 border border-zinc-800 bg-black text-center text-xs text-zinc-500 italic">
                          No solo warriors logged yet.
                        </div>
                      ) : (
                        topWarriors.map((usr, idx) => (
                          <div
                            key={usr.user_id || idx}
                            onClick={() => setActiveTab("multiplayer")}
                            className="p-2 border border-amber-500/40 bg-black flex items-center justify-between text-xs hover:border-[#00ff41] cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2">
                              {idx === 0 ? (
                                <Crown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Trophy className="w-4 h-4 text-zinc-400" />
                              )}
                              <div>
                                <div className="font-bold text-white">#{idx + 1} {usr.username}</div>
                                <div className="text-[9px] text-zinc-400">{usr.character_class} &bull; Lv.{usr.level}</div>
                              </div>
                            </div>
                            <div className="font-headline font-black text-xs text-[#00ff41]">
                              FLOOR {usr.max_floor}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-pixel-border/40">
                      <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-purple-400" />
                        <span>TOP GUILD PARTIES (CLICK TO INSPECT)</span>
                      </div>

                      {topParties.length === 0 ? (
                        <div className="p-3 border border-purple-950/40 bg-black text-center text-xs text-zinc-500 italic">
                          No active guild parties created yet.
                        </div>
                      ) : (
                        topParties.map((prt, idx) => (
                          <div
                            key={prt.party_id || idx}
                            onClick={() => setActiveTab("multiplayer")}
                            className="p-2 border border-purple-500/40 bg-purple-950/20 flex items-center justify-between text-xs hover:border-purple-400 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2">
                              {idx === 0 ? (
                                <Crown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Trophy className="w-4 h-4 text-zinc-400" />
                              )}
                              <div>
                                <div className="font-bold text-purple-300">#{idx + 1} {prt.party_name}</div>
                                <div className="text-[9px] text-zinc-400">{prt.member_count} Members &bull; Leader: {prt.leader_name}</div>
                              </div>
                            </div>
                            <div className="font-headline font-black text-xs text-[#00ff41]">
                              FLOOR {prt.total_party_floor}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "quests" && (
              <motion.div
                key="quests"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-1 bg-surface border border-pixel-border p-1">
                  <button
                    onClick={() => setSubView("workout")}
                    className={`py-2 px-2 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold transition-all ${
                      subView === "workout"
                        ? "bg-pixel-green text-black shadow-neon"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>LOG WORKOUT</span>
                  </button>

                  <button
                    onClick={() => setSubView("history")}
                    className={`py-2 px-2 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold transition-all ${
                      subView === "history"
                        ? "bg-gold-loot text-black shadow-gold-glow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>HISTORY</span>
                  </button>

                  <button
                    onClick={() => setSubView("combat")}
                    className={`py-2 px-2 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold transition-all ${
                      subView === "combat"
                        ? "bg-health-red text-white shadow-red-glow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>DUNGEON</span>
                  </button>
                </div>

                {subView === "workout" ? (
                  <WorkoutTrackerForm
                    userId={userData.user_id}
                    userWeightKg={userData.weight_kg}
                    heroStats={userData.stats}
                    onFinishSession={handleFinishWorkout}
                  />
                ) : subView === "history" ? (
                  <WorkoutHistoryList userId={userData.user_id} />
                ) : (
                  <CombatArena
                    userId={userData.user_id}
                    sessionDamage={lastSessionDamage}
                    dailyRvs={dailyRvs}
                    equippedSkills={gearSkills}
                    playerStr={userData.stats.str}
                    characterClass={userData.character_class}
                    gender={userData.gender}
                    equippedWeaponIcon={
                      userInventory.find((rec) => rec.is_equipped && rec.item.type === "weapon")?.item.image_url || "/assets/items/weapons/01.png"
                    }
                    onAddItemToInventory={handleAddItemToInventory}
                    onConsumeSessionDamage={() => setLastSessionDamage(0)}
                    onNavigateToMultiplayer={() => setActiveTab("multiplayer")}
                  />
                )}
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <AnalyticsView
                  userId={userData.user_id}
                  heroStats={{
                    level: userData.level,
                    str: totalStats.str,
                    agi: totalStats.agi,
                    vit: totalStats.vit,
                    luk: totalStats.luk,
                  }}
                />
              </motion.div>
            )}

            {activeTab === "multiplayer" && (
              <motion.div
                key="multiplayer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <MultiplayerHub
                  userCp={totalCp}
                  userLevel={userData.level}
                  userClass={userData.character_class}
                  userRvs={dailyRvs}
                />
              </motion.div>
            )}

            {activeTab === "shop" && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <BlacksmithShop
                  userGold={userGold}
                  onUpdateGold={(newG) => {
                    setUserGold(newG);
                    if (profile) {
                      const updatedProf = { ...profile, gold: newG };
                      setProfile(updatedProf);
                      localStorage.setItem("ironpixels_profile", JSON.stringify(updatedProf));
                    }
                  }}
                  onAddItemToInventory={handleAddItemToInventory}
                  onFullHeal={handleFullHeal}
                />
              </motion.div>
            )}

            {activeTab === "inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <InventoryGrid
                  inventory={userInventory}
                  onToggleEquip={handleToggleEquip}
                  onSellItem={handleSellItem}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>
    </div>
  );
}
