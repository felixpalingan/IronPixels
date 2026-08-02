"use client";

import React from "react";
import { formatNumber } from "@/lib/formatters";

export type BossState = "idle" | "hit" | "dead";

interface BossSpriteProps {
  currentState: BossState;
  currentHp: number;
  maxHp: number;
  flipHorizontal?: boolean;
}

export function BossSprite({
  currentState,
  currentHp,
  maxHp,
  flipHorizontal = true,
}: BossSpriteProps) {
  const getSpriteClass = () => {
    if (currentState === "hit") return "sprite-hit";
    if (currentState === "dead") return "sprite-dead";
    return "sprite-idle";
  };

  const hpPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="scale-[2.2] transform-gpu">
        <div
          className={`sprite-boss ${getSpriteClass()} ${
            flipHorizontal ? "flip-horizontal" : ""
          }`}
        />
      </div>
    </div>
  );
}

export default BossSprite;
