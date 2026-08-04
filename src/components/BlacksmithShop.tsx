"use client";

import { useState } from "react";
import { Coins, Sparkles, X, Swords, PackageOpen, Triangle } from "lucide-react";
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
    name: "Silver Cache",
    rarityTag: "RARE & EPIC GEAR",
    price: 500,
    borderColor: "border-[#00ff41]",
    glowColor: "shadow-[0_0_25px_rgba(0,255,65,0.3)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]/50",
  },
  {
    id: "void",
    name: "Void Relic Chest",
    rarityTag: "LEGENDARY GUARANTEED",
    price: 2500,
    borderColor: "border-amber-400",
    glowColor: "shadow-[0_0_30px_rgba(251,191,36,0.4)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-amber-400/20 text-amber-300 border-amber-400/50",
  },
];

export function BlacksmithShop({
  userGold,
  onUpdateGold,
  onAddItemToInventory,
}: BlacksmithShopProps) {
  const [openingPhase, setOpeningPhase] = useState<"rolling" | "revealed" | null>(null);
  const [activeChest, setActiveChest] = useState<ChestOption | null>(null);
  const [reelStrip, setReelStrip] = useState<EquipmentItem[]>([]);
  const [drawnResult, setDrawnResult] = useState<{
    item: EquipmentItem;
    inventory_id: string;
    db_status?: string;
  } | null>(null);
  const [targetX, setTargetX] = useState<number>(0);
  const [isOpening, setIsOpening] = useState<boolean>(false);

  const generateReelStrip = (winnerItem: EquipmentItem): EquipmentItem[] => {
    const strip: EquipmentItem[] = [];
    const totalItems = 35;
    const winnerIndex = 28;

    for (let i = 0; i < totalItems; i++) {
      if (i === winnerIndex) {
        strip.push(winnerItem);
      } else {
        const randomItem =
          EQUIPMENT_DICTIONARY[Math.floor(Math.random() * EQUIPMENT_DICTIONARY.length)];
        strip.push(randomItem);
      }
    }
    return strip;
  };

  const handleOpenChest = async (option: ChestOption) => {
    if (userGold < option.price || isOpening) return;

    setIsOpening(true);
    setActiveChest(option);

    let candidates = EQUIPMENT_DICTIONARY;
    if (option.id === "silver") {
      candidates = EQUIPMENT_DICTIONARY.filter(
        (item) => item.rarity === "rare" || item.rarity === "epic"
      );
    } else if (option.id === "void") {
      candidates = EQUIPMENT_DICTIONARY.filter(
        (item) => item.rarity === "legendary" || item.rarity === "mythic"
      );
    }

    const lockedWinner =
      candidates[Math.floor(Math.random() * candidates.length)] || EQUIPMENT_DICTIONARY[0];
    const strip = generateReelStrip(lockedWinner);
    setReelStrip(strip);

    const winnerIndex = 28;
    const itemWidth = 112;
    const offsetInWinner = Math.floor(Math.random() * 50) + 30;
    const calculatedTargetX = winnerIndex * itemWidth + offsetInWinner - 170;
    setTargetX(calculatedTargetX);

    setOpeningPhase("rolling");

    try {
      const res = await fetch("/api/shop/gacha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chest_type: option.id }),
      });

      const data = await res.json();
      const finalItem: EquipmentItem = data.item || lockedWinner;

      if (data.new_gold !== undefined) {
        onUpdateGold(data.new_gold);
      } else {
        onUpdateGold(Math.max(0, userGold - option.price));
      }

      const newInvRecord: InventoryRecord = {
        inventory_id: data.inventory_id || `inv-${Date.now()}`,
        user_id: "user-1",
        item_id: finalItem.item_id,
        is_equipped: false,
        item: finalItem,
      };

      onAddItemToInventory(newInvRecord);

      setTimeout(() => {
        setDrawnResult({
          item: finalItem,
          inventory_id: newInvRecord.inventory_id,
          db_status: data.db_status,
        });
        setOpeningPhase("revealed");
        setIsOpening(false);
      }, 4300);
    } catch (err) {
      setTimeout(() => {
        setDrawnResult({
          item: lockedWinner,
          inventory_id: `inv-${Date.now()}`,
        });
        setOpeningPhase("revealed");
        setIsOpening(false);
      }, 4300);
    }
  };

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case "mythic":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-red-glow";
      case "legendary":
        return "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-gold-glow";
      case "epic":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "rare":
        return "bg-sky-500/20 text-sky-300 border-sky-500/50";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getRarityCardBorder = (rarity: string) => {
    switch (rarity) {
      case "mythic":
        return "border-rose-500 bg-rose-950/30 text-rose-300";
      case "legendary":
        return "border-amber-400 bg-amber-950/30 text-amber-300";
      case "epic":
        return "border-purple-500 bg-purple-950/30 text-purple-300";
      case "rare":
        return "border-sky-500 bg-sky-950/30 text-sky-300";
      default:
        return "border-zinc-700 bg-zinc-900 text-zinc-400";
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      <div className="border border-pixel-border bg-surface p-4 flex items-center justify-between shadow-neon">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-gold-loot/60 bg-gold-loot/10 flex items-center justify-center text-gold-loot">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">RESERVE GOLD</div>
            <div className="font-headline font-black text-xl text-gold-loot">
              {formatNumber(userGold)} GOLD
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-pixel-green font-bold uppercase tracking-widest">BLACKSMITH GACHA</div>
          <div className="text-xs text-zinc-400 font-bold">3 CHEST TIERS</div>
        </div>
      </div>

      <div className="space-y-4">
        {CHEST_OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`border-2 ${option.borderColor} ${option.bgGradient} p-5 space-y-4 relative overflow-hidden transition-all ${option.glowColor}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className={`inline-block px-2 py-0.5 border text-[10px] uppercase font-bold ${option.accentBadge}`}>
                  {option.rarityTag}
                </span>
                <h3 className="font-headline font-black text-xl text-white uppercase tracking-wider">
                  {option.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-black/60 border border-gold-loot/40 px-3 py-1 text-gold-loot shadow-gold-glow">
                <Coins className="w-4 h-4" />
                <span className="font-mono font-extrabold text-sm">
                  {option.price === 0 ? "FREE" : `${formatNumber(option.price)} GOLD`}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Spin the roulette wheel to unlock weapons, shields, and amulets.
            </p>

            <button
              onClick={() => handleOpenChest(option)}
              disabled={userGold < option.price || isOpening}
              className={`w-full py-3.5 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                userGold >= option.price && !isOpening
                  ? "bg-[#00ff41] hover:bg-[#00ff41]/90 text-black shadow-neon cursor-pointer"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
              }`}
            >
              <PackageOpen className="w-4 h-4" />
              <span>{userGold < option.price ? "INSUFFICIENT GOLD" : `OPEN ${option.name.toUpperCase()}`}</span>
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
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            {openingPhase === "rolling" && (
              <div className="w-full max-w-lg space-y-8 text-center my-auto py-6">
                <div className="space-y-1">
                  <h3 className="font-headline font-black text-2xl text-[#00ff41] uppercase tracking-wider animate-pulse">
                    OPENING {activeChest ? activeChest.name.toUpperCase() : "CHEST"}...
                  </h3>
                  <p className="text-xs text-zinc-400">ROULETTE REEL SPINNER IN MOTION</p>
                </div>

                <div className="relative w-full max-w-[340px] mx-auto py-4">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 text-[#00ff41] filter drop-shadow-[0_0_10px_#00ff41]">
                    <Triangle className="w-6 h-6 fill-[#00ff41] rotate-180" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 text-[#00ff41] filter drop-shadow-[0_0_10px_#00ff41]">
                    <Triangle className="w-6 h-6 fill-[#00ff41]" />
                  </div>
                  <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-0.5 bg-[#00ff41] z-20 shadow-[0_0_15px_#00ff41]" />

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
                                className="w-full h-full object-contain pixelated scale-110"
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
                className="w-full max-w-sm border-2 border-zinc-800 bg-[#141416] p-6 text-center space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative my-auto"
              >
                <button
                  onClick={() => {
                    setOpeningPhase(null);
                    setDrawnResult(null);
                  }}
                  className="absolute top-4 right-4 p-1 border border-zinc-800 bg-black text-zinc-400 hover:text-white cursor-pointer"
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

                <div className="w-24 h-24 bg-black border-2 border-zinc-800 flex items-center justify-center mx-auto my-2 p-2 shadow-neon">
                  {drawnResult.item.image_url ? (
                    <img
                      src={drawnResult.item.image_url}
                      alt={drawnResult.item.item_name}
                      className="w-full h-full object-contain pixelated scale-125 drop-shadow-[0_0_10px_rgba(0,255,65,0.4)]"
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
                  className="w-full h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer"
                >
                  SAVE ITEM TO INVENTORY
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
