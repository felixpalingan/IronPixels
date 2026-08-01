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
  equipped_gear: Array<{
    slot: string;
    name: string;
    icon?: string;
  }>;
}

export function DashboardLayout() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("hub");
  const [subView, setSubView] = useState<"workout" | "combat">("workout");
  const [lastSessionDamage, setLastSessionDamage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const userData = profile || {
    user_id: "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    username: "Felix",
    character_class: "CYBER KNIGHT",
    level: 15,
    current_hp: 850,
    max_hp: 1000,
    exp: 10000,
    max_exp: 15000,
    gold: 12500,
    weight_kg: 75,
    stats: { str: 85, agi: 72, vit: 54, luk: 60 },
    equipped_gear: [
      { slot: "weapon", name: "Iron Blade...", icon: "sword" },
      { slot: "armor", name: "Chainmail", icon: "shield" },
      { slot: "accessory", name: "Vitality A...", icon: "heart" },
    ],
  };

  const hpPercent = Math.min(100, Math.max(0, (userData.current_hp / userData.max_hp) * 100));
  const expPercent = Math.min(100, Math.max(0, (userData.exp / userData.max_exp) * 100));

  const handleFinishWorkout = (summary: { totalRvs: number; totalVolume: number }) => {
    setLastSessionDamage(summary.totalRvs);
    setSubView("combat");

    if (profile) {
      setProfile({
        ...profile,
        exp: profile.exp + summary.totalRvs,
        gold: profile.gold + Math.round(summary.totalVolume / 10),
      });
    }
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

          <button className="p-1.5 border border-pixel-border bg-surface hover:border-pixel-green transition-colors text-pixel-green">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <main className="p-4 flex-1">
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
                  />
                )}
              </motion.div>
            )}

            {activeTab !== "hub" && activeTab !== "quests" && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="border border-pixel-border bg-surface p-8 text-center min-h-[350px] flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 border-2 border-pixel-green bg-pixel-green/10 text-pixel-green flex items-center justify-center font-mono font-bold text-xl mb-4 shadow-neon uppercase">
                  {activeTab[0]}
                </div>
                <h2 className="font-headline font-bold text-xl uppercase tracking-wider text-pixel-green">
                  {activeTab} SECTION
                </h2>
                <p className="font-mono text-xs text-gray-400 mt-2 max-w-xs">
                  SECTION UNDER ACTIVE DUNGEON DEVELOPMENT. STAY TUNED WARRIOR.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>
    </div>
  );
}
