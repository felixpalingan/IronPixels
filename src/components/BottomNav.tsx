"use client";

import { Home, Swords, ShoppingBag, Package, Users } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const tabs = [
    { id: "hub", label: "THE HUB", icon: Home },
    { id: "quests", label: "QUESTS", icon: Swords },
    { id: "multiplayer", label: "SOCIAL", icon: Users },
    { id: "shop", label: "SHOP", icon: ShoppingBag },
    { id: "inventory", label: "VAULT", icon: Package },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-pixel-border/60 flex justify-center">
      <div className="w-full max-w-[600px] grid grid-cols-5 p-1.5 gap-1 font-mono">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? "bg-pixel-green text-black font-extrabold shadow-neon"
                  : "text-gray-400 hover:text-white hover:bg-surface/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] tracking-wider uppercase font-bold">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
