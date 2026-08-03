"use client";

import React from "react";

export type BossState = "idle" | "hit" | "dead";

interface BossSpriteProps {
  currentState: BossState;
  currentHp: number;
  maxHp: number;
  bossType?: "orc" | "blood" | "demon" | "dragon" | "mecha" | "lich";
  flipHorizontal?: boolean;
}

export function BossSprite({
  currentState,
  currentHp,
  maxHp,
  bossType = "orc",
  flipHorizontal = true,
}: BossSpriteProps) {
  const getSpriteClass = () => {
    if (currentState === "hit") return "sprite-hit";
    if (currentState === "dead") return "sprite-dead";
    return "sprite-idle";
  };

  const getBossFilter = () => {
    switch (bossType) {
      case "orc":
        return "hue-rotate(90deg) saturate(1.8) brightness(0.9)";
      case "blood":
        return "hue-rotate(-40deg) saturate(2.5) contrast(1.2)";
      case "dragon":
        return "hue-rotate(240deg) saturate(2.2) brightness(0.85)";
      case "mecha":
        return "hue-rotate(180deg) saturate(1.5) brightness(1.2)";
      case "lich":
        return "hue-rotate(45deg) saturate(2.0) contrast(1.4)";
      case "demon":
      default:
        return "none";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="scale-[2.4] transform-gpu">
        <div
          className={`sprite-boss ${getSpriteClass()} ${
            flipHorizontal ? "flip-horizontal" : ""
          }`}
          style={{ filter: getBossFilter() }}
        />
      </div>
    </div>
  );
}

export default BossSprite;
