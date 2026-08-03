"use client";

import { Plus } from "lucide-react";

interface StatRadarChartProps {
  stats: {
    str: number;
    agi: number;
    vit: number;
    luk: number;
  };
  availableAp?: number;
  onUpgradeStat?: (statKey: "str" | "agi" | "vit" | "luk") => void;
}

export function StatRadarChart({ stats, availableAp = 0, onUpgradeStat }: StatRadarChartProps) {
  const statList: Array<{ key: "str" | "agi" | "vit" | "luk"; label: string; color: string; val: number }> = [
    { key: "str", label: "STR (STRENGTH)", color: "text-amber-400", val: stats.str },
    { key: "agi", label: "AGI (AGILITY)", color: "text-fuchsia-400", val: stats.agi },
    { key: "vit", label: "VIT (VITALITY)", color: "text-[#00ff41]", val: stats.vit },
    { key: "luk", label: "LUK (LUCK)", color: "text-sky-400", val: stats.luk },
  ];

  return (
    <div className="bg-surface border border-pixel-border p-3 font-mono space-y-3">
      <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          HERO ATTRIBUTE STATS
        </span>
        {availableAp > 0 && (
          <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-wider animate-pulse">
            AVAILABLE AP: {availableAp} POINTS
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statList.map((st) => (
          <div
            key={st.key}
            className="p-2 border border-pixel-border/60 bg-black/60 flex items-center justify-between"
          >
            <div>
              <div className={`text-[9px] font-bold ${st.color}`}>{st.label}</div>
              <div className="text-sm font-extrabold text-white">{st.val}</div>
            </div>

            {availableAp > 0 && onUpgradeStat && (
              <button
                onClick={() => onUpgradeStat(st.key)}
                className="w-7 h-7 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] text-[#00ff41] hover:text-black flex items-center justify-center font-bold transition-all shadow-neon cursor-pointer"
                title={`Upgrade ${st.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
