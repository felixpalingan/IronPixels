"use client";

import { useState } from "react";
import { Plus, Trash2, Dumbbell, Zap, Check, Search, Info, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { EXERCISE_DATABASE, ExerciseDefinition } from "@/lib/exercisesData";

interface ExerciseSet {
  set_number: number;
  weight: number;
  reps: number;
}

interface LoggedExercise {
  id: string;
  definitionId: string;
  name: string;
  category: string;
  rvsMultiplier: number;
  sets: ExerciseSet[];
}

interface WorkoutTrackerFormProps {
  userId?: string;
  userWeightKg?: number;
  onFinishSession?: (summary: {
    totalRvs: number;
    totalVolume: number;
    exercisesLog: Array<{
      exercise_name: string;
      category?: string;
      sets: Array<{ set_number: number; weight_kg: number; reps: number }>;
    }>;
  }) => void;
}

export function WorkoutTrackerForm({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  userWeightKg = 75,
  onFinishSession,
}: WorkoutTrackerFormProps) {
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([
    {
      id: "ex-init-1",
      definitionId: EXERCISE_DATABASE[0].id,
      name: EXERCISE_DATABASE[0].name,
      category: EXERCISE_DATABASE[0].category,
      rvsMultiplier: EXERCISE_DATABASE[0].rvsMultiplier,
      sets: [
        { set_number: 1, weight: 80, reps: 8 },
        { set_number: 2, weight: 85, reps: 6 },
      ],
    },
  ]);

  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeGuideExercise, setActiveGuideExercise] = useState<ExerciseDefinition | null>(null);

  const calculateSetRvs = (weight: number, reps: number, multiplier: number) => {
    if (weight <= 0 || reps <= 0) return 0;
    const bodyweightRatio = weight / Math.max(40, userWeightKg);
    return Math.round(weight * reps * bodyweightRatio * 0.1 * multiplier);
  };

  const calculateTotalVolume = () => {
    return loggedExercises.reduce((total, ex) => {
      const exVol = ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      return total + exVol;
    }, 0);
  };

  const calculateTotalRvs = () => {
    return loggedExercises.reduce((total, ex) => {
      const exRvs = ex.sets.reduce(
        (sum, s) => sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier),
        0
      );
      return total + exRvs;
    }, 0);
  };

  const handleAddExerciseFromPicker = (def: ExerciseDefinition) => {
    const newEx: LoggedExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      definitionId: def.id,
      name: def.name,
      category: def.category,
      rvsMultiplier: def.rvsMultiplier,
      sets: [{ set_number: 1, weight: 60, reps: 10 }],
    };
    setLoggedExercises((prev) => [...prev, newEx]);
    setIsPickerOpen(false);
  };

  const handleRemoveExercise = (exId: string) => {
    setLoggedExercises((prev) => prev.filter((e) => e.id !== exId));
  };

  const handleAddSet = (exId: string) => {
    setLoggedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1] || { weight: 50, reps: 10 };
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              set_number: ex.sets.length + 1,
              weight: lastSet.weight,
              reps: lastSet.reps,
            },
          ],
        };
      })
    );
  };

  const handleRemoveSet = (exId: string, setIdx: number) => {
    setLoggedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const updatedSets = ex.sets
          .filter((_, idx) => idx !== setIdx)
          .map((s, idx) => ({ ...s, set_number: idx + 1 }));
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleUpdateSet = (
    exId: string,
    setIdx: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setLoggedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const updatedSets = ex.sets.map((s, idx) => {
          if (idx !== setIdx) return s;
          return { ...s, [field]: Math.max(0, value) };
        });
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleFinish = async () => {
    const totalVolume = calculateTotalVolume();
    const totalRvs = calculateTotalRvs();

    const exercisesLog = loggedExercises.map((ex) => ({
      exercise_name: ex.name,
      category: ex.category,
      sets: ex.sets.map((s, idx) => ({
        set_number: idx + 1,
        weight_kg: s.weight,
        reps: s.reps,
      })),
    }));

    try {
      await fetch("/api/workout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          date: new Date().toISOString().split("T")[0],
          duration_minutes: 45,
          total_rvs: totalRvs,
          total_volume_kg: totalVolume,
          exercises_log: exercisesLog,
        }),
      });
    } catch (err) {}

    if (onFinishSession) {
      onFinishSession({
        totalRvs,
        totalVolume,
        exercisesLog,
      });
    }
  };

  const categories = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

  const filteredDatabase = EXERCISE_DATABASE.filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const getDifficultyBadgeStyle = (label: string) => {
    switch (label) {
      case "Master":
        return "border-red-500 text-red-400 bg-red-950/40";
      case "Advanced":
        return "border-amber-400 text-amber-300 bg-amber-950/40";
      case "Intermediate":
        return "border-sky-400 text-sky-300 bg-sky-950/40";
      default:
        return "border-pixel-green text-pixel-green bg-pixel-green/10";
    }
  };

  const getCategoryBadgeStyle = (cat: string, isSelected: boolean) => {
    if (isSelected) {
      return "bg-[#00ff41] text-black border-[#00ff41] shadow-neon font-black";
    }
    switch (cat) {
      case "Chest":
        return "border-red-500/60 text-red-300 bg-black/60 hover:bg-red-950/40";
      case "Back":
        return "border-sky-500/60 text-sky-300 bg-black/60 hover:bg-sky-950/40";
      case "Legs":
        return "border-[#00ff41]/60 text-[#00ff41] bg-black/60 hover:bg-[#00ff41]/20";
      case "Shoulders":
        return "border-amber-400/60 text-amber-300 bg-black/60 hover:bg-amber-950/40";
      case "Arms":
        return "border-fuchsia-400/60 text-fuchsia-300 bg-black/60 hover:bg-fuchsia-950/40";
      case "Core":
        return "border-cyan-400/60 text-cyan-300 bg-black/60 hover:bg-cyan-950/40";
      case "Cardio":
        return "border-orange-400/60 text-orange-300 bg-black/60 hover:bg-orange-950/40";
      default:
        return "border-zinc-700 text-zinc-300 bg-black/60 hover:bg-zinc-900";
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      <div className="border border-pixel-border bg-surface p-4 flex items-center justify-between shadow-neon">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-pixel-green bg-pixel-green/10 flex items-center justify-center text-pixel-green">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">SESSION STATS</div>
            <div className="font-headline font-black text-xl text-white">
              {formatNumber(calculateTotalVolume())} KG
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-[#00ff41] uppercase tracking-widest font-bold">RVS COMBAT POWER</div>
          <div className="font-headline font-black text-xl text-[#00ff41] flex items-center justify-end gap-1">
            <Zap className="w-4 h-4 fill-[#00ff41]" />
            <span>+{formatNumber(calculateTotalRvs())} RVS</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loggedExercises.map((ex, exIdx) => {
          const exVolume = ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
          const exRvs = ex.sets.reduce(
            (sum, s) => sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier),
            0
          );
          const defObj = EXERCISE_DATABASE.find((d) => d.id === ex.definitionId);

          return (
            <div key={ex.id} className="border border-pixel-border bg-surface p-4 space-y-3 shadow-neon">
              <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className="w-5 h-5 bg-[#00ff41] text-black font-bold text-xs flex items-center justify-center font-headline flex-shrink-0">
                    {exIdx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-headline font-extrabold text-sm text-white uppercase tracking-wide break-words flex items-center gap-2 flex-wrap">
                      <span>{ex.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-zinc-700 bg-black text-zinc-400 font-normal flex-shrink-0">
                        {ex.category}
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {defObj && (
                    <button
                      onClick={() => setActiveGuideExercise(defObj)}
                      className="p-1 border border-zinc-700 bg-black text-zinc-400 hover:text-white hover:border-[#00ff41]"
                      title="View Guide & Form Instructions"
                    >
                      <Info className="w-3.5 h-3.5 text-[#00ff41]" />
                    </button>
                  )}

                  {loggedExercises.length > 1 && (
                    <button
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="p-1 border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-400 font-bold uppercase text-center border-b border-pixel-border/30 pb-1">
                  <span className="col-span-2">SET</span>
                  <span className="col-span-4">KG (WEIGHT)</span>
                  <span className="col-span-4">REPS</span>
                  <span className="col-span-2">RVS</span>
                </div>

                {ex.sets.map((set, setIdx) => {
                  const setRvs = calculateSetRvs(set.weight, set.reps, ex.rvsMultiplier);

                  return (
                    <div key={setIdx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-2 text-center font-bold text-zinc-400">
                        #{set.set_number}
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.weight || ""}
                          onChange={(e) =>
                            handleUpdateSet(ex.id, setIdx, "weight", Number(e.target.value))
                          }
                          className="w-full bg-black border border-pixel-border px-2 py-1 text-center font-bold text-white focus:border-[#00ff41] outline-none"
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.reps || ""}
                          onChange={(e) =>
                            handleUpdateSet(ex.id, setIdx, "reps", Number(e.target.value))
                          }
                          className="w-full bg-black border border-pixel-border px-2 py-1 text-center font-bold text-white focus:border-[#00ff41] outline-none"
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-between text-center pl-1">
                        <span className="font-bold text-[#00ff41] text-[11px]">+{setRvs}</span>
                        {ex.sets.length > 1 && (
                          <button
                            onClick={() => handleRemoveSet(ex.id, setIdx)}
                            className="text-zinc-600 hover:text-red-500 text-[10px] font-bold"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-pixel-border/40 text-[10px]">
                <button
                  onClick={() => handleAddSet(ex.id)}
                  className="px-2.5 py-1 border border-pixel-border bg-black hover:border-[#00ff41] text-[#00ff41] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD SET</span>
                </button>

                <div className="text-zinc-400 font-bold flex items-center gap-3">
                  <span>VOL: {formatNumber(exVolume)} KG</span>
                  <span className="text-[#00ff41]">RVS: +{formatNumber(exRvs)}</span>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setIsPickerOpen(true)}
          className="w-full py-3.5 border-2 border-dashed border-pixel-border bg-black/40 hover:border-[#00ff41] hover:text-[#00ff41] text-zinc-400 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>CHOOSE EXERCISE FROM DATABASE ({EXERCISE_DATABASE.length} EXERCISES)</span>
        </button>

        <button
          onClick={handleFinish}
          className="w-full py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>FINISH SESSION & ATTACK BOSS</span>
        </button>
      </div>

      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
          >
            <div className="w-full max-w-lg border-2 border-pixel-border bg-surface p-5 space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col font-mono relative">
              <button
                onClick={() => setIsPickerOpen(false)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 pr-6">
                <h3 className="font-headline font-black text-xl text-white uppercase tracking-wider">
                  EXERCISE DATABASE
                </h3>
                <p className="text-xs text-zinc-400">
                  CHOOSE FROM {EXERCISE_DATABASE.length} MUSCLE-SPECIFIC EXERCISES
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, muscle (quads, lats...)"
                  className="w-full bg-black border border-pixel-border pl-9 pr-3 py-2 text-xs font-bold text-white focus:border-[#00ff41] outline-none"
                />
              </div>

              <div className="space-y-1.5 border-y border-pixel-border/50 py-2">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  FILTER BY MUSCLE GROUP:
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
                  {categories.map((cat) => {
                    const isSel = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-1.5 px-2 text-[10px] uppercase font-bold text-center border transition-all truncate cursor-pointer ${getCategoryBadgeStyle(
                          cat,
                          isSel
                        )}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pt-1 min-h-[220px]">
                {filteredDatabase.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800">
                    No exercises match your search query or muscle filter.
                  </div>
                ) : (
                  filteredDatabase.map((def) => (
                    <div
                      key={def.id}
                      className="p-3 border border-pixel-border/60 bg-black/80 hover:border-[#00ff41] transition-all space-y-2.5"
                    >
                      <div className="font-headline font-black text-sm text-white uppercase tracking-wide leading-snug break-words">
                        {def.name}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pixel-border/40">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 border text-[9px] font-extrabold uppercase ${getDifficultyBadgeStyle(def.difficultyLabel)}`}>
                            {def.difficultyLabel}
                          </span>
                          <span className="px-2 py-0.5 border border-sky-500/50 bg-sky-950/30 text-sky-300 text-[9px] font-bold uppercase">
                            {def.category}
                          </span>
                          <span className="px-2 py-0.5 border border-amber-500/50 bg-amber-950/30 text-amber-300 text-[9px] font-bold uppercase">
                            {def.equipment}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => setActiveGuideExercise(def)}
                            className="px-2 py-1 border border-zinc-700 bg-surface text-zinc-300 hover:text-[#00ff41] hover:border-[#00ff41] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-[#00ff41]" />
                            <span>GUIDE</span>
                          </button>

                          <button
                            onClick={() => handleAddExerciseFromPicker(def)}
                            className="px-3 py-1 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-[11px] uppercase tracking-wider shadow-neon cursor-pointer"
                          >
                            + ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGuideExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md border-2 border-[#00ff41] bg-surface p-6 space-y-4 shadow-[0_0_50px_rgba(0,255,65,0.3)] font-mono relative">
              <button
                onClick={() => setActiveGuideExercise(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase ${getDifficultyBadgeStyle(activeGuideExercise.difficultyLabel)}`}>
                    DIFFICULTY: {activeGuideExercise.difficultyLabel} ({activeGuideExercise.difficultyRank}/5 ⭐)
                  </span>
                  <span className="px-2 py-0.5 border border-zinc-700 bg-black text-zinc-300 text-[9px] font-bold uppercase">
                    {activeGuideExercise.category}
                  </span>
                </div>

                <h3 className="font-headline font-black text-xl text-white uppercase tracking-wider pt-1 leading-snug break-words">
                  {activeGuideExercise.name}
                </h3>
              </div>

              <div className="bg-black/80 border border-pixel-border p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">EQUIPMENT:</span>
                  <span className="text-amber-400 font-bold">{activeGuideExercise.equipment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">PRIMARY MUSCLES:</span>
                  <span className="text-sky-400 font-bold">{activeGuideExercise.targetMuscles.join(", ")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>STEP-BY-STEP FORM & EXECUTION GUIDE</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeGuideExercise.instructions.map((step, idx) => (
                    <div key={idx} className="p-2 border border-pixel-border/40 bg-black/60 text-xs text-zinc-300 flex items-start gap-2">
                      <span className="w-5 h-5 bg-pixel-border text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveGuideExercise(null)}
                className="w-full py-3 bg-[#00ff41] text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer"
              >
                GOT IT, BACK TO WORKOUT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
