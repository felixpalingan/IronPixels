"use client";

import { useState } from "react";
import { Coins, Swords, Shield, Heart, Sparkles, Check, Package, Trash2 } from "lucide-react";
import { InventoryRecord, ItemType } from "@/lib/equipment";
import { formatNumber } from "@/lib/formatters";

interface InventoryGridProps {
  inventory: InventoryRecord[];
  onToggleEquip: (inventoryId: string, currentEquippedState: boolean, itemType: ItemType) => void;
  onSellItem?: (inventoryId: string, sellGoldValue: number) => void;
}

export function getSellPriceByRarity(rarity: string): number {
  switch (rarity?.toLowerCase()) {
    case "mythic":
      return 3500;
    case "legendary":
      return 1200;
    case "epic":
      return 400;
    case "rare":
      return 150;
    case "common":
    default:
      return 50;
  }
}

export function InventoryGrid({ inventory, onToggleEquip, onSellItem }: InventoryGridProps) {
  const [filter, setFilter] = useState<"all" | ItemType>("all");

  const filteredInventory = inventory.filter(
    (rec) => filter === "all" || rec.item.type === filter
  );

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-amber-400 bg-amber-950/80 text-amber-300";
      case "epic":
        return "border-fuchsia-500 bg-fuchsia-950/80 text-fuchsia-300";
      case "rare":
        return "border-sky-400 bg-sky-950/80 text-sky-300";
      default:
        return "border-zinc-700 bg-zinc-900 text-zinc-400";
    }
  };

  return (
    <div className="space-y-5 selection:bg-[#00ff41] selection:text-black font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#00ff41]" />
          <span className="font-headline font-black text-lg tracking-wider text-white uppercase">
            VAULT INVENTORY
          </span>
        </div>
        <span className="text-xs text-zinc-400 font-bold">
          {inventory.length} ITEMS OWNED
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 bg-[#0a0a0c] border border-zinc-800 p-1 text-xs">
        {(["all", "weapon", "armor", "accessory"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`py-2 uppercase font-bold text-[10px] sm:text-xs transition-colors cursor-pointer ${
              filter === t
                ? "bg-[#00ff41] text-black shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredInventory.length === 0 ? (
        <div className="border border-zinc-800 bg-[#141416] p-8 text-center space-y-2">
          <Package className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 uppercase tracking-wider">
            NO ITEMS FOUND IN THIS CATEGORY.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredInventory.map((rec) => {
            const { item, is_equipped, inventory_id } = rec;
            const sellPrice = getSellPriceByRarity(item.rarity);

            return (
              <div
                key={inventory_id}
                className={`border p-4 bg-[#141416] space-y-3 flex flex-col justify-between transition-all ${
                  is_equipped
                    ? "border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black border border-zinc-800 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="w-full h-full object-contain [image-rendering:pixelated] scale-110"
                          />
                        ) : item.type === "armor" ? (
                          <Shield className="w-6 h-6 text-sky-400" />
                        ) : item.type === "accessory" ? (
                          <Heart className="w-6 h-6 text-fuchsia-400" />
                        ) : (
                          <Swords className="w-6 h-6 text-[#00ff41]" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm text-white uppercase line-clamp-1">
                          {item.item_name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 border text-[9px] uppercase font-bold ${getRarityBadgeStyle(item.rarity)}`}>
                            {item.rarity}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase">
                            {item.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {is_equipped && (
                      <span className="bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41] text-[9px] px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        EQUIPPED
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 italic">
                    "{item.description}"
                  </p>

                  <div className="bg-[#0a0a0c] border border-zinc-800/80 p-2 text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-1 font-bold text-[11px]">
                      {item.bonus_str > 0 && <span className="text-amber-400">+ {item.bonus_str} STR</span>}
                      {item.bonus_agi > 0 && <span className="text-fuchsia-400">+ {item.bonus_agi} AGI</span>}
                      {item.bonus_vit > 0 && <span className="text-[#00ff41]">+ {item.bonus_vit} VIT</span>}
                      {item.bonus_hp > 0 && <span className="text-sky-400">+ {item.bonus_hp} MAX HP</span>}
                    </div>

                    {item.granted_skill_name && (
                      <div className="text-[#00ff41] text-[10px] font-bold pt-1 border-t border-zinc-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>SKILL: {item.granted_skill_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onToggleEquip(inventory_id, is_equipped, item.type)}
                    className={`py-2.5 border font-mono font-bold text-xs uppercase transition-all cursor-pointer ${
                      is_equipped
                        ? "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                        : "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41] hover:text-black"
                    }`}
                  >
                    {is_equipped ? "UNEQUIP" : "EQUIP"}
                  </button>

                  <button
                    onClick={() => onSellItem && onSellItem(inventory_id, sellPrice)}
                    className="py-2.5 border border-amber-500/80 bg-amber-950/40 hover:bg-amber-500 hover:text-black text-amber-400 font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title={`Sell item for ${formatNumber(sellPrice)} Gold`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>SELL (+{formatNumber(sellPrice)})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
