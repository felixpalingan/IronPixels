"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PixelAvatarProps {
  className?: string;
  isCritical?: boolean;
  characterClass?: string;
  gender?: "m" | "f";
}

export function PixelAvatar({
  className = "",
  isCritical = false,
  characterClass = "knight",
  gender = "m",
}: PixelAvatarProps) {
  const [frameIndex, setFrameIndex] = useState<number>(0);

  let mappedClass = "knight";
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
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const heroFramePath = `/assets/dungeon/heroes/${heroKey}_idle_anim_f${frameIndex}.png`;

  return (
    <motion.div
      className={`relative border-2 ${
        isCritical
          ? "border-red-500 bg-red-950/50 shadow-[0_0_25px_rgba(255,59,48,0.8)]"
          : "border-[#00ff41]/80 bg-surface shadow-neon"
      } p-1.5 flex items-center justify-center overflow-hidden ${className}`}
      animate={{
        y: [0, -3, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />

      <img
        src={heroFramePath}
        alt="Hero Pixel Avatar"
        className="w-14 h-16 object-contain pixelated relative z-20 scale-125 drop-shadow-[0_0_10px_rgba(0,255,65,0.6)]"
      />

      <div
        className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-none z-30 ${
          isCritical ? "bg-red-500 animate-ping" : "bg-[#00ff41] animate-pulse shadow-neon"
        }`}
      />
    </motion.div>
  );
}
