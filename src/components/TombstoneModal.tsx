"use client";

import { useState } from "react";
import { Skull, Dumbbell, Sparkles, Coins, Flame, ArrowRight, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEffects";

interface TombstoneModalProps {
  isOpen: boolean;
  username: string;
  characterClass: string;
  userGold: number;
  onReviveViaWorkout: () => void;
  onReviveSuccess: (updatedProfile: any) => void;
}

export function TombstoneModal({
  isOpen,
  username,
  characterClass,
  userGold,
  onReviveViaWorkout,
  onReviveSuccess,
}: TombstoneModalProps) {
  const [isReviving, setIsReviving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const REVIVE_COST = 500;
  const canAffordPotion = userGold >= REVIVE_COST;

  const handleBuyPotion = async () => {
    if (!canAffordPotion || isReviving) return;
    setIsReviving(true);
    setErrorMsg(null);
    soundEngine.play("select");

    try {
      const res = await fetch("/api/user/revive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to purchase Revive Potion.");
        return;
      }

      soundEngine.play("level_up");
      soundEngine.triggerHaptic([100, 50, 150]);
      onReviveSuccess(data.profile);
    } catch (err: any) {
      setErrorMsg("Network error connecting to revival shrine.");
    } finally {
      setIsReviving(false);
    }
  };

  const handleChooseWorkout = () => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(50);
    onReviveViaWorkout();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md border-2 border-red-600 bg-zinc-950 p-6 space-y-5 shadow-[0_0_35px_rgba(239,68,68,0.4)] text-center relative overflow-hidden"
        >
          {/* Background Tombstone Vignette */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

          {/* Tombstone & Skull Icon Header */}
          <div className="space-y-2">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-2 border-red-500 bg-red-950/50 text-red-500 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <Skull className="w-9 h-9 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 border border-zinc-700 bg-black text-[9px] font-bold text-zinc-400 uppercase">
                0 HP
              </div>
            </div>

            <div>
              <h2 className="font-headline font-black text-2xl text-red-500 uppercase tracking-wider">
                HERO DEFEATED
              </h2>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5 font-bold">
                {username} &bull; {characterClass} HAS FALLEN
              </div>
            </div>

            <p className="text-xs text-zinc-300 italic max-w-xs mx-auto border-y border-zinc-900 py-2">
              "The dungeon claimed your body, but not your soul. Rise again through honest sweat or ancient alchemy."
            </p>
          </div>

          {errorMsg && (
            <div className="p-2 border border-red-500/80 bg-red-950/60 text-red-300 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Revival Options */}
          <div className="space-y-3 text-left">
            {/* OPTION 1: Free Workout Revival */}
            <div
              onClick={handleChooseWorkout}
              className="p-3.5 border-2 border-pixel-green bg-black/80 hover:bg-pixel-green/10 transition-all cursor-pointer group space-y-2 shadow-neon relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-1.5 py-0.5 border border-pixel-green bg-pixel-green text-black font-extrabold uppercase tracking-wider">
                  RECOMMENDED &bull; FREE
                </span>
                <span className="text-[10px] text-pixel-green font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>LOG WORKOUT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-pixel-green bg-pixel-green/20 text-pixel-green flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline font-extrabold text-xs text-white uppercase tracking-wider">
                    RESURRECT WITH SWEAT & IRON
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Log 1 workout session in the gym. Completing it will fully resurrect your hero with 100% HP!
                  </p>
                </div>
              </div>
            </div>

            {/* OPTION 2: Revive Potion (Gold) */}
            <div
              className={`p-3.5 border transition-all space-y-2 relative ${
                canAffordPotion
                  ? "border-amber-400 bg-black/80 hover:bg-amber-950/20"
                  : "border-zinc-800 bg-black/40 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] px-1.5 py-0.5 border font-extrabold uppercase tracking-wider ${
                    canAffordPotion
                      ? "border-amber-400 bg-amber-400 text-black"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  INSTANT &bull; 500 GOLD
                </span>
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <span>BALANCE:</span>
                  <span className={`font-bold ${canAffordPotion ? "text-amber-400" : "text-red-400"}`}>
                    {formatNumber(userGold)} G
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 border flex items-center justify-center flex-shrink-0 ${
                    canAffordPotion
                      ? "border-amber-400 bg-amber-950/40 text-amber-400"
                      : "border-zinc-700 bg-zinc-900 text-zinc-600"
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-extrabold text-xs text-white uppercase tracking-wider">
                    REVIVE POTION
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Instantly awaken from death and restore 100% HP using your dungeon gold.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!canAffordPotion || isReviving}
                onClick={handleBuyPotion}
                className={`w-full py-2 border font-headline font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  canAffordPotion
                    ? "border-amber-400 bg-amber-500/20 hover:bg-amber-400 hover:text-black text-amber-300 shadow-neon cursor-pointer"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>
                  {isReviving
                    ? "RESURRECTING..."
                    : canAffordPotion
                    ? "DRINK REVIVE POTION (500 GOLD)"
                    : "NEED 500 GOLD — TRAIN IN GYM"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
