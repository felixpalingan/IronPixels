"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = "", children }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer-wave border border-zinc-800/80 relative overflow-hidden select-none ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Skeleton Card for Workout History sessions
 */
export function WorkoutHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-pixel-border/80 bg-surface/80 p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 bg-zinc-900 border border-zinc-700" />
              <div className="space-y-1.5">
                <Skeleton className="w-32 h-3.5 bg-zinc-800" />
                <Skeleton className="w-20 h-2.5 bg-zinc-900" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="w-16 h-3 bg-zinc-800 ml-auto" />
              <Skeleton className="w-12 h-2.5 bg-zinc-900 ml-auto" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-pixel-border/40">
            <Skeleton className="h-10 bg-zinc-900/90" />
            <Skeleton className="h-10 bg-zinc-900/90" />
            <Skeleton className="h-10 bg-zinc-900/90" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Cards for Vault Inventory items
 */
export function InventoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border border-zinc-800/80 bg-[#141416]/90 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="w-16 h-16 bg-zinc-900 border border-zinc-700 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="w-3/4 h-3.5 bg-zinc-800" />
              <div className="flex gap-1.5">
                <Skeleton className="w-14 h-4 bg-zinc-900" />
                <Skeleton className="w-12 h-4 bg-zinc-900" />
              </div>
              <Skeleton className="w-full h-2.5 bg-zinc-900" />
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
            <Skeleton className="w-20 h-7 bg-zinc-900" />
            <Skeleton className="w-24 h-7 bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Rows for Multiplayer Leaderboard rankings
 */
export function LeaderboardSkeleton({ count = 5 }: { count?: number } = {}) {
  const items = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i} className="border border-pixel-border/60 bg-surface/90 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 bg-zinc-900 border border-zinc-700 flex-shrink-0" />
            <Skeleton className="w-8 h-8 bg-black border border-zinc-800 flex-shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="w-28 h-3.5 bg-zinc-800" />
              <Skeleton className="w-20 h-2.5 bg-zinc-900" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="w-20 h-4 bg-zinc-800 ml-auto" />
            <Skeleton className="w-12 h-2.5 bg-zinc-900 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
