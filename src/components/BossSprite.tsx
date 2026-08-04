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
  const getSpritePath = () => {
    let folder = "orc";
    let prefix = "Orc";

    if (bossType === "blood") {
      folder = "blood";
      prefix = "Blood Monster_A";
    } else if (bossType === "demon" || bossType === "dragon" || bossType === "mecha" || bossType === "lich") {
      folder = "demon";
      prefix = "Demon_A";
    }

    if (currentState === "hit") return `/assets/bosses/${folder}/${prefix}_Hurt.png`;
    if (currentState === "dead") return `/assets/bosses/${folder}/${prefix}_Death.png`;
    return `/assets/bosses/${folder}/${prefix}_Idle.png`;
  };

  const getAnimationClass = () => {
    if (currentState === "hit") return "animate-boss-hit";
    if (currentState === "dead") return "animate-boss-dead";
    return "animate-boss-idle";
  };

  const getBossFilter = () => {
    switch (bossType) {
      case "orc":
        return "drop-shadow(0 0 10px rgba(0,255,65,0.4))";
      case "blood":
        return "drop-shadow(0 0 10px rgba(255,0,85,0.6))";
      case "dragon":
        return "hue-rotate(220deg) saturate(2.5) drop-shadow(0 0 12px rgba(147,51,234,0.6))";
      case "mecha":
        return "hue-rotate(180deg) saturate(1.8) brightness(1.2) drop-shadow(0 0 12px rgba(56,189,248,0.7))";
      case "lich":
        return "hue-rotate(270deg) saturate(2.0) contrast(1.3) drop-shadow(0 0 12px rgba(192,38,211,0.7))";
      case "demon":
      default:
        return "drop-shadow(0 0 12px rgba(239,68,68,0.6))";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="scale-[2.4] transform-gpu">
        <div
          className={`w-[100px] h-[100px] bg-no-repeat pixelated ${getAnimationClass()} ${
            flipHorizontal ? "flip-horizontal" : ""
          }`}
          style={{
            backgroundImage: `url('${getSpritePath()}')`,
            filter: getBossFilter(),
          }}
        />
      </div>
    </div>
  );
}

export default BossSprite;
