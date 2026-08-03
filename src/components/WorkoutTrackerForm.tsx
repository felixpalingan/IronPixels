"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X, Plus, Swords, CheckCircle2, Search, Play, Trash2, Clock, Dumbbell, HeartPulse } from "lucide-react";
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

interface ExerciseCardItem {
  id: string;
  selectedExercise: Exercise;
  sets: SetRow[];
  searchQuery: string;
  debouncedSearch: string;
  isDropdownOpen: boolean;
}

interface WorkoutTrackerFormProps {
  userId?: string;
  userWeightKg?: number;
  onFinishSession?: (summary: { totalRvs: number; totalVolume: number }) => void;
}

const DEFAULT_EXERCISES: Exercise[] = [
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
];

export function WorkoutTrackerForm({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  userWeightKg = 75,
  onFinishSession,
}: WorkoutTrackerFormProps) {
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(0);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);

  const [exerciseCards, setExerciseCards] = useState<ExerciseCardItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionActive) {
      timer = setInterval(() => {
        setSessionDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionActive]);

  const handleStartSession = () => {
    setSessionActive(true);
    setSessionDurationSeconds(0);
    if (exerciseCards.length === 0) {
      handleAddExerciseCard();
    }
  };

  const handleAddExerciseCard = () => {
    const newCard: ExerciseCardItem = {
      id: `card-${Date.now()}-${Math.random()}`,
      selectedExercise: availableExercises[0],
      sets: [
        { id: `set-1-${Date.now()}`, weight_kg: "", reps: "" },

      ],
      searchQuery: "",
      debouncedSearch: "",
      isDropdownOpen: false,
    };
    setExerciseCards((prev) => [...prev, newCard]);
  };

  const handleDeleteCard = (cardId: string) => {
    setExerciseCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleSelectExerciseForCard = (cardId: string, ex: Exercise) => {
    setExerciseCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              selectedExercise: ex,
              searchQuery: "",
              debouncedSearch: "",
              isDropdownOpen: false,
            }
          : c
      )
    );
  };

  const handleAddSetToCard = (cardId: string) => {
    setExerciseCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const nextSetId = `set-${c.sets.length + 1}-${Date.now()}`;
          return {
            ...c,
            sets: [...c.sets, { id: nextSetId, weight_kg: "", reps: "" }],
          };
        }
        return c;
      })
    );
  };

  const handleSetChangeInCard = (
    cardId: string,
    setId: string,
    field: "weight_kg" | "reps",
    value: string
  ) => {
    setExerciseCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const updatedSets = c.sets.map((s) =>
            s.id === setId ? { ...s, [field]: value } : s
          );
          return { ...c, sets: updatedSets };
        }
        return c;
      })
    );
  };

  const handleDeleteSetFromCard = (cardId: string, setId: string) => {
    setExerciseCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const updatedSets = c.sets.filter((s) => s.id !== setId);
          return { ...c, sets: updatedSets };
        }
        return c;
      })
    );
  };

  const summary = useMemo(() => {
    let totalVolume = 0;
    let totalRvs = 0;
    let totalSets = 0;
    let totalReps = 0;

    exerciseCards.forEach((card) => {
      const coeff = card.selectedExercise.movement_coefficient || 1.0;
      card.sets.forEach((s) => {
        const w = parseFloat(s.weight_kg) || 0;
        const r = parseInt(s.reps, 10) || 0;
        if (w > 0 && r > 0) {
          totalVolume += w * r;
          totalSets += 1;
          totalReps += r;
          if (userWeightKg > 0) {
            totalRvs += (w / userWeightKg) * r * coeff;
          }
        }
      });
    });

    return {
      totalVolume,
      totalRvs: Math.round(totalRvs * 100) / 100,
      totalSets,
      totalReps,
    };
  }, [exerciseCards, userWeightKg]);

  const projectedHealHp = Math.round(summary.totalRvs * 1.5);

  const handleSubmitSession = async () => {
    if (summary.totalRvs === 0) {
      alert("PLEASE ENTER AT LEAST 1 COMPLETED SET WITH WEIGHT AND REPS!");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: userId,
        exercises: exerciseCards.map((c) => ({
          exercise_id: c.selectedExercise.exercise_id,
          sets: c.sets
            .filter((s) => parseFloat(s.weight_kg) > 0 && parseInt(s.reps, 10) > 0)
            .map((s, idx) => ({
              set_number: idx + 1,
              weight_kg: parseFloat(s.weight_kg),
              reps: parseInt(s.reps, 10),
            })),
        })),
      };

      await fetch("/api/workout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (onFinishSession) {
        onFinishSession({
          totalRvs: summary.totalRvs,
          totalVolume: summary.totalVolume,
        });
      }

      setSessionActive(false);
      setExerciseCards([]);
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      {!sessionActive ? (
        <div className="border border-pixel-border bg-surface p-6 text-center space-y-4 shadow-neon">
          <div className="w-16 h-16 border-2 border-pixel-green bg-pixel-green/10 flex items-center justify-center mx-auto text-pixel-green shadow-neon">
            <Dumbbell className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-headline font-black text-2xl tracking-wider text-white uppercase">
              WORKOUT TRACKER
            </h2>
            <p className="text-xs text-gray-400">
              Log sets to generate RVS attack power & heal your Hero HP.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartSession}
            className="w-full py-4 bg-pixel-green text-black font-headline font-black text-sm uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>START GYM SESSION</span>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-pixel-border bg-surface p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pixel-green animate-pulse" />
              <span className="font-headline font-extrabold text-sm text-white">
                ELAPSED: {formatTimer(sessionDurationSeconds)}
              </span>
            </div>

            <span className="text-[10px] text-gray-400 font-bold uppercase">
              MASS: {userWeightKg} KG
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-black border border-pixel-border p-3 text-center">
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-bold">TOTAL VOLUME</div>
              <div className="font-headline font-black text-sm text-white">{formatNumber(summary.totalVolume)} KG</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-bold">RVS POWER</div>
              <div className="font-headline font-black text-sm text-pixel-green">{formatNumber(summary.totalRvs)} RVS</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-bold">EST. HEAL</div>
              <div className="font-headline font-black text-sm text-[#00ff41] flex items-center justify-center gap-0.5">
                <HeartPulse className="w-3 h-3" />
                +{formatNumber(projectedHealHp)} HP
              </div>
            </div>
          </div>

          {exerciseCards.map((card, cardIndex) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-pixel-border bg-surface p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between border-b border-pixel-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-pixel-green">#{cardIndex + 1}</span>
                  <span className="font-headline font-extrabold text-sm text-white uppercase">
                    {card.selectedExercise.exercise_name}
                  </span>
                  <span className="text-[9px] bg-black border border-pixel-border px-1.5 py-0.5 text-gray-300 font-bold">
                    {card.selectedExercise.tier} ({card.selectedExercise.movement_coefficient}x)
                  </span>
                </div>

                {exerciseCards.length > 1 && (
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1 text-gray-500 hover:text-health-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 font-mono text-[10px] text-gray-400 uppercase font-bold px-1">
                  <span className="col-span-2">SET</span>
                  <span className="col-span-5 text-center">WEIGHT (KG)</span>
                  <span className="col-span-4 text-center">REPS</span>
                  <span className="col-span-1"></span>
                </div>

                {card.sets.map((sRow, setIndex) => (
                  <div key={sRow.id} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-2 font-bold text-xs text-gray-300 px-1">
                      #{setIndex + 1}
                    </span>

                    <div className="col-span-5">
                      <input
                        type="number"
                        placeholder="0"
                        value={sRow.weight_kg}
                        onChange={(e) => handleSetChangeInCard(card.id, sRow.id, "weight_kg", e.target.value)}
                        className="w-full bg-black border border-pixel-border text-center font-mono font-extrabold text-sm text-white focus:outline-none focus:border-pixel-green p-1"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={sRow.reps}
                        onChange={(e) => handleSetChangeInCard(card.id, sRow.id, "reps", e.target.value)}
                        className="w-full bg-black border border-pixel-border text-center font-mono font-extrabold text-sm text-pixel-green focus:outline-none focus:border-pixel-green p-1"
                      />
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleDeleteSetFromCard(card.id, sRow.id)}
                        className="p-1 text-gray-500 hover:text-health-red transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleAddSetToCard(card.id)}
                className="w-full py-1.5 border border-dashed border-pixel-border text-gray-400 hover:text-pixel-green hover:border-pixel-green font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>ADD SET</span>
              </button>
            </motion.div>
          ))}

          <button
            onClick={handleAddExerciseCard}
            className="w-full py-3 border-2 border-dashed border-pixel-green/60 text-pixel-green bg-pixel-green/5 hover:bg-pixel-green/10 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-neon"
          >
            <Plus className="w-4 h-4" />
            <span>ADD ANOTHER EXERCISE TO SESSION</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitSession}
            disabled={isSubmitting}
            className="w-full bg-health-red border-2 border-red-700 hover:bg-red-600 text-white font-headline font-extrabold text-base py-4 flex items-center justify-center gap-2 uppercase tracking-wider shadow-red-glow transition-all disabled:opacity-50"
          >
            <Swords className="w-5 h-5" />
            <span>
              {isSubmitting
                ? "ATTACKING BOSS..."
                : `FINISH SESSION & HEAL HERO (+${formatNumber(projectedHealHp)} HP)`}
            </span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
