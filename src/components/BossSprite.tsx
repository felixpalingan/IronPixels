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
  scale = 2.2,
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

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className="transform-gpu transition-all origin-bottom"
        style={{ transform: `scale(${scale})`, imageRendering: "pixelated" }}
      >
        <img
          src={getBossFramePath()}
          alt="Dungeon Boss"
          className={`w-9 h-11 object-contain pixelated block drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] ${
            currentState === "hit" ? "animate-boss-hit opacity-90" : "animate-boss-idle"
          } ${flipHorizontal ? "scale-x-[-1]" : ""}`}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

export default BossSprite;
