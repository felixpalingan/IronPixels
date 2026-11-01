import { ExerciseDefinition, EXERCISE_DATABASE } from "./exercisesData";

export type FormulaType = "epley" | "brzycki";

export interface SetLogItem {
  set_number?: number;
  weight_kg?: number;
  weight?: number;
  reps: number;
}

export interface ExerciseLogItem {
  exercise_name?: string;
  name?: string;
  definitionId?: string;
  category?: string;
  sets: SetLogItem[];
}

export interface WorkoutSessionHistoryItem {
  session_id?: string;
  id?: string;
  date?: string;
  created_at?: string;
  exercises_log?: ExerciseLogItem[];
  exercises?: ExerciseLogItem[];
  total_volume_kg?: number;
  total_rvs?: number;
  duration_minutes?: number;
}

export interface Estimated1RMOptions {
  formula?: FormulaType;
  isBodyweight?: boolean;
  userBodyweightKg?: number;
}

export interface ExerciseSessionSummary {
  date: string;
  label: string; // e.g. "10/31"
  bestWeight: number; // raw weight on bar/dumbbell (0 for bodyweight only)
  bestReps: number;
  effectiveWeight: number; // weight used in 1RM calculation (includes BW if bodyweight)
  est1RM: number; // rounded kg
  volumeKg: number; // total exercise volume (using effective weight)
  rawVolumeKg: number; // total raw volume (using bar weight)
  totalReps: number;
  totalSets: number;
  isBodyweight: boolean;
}

export interface ProgressiveOverloadTarget {
  strategy: "load" | "reps" | "volume";
  title: string;
  badge: string;
  targetWeightKg: number;
  targetReps: number;
  est1RM: number;
  gainPct: number;
  description: string;
}

export interface ProgressiveOverloadAnalysis {
  exerciseId: string;
  exerciseName: string;
  category: string;
  equipment: string;
  isBodyweight: boolean;
  userBodyweightKg: number;
  historyPoints: ExerciseSessionSummary[];
  currentEst1RM: number;
  initialEst1RM: number;
  allTimePR1RM: number;
  allTimeBestSet: {
    weight: number;
    reps: number;
    est1RM: number;
    date: string;
  } | null;
  progressPct: number;
  volumeProgressPct: number;
  isPlateau: boolean;
  isBaseline: boolean;
  targets: {
    loadTarget: ProgressiveOverloadTarget;
    repTarget: ProgressiveOverloadTarget;
    volumeTarget: ProgressiveOverloadTarget;
  };
  formulaUsed: FormulaType;
}

/**
 * Calculates Estimated 1 Rep Max (1RM) using scientific formulas (Epley or Brzycki).
 * Accurately supports bodyweight movements (pull-ups, dips, push-ups) by factoring
 * user bodyweight when raw load is 0 or when weighted added load is used.
 */
export function calculateEstimated1RM(
  weightKg: number,
  reps: number,
  options?: Estimated1RMOptions
): number {
  const safeReps = Math.max(0, Math.round(Number(reps) || 0));
  if (safeReps <= 0) return 0;

  const rawWeight = Math.max(0, Number(weightKg) || 0);
  const userBw = Math.max(40, Number(options?.userBodyweightKg) || 75);
  const isBw = Boolean(options?.isBodyweight);

  // Effective load calculation
  let effectiveLoad: number;
  if (isBw) {
    // If bodyweight calisthenics: rawWeight is added external load (e.g. +10kg dip)
    effectiveLoad = rawWeight > 0 ? userBw + rawWeight : userBw;
  } else {
    effectiveLoad = rawWeight;
  }

  if (effectiveLoad <= 0) return 0;

  // Single rep is by definition the 1RM
  if (safeReps === 1) {
    return Math.round(effectiveLoad);
  }

  // Cap effective reps at 15 for 1RM estimation to avoid unrealistic mathematical extrapolation
  const cappedReps = Math.min(safeReps, 15);
  const formula = options?.formula || "epley";

  let est: number;
  if (formula === "brzycki") {
    // Brzycki: Weight * (36 / (37 - reps))
    const divisor = 37 - Math.min(cappedReps, 36);
    est = divisor > 0 ? effectiveLoad * (36 / divisor) : effectiveLoad;
  } else {
    // Epley: Weight * (1 + reps / 30)
    est = effectiveLoad * (1 + cappedReps / 30);
  }

  return Math.round(est);
}

/**
 * Checks whether an exercise is bodyweight-based (calisthenics/bodyweight movements).
 */
export function isBodyweightExercise(def?: Partial<ExerciseDefinition> | null): boolean {
  if (!def) return false;
  if (def.equipment === "Bodyweight") return true;
  const name = (def.name || "").toLowerCase();
  return (
    name.includes("bodyweight") ||
    name.includes("pull-up") ||
    name.includes("pullup") ||
    name.includes("chin-up") ||
    name.includes("chin up") ||
    name.includes("push-up") ||
    name.includes("pushup") ||
    name.includes("dip") ||
    name.includes("muscle-up") ||
    name.includes("muscle up")
  );
}

/**
 * Matches an exercise log item to a target exercise definition.
 * Matches by definitionId, exact name, or alias / fuzzy match.
 */
export function matchesExercise(
  logItem: ExerciseLogItem,
  targetDef: ExerciseDefinition
): boolean {
  if (logItem.definitionId && logItem.definitionId === targetDef.id) {
    return true;
  }

  const logName = (logItem.exercise_name || logItem.name || "").trim().toLowerCase();
  const defName = targetDef.name.trim().toLowerCase();

  if (logName === defName) return true;

  // Check aliases
  if (targetDef.aliases && Array.isArray(targetDef.aliases)) {
    if (targetDef.aliases.some((alias) => alias.trim().toLowerCase() === logName)) {
      return true;
    }
  }

  // Check simplified name (e.g. "bench press" in "Barbell Flat Bench Press")
  if (logName.length > 3 && defName.includes(logName)) {
    return true;
  }

  return false;
}

/**
 * Computes session-level stats for an exercise across all logged sets:
 * - Real 1RM set selection (finds the set with the highest calculated 1RM)
 * - Total session volume (tonnage)
 * - Total reps and set count
 */
export function calculateExerciseSessionSummary(
  session: WorkoutSessionHistoryItem,
  exerciseDef: ExerciseDefinition,
  options?: Estimated1RMOptions
): ExerciseSessionSummary | null {
  const exercisesList = session.exercises_log || session.exercises || [];
  if (!Array.isArray(exercisesList) || exercisesList.length === 0) {
    return null;
  }

  const isBw = isBodyweightExercise(exerciseDef);
  const userBw = Math.max(40, Number(options?.userBodyweightKg) || 75);
  const formula = options?.formula || "epley";

  let bestSetEst1RM = 0;
  let bestWeight = 0;
  let bestReps = 0;
  let bestEffectiveWeight = 0;

  let totalReps = 0;
  let totalSets = 0;
  let volumeKg = 0;
  let rawVolumeKg = 0;

  let matchedAny = false;

  for (const ex of exercisesList) {
    if (!matchesExercise(ex, exerciseDef)) continue;

    matchedAny = true;
    const sets = ex.sets || [];

    for (const set of sets) {
      const rawW = Math.max(0, Number(set.weight_kg ?? set.weight ?? 0));
      const reps = Math.max(0, Math.round(Number(set.reps) || 0));

      if (reps <= 0) continue;

      const setEffectiveWeight = isBw ? (rawW > 0 ? userBw + rawW : userBw) : rawW;
      const set1RM = calculateEstimated1RM(rawW, reps, {
        formula,
        isBodyweight: isBw,
        userBodyweightKg: userBw,
      });

      // Track set with best 1RM output
      if (
        set1RM > bestSetEst1RM ||
        (set1RM === bestSetEst1RM && rawW > bestWeight) ||
        (set1RM === bestSetEst1RM && rawW === bestWeight && reps > bestReps)
      ) {
        bestSetEst1RM = set1RM;
        bestWeight = rawW;
        bestReps = reps;
        bestEffectiveWeight = setEffectiveWeight;
      }

      totalSets += 1;
      totalReps += reps;
      rawVolumeKg += rawW * reps;
      volumeKg += setEffectiveWeight * reps;
    }
  }

  if (!matchedAny || totalSets === 0 || bestSetEst1RM === 0) {
    return null;
  }

  // Format date label
  const rawDate = session.date || session.created_at || "";
  const dateStr = rawDate.split("T")[0] || "";
  let label = "Session";
  if (dateStr) {
    const parts = dateStr.split("-");
    if (parts.length >= 3) {
      label = `${parts[1]}/${parts[2]}`;
    } else {
      label = dateStr;
    }
  }

  return {
    date: dateStr || new Date().toISOString().split("T")[0],
    label,
    bestWeight,
    bestReps,
    effectiveWeight: bestEffectiveWeight,
    est1RM: bestSetEst1RM,
    volumeKg: Math.round(volumeKg),
    rawVolumeKg: Math.round(rawVolumeKg),
    totalReps,
    totalSets,
    isBodyweight: isBw,
  };
}

/**
 * Generates Double Progression targets for the next workout session:
 * 1. Load Overload (+2.5kg / +5kg)
 * 2. Rep Overload (+1 rep at same weight)
 * 3. Volume Overload (+8% to 10% session tonnage)
 */
export function generateOverloadTargets(
  lastSummary: ExerciseSessionSummary,
  exerciseDef: ExerciseDefinition,
  options?: Estimated1RMOptions
): {
  loadTarget: ProgressiveOverloadTarget;
  repTarget: ProgressiveOverloadTarget;
  volumeTarget: ProgressiveOverloadTarget;
} {
  const isBw = isBodyweightExercise(exerciseDef);
  const userBw = Math.max(40, Number(options?.userBodyweightKg) || 75);
  const formula = options?.formula || "epley";

  const isLowerBody =
    exerciseDef.category === "Legs" ||
    exerciseDef.name.toLowerCase().includes("squat") ||
    exerciseDef.name.toLowerCase().includes("deadlift");

  // Determine standard weight step
  let weightIncrement = 2.5;
  if (isLowerBody && exerciseDef.equipment === "Barbell") {
    weightIncrement = 5.0; // 5kg jump for heavy lower body barbell
  } else if (exerciseDef.equipment === "Dumbbell" || exerciseDef.movementType === "isolation") {
    weightIncrement = 2.0; // 2kg jump for dumbbell/isolation
  }

  // TARGET 1: LOAD OVERLOAD (Weight increase)
  const targetLoadWeight = isBw && lastSummary.bestWeight === 0
    ? 2.5 // First added weight for bodyweight exercise!
    : lastSummary.bestWeight + weightIncrement;

  // When adding weight, maintain reps or target 1 rep below if last was high
  const targetLoadReps = Math.max(5, lastSummary.bestReps);
  const loadEst1RM = calculateEstimated1RM(targetLoadWeight, targetLoadReps, {
    formula,
    isBodyweight: isBw,
    userBodyweightKg: userBw,
  });

  const loadGainPct =
    lastSummary.est1RM > 0
      ? Math.round(((loadEst1RM - lastSummary.est1RM) / lastSummary.est1RM) * 1000) / 10
      : 5.0;

  const loadTarget: ProgressiveOverloadTarget = {
    strategy: "load",
    title: "Weight Overload",
    badge: `+${weightIncrement} KG`,
    targetWeightKg: targetLoadWeight,
    targetReps: targetLoadReps,
    est1RM: loadEst1RM,
    gainPct: Math.max(0.5, loadGainPct),
    description: isBw && lastSummary.bestWeight === 0
      ? `Add +2.5 KG plate via dip belt for ${targetLoadReps} reps.`
      : `Increase load to ${targetLoadWeight} KG for ${targetLoadReps} solid reps.`,
  };

  // TARGET 2: REP OVERLOAD (Density / Rep progression)
  const targetRepsCount = lastSummary.bestReps + 1;
  const repEst1RM = calculateEstimated1RM(lastSummary.bestWeight, targetRepsCount, {
    formula,
    isBodyweight: isBw,
    userBodyweightKg: userBw,
  });

  const repGainPct =
    lastSummary.est1RM > 0
      ? Math.round(((repEst1RM - lastSummary.est1RM) / lastSummary.est1RM) * 1000) / 10
      : 3.3;

  const repTarget: ProgressiveOverloadTarget = {
    strategy: "reps",
    title: "Rep Overload",
    badge: "+1 REP",
    targetWeightKg: lastSummary.bestWeight,
    targetReps: targetRepsCount,
    est1RM: repEst1RM,
    gainPct: Math.max(1.0, repGainPct),
    description: `Maintain ${lastSummary.bestWeight > 0 ? `${lastSummary.bestWeight} KG` : "bodyweight"} and push to ${targetRepsCount} reps.`,
  };

  // TARGET 3: VOLUME OVERLOAD (Tonnage progression)
  const volumeTargetKg = Math.round(lastSummary.volumeKg * 1.08); // +8% session volume
  const volumeTarget: ProgressiveOverloadTarget = {
    strategy: "volume",
    title: "Volume Tonnage Overload",
    badge: "+8% VOL",
    targetWeightKg: lastSummary.bestWeight,
    targetReps: lastSummary.bestReps,
    est1RM: lastSummary.est1RM,
    gainPct: 8.0,
    description: `Achieve ${volumeTargetKg.toLocaleString()} KG cumulative exercise tonnage (+8% hypertrophy signal).`,
  };

  return {
    loadTarget,
    repTarget,
    volumeTarget,
  };
}

/**
 * Full progressive overload analysis pipeline for a chosen exercise.
 * Extracts chronological trends, all-time PR, current 1RM, volume changes,
 * plateau flags, and actionable next-session targets.
 */
export function analyzeProgressiveOverload(
  sessions: WorkoutSessionHistoryItem[],
  exerciseId: string,
  options?: {
    userBodyweightKg?: number;
    formula?: FormulaType;
    heroStats?: { str: number; agi: number; vit: number; luk: number };
  }
): ProgressiveOverloadAnalysis {
  const targetDef =
    EXERCISE_DATABASE.find((e) => e.id === exerciseId) || EXERCISE_DATABASE[0];
  const isBw = isBodyweightExercise(targetDef);
  const userBw = Math.max(40, Number(options?.userBodyweightKg) || 75);
  const formula = options?.formula || "epley";

  // Sort sessions chronologically oldest to newest
  const sortedSessions = [...sessions].sort((a, b) => {
    const da = new Date(a.date || a.created_at || 0).getTime();
    const db = new Date(b.date || b.created_at || 0).getTime();
    return da - db;
  });

  const historyPoints: ExerciseSessionSummary[] = [];

  for (const session of sortedSessions) {
    const summary = calculateExerciseSessionSummary(session, targetDef, {
      formula,
      isBodyweight: isBw,
      userBodyweightKg: userBw,
    });
    if (summary) {
      historyPoints.push(summary);
    }
  }

  // If no logged history yet: provide calibrated baseline from hero stats
  if (historyPoints.length === 0) {
    const heroStr = options?.heroStats?.str || 85;
    const isAgility = targetDef.equipment === "Bodyweight" || targetDef.category === "Core";
    const relevantStat = isAgility ? (options?.heroStats?.agi || 70) : heroStr;

    let baseWeight = Math.round(relevantStat * 0.7);
    if (isBw) {
      baseWeight = 0; // Pure bodyweight baseline
    }

    const baseline1RM = calculateEstimated1RM(baseWeight, 8, {
      formula,
      isBodyweight: isBw,
      userBodyweightKg: userBw,
    });

    const baselinePoint: ExerciseSessionSummary = {
      date: new Date().toISOString().split("T")[0],
      label: "Baseline",
      bestWeight: baseWeight,
      bestReps: 8,
      effectiveWeight: isBw ? userBw : baseWeight,
      est1RM: baseline1RM,
      volumeKg: (isBw ? userBw : baseWeight) * 8 * 3,
      rawVolumeKg: baseWeight * 8 * 3,
      totalReps: 24,
      totalSets: 3,
      isBodyweight: isBw,
    };

    const targets = generateOverloadTargets(baselinePoint, targetDef, {
      formula,
      isBodyweight: isBw,
      userBodyweightKg: userBw,
    });

    return {
      exerciseId: targetDef.id,
      exerciseName: targetDef.name,
      category: targetDef.category,
      equipment: targetDef.equipment,
      isBodyweight: isBw,
      userBodyweightKg: userBw,
      historyPoints: [baselinePoint],
      currentEst1RM: baseline1RM,
      initialEst1RM: baseline1RM,
      allTimePR1RM: baseline1RM,
      allTimeBestSet: {
        weight: baseWeight,
        reps: 8,
        est1RM: baseline1RM,
        date: baselinePoint.date,
      },
      progressPct: 0,
      volumeProgressPct: 0,
      isPlateau: false,
      isBaseline: true,
      targets,
      formulaUsed: formula,
    };
  }

  // Calculate PR and current metrics
  let allTimePR1RM = 0;
  let allTimeBestSet: { weight: number; reps: number; est1RM: number; date: string } | null = null;

  for (const pt of historyPoints) {
    if (pt.est1RM > allTimePR1RM) {
      allTimePR1RM = pt.est1RM;
      allTimeBestSet = {
        weight: pt.bestWeight,
        reps: pt.bestReps,
        est1RM: pt.est1RM,
        date: pt.date,
      };
    }
  }

  const latest = historyPoints[historyPoints.length - 1];
  const initial = historyPoints[0];

  const currentEst1RM = latest.est1RM;
  const initialEst1RM = initial.est1RM;

  const progressPct =
    initialEst1RM > 0
      ? Math.round(((currentEst1RM - initialEst1RM) / initialEst1RM) * 100)
      : 0;

  // Volume progression relative to previous session
  let volumeProgressPct = 0;
  if (historyPoints.length >= 2) {
    const prev = historyPoints[historyPoints.length - 2];
    if (prev.volumeKg > 0) {
      volumeProgressPct = Math.round(
        ((latest.volumeKg - prev.volumeKg) / prev.volumeKg) * 100
      );
    }
  }

  // Plateau check: last 3 sessions without 1RM increase
  let isPlateau = false;
  if (historyPoints.length >= 3) {
    const last3 = historyPoints.slice(-3);
    if (last3[2].est1RM <= last3[1].est1RM && last3[1].est1RM <= last3[0].est1RM) {
      isPlateau = true;
    }
  }

  const targets = generateOverloadTargets(latest, targetDef, {
    formula,
    isBodyweight: isBw,
    userBodyweightKg: userBw,
  });

  return {
    exerciseId: targetDef.id,
    exerciseName: targetDef.name,
    category: targetDef.category,
    equipment: targetDef.equipment,
    isBodyweight: isBw,
    userBodyweightKg: userBw,
    historyPoints,
    currentEst1RM,
    initialEst1RM,
    allTimePR1RM,
    allTimeBestSet,
    progressPct,
    volumeProgressPct,
    isPlateau,
    isBaseline: false,
    targets,
    formulaUsed: formula,
  };
}

