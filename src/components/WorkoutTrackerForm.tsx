"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X, Plus, Swords, CheckCircle2, Search, Play, Trash2, Clock, Dumbbell } from "lucide-react";
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
  const [attackSuccess, setAttackSuccess] = useState<boolean>(false);
  const [lastRvsSummary, setLastRvsSummary] = useState<{ totalRvs: number; totalVolume: number } | null>(null);

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
    setExerciseCards([
      {
        id: "ex-1",
        selectedExercise: availableExercises[0] || DEFAULT_EXERCISES[0],
        sets: [
          { id: "1", weight_kg: "100", reps: "8" },
          { id: "2", weight_kg: "105", reps: "6" },
          { id: "3", weight_kg: "", reps: "" },
        ],
        searchQuery: "",
        debouncedSearch: "",
        isDropdownOpen: false,
      },
    ]);
  };

  const handleAddExerciseCard = () => {
    const nextIndex = exerciseCards.length % availableExercises.length;
    const defaultEx = availableExercises[nextIndex] || availableExercises[0] || DEFAULT_EXERCISES[0];
    const newCard: ExerciseCardItem = {
      id: `ex-${Date.now()}`,
      selectedExercise: defaultEx,
      sets: [
        { id: "1", weight_kg: "60", reps: "10" },
        { id: "2", weight_kg: "", reps: "" },
      ],
      searchQuery: "",
      debouncedSearch: "",
      isDropdownOpen: false,
    };
    setExerciseCards([...exerciseCards, newCard]);
  };

  const handleRemoveExerciseCard = (cardId: string) => {
    if (exerciseCards.length <= 1) return;
    setExerciseCards(exerciseCards.filter((c) => c.id !== cardId));
  };

  const handleSelectExercise = (cardId: string, ex: Exercise) => {
    setExerciseCards(
      exerciseCards.map((c) => {
        if (c.id === cardId) {
          return { ...c, selectedExercise: ex, isDropdownOpen: false, searchQuery: "" };
        }
        return c;
      })
    );
  };

  const handleSearchChange = (cardId: string, query: string) => {
    setExerciseCards(
      exerciseCards.map((c) => {
        if (c.id === cardId) {
          return { ...c, searchQuery: query };
        }
        return c;
      })
    );
  };

  useEffect(() => {
    exerciseCards.forEach((c) => {
      const handler = setTimeout(() => {
        setExerciseCards((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, debouncedSearch: c.searchQuery } : item))
        );
      }, 300);
      return () => clearTimeout(handler);
    });
  }, [exerciseCards.map((c) => c.searchQuery).join(",")]);

  const handleAddSetToCard = (cardId: string) => {
    setExerciseCards(
      exerciseCards.map((c) => {
        if (c.id === cardId) {
          const newSetId = (c.sets.length + 1).toString();
          return { ...c, sets: [...c.sets, { id: newSetId, weight_kg: "", reps: "" }] };
        }
        return c;
      })
    );
  };

  const handleDeleteSetFromCard = (cardId: string, setId: string) => {
    setExerciseCards(
      exerciseCards.map((c) => {
        if (c.id === cardId && c.sets.length > 1) {
          return { ...c, sets: c.sets.filter((s) => s.id !== setId) };
        }
        return c;
      })
    );
  };

  const handleSetChangeInCard = (cardId: string, setId: string, field: "weight_kg" | "reps", val: string) => {
    setExerciseCards(
      exerciseCards.map((c) => {
        if (c.id === cardId) {
          const updatedSets = c.sets.map((s) => {
            if (s.id === setId) {
              return { ...s, [field]: val };
            }
            return s;
          });
          return { ...c, sets: updatedSets };
        }
        return c;
      })
    );
  };

  const totalSessionVolume = useMemo(() => {
    let vol = 0;
    exerciseCards.forEach((card) => {
      card.sets.forEach((s) => {
        const w = parseFloat(s.weight_kg) || 0;
        const r = parseFloat(s.reps) || 0;
        vol += w * r;
      });
    });
    return vol;
  }, [exerciseCards]);

  const totalSessionRVS = useMemo(() => {
    let rvs = 0;
    exerciseCards.forEach((card) => {
      const coeff = card.selectedExercise.movement_coefficient || 1.0;
      card.sets.forEach((s) => {
        const w = parseFloat(s.weight_kg) || 0;
        const r = parseFloat(s.reps) || 0;
        if (w > 0 && r > 0 && userWeightKg > 0) {
          rvs += (w / userWeightKg) * r * coeff;
        }
      });
    });
    return rvs;
  }, [exerciseCards, userWeightKg]);

  const handleSubmitSession = async () => {
    setIsSubmitting(true);
    const payloadExercises = exerciseCards.map((card) => ({
      exercise_id: card.selectedExercise.exercise_id,
      sets: card.sets
        .map((s, idx) => ({
          set_number: idx + 1,
          weight_kg: parseFloat(s.weight_kg) || 0,
          reps: parseFloat(s.reps) || 0,
        }))
        .filter((s) => s.weight_kg > 0 && s.reps > 0),
    }));

    try {
      await fetch("/api/workout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          exercises: payloadExercises,
        }),
      });
    } catch (err) {
    } finally {
      const rvsDamage = Math.round(totalSessionRVS);
      setIsSubmitting(false);
      setAttackSuccess(true);
      setLastRvsSummary({
        totalRvs: rvsDamage,
        totalVolume: totalSessionVolume,
      });

      if (onFinishSession) {
        onFinishSession({
          totalRvs: rvsDamage,
          totalVolume: totalSessionVolume,
        });
      }

      setSessionActive(false);

      setTimeout(() => {
        setAttackSuccess(false);
      }, 5000);
    }
  };

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4">
      <div className="flex justify-center my-2">
        <div className="w-16 h-16 border-2 border-pixel-green bg-pixel-green/10 flex items-center justify-center shadow-neon">
          <img src="/icon.png" alt="IronPixels" className="w-12 h-12 object-contain" />
        </div>
      </div>

      <AnimatePresence>
        {attackSuccess && lastRvsSummary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="border-2 border-pixel-green bg-pixel-green/20 p-4 text-pixel-green flex flex-col items-center justify-center gap-2 font-mono text-center shadow-neon uppercase"
          >
            <CheckCircle2 className="w-8 h-8 text-pixel-green animate-bounce" />
            <div className="font-headline font-extrabold text-xl">DUNGEON RAID DEFEATED!</div>
            <div className="text-sm text-white">
              CRITICAL ATTACK: <span className="text-pixel-green font-bold">{formatNumber(lastRvsSummary.totalRvs)} RVS</span>
            </div>
            <div className="text-xs text-gray-300">
              TOTAL LIFTED: {formatNumber(lastRvsSummary.totalVolume)} KG
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!sessionActive ? (
        <div className="border border-pixel-border bg-surface p-6 text-center space-y-4">
          <div className="w-12 h-12 border border-pixel-green bg-pixel-green/10 text-pixel-green flex items-center justify-center mx-auto shadow-neon">
            <Dumbbell className="w-6 h-6" />
          </div>

          <div>
            <h2 className="font-headline font-extrabold text-xl text-white uppercase tracking-wider">
              DUNGEON GYM RAID
            </h2>
            <p className="font-mono text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Start a gym session to log multiple exercises, sets, and reps. Calculate your total RVS damage to strike down dungeon bosses.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartSession}
            className="w-full bg-pixel-green text-black font-headline font-extrabold text-lg py-4 flex items-center justify-center gap-2 uppercase tracking-wider shadow-neon hover:bg-pixel-green-glow transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START GYM SESSION</span>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-pixel-border bg-surface p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-pixel-green font-mono text-sm font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{formatTimer(sessionDurationSeconds)}</span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="text-gray-400">
                VOLUME: <span className="text-white font-bold">{formatNumber(totalSessionVolume)} KG</span>
              </div>
              <div className="text-gray-400">
                DAMAGE: <span className="text-pixel-green font-bold">{formatNumber(Math.round(totalSessionRVS))} RVS</span>
              </div>
            </div>
          </div>

          {exerciseCards.map((card, cardIndex) => {
            const filteredExercises = availableExercises.filter((ex) =>
              ex.exercise_name.toLowerCase().includes(card.debouncedSearch.toLowerCase())
            );

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-pixel-border bg-surface p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between pb-2 border-b border-pixel-border/60">
                  <span className="font-mono text-[10px] tracking-widest text-pixel-green uppercase font-bold">
                    EXERCISE #{cardIndex + 1}
                  </span>

                  {exerciseCards.length > 1 && (
                    <button
                      onClick={() => handleRemoveExerciseCard(card.id)}
                      className="text-gray-500 hover:text-health-red transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-1">
                    TARGET MOVEMENT
                  </div>
                  <button
                    onClick={() =>
                      setExerciseCards(
                        exerciseCards.map((c) => (c.id === card.id ? { ...c, isDropdownOpen: !c.isDropdownOpen } : c))
                      )
                    }
                    className="w-full flex items-center justify-between font-headline font-extrabold text-base text-pixel-green bg-black/60 border border-pixel-border px-3 py-2 text-left hover:border-pixel-green transition-colors"
                  >
                    <span className="truncate">{card.selectedExercise.exercise_name}</span>
                    <ChevronDown className={`w-4 h-4 text-pixel-green transition-transform ${card.isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {card.isDropdownOpen && (
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
                            placeholder="Search movement..."
                            value={card.searchQuery}
                            onChange={(e) => handleSearchChange(card.id, e.target.value)}
                            className="w-full bg-surface border border-pixel-border pl-8 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-pixel-green"
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {filteredExercises.map((ex) => (
                            <button
                              key={ex.exercise_id}
                              onClick={() => handleSelectExercise(card.id, ex)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors ${
                                ex.exercise_id === card.selectedExercise.exercise_id
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

                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-12 gap-2 text-center font-mono text-[10px] text-gray-400 tracking-wider uppercase border-b border-dashed border-pixel-border/80 pb-1">
                    <div className="col-span-3 text-left">SET</div>
                    <div className="col-span-4">KG</div>
                    <div className="col-span-4">REPS</div>
                    <div className="col-span-1"></div>
                  </div>

                  {card.sets.map((sRow, sIdx) => {
                    const isFilled = sRow.weight_kg !== "" || sRow.reps !== "";
                    return (
                      <div
                        key={sRow.id}
                        className="grid grid-cols-12 gap-2 items-center bg-black/40 border border-pixel-border/60 p-1.5"
                      >
                        <div className="col-span-3 font-mono font-extrabold text-xs text-gray-300 pl-2">
                          {sIdx + 1}
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            placeholder="--"
                            value={sRow.weight_kg}
                            onChange={(e) => handleSetChangeInCard(card.id, sRow.id, "weight_kg", e.target.value)}
                            className="w-full bg-black border border-pixel-border text-center font-mono font-extrabold text-sm text-pixel-green focus:outline-none focus:border-pixel-green p-1"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            placeholder="--"
                            value={sRow.reps}
                            onChange={(e) => handleSetChangeInCard(card.id, sRow.id, "reps", e.target.value)}
                            className="w-full bg-black border border-pixel-border text-center font-mono font-extrabold text-sm text-pixel-green focus:outline-none focus:border-pixel-green p-1"
                          />
                        </div>

                        <div className="col-span-1 flex justify-center">
                          {isFilled ? (
                            <button
                              onClick={() => handleDeleteSetFromCard(card.id, sRow.id)}
                              className="p-1 text-gray-500 hover:text-health-red transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddSetToCard(card.id)}
                              className="p-1 text-gray-400 hover:text-pixel-green transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleAddSetToCard(card.id)}
                  className="w-full py-1.5 border border-dashed border-pixel-border text-gray-400 hover:text-pixel-green hover:border-pixel-green font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD SET</span>
                </button>
              </motion.div>
            );
          })}

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
            className="w-full bg-health-red border-2 border-red-700 hover:bg-red-600 text-white font-headline font-extrabold text-lg py-4 flex items-center justify-center gap-2 uppercase tracking-wider shadow-red-glow transition-all"
          >
            <Swords className="w-5 h-5" />
            <span>{isSubmitting ? "ATTACKING BOSS..." : "FINISH SESSION & ATTACK"}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
