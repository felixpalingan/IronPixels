"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Dumbbell, Zap, Check, Search, Info, X, ShieldCheck, Sparkles, Timer, Volume2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { EXERCISE_DATABASE, ExerciseDefinition, getExerciseScalingStat } from "@/lib/exercisesData";
import { calculateSetRvs as calculateSetRvsPure } from "@/lib/workoutCalculations";
import { soundEngine } from "@/lib/soundEffects";
import { WeightUnit, kgToLbs, lbsToKg, toDisplayWeight, toCanonicalKg } from "@/lib/unitConversion";

interface ExerciseSet {
  set_number: number;
  weight: number;
  reps: number;
  completed?: boolean;
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
    durationMinutes?: number;
    exercisesLog: Array<{
      exercise_name: string;
      category?: string;
      sets: Array<{ set_number: number; weight_kg: number; reps: number }>;
    }>;
  }) => void;
}

export function WorkoutTrackerForm({
  userId = "",
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
  const [routines, setRoutines] = useState<any[]>([]);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState<boolean>(true);
  const [isSaveRoutineModalOpen, setIsSaveRoutineModalOpen] = useState<boolean>(false);
  const [newRoutineName, setNewRoutineName] = useState<string>("");
  const [newRoutineSplit, setNewRoutineSplit] = useState<string>("Push");
  const [routineNotice, setRoutineNotice] = useState<string | null>(null);

  // Weight Unit preference state (KG / LBS)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_weight_unit");
      return saved === "lbs" ? "lbs" : "kg";
    } catch (e) {
      return "kg";
    }
  });

  const handleToggleWeightUnit = (newUnit: WeightUnit) => {
    if (newUnit === weightUnit) return;
    soundEngine.play("select");
    soundEngine.triggerHaptic(40);

    // Dynamically convert existing entered set weights to new unit
    setLoggedExercises((prev) =>
      prev.map((ex) => {
        const convertedSets = ex.sets.map((s) => {
          if (s.weight === 0) return s;
          const newWeight = newUnit === "lbs" ? kgToLbs(s.weight) : lbsToKg(s.weight);
          return { ...s, weight: newWeight };
        });
        return { ...ex, sets: convertedSets };
      })
    );

    setWeightUnit(newUnit);
    try {
      localStorage.setItem("ironpixels_weight_unit", newUnit);
    } catch (e) {}

    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_unit: newUnit }),
    }).catch(() => {});
  };

  // Rest Timer states (Background-resilient timestamp model)
  const [defaultRestTimerSecs, setDefaultRestTimerSecs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_default_rest_timer");
      return saved ? Number(saved) : 90;
    } catch (e) {
      return 90;
    }
  });

  const [targetEndTime, setTargetEndTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_rest_timer_target");
      if (saved) {
        const target = Number(saved);
        if (target > Date.now()) return target;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [restTimerSecs, setRestTimerSecs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_rest_timer_target");
      if (saved) {
        const target = Number(saved);
        const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000));
        if (diff > 0) return diff;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  });

  const [isTimerActive, setIsTimerActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_rest_timer_target");
      if (saved) {
        return Number(saved) > Date.now();
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  // Real Session duration tracking
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_session_start_time");
      if (saved) return Number(saved);
      const now = Date.now();
      localStorage.setItem("ironpixels_session_start_time", now.toString());
      return now;
    } catch (e) {
      return Date.now();
    }
  });

  const [elapsedSessionSecs, setElapsedSessionSecs] = useState<number>(() => {
    return Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));
  });

  // Track session elapsed time
  useEffect(() => {
    const sessionInterval = setInterval(() => {
      setElapsedSessionSecs(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));
    }, 1000);
    return () => clearInterval(sessionInterval);
  }, [sessionStartTime]);

  // Background-resilient Rest Timer effect
  useEffect(() => {
    if (!isTimerActive || !targetEndTime) return;

    const updateTimer = () => {
      const remainingSecs = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      setRestTimerSecs(remainingSecs);

      if (remainingSecs <= 0) {
        setIsTimerActive(false);
        setTargetEndTime(null);
        try {
          localStorage.removeItem("ironpixels_rest_timer_target");
        } catch (e) {}
        soundEngine.play("timer");
        soundEngine.triggerHaptic([100, 50, 100, 50, 150]);
        setRoutineNotice("REST TIMER FINISHED! GET READY FOR YOUR NEXT SET! 🏋️");
        setTimeout(() => setRoutineNotice(null), 5000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isTimerActive, targetEndTime]);

  const handleSetDefaultRestTimer = (secs: number) => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(50);
    setDefaultRestTimerSecs(secs);
    try {
      localStorage.setItem("ironpixels_default_rest_timer", secs.toString());
    } catch (e) {}
  };

  const handleStartRestTimer = (secs: number) => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(50);
    const target = Date.now() + secs * 1000;
    setTargetEndTime(target);
    setRestTimerSecs(secs);
    setIsTimerActive(true);
    try {
      localStorage.setItem("ironpixels_rest_timer_target", target.toString());
    } catch (e) {}
  };

  const handleAdjustTimer = (deltaSecs: number) => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(40);
    const currentTarget = targetEndTime || Date.now() + restTimerSecs * 1000;
    const newTarget = Math.max(Date.now(), currentTarget + deltaSecs * 1000);
    const newSecs = Math.max(0, Math.ceil((newTarget - Date.now()) / 1000));
    setTargetEndTime(newTarget);
    setRestTimerSecs(newSecs);
    setIsTimerActive(newSecs > 0);
    try {
      if (newSecs > 0) {
        localStorage.setItem("ironpixels_rest_timer_target", newTarget.toString());
      } else {
        localStorage.removeItem("ironpixels_rest_timer_target");
      }
    } catch (e) {}
  };

  const handleCancelTimer = () => {
    soundEngine.play("select");
    setIsTimerActive(false);
    setTargetEndTime(null);
    setRestTimerSecs(0);
    try {
      localStorage.removeItem("ironpixels_rest_timer_target");
    } catch (e) {}
  };

  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [activeGuideExercise, setActiveGuideExercise] = useState<ExerciseDefinition | null>(null);

  // Custom exercise form fields
  const [cName, setCName] = useState<string>("");
  const [cCategory, setCCategory] = useState<ExerciseDefinition["category"]>("Chest");
  const [cEquipment, setCEquipment] = useState<ExerciseDefinition["equipment"]>("Dumbbell");
  const [cMultiplier, setCMultiplier] = useState<number>(1.0);

  useEffect(() => {
    const fetchRoutines = async () => {
      try {
        const res = await fetch("/api/workout/routines");
        if (res.ok) {
          const data = await res.json();
          if (data.routines && Array.isArray(data.routines)) {
            setRoutines(data.routines);
            return;
          }
        }
      } catch (e) {}

      // Fallback local routines
      const savedLocal = localStorage.getItem("ironpixels_saved_routines");
      if (savedLocal) {
        try {
          setRoutines(JSON.parse(savedLocal));
        } catch (e) {}
      }
    };

    fetchRoutines();
  }, []);

  // Map of exercise name/key to array of past sets: { weight_kg: number, reps: number }[]
  const [previousLogsMap, setPreviousLogsMap] = useState<Record<string, Array<{ weight_kg: number; reps: number }>>>({});

  // Parse latest sets per exercise from workout sessions
  const parsePreviousLogs = (sessions: any[]) => {
    if (!Array.isArray(sessions) || sessions.length === 0) return {};
    const map: Record<string, Array<{ weight_kg: number; reps: number }>> = {};

    for (const session of sessions) {
      const logs = session.exercises_log;
      if (Array.isArray(logs)) {
        for (const item of logs) {
          const rawName = item.exercise_name || item.name;
          if (!rawName) continue;
          const normalizedKey = String(rawName).toLowerCase().trim();
          if (!map[normalizedKey] && Array.isArray(item.sets) && item.sets.length > 0) {
            map[normalizedKey] = item.sets.map((s: any) => ({
              weight_kg: Number(s.weight_kg ?? s.weight ?? 0),
              reps: Number(s.reps ?? 0),
            }));
          }
        }
      }
    }
    return map;
  };

  useEffect(() => {
    try {
      const localHistory = localStorage.getItem("ironpixels_workout_history");
      if (localHistory) {
        const parsed = JSON.parse(localHistory);
        const map = parsePreviousLogs(parsed);
        setPreviousLogsMap(map);
      }
    } catch (e) {}

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/workout/history");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions)) {
            const map = parsePreviousLogs(data.sessions);
            setPreviousLogsMap(map);
            try {
              localStorage.setItem("ironpixels_workout_history", JSON.stringify(data.sessions));
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    fetchHistory();
  }, []);

  const handleStartFromRoutine = (routine: any) => {
    const allDefs = [...customExercises, ...EXERCISE_DATABASE];
    const newLoggedList: LoggedExercise[] = [];

    if (routine.exercises && Array.isArray(routine.exercises)) {
      routine.exercises.forEach((exItem: any, i: number) => {
        const def = allDefs.find((d) => d.id === exItem.definitionId || d.name === exItem.exercise_name) || EXERCISE_DATABASE[0];
        const numSets = exItem.defaultSets || 3;
        const targetWeight = exItem.defaultWeight || 40;
        const targetReps = exItem.defaultReps || 10;

        const setsList: ExerciseSet[] = [];
        for (let s = 1; s <= numSets; s++) {
          setsList.push({
            set_number: s,
            weight: targetWeight,
            reps: targetReps,
          });
        }

        newLoggedList.push({
          id: `ex-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          definitionId: def.id,
          name: def.name,
          category: def.category,
          equipment: def.equipment,
          rvsMultiplier: def.rvsMultiplier,
          sets: setsList,
        });
      });
    }

    setLoggedExercises(newLoggedList);
    setRoutineNotice(`LOADED TEMPLATE: "${routine.routine_name.toUpperCase()}" WITH ${newLoggedList.length} EXERCISES!`);
    setTimeout(() => setRoutineNotice(null), 4000);
  };

  const handleSaveCurrentAsRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim() || loggedExercises.length === 0) return;

    const routinePayload = {
      routine_name: newRoutineName.trim(),
      target_split: newRoutineSplit,
      description: `Custom ${newRoutineSplit} routine saved by ${userId.substring(0, 6)}.`,
      exercises: loggedExercises.map((ex) => ({
        definitionId: ex.definitionId,
        exercise_name: ex.name,
        defaultSets: ex.sets.length,
        defaultWeight: ex.sets[0]?.weight || 20,
        defaultReps: ex.sets[0]?.reps || 10,
      })),
    };

    let newRoutineObj = {
      ...routinePayload,
      routine_id: `routine-${Date.now()}`,
      is_preset: false,
    };

    try {
      const res = await fetch("/api/workout/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routinePayload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.routine) newRoutineObj = data.routine;
      }
    } catch (err) {}

    const updated = [newRoutineObj, ...routines];
    setRoutines(updated);
    try {
      localStorage.setItem("ironpixels_saved_routines", JSON.stringify(updated));
    } catch (e) {}

    setNewRoutineName("");
    setIsSaveRoutineModalOpen(false);
    setRoutineNotice(`ROUTINE TEMPLATE "${newRoutineObj.routine_name.toUpperCase()}" SAVED SUCCESSFULLY!`);
    setTimeout(() => setRoutineNotice(null), 4000);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.routine_id !== routineId));
    try {
      await fetch(`/api/workout/routines?routine_id=${routineId}`, { method: "DELETE" });
    } catch (e) {}
  };

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
    multiplier: number = 1.0,
    category: string = "Chest",
    equipment: string = "Barbell"
  ) => {
    const canonicalWeight = toCanonicalKg(weight, weightUnit);
    return calculateSetRvsPure({
      weight: canonicalWeight,
      reps,
      multiplier,
      category,
      equipment,
      userWeightKg,
      userStr: heroStats?.str || 85,
      userAgi: heroStats?.agi || 70,
    });
  };

  const calculateTotalVolume = () => {
    return loggedExercises.reduce((total, ex) => {
      const exVol = ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + toCanonicalKg(s.weight, weightUnit) * s.reps, 0);
      return total + exVol;
    }, 0);
  };

  const calculateTotalRvs = () => {
    return loggedExercises.reduce((total, ex) => {
      const exRvs = ex.sets
        .filter((s) => s.completed)
        .reduce(
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

  const handleToggleCompleteSet = (exId: string, setIdx: number) => {
    setLoggedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const updatedSets = ex.sets.map((set, idx) => {
          if (idx !== setIdx) return set;
          const isNowCompleted = !set.completed;
          if (isNowCompleted) {
            soundEngine.play("select");
            soundEngine.triggerHaptic(60);
            // Auto-start rest timer using user's configured defaultRestTimerSecs (LiftOff style)
            handleStartRestTimer(defaultRestTimerSecs);
          }
          return { ...set, completed: isNowCompleted };
        });
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleFinish = () => {
    if (loggedExercises.length === 0) return;

    // Filter only completed sets with valid repetitions
    const validExercises = loggedExercises
      .map((ex) => {
        const completedSets = ex.sets.filter((s) => s.completed && s.reps > 0);
        return {
          ...ex,
          completedSets,
        };
      })
      .filter((ex) => ex.completedSets.length > 0);

    if (validExercises.length === 0) {
      alert("BELUM ADA SET SELESAI!\nCentang tombol 'LOG SET' (✓) pada set yang telah kamu lakukan sebelum menyelesaikan sesi.");
      return;
    }

    const totalRawSets = loggedExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalDoneSets = validExercises.reduce((sum, ex) => sum + ex.completedSets.length, 0);

    if (totalDoneSets < totalRawSets) {
      const confirmFinish = window.confirm(
        `Perhatian: Hanya ${totalDoneSets} dari ${totalRawSets} set yang dicentang selesai (DONE).\nSet yang belum dicentang tidak akan dihitung ke EXP dan Volume.\n\nLanjutkan selesaikan sesi?`
      );
      if (!confirmFinish) return;
    }

    const totalVolume = validExercises.reduce(
      (total, ex) =>
        total +
        ex.completedSets.reduce(
          (sum, s) => sum + toCanonicalKg(s.weight, weightUnit) * s.reps,
          0
        ),
      0
    );

    const totalRvs = validExercises.reduce(
      (total, ex) =>
        total +
        ex.completedSets.reduce(
          (sum, s) =>
            sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier, ex.category, ex.equipment),
          0
        ),
      0
    );

    const exercisesLog = validExercises.map((ex) => ({
      exercise_id: ex.definitionId || ex.id,
      exercise_name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      rvs_multiplier: ex.rvsMultiplier,
      sets: ex.completedSets.map((s, idx) => ({
        set_number: idx + 1,
        weight_kg: toCanonicalKg(s.weight, weightUnit),
        reps: s.reps,
        completed: true,
      })),
    }));

    const realDurationMinutes = Math.max(
      1,
      Math.round((Date.now() - sessionStartTime) / (1000 * 60))
    );

    if (onFinishSession) {
      onFinishSession({
        totalRvs,
        totalVolume,
        durationMinutes: realDurationMinutes,
        exercisesLog,
      });
    }

    try {
      const nextStart = Date.now();
      setSessionStartTime(nextStart);
      localStorage.setItem("ironpixels_session_start_time", nextStart.toString());
      localStorage.removeItem("ironpixels_rest_timer_target");
    } catch (e) {}

    setIsTimerActive(false);
    setTargetEndTime(null);
    setRestTimerSecs(0);
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

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-pixel-border bg-black p-0.5 shadow-neon">
              <button
                type="button"
                onClick={() => handleToggleWeightUnit("kg")}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  weightUnit === "kg"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Switch weight unit to Kilograms (KG)"
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => handleToggleWeightUnit("lbs")}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  weightUnit === "lbs"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Switch weight unit to Pounds (LBS)"
              >
                LBS
              </button>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-zinc-400 uppercase font-bold">LIVE RVS POWER</div>
              <div className="font-headline font-black text-lg text-[#00ff41] animate-pulse">
                +{formatNumber(calculateTotalRvs())} RVS
              </div>
            </div>
          </div>
        </div>

        {routineNotice && (
          <div className="p-2.5 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{routineNotice}</span>
          </div>
        )}

        {/* REST TIMER & HAPTIC ALARM WIDGET */}
        <div className="border border-[#00ff41]/60 bg-black/80 p-3 space-y-2 shadow-neon">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#00ff41]" />
              <span className="font-headline font-bold text-xs text-white uppercase tracking-wider">
                AUTO REST TIMER (LIFTOFF STYLE)
              </span>
            </div>
            {isTimerActive ? (
              <span className="font-headline font-black text-sm text-[#00ff41] animate-pulse">
                REST: {Math.floor(restTimerSecs / 60)}:{(restTimerSecs % 60).toString().padStart(2, "0")}
              </span>
            ) : (
              <span className="text-[9px] text-zinc-400 font-bold uppercase">
                DEFAULT: {defaultRestTimerSecs >= 60 ? `${defaultRestTimerSecs / 60}m` : `${defaultRestTimerSecs}s`}
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase">
              <span>SET DEFAULT TIMER DURATION (AUTO-RUNS ON SET COMPLETION):</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { sec: 30, label: "30s" },
                { sec: 60, label: "60s (1m)" },
                { sec: 90, label: "90s (1.5m)" },
                { sec: 120, label: "120s (2m)" },
                { sec: 180, label: "180s (3m)" },
              ].map((item) => {
                const isDefault = defaultRestTimerSecs === item.sec;
                return (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => handleSetDefaultRestTimer(item.sec)}
                    className={`px-2 py-1 border text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                      isDefault
                        ? "border-amber-400 bg-amber-500 text-black shadow-gold-glow"
                        : "border-zinc-800 bg-black text-zinc-400 hover:border-[#00ff41] hover:text-white"
                    }`}
                  >
                    {isDefault ? "★ " : ""}{item.label}
                  </button>
                );
              })}
            </div>

            {isTimerActive && (
              <div className="pt-1 flex items-center justify-between border-t border-zinc-800/80 gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustTimer(-30)}
                    className="px-2 py-1 border border-zinc-700 bg-black text-zinc-300 hover:text-white font-bold cursor-pointer"
                  >
                    -30s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTimer(30)}
                    className="px-2 py-1 border border-amber-400/80 bg-amber-950/40 text-amber-300 font-bold cursor-pointer"
                  >
                    +30s
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCancelTimer}
                  className="px-2.5 py-1 border border-red-900 bg-red-950/40 text-red-400 font-bold uppercase cursor-pointer"
                >
                  SKIP / CANCEL TIMER
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WORKOUT ROUTINE TEMPLATES ACCORDION */}
        <div className="border border-pixel-border/80 bg-black/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsRoutinesOpen(!isRoutinesOpen)}
              className="flex items-center gap-2 text-xs font-headline font-bold text-amber-400 hover:text-amber-300 uppercase cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ROUTINE TEMPLATES & PRESETS ({routines.length})</span>
            </button>
            <span className="text-[9px] text-zinc-500 font-bold uppercase">
              {isRoutinesOpen ? "TAP TO COLLAPSE" : "TAP TO EXPAND"}
            </span>
          </div>

          {isRoutinesOpen && (
            <div className="space-y-2 pt-1 border-t border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {routines.map((rt) => {
                  const exCount = rt.exercises?.length || 0;
                  return (
                    <div
                      key={rt.routine_id}
                      className="p-2.5 border border-zinc-800 bg-[#141416] hover:border-amber-400 transition-all flex flex-col justify-between space-y-2 relative"
                    >
                      <div className="space-y-1 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-headline font-bold text-white uppercase line-clamp-1">
                            {rt.routine_name}
                          </span>
                          {rt.is_preset ? (
                            <span className="px-1.5 py-0.2 border border-sky-500/80 bg-sky-950/60 text-sky-300 text-[8px] font-bold uppercase">
                              PRESET
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 border border-amber-400 bg-amber-950/80 text-amber-300 text-[8px] font-bold uppercase">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 italic line-clamp-1">
                          {rt.description || `${exCount} Exercises included`}
                        </p>
                      </div>

                      {!rt.is_preset && (
                        <button
                          onClick={() => handleDeleteRoutine(rt.routine_id)}
                          className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 p-1 cursor-pointer"
                          title="Delete Custom Routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleStartFromRoutine(rt)}
                        className="w-full py-1.5 border border-amber-400/80 bg-amber-500/20 hover:bg-amber-400 hover:text-black text-amber-300 font-headline font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>START TEMPLATE ({exCount} EXERCISES)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 uppercase font-bold">
              TOTAL VOL ({weightUnit.toUpperCase()})
            </div>
            <div className="font-headline font-extrabold text-xs sm:text-sm text-white">
              {formatNumber(
                weightUnit === "lbs"
                  ? kgToLbs(calculateTotalVolume())
                  : calculateTotalVolume()
              )}{" "}
              {weightUnit.toUpperCase()}
            </div>
          </div>
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 uppercase font-bold flex items-center justify-center gap-1">
              <Timer className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
              <span>TIME</span>
            </div>
            <div className="font-headline font-extrabold text-xs sm:text-sm text-amber-300 font-mono">
              {Math.floor(elapsedSessionSecs / 60)}m {elapsedSessionSecs % 60}s
            </div>
          </div>
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 uppercase font-bold">EXERCISES</div>
            <div className="font-headline font-extrabold text-xs sm:text-sm text-[#00ff41]">
              {loggedExercises.length} LOGGED
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
            const completedSets = ex.sets.filter((s) => s.completed);
            const exVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
            const exRvs = completedSets.reduce(
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
                  <div className="grid grid-cols-12 gap-1.5 text-[9px] text-zinc-400 font-bold uppercase text-center border-b border-pixel-border/30 pb-1.5">
                    <span className="col-span-1">SET</span>
                    <span className="col-span-3">{weightUnit.toUpperCase()} (WEIGHT)</span>
                    <span className="col-span-3">REPS</span>
                    <span className="col-span-2">RVS</span>
                    <span className="col-span-3">STATUS / LOG</span>
                  </div>

                  {ex.sets.map((set, setIdx) => {
                    const setRvs = calculateSetRvs(
                      set.weight,
                      set.reps,
                      ex.rvsMultiplier,
                      ex.category,
                      ex.equipment
                    );

                    const isDone = Boolean(set.completed);
                    const exKey = ex.name.toLowerCase().trim();
                    const defKey = ex.definitionId ? ex.definitionId.toLowerCase().trim() : "";
                    const prevSets = previousLogsMap[exKey] || (defKey ? previousLogsMap[defKey] : undefined);
                    const prevSet = prevSets && prevSets.length > 0
                      ? (prevSets[setIdx] || prevSets[prevSets.length - 1])
                      : null;

                    return (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-12 gap-1.5 items-center text-xs p-1 transition-all ${
                          isDone
                            ? "border border-[#00ff41]/50 bg-[#00ff41]/10"
                            : "border border-zinc-800/80 bg-black/40"
                        }`}
                      >
                        <div className="col-span-1 text-center font-bold text-zinc-400 text-[11px]">
                          #{set.set_number}
                        </div>

                        <div className="col-span-3">
                          <input
                            type="number"
                            value={set.weight || ""}
                            onChange={(e) =>
                              handleUpdateSet(ex.id, setIdx, "weight", Number(e.target.value))
                            }
                            className={`w-full bg-black border px-2 py-1 text-center font-bold outline-none text-xs ${
                              isDone ? "border-[#00ff41] text-[#00ff41]" : "border-pixel-border text-white focus:border-[#00ff41]"
                            }`}
                            placeholder={
                              prevSet && prevSet.weight_kg > 0
                                ? String(toDisplayWeight(prevSet.weight_kg, weightUnit))
                                : isAgilityEx
                                ? "0 (BW)"
                                : "0"
                            }
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="number"
                            value={set.reps || ""}
                            onChange={(e) =>
                              handleUpdateSet(ex.id, setIdx, "reps", Number(e.target.value))
                            }
                            className={`w-full bg-black border px-2 py-1 text-center font-bold outline-none text-xs ${
                              isDone ? "border-[#00ff41] text-[#00ff41]" : "border-pixel-border text-white focus:border-[#00ff41]"
                            }`}
                            placeholder={
                              prevSet && prevSet.reps > 0
                                ? String(prevSet.reps)
                                : "0"
                            }
                          />
                        </div>

                        <div className="col-span-2 text-center">
                          <span className="font-bold text-[#00ff41] text-[10px]">+{setRvs}</span>
                        </div>

                        <div className="col-span-3 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCompleteSet(ex.id, setIdx)}
                            className={`flex-1 py-1 px-1.5 border text-[9px] font-extrabold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                              isDone
                                ? "border-[#00ff41] bg-[#00ff41] text-black shadow-neon"
                                : "border-zinc-700 bg-surface text-zinc-300 hover:border-[#00ff41] hover:text-[#00ff41]"
                            }`}
                            title={isDone ? "Click to uncheck set" : "Click to complete set & start 90s Rest Timer"}
                          >
                            <Check className={`w-3 h-3 ${isDone ? "stroke-[3]" : "opacity-40"}`} />
                            <span>{isDone ? "DONE" : "LOG SET"}</span>
                          </button>

                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(ex.id, setIdx)}
                              className="text-zinc-600 hover:text-red-500 p-1 font-bold cursor-pointer flex-shrink-0"
                              title="Delete Set"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {prevSet && (
                          <div className="col-span-12 flex items-center justify-between px-2 py-1 text-[9px] bg-zinc-950/80 border-t border-zinc-900/80 text-zinc-400 font-mono">
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
                                  handleUpdateSet(ex.id, setIdx, "weight", toDisplayWeight(prevSet.weight_kg, weightUnit));
                                  handleUpdateSet(ex.id, setIdx, "reps", prevSet.reps);
                                }}
                                className="text-[#00ff41] hover:text-[#5cff87] hover:underline cursor-pointer flex items-center gap-1 font-bold text-[8.5px] uppercase tracking-wider"
                                title="Copy previous weight and reps to this set"
                              >
                                <span>⚡ AUTOFILL</span>
                              </button>
                            )}
                          </div>
                        )}
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
                    <span className="text-[9px] px-1.5 py-0.5 border border-pixel-border/80 bg-surface text-zinc-300">
                      {completedSets.length}/{ex.sets.length} DONE
                    </span>
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
          <div className="space-y-2">
            <button
              onClick={() => setIsSaveRoutineModalOpen(true)}
              className="w-full py-2.5 border border-amber-400 bg-amber-950/40 hover:bg-amber-400 hover:text-black text-amber-300 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-gold-glow"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SAVE CURRENT WORKOUT AS ROUTINE TEMPLATE</span>
            </button>

            <button
              onClick={handleFinish}
              className="w-full py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>FINISH SESSION & ATTACK BOSS</span>
            </button>
          </div>
        )}
      </div>

      {/* SAVE ROUTINE MODAL */}
      <AnimatePresence>
        {isSaveRoutineModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
          >
            <div className="w-full max-w-md border-2 border-amber-400 bg-surface p-5 space-y-4 shadow-[0_0_50px_rgba(251,191,36,0.4)] font-mono relative">
              <button
                onClick={() => setIsSaveRoutineModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-headline font-black text-lg text-white uppercase tracking-wider">
                    SAVE ROUTINE TEMPLATE
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  SAVE YOUR CURRENT {loggedExercises.length} EXERCISES AS A REUSABLE WORKOUT TEMPLATE
                </p>
              </div>

              <form onSubmit={handleSaveCurrentAsRoutine} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">
                    ROUTINE TEMPLATE NAME:
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    placeholder="e.g. Upper Body Hypertrophy A, Leg Day Destroyer..."
                    className="w-full bg-black border border-pixel-border px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">
                    TARGET SPLIT CATEGORY:
                  </label>
                  <select
                    value={newRoutineSplit}
                    onChange={(e) => setNewRoutineSplit(e.target.value)}
                    className="w-full bg-black border border-pixel-border px-2 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none uppercase"
                  >
                    {(["Push", "Pull", "Legs", "Full Body", "Upper", "Lower", "Custom"] as const).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSaveRoutineModalOpen(false)}
                    className="w-1/3 py-2.5 border border-zinc-700 bg-black text-zinc-400 hover:text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-2.5 border border-amber-400 bg-amber-500 hover:bg-amber-400 text-black font-headline font-black text-xs uppercase tracking-wider cursor-pointer shadow-gold-glow flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>SAVE ROUTINE TEMPLATE</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
