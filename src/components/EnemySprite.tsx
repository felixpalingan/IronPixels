"use client";

import React, { useState, useEffect } from "react";

export type EnemySpriteState = "idle" | "hit" | "dead";

interface EnemySpriteConfig {
  spriteKey: string;
  animPrefix: string;
  hasRunAnim: boolean;
  isBig: boolean;
}

interface EnemySpriteProps {
  currentState: EnemySpriteState;
  spriteConfig: EnemySpriteConfig;
  scale?: number;
}

export function EnemySprite({
  currentState,
  spriteConfig,
  scale,
}: EnemySpriteProps) {
  const [frameIndex, setFrameIndex] = useState<number>(0);

  const finalScale = scale ?? (spriteConfig.isBig ? 2.2 : 2.0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const getFramePath = () => {
    const { spriteKey, animPrefix, hasRunAnim } = spriteConfig;

    if (currentState === "hit" && hasRunAnim) {
      return `/assets/dungeon/monsters/${spriteKey}_run_anim_f${frameIndex}.png`;
    }

    return `/assets/dungeon/monsters/${spriteKey}_${animPrefix}_f${frameIndex}.png`;
  };

  const sizeClass = spriteConfig.isBig ? "w-9 h-11" : "w-5 h-7";

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className="transform-gpu transition-all origin-bottom"
        style={{
          transform: `scale(${finalScale}) scaleX(-1)`,
          imageRendering: "pixelated",
        }}
      >
        <img
          src={getFramePath()}
          alt="Dungeon Enemy"
          className={`${sizeClass} object-contain pixelated block drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] ${
            currentState === "hit" ? "animate-boss-hit opacity-90" : "animate-boss-idle"
          }`}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

export default EnemySprite;
