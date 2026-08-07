"use client";

import { useState } from "react";
import { Plus, Trash2, Dumbbell, Zap, Check, Search, Info, X, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { EXERCISE_DATABASE, ExerciseDefinition, getExerciseScalingStat } from "@/lib/exercisesData";

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
  equipment: string;
  rvsMultiplier: number;
  sets: ExerciseSet[];
}

interface WorkoutTrackerFormProps {
  userId?: string;
  userWeightKg?: number;
  heroStats?: {
    str: number;
    agi: number;
    vit: number;
    luk: number;
  };
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
  heroStats = { str: 85, agi: 70, vit: 60, luk: 50 },
  onFinishSession,
}: WorkoutTrackerFormProps) {
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_custom_exercises");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeGuideExercise, setActiveGuideExercise] = useState<ExerciseDefinition | null>(null);

  // Custom exercise form fields
  const [cName, setCName] = useState<string>("");
  const [cCategory, setCCategory] = useState<ExerciseDefinition["category"]>("Chest");
  const [cEquipment, setCEquipment] = useState<ExerciseDefinition["equipment"]>("Dumbbell");
  const [cMultiplier, setCMultiplier] = useState<number>(1.0);

  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    const newCustomEx: ExerciseDefinition = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cName.trim(),
      category: cCategory,
      difficultyRank: 2,
      difficultyLabel: "Intermediate",
      equipment: cEquipment,
      targetMuscles: [cCategory],
      instructions: [
        `Perform ${cName.trim()} with strict form and full range of motion.`,
        "Control both eccentric and concentric phases of movement.",
      ],
      rvsMultiplier: Number(cMultiplier) || 1.0,
      isCustom: true,
    };

    try {
      await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomEx.name,
          category: newCustomEx.category,
          equipment: newCustomEx.equipment,
          rvs_multiplier: newCustomEx.rvsMultiplier,
        }),
      });
    } catch (err) {}

    const updated = [newCustomEx, ...customExercises];
    setCustomExercises(updated);
    try {
      localStorage.setItem("ironpixels_custom_exercises", JSON.stringify(updated));
    } catch (e) {}

    // Automatically add custom exercise to current workout session
    handleAddExerciseFromPicker(newCustomEx);

    // Reset form and close modal
    setCName("");
    setCMultiplier(1.0);
    setIsCustomModalOpen(false);
  };

  const calculateSetRvs = (
    weight: number,
    reps: number,
    multiplier: number,
    category: string = "Chest",
    equipment: string = "Barbell"
  ) => {
    if (reps <= 0) return 0;
    const scalingStat = getExerciseScalingStat({ category, equipment });
    const isAgilityEx = scalingStat === "AGI";

    const actualWeight = isAgilityEx && weight <= 0 ? userWeightKg : Math.max(1, weight);
    const bodyweightRatio = actualWeight / Math.max(40, userWeightKg);

    const relevantStat = isAgilityEx ? (heroStats?.agi || 70) : (heroStats?.str || 85);
    const statMultiplier = relevantStat / 50;

    return Math.round(actualWeight * reps * bodyweightRatio * 0.1 * multiplier * statMultiplier);
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
        (sum, s) =>
          sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier, ex.category, ex.equipment),
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
      equipment: def.equipment,
      rvsMultiplier: def.rvsMultiplier,
      sets: [{ set_number: 1, weight: def.equipment === "Bodyweight" ? 0 : 60, reps: 10 }],
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
        const lastSet = ex.sets[ex.sets.length - 1] || { weight: ex.equipment === "Bodyweight" ? 0 : 50, reps: 10 };
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
        const updatedSets = ex.sets.map((set, idx) => {
          if (idx !== setIdx) return set;
          return { ...set, [field]: Math.max(0, value) };
        });
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleFinish = () => {
    if (loggedExercises.length === 0) return;
    const totalVolume = calculateTotalVolume();
    const totalRvs = calculateTotalRvs();

    const exercisesLog = loggedExercises.map((ex) => ({
      exercise_name: ex.name,
      category: ex.category,
      sets: ex.sets.map((s) => ({
        set_number: s.set_number,
        weight_kg: s.weight,
        reps: s.reps,
      })),
    }));

    if (onFinishSession) {
      onFinishSession({
        totalRvs,
        totalVolume,
        exercisesLog,
      });
    }

    setLoggedExercises([]);
  };

  const categories = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

  const allExercises = [...customExercises, ...EXERCISE_DATABASE];

  const filteredDatabase = allExercises.filter((def) => {
    const matchesCategory = selectedCategory === "All" || def.category === selectedCategory;
    const matchesSearch =
      def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.targetMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getDifficultyBadgeStyle = (label: string) => {
    switch (label) {
      case "Novice":
        return "border-emerald-500/50 bg-emerald-950/30 text-emerald-400";
      case "Intermediate":
        return "border-sky-500/50 bg-sky-950/30 text-sky-400";
      case "Advanced":
        return "border-purple-500/50 bg-purple-950/30 text-purple-400";
      case "Master":
        return "border-amber-500/50 bg-amber-950/30 text-amber-400";
      default:
        return "border-zinc-700 bg-black text-zinc-400";
    }
  };

  const getCategoryBadgeStyle = (cat: string, active: boolean) => {
    if (!active) return "border-pixel-border/60 bg-black/60 text-zinc-400 hover:text-white";
    switch (cat) {
      case "Chest":
        return "border-red-500 bg-red-950/40 text-red-400 font-bold shadow-neon";
      case "Back":
        return "border-blue-500 bg-blue-950/40 text-blue-400 font-bold shadow-neon";
      case "Legs":
        return "border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold shadow-neon";
      case "Shoulders":
        return "border-amber-500 bg-amber-950/40 text-amber-400 font-bold shadow-neon";
      case "Arms":
        return "border-purple-500 bg-purple-950/40 text-purple-400 font-bold shadow-neon";
      case "Core":
        return "border-teal-500 bg-teal-950/40 text-teal-400 font-bold shadow-neon";
      case "Cardio":
        return "border-pink-500 bg-pink-950/40 text-pink-400 font-bold shadow-neon";
      default:
        return "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] font-bold shadow-neon";
    }
  };

  return (
    <div className="space-y-4 font-mono select-none">
      <div className="border border-pixel-border bg-surface p-4 space-y-3 shadow-neon">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border border-[#00ff41] bg-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-black text-sm text-white uppercase tracking-wider">
                GYM RAID LOGGING TERMINAL
              </h3>
              <p className="text-[10px] text-zinc-400">
                LIFT WEIGHTS & DO CALISTHENICS TO CONVERT WORKOUT INTO RVS BOSS DAMAGE
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] text-zinc-400 uppercase font-bold">LIVE RVS POWER</div>
            <div className="font-headline font-black text-lg text-[#00ff41] animate-pulse">
              +{formatNumber(calculateTotalRvs())} RVS
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 uppercase font-bold">TOTAL VOLUME</div>
            <div className="font-headline font-extrabold text-sm text-white">
              {formatNumber(calculateTotalVolume())} KG
            </div>
          </div>
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 uppercase font-bold">EXERCISES LOGGED</div>
            <div className="font-headline font-extrabold text-sm text-[#00ff41]">
              {loggedExercises.length} EXERCISES
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loggedExercises.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-pixel-border/60 bg-surface/40 text-center space-y-3">
            <div className="w-12 h-12 bg-black border border-pixel-border text-zinc-500 mx-auto flex items-center justify-center">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="font-headline font-bold text-sm text-white uppercase">
                NO EXERCISES ADDED YET
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Click below to select from {EXERCISE_DATABASE.length} muscle-building exercises
              </div>
            </div>
          </div>
        ) : (
          loggedExercises.map((ex, exIdx) => {
            const exVolume = ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
            const exRvs = ex.sets.reduce(
              (sum, s) =>
                sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier, ex.category, ex.equipment),
              0
            );
            const defObj = EXERCISE_DATABASE.find((d) => d.id === ex.definitionId);
            const scalingStat = getExerciseScalingStat({ category: ex.category, equipment: ex.equipment });
            const isAgilityEx = scalingStat === "AGI";
            const scalingFactor = isAgilityEx
              ? ((heroStats?.agi || 70) / 50).toFixed(2)
              : ((heroStats?.str || 85) / 50).toFixed(2);

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
                        {isAgilityEx ? (
                          <span className="text-[9px] px-1.5 py-0.5 border border-fuchsia-500/80 bg-fuchsia-950/60 text-fuchsia-300 font-bold flex-shrink-0">
                            🏃 AGI SCALING (x{scalingFactor})
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 border border-amber-500/80 bg-amber-950/60 text-amber-300 font-bold flex-shrink-0">
                            🏋️ STR SCALING (x{scalingFactor})
                          </span>
                        )}
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

                    <button
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="p-1 border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer"
                      title="Delete Exercise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                    const setRvs = calculateSetRvs(
                      set.weight,
                      set.reps,
                      ex.rvsMultiplier,
                      ex.category,
                      ex.equipment
                    );

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
                            placeholder={isAgilityEx ? "0 (Body)" : "0"}
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
                              className="text-zinc-600 hover:text-red-500 text-[10px] font-bold cursor-pointer"
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
          })
        )}

        <button
          onClick={() => setIsPickerOpen(true)}
          className="w-full py-4 border-2 border-dashed border-[#00ff41] bg-black/60 hover:bg-[#00ff41]/10 text-[#00ff41] font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-neon"
        >
          <Plus className="w-4 h-4" />
          <span>CHOOSE EXERCISE FROM DATABASE ({EXERCISE_DATABASE.length} EXERCISES)</span>
        </button>

        {loggedExercises.length > 0 && (
          <button
            onClick={handleFinish}
            className="w-full py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>FINISH SESSION & ATTACK BOSS</span>
          </button>
        )}
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
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between gap-2 pr-6">
                <div className="space-y-1">
                  <h3 className="font-headline font-black text-xl text-white uppercase tracking-wider">
                    EXERCISE DATABASE
                  </h3>
                  <p className="text-xs text-zinc-400">
                    CHOOSE FROM {filteredDatabase.length} EXERCISES ({customExercises.length} CUSTOM)
                  </p>
                </div>

                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="px-2.5 py-1.5 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41] hover:text-black font-mono font-bold text-[10px] uppercase transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-neon"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ CREATE CUSTOM</span>
                </button>
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

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pt-1 min-h-[220px]">
                {filteredDatabase.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800 space-y-3">
                    <p>No exercises match your search query or muscle filter.</p>
                    <button
                      onClick={() => setIsCustomModalOpen(true)}
                      className="px-3 py-1.5 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] font-bold uppercase text-[10px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>CREATE "{searchQuery || "CUSTOM"}" EXERCISE</span>
                    </button>
                  </div>
                ) : (
                  filteredDatabase.map((def) => {
                    const scalingStat = getExerciseScalingStat(def);
                    const isAgilityEx = scalingStat === "AGI";
                    const factorStr = isAgilityEx
                      ? ((heroStats?.agi || 70) / 50).toFixed(2)
                      : ((heroStats?.str || 85) / 50).toFixed(2);

                    return (
                      <div
                        key={def.id}
                        className={`p-3 border bg-black/80 hover:border-[#00ff41] transition-all space-y-3 ${
                          def.isCustom ? "border-amber-500/80 shadow-gold-glow" : "border-pixel-border/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-headline font-black text-sm text-white uppercase tracking-wide leading-snug break-words">
                            {def.name}
                          </div>
                          {def.isCustom && (
                            <span className="px-1.5 py-0.2 border border-amber-400 bg-amber-950/80 text-amber-300 text-[9px] font-black uppercase flex items-center gap-1 flex-shrink-0">
                              <Sparkles className="w-3 h-3" />
                              CUSTOM
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-pixel-border/40">
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
                            {isAgilityEx ? (
                              <span className="px-2 py-0.5 border border-fuchsia-500/80 bg-fuchsia-950/60 text-fuchsia-300 text-[9px] font-black uppercase tracking-wider">
                                🏃 AGI SCALING (x{factorStr})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 border border-amber-500/80 bg-amber-950/60 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                                🏋️ STR SCALING (x{factorStr})
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 w-full pt-1">
                            <button
                              onClick={() => handleAddExerciseFromPicker(def)}
                              className="w-full py-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>ADD EXERCISE</span>
                            </button>

                            <button
                              onClick={() => setActiveGuideExercise(def)}
                              className="w-full py-1.5 border border-zinc-700 bg-surface hover:bg-black text-zinc-300 hover:text-[#00ff41] hover:border-[#00ff41] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5 text-[#00ff41]" />
                              <span>VIEW EXECUTION GUIDE & INSTRUCTIONS</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
          >
            <div className="w-full max-w-md border-2 border-amber-500 bg-surface p-5 space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.4)] font-mono relative">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-headline font-black text-lg text-white uppercase tracking-wider">
                    CREATE CUSTOM EXERCISE
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  ADD A NEW CUSTOM MOVEMENT TO YOUR PERSONAL EXERCISE DATABASE
                </p>
              </div>

              <form onSubmit={handleCreateCustomExercise} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">
                    EXERCISE NAME:
                  </label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Kettlebell Swing, Landmine Press, Ring Dips..."
                    className="w-full bg-black border border-pixel-border px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">
                      MUSCLE CATEGORY:
                    </label>
                    <select
                      value={cCategory}
                      onChange={(e) => setCCategory(e.target.value as any)}
                      className="w-full bg-black border border-pixel-border px-2 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none uppercase"
                    >
                      {(["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"] as const).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">
                      EQUIPMENT TYPE:
                    </label>
                    <select
                      value={cEquipment}
                      onChange={(e) => setCEquipment(e.target.value as any)}
                      className="w-full bg-black border border-pixel-border px-2 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none uppercase"
                    >
                      {(["Barbell", "Dumbbell", "Bodyweight", "Machine", "Cable"] as const).map((eq) => (
                        <option key={eq} value={eq}>
                          {eq}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">
                    RVS MULTIPLIER ({cMultiplier}x):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={cMultiplier}
                    onChange={(e) => setCMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-black border border-pixel-border px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(false)}
                    className="w-1/3 py-2.5 border border-zinc-700 bg-black text-zinc-400 hover:text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-2.5 border border-amber-400 bg-amber-500 hover:bg-amber-400 text-black font-headline font-black text-xs uppercase tracking-wider cursor-pointer shadow-gold-glow flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>SAVE & ADD TO WORKOUT</span>
                  </button>
                </div>
              </form>
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
          >
            <div className="w-full max-w-md border-2 border-[#00ff41] bg-surface p-5 space-y-4 shadow-[0_0_50px_rgba(0,255,65,0.3)] font-mono relative">
              <button
                onClick={() => setActiveGuideExercise(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 border-b border-pixel-border/50 pb-3 pr-6">
                <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  EXECUTION GUIDE & INSTRUCTIONS
                </span>
                <h3 className="font-headline font-black text-lg text-white uppercase tracking-wider">
                  {activeGuideExercise.name}
                </h3>
              </div>

              <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-2.5 border border-pixel-border/60 bg-black/80 space-y-1">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">TARGET MUSCLE GROUPS</div>
                  <div className="flex flex-wrap gap-1 text-white font-bold">
                    {activeGuideExercise.targetMuscles.map((m) => (
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
                    {activeGuideExercise.instructions.map((step, idx) => (
                      <li key={idx} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <button
                onClick={() => setActiveGuideExercise(null)}
                className="w-full py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
