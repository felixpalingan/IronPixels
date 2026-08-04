"use client";

import { Sword, Shield, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface GearItem {
  slot: string;
  name: string;
  icon?: string;
  image_url?: string;
}

interface EquippedGearGridProps {
  gear: GearItem[];
}

export function EquippedGearGrid({ gear }: EquippedGearGridProps) {
  const weapon = gear.find((g) => g.slot.toLowerCase() === "weapon") || {
    slot: "weapon",
    name: "Rusty Iron Broadsword",
    image_url: "/assets/items/weapons/Icon1.png",
  };

  const armor = gear.find((g) => g.slot.toLowerCase() === "armor") || {
    slot: "armor",
    name: "Novice Defender Shield",
    image_url: "/assets/items/shields/Icon1.png",
  };

  const accessories = gear.filter((g) => g.slot.toLowerCase() === "accessory");

  const accessory1 = accessories[0] || {
    slot: "accessory",
    name: "Copper Amulet",
    image_url: "/assets/items/amulets/Icon25.png",
  };

  const accessory2 = accessories[1] || {
    slot: "accessory",
    name: "Iron Ring of Power",
    image_url: "/assets/items/amulets/Icon26.png",
  };

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-3 font-mono">
        <span className="text-[11px] tracking-wider text-gray-400 uppercase font-bold">
          EQUIPPED GEAR (4 SLOTS)
        </span>
        <span className="px-2 py-0.5 border border-pixel-green text-pixel-green text-[10px] uppercase font-bold bg-pixel-green/10 shadow-neon">
          4-Piece Synergy Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green shadow-neon"
        >
          <div className="w-10 h-10 bg-black border border-pixel-border flex items-center justify-center p-1 overflow-hidden">
            {weapon.image_url ? (
              <img
                src={weapon.image_url}
                alt={weapon.name}
                className="w-full h-full object-contain pixelated scale-110"
              />
            ) : (
              <Sword className="w-5 h-5 text-pixel-green" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-[#00ff41] uppercase tracking-wider font-extrabold">
              WEAPON (HIGH DMG)
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {weapon.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green shadow-neon"
        >
          <div className="w-10 h-10 bg-black border border-pixel-border flex items-center justify-center p-1 overflow-hidden">
            {armor.image_url ? (
              <img
                src={armor.image_url}
                alt={armor.name}
                className="w-full h-full object-contain pixelated scale-110"
              />
            ) : (
              <Shield className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-sky-400 uppercase tracking-wider font-extrabold">
              SHIELD / ARMOR
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {armor.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green shadow-neon"
        >
          <div className="w-10 h-10 bg-black border border-pixel-border flex items-center justify-center p-1 overflow-hidden">
            {accessory1.image_url ? (
              <img
                src={accessory1.image_url}
                alt={accessory1.name}
                className="w-full h-full object-contain pixelated scale-110"
              />
            ) : (
              <Heart className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-amber-400 uppercase tracking-wider font-extrabold">
              ACCESSORY #1
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {accessory1.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green shadow-neon"
        >
          <div className="w-10 h-10 bg-black border border-pixel-border flex items-center justify-center p-1 overflow-hidden">
            {accessory2.image_url ? (
              <img
                src={accessory2.image_url}
                alt={accessory2.name}
                className="w-full h-full object-contain pixelated scale-110"
              />
            ) : (
              <Heart className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-amber-400 uppercase tracking-wider font-extrabold">
              ACCESSORY #2
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {accessory2.name}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
