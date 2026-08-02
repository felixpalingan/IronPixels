"use client";

import { useState } from "react";
import { Coins, Sparkles, X, Shield, Swords, Flame, Zap, PackageOpen, Triangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { EQUIPMENT_DICTIONARY, EquipmentItem, InventoryRecord } from "@/lib/equipment";

interface BlacksmithShopProps {
  userGold: number;
  onUpdateGold: (newGold: number) => void;
  onAddItemToInventory: (newItem: InventoryRecord) => void;
}

interface ChestOption {
  id: "bronze" | "silver" | "void";
  name: string;
  rarityTag: string;
  price: number;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  accentBadge: string;
}

const CHEST_OPTIONS: ChestOption[] = [
  {
    id: "bronze",
    name: "Bronze Cache",
    rarityTag: "COMMON REWARDS",
    price: 0,
    borderColor: "border-zinc-700",
    glowColor: "shadow-[0_0_20px_rgba(113,113,122,0.2)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-zinc-800 text-zinc-300 border-zinc-700",
  },
  {
    id: "silver",
    name: "Silver Coffer",
    rarityTag: "RARE REWARDS",
    price: 0,
    borderColor: "border-sky-500/60",
    glowColor: "shadow-[0_0_25px_rgba(14,165,233,0.25)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-sky-950 text-sky-400 border-sky-500/40",
  },
  {
    id: "void",
    name: "Void Reliquary",
    rarityTag: "LEGENDARY REWARDS",
    price: 0,
    borderColor: "border-[#00ff41]",
    glowColor: "shadow-[0_0_30px_rgba(0,255,65,0.4)]",
    bgGradient: "bg-[#0d1a10]",
    accentBadge: "bg-emerald-950 text-[#00ff41] border-[#00ff41]/50 font-bold",
  },
];

export function BlacksmithShop({
  userGold,
  onUpdateGold,
  onAddItemToInventory,
}: BlacksmithShopProps) {
  const [loadingChest, setLoadingChest] = useState<string | null>(null);
  const [drawnResult, setDrawnResult] = useState<InventoryRecord | null>(null);
  const [reelStrip, setReelStrip] = useState<EquipmentItem[]>([]);
  const [targetIndex, setTargetIndex] = useState<number>(26);
  const [openingPhase, setOpeningPhase] = useState<"rolling" | "revealed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handlePurchaseChest = async (chest: ChestOption) => {
    setErrorMsg("");
    setLoadingChest(chest.id);

    try {
      const res = await fetch("/api/shop/gacha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chest_type: chest.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "GACHA PURCHASE FAILED.");
        setLoadingChest(null);
      } else {
        onUpdateGold(data.new_gold);
        onAddItemToInventory(data.drawn_item);

        const winItem: EquipmentItem = data.drawn_item.item;
        const WIN_INDEX = 26;

        const generatedStrip: EquipmentItem[] = [];
        for (let i = 0; i < 35; i++) {
          if (i === WIN_INDEX) {
            generatedStrip.push(winItem);
          } else {
            const randItem = EQUIPMENT_DICTIONARY[Math.floor(Math.random() * EQUIPMENT_DICTIONARY.length)];
            generatedStrip.push(randItem);
          }
        }

        setReelStrip(generatedStrip);
        setTargetIndex(WIN_INDEX);
        setDrawnResult(data.drawn_item);
        setOpeningPhase("rolling");
        setLoadingChest(null);

        setTimeout(() => {
          setOpeningPhase("revealed");
        }, 4600);
      }
    } catch (err: any) {
      setErrorMsg("GACHA CONNECTION ERROR.");
      setLoadingChest(null);
    }
  };

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]";
      case "epic":
        return "border-fuchsia-500 bg-fuchsia-950/80 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.5)]";
      case "rare":
        return "border-sky-400 bg-sky-950/80 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.5)]";
      default:
        return "border-zinc-600 bg-zinc-900 text-zinc-300";
    }
  };

  const getRarityCardBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-amber-400 bg-amber-950/30 text-amber-300";
      case "epic":
        return "border-fuchsia-500 bg-fuchsia-950/30 text-fuchsia-300";
      case "rare":
        return "border-sky-400 bg-sky-950/30 text-sky-300";
      default:
        return "border-zinc-700 bg-zinc-950 text-zinc-400";
    }
  };

  const ITEM_CARD_WIDTH = 112;
  const targetX = targetIndex * ITEM_CARD_WIDTH - (320 / 2 - ITEM_CARD_WIDTH / 2);

  return (
    <div className="space-y-6 selection:bg-[#00ff41] selection:text-black font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-[#00ff41]" />
          <span className="font-headline font-black text-lg tracking-wider text-white uppercase">
            LOOT_CRATE_V1.0
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0a0a0c] border border-gold-loot/50 px-3 py-1 text-gold-loot shadow-gold-glow">
          <Coins className="w-4 h-4" />
          <span className="font-bold text-xs">{formatNumber(userGold)} GOLD</span>
        </div>
      </div>

      <div className="relative border border-zinc-800 bg-[#121214] p-6 overflow-hidden flex flex-col items-center text-center space-y-3">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff41]/5 via-transparent to-[#00ff41]/5 pointer-events-none" />

        <div className="w-12 h-12 border border-zinc-700 bg-zinc-950 flex items-center justify-center text-white mb-1 shadow-neon">
          <Swords className="w-6 h-6 text-[#00ff41]" />
        </div>

        <h2 className="font-headline font-black text-2xl tracking-wider text-white uppercase">
          FORGE NEW DESTINY
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm">
          Purchase enchanted caches to unlock legendary pixel equipment for your journey.
        </p>
      </div>

      {errorMsg && (
        <div className="border border-red-500/80 bg-red-950/40 p-3 text-red-400 text-xs font-bold uppercase tracking-wider text-center">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CHEST_OPTIONS.map((chest) => (
          <div
            key={chest.id}
            className={`border-2 ${chest.borderColor} ${chest.bgGradient} ${chest.glowColor} p-5 flex flex-col items-center text-center justify-between space-y-4 transition-all hover:scale-[1.02] relative`}
          >
            <div className="space-y-1.5">
              <span className={`inline-block px-2.5 py-0.5 border text-[9px] tracking-wider uppercase font-bold ${chest.accentBadge}`}>
                {chest.rarityTag}
              </span>
              <h3 className="font-headline font-bold text-base text-white uppercase">
                {chest.name}
              </h3>
            </div>

            <div className="w-20 h-20 bg-black/80 border border-zinc-800 flex items-center justify-center relative overflow-hidden my-2">
              {chest.id === "void" ? (
                <Sparkles className="w-10 h-10 text-[#00ff41] animate-pulse" />
              ) : chest.id === "silver" ? (
                <Zap className="w-10 h-10 text-sky-400" />
              ) : (
                <Shield className="w-10 h-10 text-zinc-400" />
              )}
            </div>

            <button
              onClick={() => handlePurchaseChest(chest)}
              disabled={loadingChest !== null}
              className={`w-full py-3 border font-headline font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                chest.id === "void"
                  ? "border-[#00ff41] bg-[#00ff41] text-black hover:bg-[#00ff41]/90 shadow-[0_0_20px_rgba(0,255,65,0.4)]"
                  : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
              } disabled:opacity-50`}
            >
              <Coins className="w-3.5 h-3.5 text-[#00ff41]" />
              <span>0 GOLD (FREE TEST)</span>
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {openingPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            {openingPhase === "rolling" && (
              <div className="w-full max-w-lg space-y-6 text-center">
                <div className="space-y-1">
                  <h3 className="font-headline font-black text-2xl text-[#00ff41] uppercase tracking-wider animate-pulse">
                    OPENING CACHE REEL...
                  </h3>
                  <p className="text-xs text-zinc-400">ROULETTE REEL SPINNER IN MOTION</p>
                </div>

                <div className="relative w-full max-w-[340px] mx-auto">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 text-[#00ff41] filter drop-shadow-[0_0_10px_#00ff41]">
                    <Triangle className="w-6 h-6 fill-[#00ff41] rotate-180" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 text-[#00ff41] filter drop-shadow-[0_0_10px_#00ff41]">
                    <Triangle className="w-6 h-6 fill-[#00ff41]" />
                  </div>
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#00ff41] z-20 shadow-[0_0_15px_#00ff41]" />

                  <div className="w-full h-36 border-2 border-zinc-700 bg-[#0a0a0c] overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                    <motion.div
                      initial={{ x: 0 }}
                      animate={{ x: -targetX }}
                      transition={{
                        duration: 4.2,
                        ease: [0.15, 0.85, 0.35, 1.0],
                      }}
                      className="flex gap-0 h-full items-center pl-0"
                    >
                      {reelStrip.map((item, idx) => (
                        <div
                          key={idx}
                          className={`w-[112px] h-[128px] flex-shrink-0 border-r-2 ${getRarityCardBorder(
                            item.rarity
                          )} p-2 flex flex-col items-center justify-between text-center relative bg-black/60`}
                        >
                          <span className="text-[8px] font-bold uppercase tracking-wider">
                            {item.rarity}
                          </span>

                          <div className="w-12 h-12 flex items-center justify-center my-1">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.item_name}
                                className="w-full h-full object-contain [image-rendering:pixelated] scale-110"
                              />
                            ) : (
                              <Swords className="w-8 h-8 text-[#00ff41]" />
                            )}
                          </div>

                          <span className="text-[9px] font-bold text-white line-clamp-1 w-full">
                            {item.item_name}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">
                  SPINNING LOOT WHEEL...
                </div>
              </div>
            )}

            {openingPhase === "revealed" && drawnResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm border-2 border-zinc-800 bg-[#141416] p-6 text-center space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative"
              >
                <button
                  onClick={() => {
                    setOpeningPhase(null);
                    setDrawnResult(null);
                  }}
                  className="absolute top-4 right-4 p-1 border border-zinc-800 bg-black text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1 pt-2">
                  <span className={`inline-block px-3 py-1 border text-xs tracking-widest uppercase font-bold ${getRarityBadgeStyle(drawnResult.item.rarity)}`}>
                    {drawnResult.item.rarity} LOOT LANDED!
                  </span>
                  <h3 className="font-headline font-black text-xl text-white uppercase tracking-wider pt-2">
                    {drawnResult.item.item_name}
                  </h3>
                </div>

                <div className="w-24 h-24 bg-black border-2 border-zinc-800 flex items-center justify-center mx-auto my-2 p-2">
                  {drawnResult.item.image_url ? (
                    <img
                      src={drawnResult.item.image_url}
                      alt={drawnResult.item.item_name}
                      className="w-full h-full object-contain [image-rendering:pixelated] scale-125 drop-shadow-[0_0_10px_rgba(0,255,65,0.4)]"
                    />
                  ) : (
                    <Swords className="w-12 h-12 text-[#00ff41]" />
                  )}
                </div>

                <div className="bg-[#0a0a0c] border border-zinc-800 p-4 space-y-2 text-left text-xs">
                  <div className="text-zinc-400 italic mb-2">"{drawnResult.item.description}"</div>

                  <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-2 font-bold">
                    {drawnResult.item.bonus_str > 0 && <span className="text-amber-400">+ {drawnResult.item.bonus_str} STR</span>}
                    {drawnResult.item.bonus_agi > 0 && <span className="text-fuchsia-400">+ {drawnResult.item.bonus_agi} AGI</span>}
                    {drawnResult.item.bonus_vit > 0 && <span className="text-[#00ff41]">+ {drawnResult.item.bonus_vit} VIT</span>}
                    {drawnResult.item.bonus_hp > 0 && <span className="text-sky-400">+ {drawnResult.item.bonus_hp} MAX HP</span>}
                  </div>

                  {drawnResult.item.granted_skill_name && (
                    <div className="border-t border-zinc-800 pt-2 text-[#00ff41] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>UNLOCKS SKILL: {drawnResult.item.granted_skill_name}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setOpeningPhase(null);
                    setDrawnResult(null);
                  }}
                  className="w-full h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon"
                >
                  CLAIM TO VAULT INVENTORY
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
