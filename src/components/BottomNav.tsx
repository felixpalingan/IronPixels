"use client";

import { Home, Swords, TrendingUp, ShoppingBag, Package, Users } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const tabs = [
    { id: "hub", label: "THE HUB", icon: Home },
    { id: "quests", label: "QUESTS", icon: Swords },
    { id: "analytics", label: "STATS", icon: TrendingUp },
    { id: "multiplayer", label: "SOCIAL", icon: Users },
    { id: "shop", label: "SHOP", icon: ShoppingBag },
    { id: "inventory", label: "VAULT", icon: Package },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-pixel-border/60 flex justify-center pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-[600px] grid grid-cols-6 p-1 sm:p-1.5 gap-0.5 sm:gap-1 font-mono">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`py-1.5 sm:py-2 px-0.5 flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
                isActive
                  ? "bg-pixel-green text-black font-extrabold shadow-neon"
                  : "text-gray-400 hover:text-white hover:bg-surface/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[8px] sm:text-[9px] tracking-tight sm:tracking-wider uppercase font-bold truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
