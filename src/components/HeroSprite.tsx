"use client";

import React, { useState, useEffect } from "react";

export type HeroState = "idle" | "attack01" | "attack02" | "attack03";
export type CharacterClass = "knight" | "elf" | "wizzard" | "dwarf" | "lizard";
export type CharacterGender = "m" | "f";

interface HeroSpriteProps {
  currentState?: HeroState;
  characterClass?: CharacterClass | string;
  gender?: CharacterGender;
  scale?: number;
  weaponIcon?: string;
  showNameTag?: string;
}

export function HeroSprite({
  currentState = "idle",
  characterClass = "knight",
  gender = "m",
  scale = 2.0,
  weaponIcon,
  showNameTag,
}: HeroSpriteProps) {
  const [frameIndex, setFrameIndex] = useState<number>(0);

  let mappedClass: CharacterClass = "knight";
  const clsLower = (characterClass || "").toLowerCase();

  if (clsLower.includes("elf") || clsLower.includes("rogue") || clsLower.includes("ninja")) {
    mappedClass = "elf";
  } else if (clsLower.includes("wizzard") || clsLower.includes("wizard") || clsLower.includes("mage")) {
    mappedClass = "wizzard";
  } else if (clsLower.includes("dwarf") || clsLower.includes("titan") || clsLower.includes("berserker")) {
    mappedClass = "dwarf";
  } else if (clsLower.includes("lizard") || clsLower.includes("paladin") || clsLower.includes("vanguard")) {
    mappedClass = "lizard";
  }

  const genderSuffix = gender === "f" ? "f" : "m";
  const heroKey = `${mappedClass}_${genderSuffix}`;

  useEffect(() => {
    const intervalTime = currentState.startsWith("attack") ? 100 : 180;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentState]);

  const animType = currentState.startsWith("attack") ? "run" : "idle";
  const framePath = `/assets/dungeon/heroes/${heroKey}_${animType}_anim_f${frameIndex}.png`;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className="transform-gpu relative transition-transform origin-bottom flex flex-col items-center"
        style={{ transform: `scale(${scale})`, imageRendering: "pixelated" }}
      >
        <div className="relative flex items-center justify-center">
          <img
            src={framePath}
            alt={`${heroKey} Hero`}
            className="w-5 h-7 object-contain pixelated block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{ imageRendering: "pixelated" }}
          />
          {weaponIcon && (
            <img
              src={weaponIcon}
              alt="Equipped Weapon"
              className="w-3.5 h-3.5 absolute -right-2 top-1.5 origin-bottom-left transform -rotate-12 pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              style={{ imageRendering: "pixelated" }}
            />
          )}
        </div>
        {showNameTag && (
          <div className="text-[6px] font-black font-mono text-purple-200 bg-black/90 px-1 py-0.2 border border-purple-500/80 rounded-xs mt-0.5 uppercase tracking-tighter whitespace-nowrap shadow-[0_0_8px_rgba(168,85,247,0.6)]">
            {showNameTag}
          </div>
        )}
      </div>
    </div>
  );
}

export default HeroSprite;
