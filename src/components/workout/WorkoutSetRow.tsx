"use client";

import React, { memo } from "react";
import { Check, X, History } from "lucide-react";
import { WeightUnit, toDisplayWeight } from "@/lib/unitConversion";
import { soundEngine } from "@/lib/soundEffects";

export interface ExerciseSet {
  set_number: number;
  weight: number;
  reps: number;
  completed?: boolean;
}

interface WorkoutSetRowProps {
  exerciseId: string;
  setIndex: number;
  set: ExerciseSet;
  setRvs: number;
  weightUnit: WeightUnit;
  isAgilityEx: boolean;
  isUnilateralEx: boolean;
  canDelete: boolean;
  prevSet?: { weight_kg: number; reps: number } | null;
  onUpdateSet: (exId: string, setIdx: number, field: "weight" | "reps", val: number) => void;
  onToggleCompleteSet: (exId: string, setIdx: number) => void;
  onRemoveSet: (exId: string, setIdx: number) => void;
}

export const WorkoutSetRow = memo<WorkoutSetRowProps>(function WorkoutSetRow({
  exerciseId,
  setIndex,
  set,
  setRvs,
  weightUnit,
  isAgilityEx,
  isUnilateralEx,
  canDelete,
  prevSet,
  onUpdateSet,
  onToggleCompleteSet,
  onRemoveSet,
}) {
  const isDone = Boolean(set.completed);

  return (
    <div
      className={`grid grid-cols-12 gap-1.5 items-center text-xs p-1 transition-all ${
        isDone
          ? "border border-pixel-green/50 bg-pixel-green/10"
          : "border border-zinc-800/80 bg-black/40"
      }`}
    >
      <div className="col-span-1 text-center font-bold text-zinc-400 text-[11px]">
        #{set.set_number}
      </div>

      <div className="col-span-3">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={set.weight || ""}
          onChange={(e) =>
            onUpdateSet(exerciseId, setIndex, "weight", Number(e.target.value))
          }
          className={`w-full bg-black border px-2 py-2 sm:py-1 min-h-[40px] sm:min-h-0 text-center font-bold outline-none text-base sm:text-xs ${
            isDone
              ? "border-pixel-green text-pixel-green"
              : "border-pixel-border text-white focus:border-pixel-green"
          }`}
          placeholder={
            prevSet && prevSet.weight_kg > 0
              ? String(toDisplayWeight(prevSet.weight_kg, weightUnit))
              : isAgilityEx
              ? "0 (BW)"
              : isUnilateralEx
              ? "Beban 1 sisi"
              : "0"
          }
        />
      </div>

      <div className="col-span-3">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={set.reps || ""}
          onChange={(e) =>
            onUpdateSet(exerciseId, setIndex, "reps", Number(e.target.value))
          }
          className={`w-full bg-black border px-2 py-2 sm:py-1 min-h-[40px] sm:min-h-0 text-center font-bold outline-none text-base sm:text-xs ${
            isDone
              ? "border-pixel-green text-pixel-green"
              : "border-pixel-border text-white focus:border-pixel-green"
          }`}
          placeholder={
            prevSet && prevSet.reps > 0
              ? String(prevSet.reps)
              : isUnilateralEx
              ? "Reps/sisi"
              : "0"
          }
        />
      </div>

      <div className="col-span-2 text-center">
        <span className="font-bold text-pixel-green text-[10px]">+{setRvs}</span>
      </div>

      <div className="col-span-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleCompleteSet(exerciseId, setIndex)}
          className={`flex-1 min-h-[40px] sm:min-h-[32px] py-2 sm:py-1 px-1.5 border text-[10px] sm:text-[9px] font-extrabold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer truncate active:scale-95 ${
            isDone
              ? "border-pixel-green bg-pixel-green text-black shadow-neon"
              : "border-zinc-700 bg-surface text-zinc-300 hover:border-pixel-green hover:text-pixel-green"
          }`}
          title={isDone ? "Click to uncheck set" : "Click to complete set & start 90s Rest Timer"}
        >
          <Check className={`w-3.5 h-3.5 sm:w-3 sm:h-3 ${isDone ? "stroke-[3]" : "opacity-40"}`} />
          <span>{isDone ? "DONE" : "LOG SET"}</span>
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={() => onRemoveSet(exerciseId, setIndex)}
            aria-label={`Hapus set #${set.set_number}`}
            className="min-h-[40px] min-w-[32px] text-zinc-600 hover:text-red-500 p-1 font-bold cursor-pointer flex-shrink-0 flex items-center justify-center active:scale-90"
            title="Delete Set"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {prevSet && (
        <div className="col-span-12 flex items-center justify-between px-2 py-1.5 text-[9.5px] sm:text-[9px] bg-zinc-950/80 border-t border-zinc-900/80 text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-semibold flex items-center gap-1">
              <History className="w-2.5 h-2.5 text-zinc-400" />
              <span>LAST:</span>
            </span>
            <span className="text-zinc-300 font-bold">
              {toDisplayWeight(prevSet.weight_kg, weightUnit)} {weightUnit.toUpperCase()} × {prevSet.reps} reps
            </span>
          </div>
          {!isDone && (!set.weight || !set.reps) && (
            <button
              type="button"
              onClick={() => {
                soundEngine.play("select");
                soundEngine.triggerHaptic(40);
                onUpdateSet(exerciseId, setIndex, "weight", toDisplayWeight(prevSet.weight_kg, weightUnit));
                onUpdateSet(exerciseId, setIndex, "reps", prevSet.reps);
              }}
              className="px-2 py-1 border border-pixel-green/40 bg-pixel-green/10 text-pixel-green hover:text-[#5cff87] hover:bg-pixel-green/20 cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider transition-colors active:scale-95"
              title="Copy previous weight and reps to this set"
            >
              <span>⚡ AUTOFILL</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});
