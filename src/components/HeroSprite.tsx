"use client";

import React from "react";

export type HeroState = "idle" | "attack01" | "attack02" | "attack03";

interface HeroSpriteProps {
  currentState?: HeroState;
}

export function HeroSprite({ currentState = "idle" }: HeroSpriteProps) {
  const getSpriteClass = () => {
    if (currentState === "attack01") return "sprite-soldier-attack01";
    if (currentState === "attack02") return "sprite-soldier-attack02";
    if (currentState === "attack03") return "sprite-soldier-attack03";
    return "sprite-soldier-idle";
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="scale-[2.4] transform-gpu">
        <div className={`sprite-soldier ${getSpriteClass()}`} />
      </div>
    </div>
  );
}

export default HeroSprite;
