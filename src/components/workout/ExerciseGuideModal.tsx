"use client";

import React, { memo } from "react";
import { X, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseDefinition } from "@/lib/exercisesData";

interface ExerciseGuideModalProps {
  activeExercise: ExerciseDefinition | null;
  onClose: () => void;
}

export const ExerciseGuideModal = memo<ExerciseGuideModalProps>(function ExerciseGuideModal({
  activeExercise,
  onClose,
}) {
  return (
    <AnimatePresence>
      {activeExercise && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-exercise-title"
            className="w-full max-w-md border-2 border-[#00ff41] bg-surface p-5 space-y-4 shadow-[0_0_50px_rgba(0,255,65,0.3)] font-mono relative"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panduan gerakan"
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="space-y-1 border-b border-pixel-border/50 pb-3 pr-6">
              <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                EXECUTION GUIDE & INSTRUCTIONS
              </span>
              <h3 id="guide-exercise-title" className="font-headline font-black text-lg text-white uppercase tracking-wider">
                {activeExercise.name}
              </h3>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-2.5 border border-pixel-border/60 bg-black/80 space-y-1">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">TARGET MUSCLE GROUPS</div>
                <div className="flex flex-wrap gap-1 text-white font-bold">
                  {activeExercise.targetMuscles.map((m) => (
                    <span key={m} className="px-1.5 py-0.5 bg-zinc-800 text-[10px] uppercase">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 border border-pixel-border/60 bg-black/80 space-y-2">
                <div className="text-[10px] text-[#00ff41] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  FORM & MOVEMENT STEPS:
                </div>
                <ol className="list-decimal list-inside space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                  {activeExercise.instructions.map((step, idx) => (
                    <li key={idx} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer"
            >
              GOT IT
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
