"use client";

import React from "react";
import { formatNumber } from "@/lib/formatters";

export type BossState = "idle" | "hit" | "dead";

interface BossSpriteProps {
  currentState: BossState;
  currentHp: number;
  maxHp: number;
}

export function BossSprite({
  currentState,
  currentHp,
  maxHp,
}: BossSpriteProps) {
  const getSpriteClass = () => {
    if (currentState === "hit") return "sprite-hit";
    if (currentState === "dead") return "sprite-dead";
    return "sprite-idle";
  };

  const hpPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      <div className="w-64 bg-surface border border-pixel-border p-2 mb-4 shadow-red-glow">
        <div className="flex justify-between text-xs font-mono text-health-red font-bold mb-1">
          <span>BOSS HP</span>
          <span>
            {formatNumber(currentHp)} / {formatNumber(maxHp)}
          </span>
        </div>
        <div className="w-full bg-black h-3 border border-pixel-border overflow-hidden">
          <div
            className="bg-health-red h-full transition-all duration-300 shadow-red-glow"
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      <div className="scale-[2.5] transform-gpu my-6">
        <div className={`sprite-boss ${getSpriteClass()}`} />
      </div>
    </div>
  );
}

export default BossSprite;
