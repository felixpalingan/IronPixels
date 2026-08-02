"use client";

import { useState, useEffect } from "react";
import { Settings, Coins, Swords, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { PixelAvatar } from "@/components/PixelAvatar";
import { StatRadarChart } from "@/components/StatRadarChart";
import { EquippedGearGrid } from "@/components/EquippedGearGrid";
import { WorkoutTrackerForm } from "@/components/WorkoutTrackerForm";
import { CombatArena } from "@/components/CombatArena";
import { BottomNav } from "@/components/BottomNav";
import { SettingsModal } from "@/components/SettingsModal";
import { BlacksmithShop } from "@/components/BlacksmithShop";
import { InventoryGrid } from "@/components/InventoryGrid";
import { EQUIPMENT_DICTIONARY, InventoryRecord, ItemType } from "@/lib/equipment";

interface UserProfileData {
  user_id: string;
  username: string;
  character_class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  exp: number;
  max_exp: number;
  gold: number;
  weight_kg: number;
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
  const [subView, setSubView] = useState<"workout" | "combat">("workout");
  const [lastSessionDamage, setLastSessionDamage] = useState<number>(0);
  const [sessionVictoryModal, setSessionVictoryModal] = useState<{
    totalRvs: number;
    totalVolume: number;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const INITIAL_INVENTORY: InventoryRecord[] = [
    {
      inventory_id: "inv-init-1",
      user_id: "user-1",
      item_id: EQUIPMENT_DICTIONARY[0].item_id,
      is_equipped: true,
      item: EQUIPMENT_DICTIONARY[0],
    },
    {
      inventory_id: "inv-init-2",
      user_id: "user-1",
      item_id: EQUIPMENT_DICTIONARY[1].item_id,
      is_equipped: true,
      item: EQUIPMENT_DICTIONARY[1],
    },
    {
      inventory_id: "inv-init-3",
      user_id: "user-1",
      item_id: EQUIPMENT_DICTIONARY[2].item_id,
      is_equipped: true,
      item: EQUIPMENT_DICTIONARY[2],
    },
  ];

  const [userInventory, setUserInventory] = useState<InventoryRecord[]>(INITIAL_INVENTORY);
  const [userGold, setUserGold] = useState<number>(12500);

  useEffect(() => {
    const localInv = localStorage.getItem("ironpixels_inventory");
    if (localInv) {
      try {
        const parsed = JSON.parse(localInv);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserInventory(parsed);
        }
      } catch (e) {}
    }

    async function fetchData() {
      try {
        const resProf = await fetch("/api/user/profile");
        if (resProf.ok) {
          const dataProf = await resProf.json();
          setProfile(dataProf);
          if (dataProf.gold !== undefined) setUserGold(dataProf.gold);
        }

        const resInv = await fetch("/api/user/inventory");
        if (resInv.ok) {
          const dataInv = await resInv.json();
          if (Array.isArray(dataInv) && dataInv.length > 0) {
            setUserInventory(dataInv);
            localStorage.setItem("ironpixels_inventory", JSON.stringify(dataInv));
          }
        }
      } catch (err) {}
    }

    fetchData();
  }, []);

  const baseStats = profile?.stats || { str: 85, agi: 72, vit: 54, luk: 60 };
  const baseMaxHp = profile?.max_hp || 1000;

  const equippedItems = userInventory.filter((rec) => rec.is_equipped);

  const bonusStats = equippedItems.reduce(
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
    character_class: profile?.character_class || "CYBER KNIGHT",
    level: profile?.level || 15,
    current_hp: Math.min(totalMaxHp, profile?.current_hp || 850),
    max_hp: totalMaxHp,
    exp: profile?.exp || 10000,
    max_exp: profile?.max_exp || 15000,
    gold: userGold,
    weight_kg: profile?.weight_kg || 75,
    stats: totalStats,
    equipped_gear: equippedItems.map((rec) => ({
      slot: rec.item.type,
      name: rec.item.item_name,
      icon: rec.item.icon,
      image_url: rec.item.image_url,
    })),
  };

  const gearSkills = equippedItems
    .map((rec) => ({
      name: rec.item?.granted_skill_name || rec.item?.item_name,
      icon: rec.item?.icon,
    }))
    .filter((s) => Boolean(s.name));

  const hpPercent = Math.min(100, Math.max(0, (userData.current_hp / userData.max_hp) * 100));
  const expPercent = Math.min(100, Math.max(0, (userData.exp / userData.max_exp) * 100));

  const handleFinishWorkout = (summary: { totalRvs: number; totalVolume: number }) => {
    setLastSessionDamage(summary.totalRvs);
    setSessionVictoryModal(summary);

    const earnedGold = Math.round(summary.totalVolume / 10);
    setUserGold((prev) => prev + earnedGold);

    if (profile) {
      setProfile({
        ...profile,
        exp: profile.exp + summary.totalRvs,
        gold: profile.gold + earnedGold,
      });
    }

    setTimeout(() => {
      setSessionVictoryModal(null);
      setSubView("combat");
    }, 2800);
  };

  const handleToggleEquip = async (inventoryId: string, currentEquippedState: boolean, itemType: ItemType) => {
    const nextEquippedState = !currentEquippedState;

    setUserInventory((prev) => {
      const updated = prev.map((rec) => {
        if (rec.inventory_id === inventoryId) {
          return { ...rec, is_equipped: nextEquippedState };
        }
        if (nextEquippedState && rec.item.type === itemType) {
          return { ...rec, is_equipped: false };
        }
        return rec;
      });
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

  return (
    <div className="min-h-screen bg-background text-white flex justify-center selection:bg-pixel-green selection:text-black">
      <div className="w-full max-w-[600px] min-h-screen flex flex-col justify-between border-x border-pixel-border/30 pb-20">
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

        <main className="p-4 flex-1 relative">
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            userData={userData}
          />

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
                      <span className="text-gray-400">TOTAL VOLUME LIFTED:</span>
                      <span className="text-white font-bold">{formatNumber(sessionVictoryModal.totalVolume)} KG</span>
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
                <div className="border border-pixel-border bg-surface p-4 relative overflow-hidden">
                  <div className="flex gap-4">
                    <PixelAvatar className="w-24 h-24 flex-shrink-0" />

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-headline font-extrabold text-2xl tracking-tight text-white">
                            Lv. {formatNumber(userData.level)}
                          </div>
                          <div className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
                            {userData.character_class}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-black/60 border border-gold-loot/40 px-2.5 py-1 text-gold-loot shadow-gold-glow">
                          <Coins className="w-3.5 h-3.5" />
                          <span className="font-mono font-bold text-xs">
                            {formatNumber(userData.gold)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-3">
                        <div>
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-health-red font-bold">HP</span>
                            <span className="text-gray-300">
                              {formatNumber(userData.current_hp)} / {formatNumber(userData.max_hp)}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-black border border-pixel-border overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${hpPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-health-red relative shadow-red-glow"
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:4px_100%]" />
                            </motion.div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-exp-blue font-bold">EXP</span>
                            <span className="text-gray-300">
                              {formatNumber(userData.exp)} / {formatNumber(userData.max_exp)}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-black border border-pixel-border overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${expPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-exp-blue relative shadow-blue-glow"
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:4px_100%]" />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-pixel-border bg-surface p-1">
                  <StatRadarChart stats={userData.stats} />
                </div>

                <EquippedGearGrid gear={userData.equipped_gear} />
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
                <div className="grid grid-cols-2 gap-2 bg-surface border border-pixel-border p-1">
                  <button
                    onClick={() => setSubView("workout")}
                    className={`py-2 px-3 flex items-center justify-center gap-2 font-mono text-xs font-bold transition-all ${
                      subView === "workout"
                        ? "bg-pixel-green text-black shadow-neon"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span>WORKOUT TRACKER</span>
                  </button>

                  <button
                    onClick={() => setSubView("combat")}
                    className={`py-2 px-3 flex items-center justify-center gap-2 font-mono text-xs font-bold transition-all ${
                      subView === "combat"
                        ? "bg-health-red text-white shadow-red-glow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Swords className="w-4 h-4" />
                    <span>BOSS ARENA</span>
                  </button>
                </div>

                {subView === "workout" ? (
                  <WorkoutTrackerForm
                    userId={userData.user_id}
                    userWeightKg={userData.weight_kg}
                    onFinishSession={handleFinishWorkout}
                  />
                ) : (
                  <CombatArena
                    userId={userData.user_id}
                    sessionDamage={lastSessionDamage}
                    equippedSkills={gearSkills}
                    playerStr={userData.stats.str}
                  />
                )}
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
                  onUpdateGold={setUserGold}
                  onAddItemToInventory={handleAddItemToInventory}
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
