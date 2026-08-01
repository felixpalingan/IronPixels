"use client";

import { LayoutGrid, Swords, Shield, Store } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const tabs = [
    { id: "hub", label: "HUB", icon: LayoutGrid },
    { id: "quests", label: "QUESTS", icon: Swords },
    { id: "inventory", label: "INVENTORY", icon: Shield },
    { id: "shop", label: "SHOP", icon: Store },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-background/95 backdrop-blur-md border-t border-pixel-border/80 px-4 py-2 z-50">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 border transition-all ${
                isActive
                  ? "border-pixel-green bg-pixel-green/10 text-pixel-green shadow-neon"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="font-mono text-[10px] tracking-widest font-bold">
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
