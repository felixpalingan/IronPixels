"use client";

import React, { memo } from "react";
import { Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingRestTimerProps {
  isTimerActive: boolean;
  restTimerSecs: number;
  restTimerTotalDuration: number;
  defaultRestTimerSecs: number;
  onAdjustTimer: (secondsDelta: number) => void;
  onCancelTimer: () => void;
}

export const FloatingRestTimer = memo<FloatingRestTimerProps>(function FloatingRestTimer({
  isTimerActive,
  restTimerSecs,
  restTimerTotalDuration,
  defaultRestTimerSecs,
  onAdjustTimer,
  onCancelTimer,
}) {
  return (
    <AnimatePresence>
      {isTimerActive && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="region"
          aria-label="Rest Timer Overlay"
          className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b-2 border-pixel-green px-3 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] shadow-[0_4px_30px_rgba(0,255,65,0.4)] backdrop-blur-md font-mono"
        >
          <div className="max-w-[600px] mx-auto space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border border-pixel-green bg-pixel-green/20 flex items-center justify-center text-pixel-green animate-pulse">
                  <Timer className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>REST TIMER AKTIF</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pixel-green animate-ping" aria-hidden="true" />
                  </div>
                  <div className="font-headline font-black text-xl sm:text-2xl text-pixel-green tracking-wider leading-none" aria-live="polite">
                    {Math.floor(restTimerSecs / 60)}:{(restTimerSecs % 60).toString().padStart(2, "0")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdjustTimer(-30)}
                  aria-label="Kurangi waktu istirahat 30 detik"
                  className="min-h-[42px] min-w-[42px] sm:min-h-[36px] sm:min-w-[36px] px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs sm:text-[11px] font-bold text-zinc-300 cursor-pointer transition-colors flex items-center justify-center active:scale-95"
                >
                  -30s
                </button>
                <button
                  type="button"
                  onClick={() => onAdjustTimer(30)}
                  aria-label="Tambah waktu istirahat 30 detik"
                  className="min-h-[42px] min-w-[42px] sm:min-h-[36px] sm:min-w-[36px] px-2.5 py-1.5 bg-amber-950/70 border border-amber-500 hover:border-amber-400 text-xs sm:text-[11px] font-bold text-amber-300 cursor-pointer shadow-gold-glow transition-colors flex items-center justify-center active:scale-95"
                >
                  +30s
                </button>
                <button
                  type="button"
                  onClick={onCancelTimer}
                  aria-label="Lewati waktu istirahat"
                  className="min-h-[42px] px-3.5 py-1.5 sm:min-h-[36px] bg-red-950/80 border border-red-600 hover:border-red-500 text-xs sm:text-[11px] font-bold text-red-300 cursor-pointer shadow-red-glow transition-colors flex items-center justify-center active:scale-95"
                >
                  SKIP
                </button>
              </div>
            </div>

            {/* Shrinking progress bar */}
            <div className="w-full bg-zinc-900 h-1 overflow-hidden">
              <div
                className="bg-pixel-green h-1 transition-all duration-500 ease-linear shadow-neon"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (restTimerSecs / (restTimerTotalDuration || defaultRestTimerSecs || 90)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
