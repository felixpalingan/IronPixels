"use client";

import React from "react";

export type HeroState = "idle" | "attack";

interface HeroSpriteProps {
  currentState?: HeroState;
}

export function HeroSprite({ currentState = "idle" }: HeroSpriteProps) {
  const getSpriteClass = () => {
    if (currentState === "attack") return "sprite-soldier-attack";
    return "sprite-soldier-idle";
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="scale-[2.2] transform-gpu">
        <div className={`sprite-soldier ${getSpriteClass()}`} />
      </div>
    </div>
  );
}

export default HeroSprite;
