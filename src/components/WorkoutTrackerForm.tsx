"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Dumbbell, Zap, Check, Search, Info, X, Timer, Volume2, History, Play, Bell, BellOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { EXERCISE_DATABASE, ExerciseDefinition, getExerciseScalingStat, isExerciseUnilateral } from "@/lib/exercisesData";
import { calculateSetRvs as calculateSetRvsPure } from "@/lib/workoutCalculations";
import { soundEngine } from "@/lib/soundEffects";
import { WeightUnit, kgToLbs, lbsToKg, toDisplayWeight, toCanonicalKg } from "@/lib/unitConversion";
import { WorkoutSetRow } from "@/components/workout/WorkoutSetRow";
import { FloatingRestTimer } from "@/components/workout/FloatingRestTimer";
import { ExerciseGuideModal } from "@/components/workout/ExerciseGuideModal";

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
  // Workout Session State (Idle vs Active)
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(() => {
    try {
      const savedActive = localStorage.getItem("ironpixels_is_workout_active");
      if (savedActive === "true") return true;
      const savedDraft = localStorage.getItem("ironpixels_active_workout_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_active_workout_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_custom_exercises");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [routines, setRoutines] = useState<any[]>([]);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState<boolean>(false);
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

  const [restTimerTotalDuration, setRestTimerTotalDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_rest_timer_total");
      if (saved) return Number(saved);
      const defaultSecs = localStorage.getItem("ironpixels_default_rest_timer");
      if (defaultSecs) return Number(defaultSecs);
    } catch (e) {}
    return 90;
  });

  // Real Session duration tracking (Strictly scoped to active session)
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    try {
      const savedActive = localStorage.getItem("ironpixels_is_workout_active");
      const saved = localStorage.getItem("ironpixels_session_start_time");
      if (savedActive === "true" && saved) return Number(saved);
      return 0;
    } catch (e) {
      return 0;
    }
  });

  const [elapsedSessionSecs, setElapsedSessionSecs] = useState<number>(() => {
    try {
      const savedActive = localStorage.getItem("ironpixels_is_workout_active");
      const saved = localStorage.getItem("ironpixels_session_start_time");
      if (savedActive === "true" && saved) {
        return Math.max(0, Math.floor((Date.now() - Number(saved)) / 1000));
      }
      return 0;
    } catch (e) {
      return 0;
    }
  });

  // Track session elapsed time (only when workout is active)
  useEffect(() => {
    if (!isWorkoutActive || sessionStartTime <= 0) {
      setElapsedSessionSecs(0);
      return;
    }

    const updateSessionElapsed = () => {
      setElapsedSessionSecs(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));
    };

    updateSessionElapsed();
    const sessionInterval = setInterval(updateSessionElapsed, 1000);
    return () => clearInterval(sessionInterval);
  }, [isWorkoutActive, sessionStartTime]);

  // Auto-save active workout draft
  useEffect(() => {
    try {
      if (isWorkoutActive && loggedExercises.length > 0) {
        localStorage.setItem("ironpixels_active_workout_draft", JSON.stringify(loggedExercises));
      } else if (!isWorkoutActive) {
        localStorage.removeItem("ironpixels_active_workout_draft");
      }
    } catch (e) {}
  }, [loggedExercises, isWorkoutActive]);

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const postSWMessage = (message: any) => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
      } else if (navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage(message);
        });
      }
    } catch (e) {}
  };

  const handleRequestNotificationPermission = async () => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(50);
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          soundEngine.triggerHaptic([100, 50, 100]);
          postSWMessage({
            type: "SCHEDULE_REST_TIMER",
            targetTimestamp: Date.now() + 100,
            title: "NOTIFIKASI REST AKTIF! 🔔",
            body: "HP kamu sekarang akan bergetar dan memberi notifikasi saat waktu istirahat set selesai!",
          });
        }
      } catch (e) {}
    }
  };

  // Register service worker for lockscreen rest timer notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
          }
        })
        .catch(() => {});
    }
  }, []);

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

        postSWMessage({ type: "CANCEL_REST_TIMER" });
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
    setRestTimerTotalDuration(secs);
    setIsTimerActive(true);
    try {
      localStorage.setItem("ironpixels_rest_timer_target", target.toString());
      localStorage.setItem("ironpixels_rest_timer_total", secs.toString());
    } catch (e) {}

    // Service Worker lockscreen notification request
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      }
      postSWMessage({
        type: "SCHEDULE_REST_TIMER",
        targetTimestamp: target,
        title: "REST TIMER SELESAI! 🏋️",
        body: "Waktu istirahat selesai! Masuk ke set berikutnya untuk menyerang boss!",
      });
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
    setRestTimerTotalDuration((prev) => Math.max(prev, newSecs));
    setIsTimerActive(newSecs > 0);
    try {
      if (newSecs > 0) {
        localStorage.setItem("ironpixels_rest_timer_target", newTarget.toString());
      } else {
        localStorage.removeItem("ironpixels_rest_timer_target");
      }
    } catch (e) {}

    try {
      if (newSecs > 0) {
        postSWMessage({
          type: "SCHEDULE_REST_TIMER",
          targetTimestamp: newTarget,
          title: "REST TIMER SELESAI! 🏋️",
          body: "Waktu istirahat selesai! Masuk ke set berikutnya untuk menyerang boss!",
        });
      } else {
        postSWMessage({
          type: "CANCEL_REST_TIMER",
        });
      }
    } catch (e) {}
  };

  const handleCancelTimer = () => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(50);
    setIsTimerActive(false);
    setTargetEndTime(null);
    setRestTimerSecs(0);
    try {
      localStorage.removeItem("ironpixels_rest_timer_target");
      localStorage.removeItem("ironpixels_rest_timer_total");
    } catch (e) {}
    postSWMessage({
      type: "CANCEL_REST_TIMER",
    });
  };

  // Explicit session control: Start workout session
  const handleStartWorkoutSession = (initialExercises: LoggedExercise[] = []) => {
    const now = Date.now();
    soundEngine.play("select");
    soundEngine.triggerHaptic([100, 50, 100]);
    setIsWorkoutActive(true);
    setSessionStartTime(now);
    setElapsedSessionSecs(0);
    if (initialExercises.length > 0) {
      setLoggedExercises(initialExercises);
    }
    try {
      localStorage.setItem("ironpixels_is_workout_active", "true");
      localStorage.setItem("ironpixels_session_start_time", now.toString());
      if (initialExercises.length > 0) {
        localStorage.setItem("ironpixels_active_workout_draft", JSON.stringify(initialExercises));
      }
    } catch (e) {}
    setRoutineNotice("SESI LATIHAN DIMULAI! HAJAR SEMUA SET & KALAHKAN BOSS! ⚔️");
    setTimeout(() => setRoutineNotice(null), 4000);
  };

  // Explicit session control: Discard / cancel active workout session
  const handleDiscardWorkout = () => {
    soundEngine.play("select");
    soundEngine.triggerHaptic(50);
    setIsWorkoutActive(false);
    setLoggedExercises([]);
    setSessionStartTime(0);
    setElapsedSessionSecs(0);
    setIsTimerActive(false);
    setTargetEndTime(null);
    setRestTimerSecs(0);
    try {
      localStorage.removeItem("ironpixels_is_workout_active");
      localStorage.removeItem("ironpixels_session_start_time");
      localStorage.removeItem("ironpixels_active_workout_draft");
      localStorage.removeItem("ironpixels_rest_timer_target");
    } catch (e) {}
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CANCEL_REST_TIMER" });
    }
    setRoutineNotice("SESI LATIHAN DIBATALKAN. SEMUA DATA RESET KE IDLE.");
    setTimeout(() => setRoutineNotice(null), 3000);
  };

  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [activeGuideExercise, setActiveGuideExercise] = useState<ExerciseDefinition | null>(null);

  // Custom exercise form fields
  const [cName, setCName] = useState<string>("");
  const [cCategory, setCCategory] = useState<ExerciseDefinition["category"]>("Chest");
  const [cEquipment, setCEquipment] = useState<ExerciseDefinition["equipment"]>("Bodyweight");
  const [cDifficulty, setCDifficulty] = useState<ExerciseDefinition["difficultyLabel"]>("Intermediate");
  const [cScalingStat, setCScalingStat] = useState<"STR" | "AGI">("AGI");
  const [cMultiplier, setCMultiplier] = useState<number>(1.0);
  const [cIsUnilateral, setCIsUnilateral] = useState<boolean>(false);

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

    if (!isWorkoutActive) {
      handleStartWorkoutSession(newLoggedList);
    } else {
      setLoggedExercises(newLoggedList);
    }
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

  const handleSelectDifficulty = (label: ExerciseDefinition["difficultyLabel"]) => {
    setCDifficulty(label);
    const defaultMultMap: Record<ExerciseDefinition["difficultyLabel"], number> = {
      Novice: 0.85,
      Intermediate: 1.0,
      Advanced: 1.2,
      Master: 1.35,
    };
    setCMultiplier(defaultMultMap[label] || 1.0);
  };

  const handleSelectCategory = (cat: ExerciseDefinition["category"]) => {
    setCCategory(cat);
    if (cat === "Cardio" || cat === "Core") {
      setCScalingStat("AGI");
    }
  };

  const handleSelectEquipment = (eq: ExerciseDefinition["equipment"]) => {
    setCEquipment(eq);
    if (eq === "Bodyweight" || cCategory === "Cardio" || cCategory === "Core") {
      setCScalingStat("AGI");
    } else {
      setCScalingStat("STR");
    }
  };

  const handleDeleteCustomExercise = (id: string, name: string) => {
    if (!window.confirm(`Hapus latihan kustom "${name}" dari database personal?`)) return;
    const updated = customExercises.filter((e) => e.id !== id);
    setCustomExercises(updated);
    try {
      localStorage.setItem("ironpixels_custom_exercises", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    const difficultyRankMap: Record<ExerciseDefinition["difficultyLabel"], number> = {
      Novice: 1,
      Intermediate: 2,
      Advanced: 4,
      Master: 5,
    };

    const cleanMultiplier = Math.round((Number(cMultiplier) || 1.0) * 100) / 100;

    const newCustomEx: ExerciseDefinition = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cName.trim(),
      category: cCategory,
      difficultyRank: difficultyRankMap[cDifficulty] || 2,
      difficultyLabel: cDifficulty,
      equipment: cEquipment,
      scalingStat: cScalingStat,
      targetMuscles: [cCategory],
      instructions: [
        `Lakukan gerakan ${cName.trim()} dengan kontrol postur dan rentang gerak penuh (full ROM).`,
        "Fokus pada kontraksi otot target, hembuskan napas saat fase kontraksi / beban puncak.",
      ],
      rvsMultiplier: cleanMultiplier,
      isUnilateral: cIsUnilateral,
      aliases: [cName.trim().toLowerCase()],
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
    setCDifficulty("Intermediate");
    setCIsUnilateral(false);
    setIsCustomModalOpen(false);
  };

  const calculateSetRvs = (
    weight: number,
    reps: number,
    multiplier: number = 1.0,
    category: string = "Chest",
    equipment: string = "Barbell",
    exerciseName: string = ""
  ) => {
    const canonicalWeight = toCanonicalKg(weight, weightUnit);
    return calculateSetRvsPure({
      weight: canonicalWeight,
      reps,
      multiplier,
      category,
      equipment,
      exerciseName,
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
            sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier, ex.category, ex.equipment, ex.name),
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
    if (!isWorkoutActive) {
      handleStartWorkoutSession([newEx]);
    } else {
      setLoggedExercises((prev) => [...prev, newEx]);
    }
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
            sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier, ex.category, ex.equipment, ex.name),
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
      Math.round((Date.now() - (sessionStartTime || Date.now())) / (1000 * 60))
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
      localStorage.removeItem("ironpixels_is_workout_active");
      localStorage.removeItem("ironpixels_session_start_time");
      localStorage.removeItem("ironpixels_active_workout_draft");
      localStorage.removeItem("ironpixels_rest_timer_target");
    } catch (e) {}

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CANCEL_REST_TIMER" });
    }

    setIsWorkoutActive(false);
    setSessionStartTime(0);
    setElapsedSessionSecs(0);
    setIsTimerActive(false);
    setTargetEndTime(null);
    setRestTimerSecs(0);
    setLoggedExercises([]);
  };

  const categories = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

  const allExercises = [...customExercises, ...EXERCISE_DATABASE];

  const filteredDatabase = allExercises.filter((def) => {
    const matchesCategory = selectedCategory === "All" || def.category === selectedCategory;
    if (!matchesCategory) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const normalizedQ = q
      .replace(/dumbell/g, "dumbbell")
      .replace(/squad\b/g, "squat")
      .replace(/goblit/g, "goblet")
      .replace(/pushups/g, "push up")
      .replace(/pullups/g, "pull up");

    const matchesSearch =
      def.name.toLowerCase().includes(q) ||
      def.name.toLowerCase().includes(normalizedQ) ||
      def.category.toLowerCase().includes(q) ||
      def.targetMuscles.some((m) => m.toLowerCase().includes(q) || m.toLowerCase().includes(normalizedQ)) ||
      (def.aliases && def.aliases.some((a) => a.toLowerCase().includes(q) || a.toLowerCase().includes(normalizedQ)));

    return matchesCategory && Boolean(matchesSearch);
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
    <div className="space-y-4 font-mono select-none relative">
      {/* 1. FLOATING REST TIMER OVERLAY (STICKY AT TOP OF SCREEN) */}
      <FloatingRestTimer
        isTimerActive={isTimerActive}
        restTimerSecs={restTimerSecs}
        restTimerTotalDuration={restTimerTotalDuration}
        defaultRestTimerSecs={defaultRestTimerSecs}
        onAdjustTimer={handleAdjustTimer}
        onCancelTimer={handleCancelTimer}
      />

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

        {/* WORKOUT LIFECYCLE BANNER (IDLE vs ACTIVE SESSION) */}
        {!isWorkoutActive ? (
          <div className="border border-pixel-border/80 bg-black/90 p-3.5 space-y-3 shadow-neon">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded border border-amber-400 bg-amber-950/40 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs font-headline font-black text-white uppercase tracking-wider">
                  STATUS: SESI LATIHAN SIAP (IDLE)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Timer durasi saat ini <span className="text-amber-400 font-bold">BERHENTI (00:00)</span>. Klik tombol untuk menyalakan timer sesi.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleStartWorkoutSession()}
                className="w-full sm:flex-1 py-3 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>MULAI SESI LATIHAN (START)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRoutinesOpen(!isRoutinesOpen)}
                className="w-full sm:w-auto px-4 py-3 border border-amber-400 bg-amber-950/40 hover:bg-amber-400 hover:text-black text-amber-300 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-gold-glow transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>PILIH DARI TEMPLATE</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2.5 border border-[#00ff41]/80 bg-[#00ff41]/10 flex items-center justify-between gap-2 shadow-neon">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff41] animate-ping flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-headline font-bold text-[#00ff41] uppercase tracking-wider truncate">
                  SESI LATIHAN SEDANG BERJALAN ⏱️
                </span>
                <span className="text-[9px] text-zinc-300 font-mono truncate">
                  Auto-save draft aktif 💾 ({loggedExercises.length} gerakan, {loggedExercises.reduce((sum, ex) => sum + ex.sets.length, 0)} set)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Yakin ingin MEMBATALKAN sesi latihan ini?\n\nSeluruh set yang sudah dicatat akan dihapus dan timer akan dihentikan."
                  )
                ) {
                  handleDiscardWorkout();
                }
              }}
              className="px-2.5 py-1 border border-red-600 bg-red-950/80 hover:bg-red-900 text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-red-glow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>BATALKAN SESI (CANCEL)</span>
            </button>
          </div>
        )}

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
                    className={`min-h-[36px] sm:min-h-0 px-3 sm:px-2 py-1.5 sm:py-1 border text-[10px] sm:text-[9px] font-extrabold uppercase transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
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

            {/* MOBILE NOTIFICATION & VIBRATION STATUS BAR */}
            <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-400 font-mono">
                <Bell className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>NOTIFIKASI HP & GETAR:</span>
              </div>

              {notificationPermission === "granted" ? (
                <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 border border-[#00ff41]/60 bg-[#00ff41]/15 text-[#00ff41] font-mono font-bold uppercase shadow-neon">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>AKTIF (BERGETAR)</span>
                </div>
              ) : notificationPermission === "denied" ? (
                <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 border border-red-900 bg-red-950/40 text-red-400 font-mono uppercase">
                  <BellOff className="w-2.5 h-2.5" />
                  <span>DIBLOKIR BROWSER</span>
                </div>
              ) : notificationPermission === "unsupported" ? (
                <span className="text-zinc-500 font-mono text-[9px]">TIDAK DIDUKUNG</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-2.5 py-1 border border-amber-400 bg-amber-950/60 hover:bg-amber-400 hover:text-black text-amber-300 font-headline font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-gold-glow transition-all"
                >
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>AKTIFKAN GETAR HP</span>
                </button>
              )}
            </div>
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
              <Timer className={`w-2.5 h-2.5 ${isWorkoutActive ? "text-amber-400 animate-pulse" : "text-zinc-500"}`} />
              <span>TIME</span>
            </div>
            <div className={`font-headline font-extrabold text-xs sm:text-sm font-mono ${isWorkoutActive ? "text-amber-300" : "text-zinc-500"}`}>
              {isWorkoutActive ? `${Math.floor(elapsedSessionSecs / 60)}m ${elapsedSessionSecs % 60}s` : "00m 00s (IDLE)"}
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
                sum + calculateSetRvs(s.weight, s.reps, ex.rvsMultiplier, ex.category, ex.equipment, ex.name),
              0
            );
            const defObj = EXERCISE_DATABASE.find((d) => d.id === ex.definitionId);
            const scalingStat = getExerciseScalingStat({ category: ex.category, equipment: ex.equipment });
            const isAgilityEx = scalingStat === "AGI";
            const isUnilateralEx = isExerciseUnilateral({ name: ex.name, isUnilateral: defObj?.isUnilateral });
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
                        {isUnilateralEx && (
                          <span className="text-[9px] px-1.5 py-0.5 border border-sky-400 bg-sky-950/80 text-sky-300 font-bold flex-shrink-0">
                            ⚡ UNILATERAL (PER SISI)
                          </span>
                        )}
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

                {isUnilateralEx && (
                  <div className="flex items-start sm:items-center gap-2 p-2 bg-sky-950/40 border border-sky-500/50 text-sky-200 text-[10.5px] font-mono shadow-sm">
                    <span className="px-1.5 py-0.5 bg-sky-900 border border-sky-400 text-sky-200 font-extrabold text-[9px] uppercase tracking-wider flex-shrink-0">
                      💡 TIPS LOG UNILATERAL
                    </span>
                    <span className="leading-tight">
                      Catat <strong>beban 1 dumbbell</strong> &amp; <strong>reps per tangan/kaki</strong> (contoh: 8 reps kiri &amp; 8 reps kanan = ketik <strong>8 reps</strong>, jangan ditotal).
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1.5 text-[9px] text-zinc-400 font-bold uppercase text-center border-b border-pixel-border/30 pb-1.5">
                    <span className="col-span-1">SET</span>
                    <span className="col-span-3">
                      {weightUnit.toUpperCase()} {isUnilateralEx ? "(PER DUMBBELL)" : "(WEIGHT)"}
                    </span>
                    <span className="col-span-3">{isUnilateralEx ? "REPS / SISI" : "REPS"}</span>
                    <span className="col-span-2">RVS</span>
                    <span className="col-span-3">STATUS / LOG</span>
                  </div>

                  {ex.sets.map((set, setIdx) => {
                    const setRvs = calculateSetRvs(
                      set.weight,
                      set.reps,
                      ex.rvsMultiplier,
                      ex.category,
                      ex.equipment,
                      ex.name
                    );

                    const exKey = ex.name.toLowerCase().trim();
                    const defKey = ex.definitionId ? ex.definitionId.toLowerCase().trim() : "";
                    const prevSets = previousLogsMap[exKey] || (defKey ? previousLogsMap[defKey] : undefined);
                    const prevSet = prevSets && prevSets.length > 0
                      ? (prevSets[setIdx] || prevSets[prevSets.length - 1])
                      : null;

                    return (
                      <WorkoutSetRow
                        key={setIdx}
                        exerciseId={ex.id}
                        setIndex={setIdx}
                        set={set}
                        setRvs={setRvs}
                        weightUnit={weightUnit}
                        isAgilityEx={isAgilityEx}
                        isUnilateralEx={isUnilateralEx}
                        canDelete={ex.sets.length > 1}
                        prevSet={prevSet}
                        onUpdateSet={handleUpdateSet}
                        onToggleCompleteSet={handleToggleCompleteSet}
                        onRemoveSet={handleRemoveSet}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-pixel-border/40 text-[10px]">
                  <button
                    onClick={() => handleAddSet(ex.id)}
                    className="min-h-[38px] px-3 py-2 sm:py-1 border border-pixel-border bg-black hover:border-[#00ff41] text-[#00ff41] font-bold text-[11px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
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

        {isWorkoutActive && loggedExercises.length === 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Yakin ingin membatalkan sesi latihan kosong ini?\n\nTimer akan berhenti dan di-reset.")) {
                  handleDiscardWorkout();
                }
              }}
              className="w-full py-2.5 border border-red-900/60 bg-red-950/40 hover:bg-red-900 text-red-300 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-red-glow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>BATALKAN SESI LATIHAN KOSONG</span>
            </button>
          </div>
        )}

        {loggedExercises.length > 0 && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setIsSaveRoutineModalOpen(true)}
              className="w-full py-2.5 border border-amber-400 bg-amber-950/40 hover:bg-amber-400 hover:text-black text-amber-300 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-gold-glow"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SAVE CURRENT WORKOUT AS ROUTINE TEMPLATE</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Yakin ingin MEMBATALKAN sesi latihan ini?\n\nSemua data set yang belum disimpan akan dihapus dan timer akan berhenti."
                    )
                  ) {
                    handleDiscardWorkout();
                  }
                }}
                className="col-span-1 py-4 border border-red-600 bg-red-950/80 hover:bg-red-900 text-red-300 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-red-glow cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>BATALKAN</span>
              </button>

              <button
                onClick={handleFinish}
                className="col-span-2 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon cursor-pointer transition-all"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>SELESAIKAN & SERANG BOSS</span>
              </button>
            </div>
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
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-routine-title"
              className="w-full max-w-md max-h-[88dvh] overflow-y-auto border-2 border-amber-400 bg-surface p-5 space-y-4 shadow-[0_0_50px_rgba(251,191,36,0.4)] font-mono relative"
            >
              <button
                type="button"
                onClick={() => setIsSaveRoutineModalOpen(false)}
                aria-label="Tutup jendela simpan template"
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <h3 id="save-routine-title" className="font-headline font-black text-lg text-white uppercase tracking-wider">
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="exercise-db-title"
              className="w-full max-w-lg border-2 border-pixel-border bg-surface p-4 sm:p-5 space-y-3.5 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[88dvh] flex flex-col font-mono relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                aria-label="Tutup jendela database latihan"
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="flex items-start justify-between gap-2 pr-6">
                <div className="space-y-1">
                  <h3 id="exercise-db-title" className="font-headline font-black text-xl text-white uppercase tracking-wider">
                    EXERCISE DATABASE
                  </h3>
                  <p className="text-xs text-zinc-400">
                    CHOOSE FROM {filteredDatabase.length} EXERCISES ({customExercises.length} CUSTOM)
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (searchQuery.trim()) setCName(searchQuery.trim());
                    setIsCustomModalOpen(true);
                  }}
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

              <div className="flex-1 overflow-y-auto overscroll-contain space-y-3 pr-1 pt-1 min-h-[220px]">
                {filteredDatabase.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800 space-y-3">
                    <p>No exercises match your search query or muscle filter.</p>
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) setCName(searchQuery.trim());
                        setIsCustomModalOpen(true);
                      }}
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
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="px-1.5 py-0.5 border border-amber-400 bg-amber-950/80 text-amber-300 text-[9px] font-black uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                CUSTOM
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomExercise(def.id, def.name);
                                }}
                                title="Hapus latihan kustom"
                                className="p-1 text-zinc-500 hover:text-red-400 hover:border-red-500/50 border border-zinc-800 bg-black cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
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
                            {isExerciseUnilateral(def) && (
                              <span className="px-2 py-0.5 border border-sky-400/80 bg-sky-950/60 text-sky-300 text-[9px] font-black uppercase tracking-wider">
                                ⚡ UNILATERAL (PER SISI)
                              </span>
                            )}
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

              {/* STICKY FOOTER ACTION BAR FOR MOBILE */}
              <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="px-4 py-2 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white font-bold text-xs uppercase cursor-pointer transition-colors"
                >
                  TUTUP (CLOSE)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery.trim()) setCName(searchQuery.trim());
                    setIsCustomModalOpen(true);
                  }}
                  className="px-3.5 py-2 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41] hover:text-black text-[#00ff41] font-mono font-bold text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-neon"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ BUAT GERAKAN KUSTOM</span>
                </button>
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="custom-exercise-title"
              className="w-full max-w-md max-h-[88dvh] border-2 border-amber-500 bg-surface shadow-[0_0_50px_rgba(245,158,11,0.4)] font-mono flex flex-col overflow-hidden relative"
            >
              <div className="p-4 pb-2 border-b border-zinc-800 flex items-start justify-between flex-shrink-0">
                <div className="space-y-0.5 pr-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1 border border-amber-400 bg-amber-950/60 text-amber-400 flex-shrink-0">
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <h3 id="custom-exercise-title" className="font-headline font-black text-base sm:text-lg text-white uppercase tracking-wider">
                      BUAT GERAKAN KUSTOM
                    </h3>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Tambahkan gerakan baru ke database personalmu. Otomatis tersimpan dan bisa langsung dicatat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  aria-label="Tutup jendela buat gerakan kustom"
                  className="p-1 text-zinc-400 hover:text-white border border-zinc-700 bg-black cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomExercise} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-4 space-y-3.5 flex-1 overflow-y-auto overscroll-contain">
                  {/* QUICK INSPIRATION PRESETS */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>💡 CONTOH CEPAT (KLIK UNTUK AUTO-FILL):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: "Kettlebell Swing", cat: "Legs" as const, eq: "Dumbbell" as const, diff: "Intermediate" as const, mult: 1.0, stat: "STR" as const },
                        { name: "Ring Dips", cat: "Chest" as const, eq: "Bodyweight" as const, diff: "Advanced" as const, mult: 1.2, stat: "AGI" as const },
                        { name: "Landmine Press", cat: "Shoulders" as const, eq: "Barbell" as const, diff: "Intermediate" as const, mult: 1.0, stat: "STR" as const },
                        { name: "Nordic Hamstring Curl", cat: "Legs" as const, eq: "Bodyweight" as const, diff: "Advanced" as const, mult: 1.2, stat: "AGI" as const },
                        { name: "Farmer's Walk", cat: "Core" as const, eq: "Dumbbell" as const, diff: "Intermediate" as const, mult: 1.0, stat: "STR" as const },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setCName(preset.name);
                            setCCategory(preset.cat);
                            setCEquipment(preset.eq);
                            setCDifficulty(preset.diff);
                            setCMultiplier(preset.mult);
                            setCScalingStat(preset.stat);
                          }}
                          className="px-2 py-1 text-[10px] font-bold border border-zinc-800 bg-black/60 text-zinc-300 hover:text-amber-400 hover:border-amber-400/80 transition-all cursor-pointer truncate"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                {/* 1. EXERCISE NAME */}
                <div className="space-y-1">
                  <label className="text-[10px] text-amber-400 font-bold uppercase flex items-center justify-between">
                    <span>1. NAMA LATIHAN (EXERCISE NAME) *</span>
                    <span className="text-[9px] text-zinc-500 font-normal">Wajib diisi</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Contoh: Kettlebell Clean, Deficit Deadlift, Ring Muscle Up..."
                    className="w-full bg-black border border-pixel-border px-3 py-2.5 text-xs font-bold text-white focus:border-amber-400 outline-none transition-colors"
                  />
                </div>

                {/* 2. MUSCLE CATEGORY SELECTION (VISUAL GRID) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-300 font-bold uppercase">
                    2. TARGET KELOMPOK OTOT (MUSCLE GROUP):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
                    {[
                      { id: "Chest", label: "Dada", emoji: "🔴" },
                      { id: "Back", label: "Punggung", emoji: "🔵" },
                      { id: "Legs", label: "Kaki", emoji: "🟢" },
                      { id: "Shoulders", label: "Bahu", emoji: "🟠" },
                      { id: "Arms", label: "Lengan", emoji: "🟣" },
                      { id: "Core", label: "Perut", emoji: "🟡" },
                      { id: "Cardio", label: "Kardio", emoji: "🏃" },
                    ].map((catItem) => {
                      const isSel = cCategory === catItem.id;
                      return (
                        <button
                          key={catItem.id}
                          type="button"
                          onClick={() => handleSelectCategory(catItem.id as any)}
                          className={`py-2 px-1 text-[10px] uppercase font-bold text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSel
                              ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-gold-glow"
                              : "border-zinc-800 bg-black/60 text-zinc-400 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-xs">{catItem.emoji}</span>
                          <span className="truncate">{catItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. EQUIPMENT SELECTION (VISUAL PILLS) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-300 font-bold uppercase">
                    3. TIPE PERALATAN (EQUIPMENT):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: "Bodyweight", label: "Bodyweight", icon: "🤸" },
                      { id: "Dumbbell", label: "Dumbbell", icon: "🧱" },
                      { id: "Barbell", label: "Barbell", icon: "🏋️" },
                      { id: "Cable", label: "Cable", icon: "🪢" },
                      { id: "Machine", label: "Machine", icon: "⚙️" },
                    ].map((eqItem) => {
                      const isSel = cEquipment === eqItem.id;
                      return (
                        <button
                          key={eqItem.id}
                          type="button"
                          onClick={() => handleSelectEquipment(eqItem.id as any)}
                          className={`py-1.5 px-2 text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            isSel
                              ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-gold-glow"
                              : "border-zinc-800 bg-black/60 text-zinc-400 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          <span>{eqItem.icon}</span>
                          <span className="truncate">{eqItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. HERO STAT SCALING (STR vs AGI) */}
                <div className="space-y-1.5 p-2.5 border border-zinc-800 bg-black/40">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-zinc-300 font-bold uppercase">
                      4. STAT UTAMA SCALING HERO:
                    </label>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      Dipengaruhi stat karaktermu
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCScalingStat("STR")}
                      className={`p-2 border text-left cursor-pointer transition-all ${
                        cScalingStat === "STR"
                          ? "border-amber-500 bg-amber-950/40 text-white shadow-gold-glow"
                          : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs text-amber-400">
                        <span>🏋️</span>
                        <span>STR (STRENGTH)</span>
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                        Damage & RVS meningkat dari stat STR. Cocok untuk angkat beban berat.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCScalingStat("AGI")}
                      className={`p-2 border text-left cursor-pointer transition-all ${
                        cScalingStat === "AGI"
                          ? "border-fuchsia-500 bg-fuchsia-950/40 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                          : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs text-fuchsia-400">
                        <span>🏃</span>
                        <span>AGI (AGILITY)</span>
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                        Damage & RVS meningkat dari stat AGI. Cocok untuk calisthenics & kardio.
                      </div>
                    </button>
                  </div>
                </div>

                {/* 5. DIFFICULTY & RVS MULTIPLIER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-zinc-300 font-bold uppercase">
                      5. TINGKAT KESULITAN & PENGALI RVS ({cMultiplier.toFixed(2)}x):
                    </label>
                    <span className="text-[9px] text-emerald-400 font-mono">
                      Multiplier EXP & Boss Dmg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: "Novice" as const, label: "Pemula", mult: 0.85, color: "border-emerald-500/60 bg-emerald-950/30 text-emerald-300" },
                      { id: "Intermediate" as const, label: "Standar", mult: 1.0, color: "border-sky-500/60 bg-sky-950/30 text-sky-300" },
                      { id: "Advanced" as const, label: "Mahir", mult: 1.2, color: "border-purple-500/60 bg-purple-950/30 text-purple-300" },
                      { id: "Master" as const, label: "Master", mult: 1.35, color: "border-amber-500/60 bg-amber-950/30 text-amber-300" },
                    ].map((diff) => {
                      const isSel = cDifficulty === diff.id;
                      return (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => handleSelectDifficulty(diff.id)}
                          className={`p-2 border text-left transition-all cursor-pointer ${
                            isSel ? `${diff.color} shadow-neon ring-1 ring-white/20` : "border-zinc-800 bg-black/60 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <div className="font-extrabold text-[11px] uppercase truncate">{diff.id}</div>
                          <div className="text-[9px] opacity-75">{diff.label} ({diff.mult}x)</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* MULTIPLIER FINE TUNER */}
                  <div className="flex items-center gap-2 p-2 bg-black border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold">FINE-TUNE MULTIPLIER:</span>
                    <button
                      type="button"
                      onClick={() => setCMultiplier((prev) => Math.max(0.5, Math.round((prev - 0.05) * 100) / 100))}
                      className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-white font-black text-xs hover:bg-zinc-800 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-headline font-black text-xs text-amber-400 w-12 text-center">
                      {cMultiplier.toFixed(2)}x
                    </span>
                    <button
                      type="button"
                      onClick={() => setCMultiplier((prev) => Math.min(3.0, Math.round((prev + 0.05) * 100) / 100))}
                      className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-white font-black text-xs hover:bg-zinc-800 cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-[9px] text-zinc-500 italic ml-auto truncate">
                      (0.5x - 3.0x range)
                    </span>
                  </div>
                </div>

                {/* UNILATERAL MOVEMENT TOGGLE */}
                <div className="p-2.5 border border-sky-900/60 bg-sky-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-sky-300 font-bold uppercase flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cIsUnilateral}
                        onChange={(e) => setCIsUnilateral(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff41] cursor-pointer"
                      />
                      <span>GERAKAN UNILATERAL (1 SISI / 1 TANGAN / 1 KAKI)</span>
                    </label>
                    <span className="text-[9px] text-sky-400 font-mono font-bold">
                      {cIsUnilateral ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono leading-tight pl-6">
                    Centang jika gerakan dilakukan bergantian atau satu sisi (contoh: Dumbbell Curl 1 tangan, Split Squat). Pengguna akan diminta mengisi <strong>beban per dumbbell</strong> dan <strong>reps per sisi</strong>.
                  </p>
                </div>

                {/* 6. LIVE PREVIEW CARD */}
                <div className="space-y-1 pt-1">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                    👁️ PRATINJAU KARTU LATIHAN (LIVE PREVIEW):
                  </div>
                  <div className="p-3 border border-amber-500/80 bg-black/90 space-y-2 shadow-gold-glow">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-headline font-black text-xs text-white uppercase tracking-wide truncate">
                        {cName.trim() || "Nama Gerakan Kustom"}
                      </div>
                      <span className="px-1.5 py-0.2 border border-amber-400 bg-amber-950/80 text-amber-300 text-[9px] font-black uppercase flex items-center gap-1 flex-shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        CUSTOM
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 border text-[9px] font-extrabold uppercase ${getDifficultyBadgeStyle(cDifficulty)}`}>
                        {cDifficulty}
                      </span>
                      <span className="px-2 py-0.5 border border-sky-500/50 bg-sky-950/30 text-sky-300 text-[9px] font-bold uppercase">
                        {cCategory}
                      </span>
                      <span className="px-2 py-0.5 border border-amber-500/50 bg-amber-950/30 text-amber-300 text-[9px] font-bold uppercase">
                        {cEquipment}
                      </span>
                      {cIsUnilateral && (
                        <span className="px-2 py-0.5 border border-sky-400/80 bg-sky-950/60 text-sky-300 text-[9px] font-black uppercase">
                          ⚡ UNILATERAL (PER SISI)
                        </span>
                      )}
                      {cScalingStat === "AGI" ? (
                        <span className="px-2 py-0.5 border border-fuchsia-500/80 bg-fuchsia-950/60 text-fuchsia-300 text-[9px] font-black uppercase">
                          🏃 AGI SCALING ({cMultiplier.toFixed(2)}x)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 border border-amber-500/80 bg-amber-950/60 text-amber-300 text-[9px] font-black uppercase">
                          🏋️ STR SCALING ({cMultiplier.toFixed(2)}x)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                </div>

                {/* MODAL ACTION BUTTONS - STICKY FOOTER */}
                <div className="p-3 border-t border-zinc-800 bg-black/95 flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(false)}
                    className="w-1/3 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white font-bold text-xs uppercase cursor-pointer transition-colors"
                  >
                    BATAL
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-2.5 border border-amber-400 bg-amber-500 hover:bg-amber-400 text-black font-headline font-black text-xs uppercase tracking-wider cursor-pointer shadow-gold-glow flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>SIMPAN & TAMBAH KE SESI</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExerciseGuideModal
        activeExercise={activeGuideExercise}
        onClose={() => setActiveGuideExercise(null)}
      />
    </div>
  );
}
