"use client";

import { Sword, Shield, Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface GearItem {
  slot: string;
  name: string;
  icon?: string;
}

interface EquippedGearGridProps {
  gear: GearItem[];
}

export function EquippedGearGrid({ gear }: EquippedGearGridProps) {
  const getGearBySlot = (slotName: string) => {
    return gear.find((g) => g.slot.toLowerCase() === slotName.toLowerCase());
  };

  const weapon = getGearBySlot("weapon") || { slot: "weapon", name: "Iron Blade...", icon: "sword" };
  const armor = getGearBySlot("armor") || { slot: "armor", name: "Chainmail", icon: "shield" };
  const accessory = getGearBySlot("accessory") || { slot: "accessory", name: "Vitality A...", icon: "heart" };

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] tracking-wider text-gray-400 uppercase">
          EQUIPPED GEAR
        </span>
        <span className="px-2 py-0.5 border border-pixel-green text-pixel-green font-mono text-[10px] uppercase font-semibold bg-pixel-green/10 shadow-neon">
          Set Bonus Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green"
        >
          <div className="w-10 h-10 bg-black/60 border border-pixel-border flex items-center justify-center text-mana-purple">
            <Sword className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">
              WEAPON
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {weapon.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green"
        >
          <div className="w-10 h-10 bg-black/60 border border-pixel-border flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">
              ARMOR
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {armor.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-pixel-border bg-surface p-3 flex items-center gap-3 transition-colors hover:border-pixel-green"
        >
          <div className="w-10 h-10 bg-black/60 border border-pixel-border flex items-center justify-center text-health-red">
            <Heart className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">
              ACCESSORY
            </span>
            <span className="font-headline font-bold text-xs text-white truncate">
              {accessory.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-dashed border-pixel-border/60 bg-surface/30 p-3 flex items-center justify-center gap-2 cursor-pointer hover:border-pixel-green/50 transition-colors"
        >
          <Plus className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-[11px] text-gray-500 font-semibold tracking-wider">
            EMPTY SLOT
          </span>
        </motion.div>
      </div>
    </div>
  );
}
