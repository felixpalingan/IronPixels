"use client";

import React, { useState, useEffect } from "react";

export type BossState = "idle" | "hit" | "dead";

interface BossSpriteProps {
  currentState: BossState;
  currentHp: number;
  maxHp: number;
  bossType?: "orc" | "blood" | "demon" | "dragon" | "mecha" | "lich";
  flipHorizontal?: boolean;
  scale?: number;
}

export function BossSprite({
  currentState,
  currentHp,
  maxHp,
  bossType = "demon",
  flipHorizontal = true,
  scale = 2.4,
}: BossSpriteProps) {
  const [frameIndex, setFrameIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const getBossFramePath = () => {
    let bossKey = "big_demon";
    let animName = "idle_anim";

    if (bossType === "orc") {
      bossKey = "ogre";
      animName = "idle_anim";
    } else if (bossType === "blood") {
      bossKey = "big_zombie";
      animName = "idle_anim";
    } else if (bossType === "demon") {
      bossKey = "big_demon";
      animName = "idle_anim";
    } else if (bossType === "lich") {
      bossKey = "necromancer";
      animName = "anim";
    } else if (bossType === "dragon") {
      bossKey = "chort";
      animName = "idle_anim";
    } else if (bossType === "mecha") {
      bossKey = "orc_shaman";
      animName = "idle_anim";
    }

    if (currentState === "hit") {
      animName = bossKey === "necromancer" ? "anim" : "run_anim";
    }

    return `/assets/dungeon/monsters/${bossKey}_${animName}_f${frameIndex}.png`;
  };

  const getBossFilter = () => {
    switch (bossType) {
      case "orc":
        return "drop-shadow(0 0 10px rgba(0,255,65,0.6))";
      case "blood":
        return "drop-shadow(0 0 10px rgba(255,0,85,0.7))";
      case "dragon":
        return "hue-rotate(220deg) saturate(2.5) drop-shadow(0 0 12px rgba(147,51,234,0.7))";
      case "mecha":
        return "hue-rotate(180deg) saturate(1.8) brightness(1.3) drop-shadow(0 0 12px rgba(56,189,248,0.8))";
      case "lich":
        return "hue-rotate(270deg) saturate(2.0) contrast(1.3) drop-shadow(0 0 12px rgba(192,38,211,0.8))";
      case "demon":
      default:
        return "drop-shadow(0 0 12px rgba(239,68,68,0.8))";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className="transform-gpu transition-all origin-bottom"
        style={{ transform: `scale(${scale})` }}
      >
        <img
          src={getBossFramePath()}
          alt="Dungeon Boss"
          className={`w-9 h-11 object-contain pixelated ${
            currentState === "hit" ? "animate-boss-hit opacity-90" : "animate-boss-idle"
          } ${flipHorizontal ? "scale-x-[-1]" : ""}`}
          style={{ filter: getBossFilter() }}
        />
      </div>
    </div>
  );
}

export default BossSprite;
