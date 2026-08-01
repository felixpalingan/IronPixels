"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X, Plus, Swords, CheckCircle2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";

interface Exercise {
  exercise_id: string;
  exercise_name: string;
  tier: string;
  movement_coefficient: number;
}

interface SetRow {
  id: string;
  weight_kg: string;
  reps: string;
}

interface WorkoutTrackerFormProps {
  userId?: string;
  userWeightKg?: number;
  onFinishSession?: (summary: { totalRvs: number; totalVolume: number }) => void;
}

export function WorkoutTrackerForm({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  userWeightKg = 75,
  onFinishSession,
}: WorkoutTrackerFormProps) {
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      exercise_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      exercise_name: "Barbell Bench Press",
      tier: "Tier B",
      movement_coefficient: 1.2,
    },
    {
      exercise_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      exercise_name: "Barbell Squat",
      tier: "Tier B",
      movement_coefficient: 1.5,
    },
    {
      exercise_id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      exercise_name: "Bicep Curl",
      tier: "Tier A",
      movement_coefficient: 2.5,
    },
    {
      exercise_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
      exercise_name: "Lateral Raise",
      tier: "Tier A",
      movement_coefficient: 2.8,
    },
    {
      exercise_id: "e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b",
      exercise_name: "Leg Press",
      tier: "Tier C",
      movement_coefficient: 0.7,
    },
    {
      exercise_id: "f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c",
      exercise_name: "Lat Pulldown",
      tier: "Tier C",
      movement_coefficient: 0.8,
    },
  ]);

  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [sets, setSets] = useState<SetRow[]>([
    { id: "1", weight_kg: "100", reps: "8" },
    { id: "2", weight_kg: "105", reps: "6" },
    { id: "3", weight_kg: "", reps: "" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attackSuccess, setAttackSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchExercises() {
      try {
        const res = await fetch(`/api/exercises?q=${encodeURIComponent(debouncedSearch)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setExercises(data);
          }
        }
      } catch (err) {
      }
    }
    fetchExercises();
  }, [debouncedSearch]);

  const handleAddSet = () => {
    const newId = (sets.length + 1).toString();
    setSets([...sets, { id: newId, weight_kg: "", reps: "" }]);
  };

  const handleDeleteSet = (id: string) => {
    if (sets.length <= 1) return;
    setSets(sets.filter((s) => s.id !== id));
  };

  const handleSetChange = (id: string, field: "weight_kg" | "reps", value: string) => {
    setSets(
      sets.map((s) => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const totalVolume = useMemo(() => {
    return sets.reduce((acc, set) => {
      const w = parseFloat(set.weight_kg) || 0;
      const r = parseFloat(set.reps) || 0;
      return acc + w * r;
    }, 0);
  }, [sets]);

  const totalRvsDamage = useMemo(() => {
    const coeff = selectedExercise.movement_coefficient || 1.0;
    return sets.reduce((acc, set) => {
      const w = parseFloat(set.weight_kg) || 0;
      const r = parseFloat(set.reps) || 0;
      if (w > 0 && r > 0 && userWeightKg > 0) {
        const setRvs = (w / userWeightKg) * r * coeff;
        return acc + setRvs;
      }
      return acc;
    }, 0);
  }, [sets, selectedExercise, userWeightKg]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const validSets = sets
      .map((s, idx) => ({
        set_number: idx + 1,
        weight_kg: parseFloat(s.weight_kg) || 0,
        reps: parseFloat(s.reps) || 0,
      }))
      .filter((s) => s.weight_kg > 0 && s.reps > 0);

    try {
      await fetch("/api/workout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          exercise_id: selectedExercise.exercise_id,
          sets: validSets.length > 0 ? validSets : [{ set_number: 1, weight_kg: 100, reps: 8 }],
        }),
      });
    } catch (err) {
    } finally {
      setIsSubmitting(false);
      setAttackSuccess(true);
      if (onFinishSession) {
        onFinishSession({
          totalRvs: Math.round(totalRvsDamage),
          totalVolume,
        });
      }
      setTimeout(() => {
        setAttackSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4">
      <div className="flex justify-center my-2">
        <div className="w-16 h-16 border-2 border-pixel-green bg-pixel-green/10 flex items-center justify-center shadow-neon">
          <img src="/icon.png" alt="IronPixels" className="w-12 h-12 object-contain" />
        </div>
      </div>

      <div className="relative border border-pixel-border bg-surface p-4">
        <div className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-1">
          CURRENT TARGET
        </div>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between font-headline font-extrabold text-lg text-pixel-green bg-black/60 border border-pixel-border px-3 py-2 text-left hover:border-pixel-green transition-colors"
        >
          <span className="truncate">{selectedExercise.exercise_name}</span>
          <ChevronDown className={`w-5 h-5 text-pixel-green transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 right-0 top-full mt-1 z-50 bg-background border border-pixel-green p-2 shadow-neon space-y-2"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search exercise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-pixel-border pl-8 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-pixel-green"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {exercises.map((ex) => (
                  <button
                    key={ex.exercise_id}
                    onClick={() => {
                      setSelectedExercise(ex);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors ${
                      ex.exercise_id === selectedExercise.exercise_id
                        ? "bg-pixel-green/20 text-pixel-green border-l-2 border-pixel-green"
                        : "hover:bg-surface text-gray-300"
                    }`}
                  >
                    <span>{ex.exercise_name}</span>
                    <span className="text-[10px] text-gray-500">{ex.tier} ({ex.movement_coefficient}x)</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border border-pixel-border bg-surface p-4 space-y-3">
        <div className="grid grid-cols-12 gap-2 text-center font-mono text-[10px] text-gray-400 tracking-wider uppercase border-b border-dashed border-pixel-border/80 pb-2">
          <div className="col-span-3 text-left">SET</div>
          <div className="col-span-4">KG</div>
          <div className="col-span-4">REPS</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-2">
          {sets.map((setRow, index) => {
            const isFilled = setRow.weight_kg !== "" || setRow.reps !== "";
            return (
              <div
                key={setRow.id}
                className="grid grid-cols-12 gap-2 items-center bg-black/40 border border-pixel-border/60 p-2"
              >
                <div className="col-span-3 font-mono font-extrabold text-sm text-gray-300 pl-2">
                  {index + 1}
                </div>

                <div className="col-span-4">
                  <input
                    type="number"
                    placeholder="--"
                    value={setRow.weight_kg}
                    onChange={(e) => handleSetChange(setRow.id, "weight_kg", e.target.value)}
                    className="w-full bg-black border border-pixel-border text-center font-mono font-extrabold text-base text-pixel-green focus:outline-none focus:border-pixel-green p-1.5"
                  />
                </div>

                <div className="col-span-4">
                  <input
                    type="number"
                    placeholder="--"
                    value={setRow.reps}
                    onChange={(e) => handleSetChange(setRow.id, "reps", e.target.value)}
                    className="w-full bg-black border border-pixel-border text-center font-mono font-extrabold text-base text-pixel-green focus:outline-none focus:border-pixel-green p-1.5"
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  {isFilled ? (
                    <button
                      onClick={() => handleDeleteSet(setRow.id)}
                      className="p-1 border border-pixel-border hover:border-health-red hover:text-health-red text-gray-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleAddSet}
                      className="p-1 border border-pixel-border hover:border-pixel-green hover:text-pixel-green text-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAddSet}
          className="w-full py-2 border border-dashed border-pixel-border text-gray-400 hover:text-pixel-green hover:border-pixel-green font-mono text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 mt-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD SET</span>
        </button>
      </div>

      <div className="border border-pixel-border bg-surface p-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">
            SESSION VOLUME
          </div>
          <div className="font-headline font-bold text-lg text-white">
            Damage Dealt
          </div>
        </div>

        <div className="font-mono font-extrabold text-xl text-pixel-green flex items-baseline gap-1">
          <span>{formatNumber(totalVolume)}</span>
          <span className="text-xs text-gray-400">KG</span>
        </div>
      </div>

      <AnimatePresence>
        {attackSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-pixel-green bg-pixel-green/20 p-3 text-pixel-green flex items-center justify-center gap-2 font-mono text-xs font-bold shadow-neon uppercase"
          >
            <CheckCircle2 className="w-4 h-4 text-pixel-green" />
            <span>CRITICAL HIT EXECUTED! RVS DAMAGE: {formatNumber(Math.round(totalRvsDamage))}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-health-red border-2 border-red-700 hover:bg-red-600 text-white font-headline font-extrabold text-lg py-4 flex items-center justify-center gap-2 uppercase tracking-wider shadow-red-glow transition-all"
      >
        <Swords className="w-5 h-5" />
        <span>{isSubmitting ? "ATTACKING..." : "FINISH SESSION & ATTACK"}</span>
      </motion.button>
    </div>
  );
}
