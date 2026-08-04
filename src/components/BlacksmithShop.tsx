"use client";

import { useState } from "react";
import { Coins, X, HeartPulse, Check, Triangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { EQUIPMENT_DICTIONARY, EquipmentItem, InventoryRecord } from "@/lib/equipment";

interface BlacksmithShopProps {
  userGold: number;
  onUpdateGold: (newGold: number) => void;
  onAddItemToInventory: (newItem: InventoryRecord) => void;
  onFullHeal?: () => void;
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
  cardDisplayFrame: string;
  openPrefix: string;
}

const CHEST_OPTIONS: ChestOption[] = [
  {
    id: "bronze",
    name: "Bronze Cache",
    rarityTag: "COMMON & RARE",
    price: 500,
    borderColor: "border-zinc-600",
    glowColor: "shadow-[0_0_20px_rgba(113,113,122,0.3)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-zinc-800 text-zinc-300 border-zinc-700",
    cardDisplayFrame: "/assets/dungeon/chests/chest_empty_open_anim_f0.png",
    openPrefix: "chest_empty_open_anim",
  },
  {
    id: "silver",
    name: "Silver Cache",
    rarityTag: "RARE & EPIC GEAR",
    price: 2500,
    borderColor: "border-[#00ff41]",
    glowColor: "shadow-[0_0_25px_rgba(0,255,65,0.4)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]/50",
    cardDisplayFrame: "/assets/dungeon/chests/chest_full_open_anim_f2.png",
    openPrefix: "chest_full_open_anim",
  },
  {
    id: "void",
    name: "Void Relic Chest",
    rarityTag: "LEGENDARY RELICS",
    price: 10000,
    borderColor: "border-amber-400",
    glowColor: "shadow-[0_0_30px_rgba(251,191,36,0.5)]",
    bgGradient: "bg-[#141416]",
    accentBadge: "bg-amber-400/20 text-amber-300 border-amber-400/50",
    cardDisplayFrame: "/assets/dungeon/chests/chest_mimic_open_anim_f2.png",
    openPrefix: "chest_mimic_open_anim",
  },
];

export function BlacksmithShop({
  userGold,
  onUpdateGold,
  onAddItemToInventory,
  onFullHeal,
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
  const [potionNotice, setPotionNotice] = useState<string | null>(null);

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
    if (option.id === "bronze") {
      candidates = EQUIPMENT_DICTIONARY.filter(
        (item) => item.rarity === "common" || item.rarity === "rare"
      );
    } else if (option.id === "silver") {
      candidates = EQUIPMENT_DICTIONARY.filter(
        (item) => item.rarity === "rare" || item.rarity === "epic"
      );
    } else if (option.id === "void") {
      candidates = EQUIPMENT_DICTIONARY.filter(
        (item) => item.rarity === "epic" || item.rarity === "legendary" || item.rarity === "mythic"
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

  const handleBuyFullHealPotion = () => {
    const POTION_PRICE = 10000;
    if (userGold < POTION_PRICE) return;

    onUpdateGold(userGold - POTION_PRICE);
    if (onFullHeal) {
      onFullHeal();
    }
    setPotionNotice("FULL HEAL POTION CONSUMED! HP RESTORED TO 100%!");
    setTimeout(() => setPotionNotice(null), 3500);
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

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      <div className="border border-pixel-border bg-surface p-3 flex items-center justify-between shadow-neon">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 border border-gold-loot bg-gold-loot/10 text-gold-loot flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="font-headline font-black text-sm text-white uppercase tracking-wider">
              DUNGEON CHEST FORGE
            </div>
            <div className="text-[10px] text-zinc-400 font-bold">
              0x72 DUNGEON GACHA LOOT CHESTS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black border border-gold-loot/60 px-3 py-1 text-gold-loot font-bold text-sm shadow-gold-glow">
          <Coins className="w-4 h-4 text-gold-loot" />
          <span>{formatNumber(userGold)} GOLD</span>
        </div>
      </div>

      {potionNotice && (
        <div className="bg-[#00ff41]/20 border border-[#00ff41] p-2.5 text-xs font-bold text-[#00ff41] text-center shadow-neon animate-pulse flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>{potionNotice}</span>
        </div>
      )}

      <div className="border border-[#00ff41]/60 bg-surface p-3.5 flex items-center justify-between shadow-neon">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 border-2 border-red-500 bg-red-950/40 text-red-400 flex items-center justify-center shadow-red-glow">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-headline font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>ELIXIR OF FULL RECOVERY</span>
              <span className="text-[9px] bg-red-950/80 border border-red-500 text-red-300 px-1.5 py-0.5 font-extrabold">
                100% HEAL
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-bold mt-0.5">
              INSTANTLY RESTORES HERO HP BACK TO 100% MAX HP!
            </div>
          </div>
        </div>

        <button
          onClick={handleBuyFullHealPotion}
          disabled={userGold < 10000}
          className={`px-3 py-2 border font-headline font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
            userGold >= 10000
              ? "border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black shadow-neon"
              : "border-zinc-800 bg-black/40 text-zinc-600 cursor-not-allowed"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>10,000 GOLD</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CHEST_OPTIONS.map((opt) => {
          const canAfford = userGold >= opt.price;
          return (
            <div
              key={opt.id}
              className={`border p-3 flex flex-col justify-between text-center relative transition-all ${opt.bgGradient} ${opt.borderColor} ${opt.glowColor}`}
            >
              <div>
                <span
                  className={`text-[8px] font-extrabold px-1.5 py-0.5 uppercase border ${opt.accentBadge}`}
                >
                  {opt.rarityTag}
                </span>

                <div className="w-16 h-16 mx-auto my-3 border border-pixel-border bg-black/80 flex items-center justify-center shadow-neon">
                  <img
                    src={opt.cardDisplayFrame}
                    alt={opt.name}
                    className="w-12 h-12 object-contain pixelated scale-125 hover:scale-135 transition-transform"
                  />
                </div>

                <h4 className="font-headline font-extrabold text-xs text-white uppercase tracking-wider">
                  {opt.name}
                </h4>
              </div>

              <button
                onClick={() => handleOpenChest(opt)}
                disabled={!canAfford || isOpening}
                className={`w-full mt-3 py-2 border font-headline font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  canAfford && !isOpening
                    ? "border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black shadow-neon"
                    : "border-zinc-800 bg-black/40 text-zinc-600 cursor-not-allowed"
                }`}
              >
                <Coins className="w-3 h-3" />
                <span>{formatNumber(opt.price)} GOLD</span>
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {openingPhase && activeChest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md border-2 border-pixel-green bg-surface p-6 text-center space-y-5 shadow-neon relative font-mono">
              {!isOpening && (
                <button
                  onClick={() => {
                    setOpeningPhase(null);
                    setActiveChest(null);
                    setDrawnResult(null);
                  }}
                  className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div>
                <span className="text-[10px] text-pixel-green font-extrabold uppercase tracking-widest">
                  FORGING CHEST REWARD
                </span>
                <h3 className="font-headline font-black text-2xl text-white uppercase mt-0.5">
                  {activeChest.name}
                </h3>
              </div>

              {openingPhase === "rolling" && (
                <div className="space-y-4 py-4">
                  <div className="relative w-full h-28 bg-black border-2 border-pixel-border overflow-hidden flex items-center shadow-inner">
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-pixel-green z-20 shadow-neon" />
                    <Triangle className="w-4 h-4 text-pixel-green fill-pixel-green absolute left-1/2 -top-2 -translate-x-1/2 rotate-180 z-30" />

                    <motion.div
                      initial={{ x: 0 }}
                      animate={{ x: -targetX }}
                      transition={{ duration: 4, ease: [0.15, 0.85, 0.35, 1] }}
                      className="flex gap-2 px-2 absolute left-0"
                    >
                      {reelStrip.map((item, idx) => {
                        const badgeStyle = getRarityBadgeStyle(item.rarity);
                        return (
                          <div
                            key={idx}
                            className="w-24 h-24 bg-surface border border-pixel-border p-2 flex flex-col items-center justify-between flex-shrink-0"
                          >
                            <div className="w-10 h-10 bg-black border border-pixel-border p-1 flex items-center justify-center">
                              <img
                                src={item.image_url}
                                alt={item.item_name}
                                className="w-full h-full object-contain pixelated"
                              />
                            </div>
                            <span
                              className={`text-[7px] font-extrabold uppercase px-1 border ${badgeStyle}`}
                            >
                              {item.rarity}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  </div>

                  <div className="text-xs text-pixel-green font-bold animate-pulse">
                    UNFORGING RELIC CHEST...
                  </div>
                </div>
              )}

              {openingPhase === "revealed" && drawnResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4 py-2"
                >
                  <div className="w-28 h-28 mx-auto bg-black border-2 border-[#00ff41] p-3 flex flex-col items-center justify-center shadow-neon">
                    <img
                      src={drawnResult.item.image_url}
                      alt={drawnResult.item.item_name}
                      className="w-16 h-16 object-contain pixelated mb-2 scale-125"
                    />
                    <span
                      className={`text-[8px] font-extrabold uppercase px-2 py-0.5 border ${getRarityBadgeStyle(
                        drawnResult.item.rarity
                      )}`}
                    >
                      {drawnResult.item.rarity}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-headline font-black text-xl text-white uppercase">
                      {drawnResult.item.item_name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {drawnResult.item.description}
                    </p>
                  </div>

                  <div className="bg-black/60 border border-pixel-border p-3 text-xs space-y-1 text-left">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">
                      ITEM STAT BONUS
                    </div>
                    {drawnResult.item.bonus_str > 0 && (
                      <div className="text-amber-400 font-bold">+ {drawnResult.item.bonus_str} STR</div>
                    )}
                    {drawnResult.item.bonus_agi > 0 && (
                      <div className="text-sky-400 font-bold">+ {drawnResult.item.bonus_agi} AGI</div>
                    )}
                    {drawnResult.item.bonus_vit > 0 && (
                      <div className="text-[#00ff41] font-bold">+ {drawnResult.item.bonus_vit} VIT</div>
                    )}
                    {drawnResult.item.bonus_hp > 0 && (
                      <div className="text-red-400 font-bold">+ {drawnResult.item.bonus_hp} MAX HP</div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setOpeningPhase(null);
                      setActiveChest(null);
                      setDrawnResult(null);
                    }}
                    className="w-full py-3 bg-[#00ff41] text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer"
                  >
                    CLAIM & ADD TO VAULT
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
