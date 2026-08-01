"use client";

import { motion } from "framer-motion";

interface PixelAvatarProps {
  className?: string;
}

export function PixelAvatar({ className = "" }: PixelAvatarProps) {
  return (
    <motion.div
      className={`relative border-2 border-pixel-border bg-surface p-1 flex items-center justify-center overflow-hidden ${className}`}
      animate={{
        y: [0, -3, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
      <svg
        className="w-full h-full object-cover text-pixel-green"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" fill="#121418" />
        <path
          d="M30 20H70V40H80V70H70V80H30V70H20V40H30V20Z"
          fill="#1C1C1E"
          stroke="#00ff41"
          strokeWidth="2"
        />
        <rect x="35" y="30" width="30" height="10" fill="#00ff41" />
        <rect x="40" y="33" width="8" height="4" fill="#0A0A0A" />
        <rect x="52" y="33" width="8" height="4" fill="#0A0A0A" />
        <path
          d="M25 45H75V55H25V45Z"
          fill="#2A2A2A"
          stroke="#00ff41"
          strokeWidth="1"
        />
        <rect x="45" y="55" width="10" height="20" fill="#00ff41" />
        <rect x="30" y="70" width="40" height="10" fill="#48484A" />
        <circle cx="25" cy="35" r="3" fill="#0A84FF" />
        <circle cx="75" cy="35" r="3" fill="#0A84FF" />
      </svg>
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-pixel-green rounded-none animate-pulse shadow-neon z-20" />
    </motion.div>
  );
}
