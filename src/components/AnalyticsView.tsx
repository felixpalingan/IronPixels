"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Calendar,
  Dumbbell,
  Award,
  Zap,
  Flame,
  BarChart3,
  Target,
  Trophy,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { EXERCISE_DATABASE, ExerciseDefinition } from "@/lib/exercisesData";
import {
  analyzeProgressiveOverload,
  FormulaType,
  ProgressiveOverloadAnalysis,
  WorkoutSessionHistoryItem,
} from "@/lib/progressiveOverload";

interface AnalyticsViewProps {
  userId?: string;
  heroStats?: { level: number; str: number; agi: number; vit: number; luk: number };
  userBodyweightKg?: number;
}

export function AnalyticsView({
  userId = "",
  heroStats,
  userBodyweightKg = 75,
}: AnalyticsViewProps) {
  const [history, setHistory] = useState<WorkoutSessionHistoryItem[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("barbell-bench-press");
  const [formula, setFormula] = useState<FormulaType>("epley");
  const [chartMode, setChartMode] = useState<"1rm" | "volume">("1rm");
  const [streakCount, setStreakCount] = useState<number>(1);
  const [totalVolumeKg, setTotalVolumeKg] = useState<number>(0);
  const [totalRvsDealt, setTotalRvsDealt] = useState<number>(0);
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);

  useEffect(() => {
    const fetchHistory = async () => {
      let liveSessions: any[] = [];

      try {
        const res = await fetch("/api/workout/history");
        if (res.ok) {
          const data = await res.json();
          const fetchedSessions = data.sessions || data.history;
          if (fetchedSessions && Array.isArray(fetchedSessions)) {
            liveSessions = fetchedSessions;
          }
        }
      } catch (e) {}

      // Combine with local sessions if any
      try {
        const savedLocal = localStorage.getItem("ironpixels_workout_history");
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed)) {
            // Deduplicate by created_at or session_id
            const existingIds = new Set(liveSessions.map((s) => s.session_id || s.created_at));
            parsed.forEach((item: any) => {
              const key = item.session_id || item.created_at || item.date;
              if (key && !existingIds.has(key)) {
                liveSessions.push(item);
              }
            });
          }
        }
      } catch (e) {}

      setHistory(liveSessions);
      setIsDbLoaded(true);

      // Compute live totals
      let vol = 0;
      let rvs = 0;
      const workoutDates = new Set<string>();

      liveSessions.forEach((sess: any) => {
        vol += Number(sess.total_volume_kg || sess.total_volume || sess.volume) || 0;
        rvs += Number(sess.total_rvs || sess.rvs) || 0;
        const dateStr = (sess.created_at || sess.date || "").split("T")[0];
        if (dateStr) workoutDates.add(dateStr);
      });

      setTotalVolumeKg(vol);
      setTotalRvsDealt(rvs);
      setStreakCount(Math.max(1, workoutDates.size));
    };

    fetchHistory();
  }, []);

  // Generate 28-day calendar tiles matching real DB dates
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const workoutDatesMap = new Map<string, number>();

    history.forEach((sess: any) => {
      const dateStr = (sess.created_at || sess.date || "").split("T")[0];
      if (dateStr) {
        const currentVol = workoutDatesMap.get(dateStr) || 0;
        workoutDatesMap.set(
          dateStr,
          currentVol + (Number(sess.total_volume_kg || sess.total_volume || sess.volume) || 1)
        );
      }
    });

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const volOnDate = workoutDatesMap.get(dateStr);
      const hasWorkout = volOnDate !== undefined;

      days.push({
        dateStr,
        dayNum: d.getDate(),
        hasWorkout,
        volOnDate: volOnDate || 0,
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Run scientific progressive overload analysis
  const overloadAnalysis: ProgressiveOverloadAnalysis = useMemo(() => {
    return analyzeProgressiveOverload(history, selectedExerciseId, {
      formula,
      userBodyweightKg,
      heroStats,
    });
  }, [history, selectedExerciseId, formula, userBodyweightKg, heroStats]);

  // Max value for SVG bar scaling
  const maxChartValue = useMemo(() => {
    if (chartMode === "1rm") {
      const max1RM = Math.max(...overloadAnalysis.historyPoints.map((p) => p.est1RM), 10);
      return Math.round(max1RM * 1.1);
    } else {
      const maxVol = Math.max(...overloadAnalysis.historyPoints.map((p) => p.volumeKg), 50);
      return Math.round(maxVol * 1.1);
    }
  }, [overloadAnalysis.historyPoints, chartMode]);

  // Group exercises by category for easy selection
  const categorizedExercises = useMemo(() => {
    const map = new Map<string, ExerciseDefinition[]>();
    EXERCISE_DATABASE.forEach((ex) => {
      const cat = ex.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ex);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="w-full max-w-[640px] mx-auto p-4 space-y-4 font-mono select-none">
      {/* HEADER CARD */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3 shadow-neon">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 border border-pixel-green bg-pixel-green/20 flex items-center justify-center text-pixel-green">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span>HERO GYM ANALYTICS</span>
                <span
                  className={`px-1.5 py-0.2 border text-[8px] font-bold uppercase ${
                    !isDbLoaded
                      ? "border-amber-400/80 bg-amber-950/40 text-amber-300 animate-pulse"
                      : "border-pixel-green bg-pixel-green/20 text-pixel-green"
                  }`}
                >
                  {!isDbLoaded ? "SYNCHRONIZING..." : "LIVE DB SYNC"}
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                SCIENTIFIC PROGRESSIVE OVERLOAD & 1RM ESTIMATOR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-amber-400 bg-amber-950/60 text-amber-300 text-xs font-bold shadow-gold-glow">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{streakCount} ACTIVE DAYS</span>
          </div>
        </div>

        {/* METRICS OVERVIEW GRID */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {!isDbLoaded ? (
            <>
              <div className="p-2 border border-pixel-border/60 bg-black/60 space-y-1">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">SESSIONS</div>
                <div className="h-5 w-16 mx-auto bg-surface/60 border border-zinc-800 animate-shimmer-wave" />
              </div>
              <div className="p-2 border border-pixel-border/60 bg-black/60 space-y-1">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">TOTAL VOLUME</div>
                <div className="h-5 w-20 mx-auto bg-surface/60 border border-zinc-800 animate-shimmer-wave" />
              </div>
              <div className="p-2 border border-pixel-border/60 bg-black/60 space-y-1">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">TOTAL RVS</div>
                <div className="h-5 w-16 mx-auto bg-surface/60 border border-zinc-800 animate-shimmer-wave" />
              </div>
            </>
          ) : (
            <>
              <div className="p-2 border border-pixel-border/60 bg-black/60">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">SESSIONS LOGGED</div>
                <div className="font-headline font-black text-white text-sm">
                  {history.length} SESSIONS
                </div>
              </div>
              <div className="p-2 border border-pixel-border/60 bg-black/60">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">TOTAL VOLUME</div>
                <div className="font-headline font-black text-pixel-green text-sm">
                  {formatNumber(totalVolumeKg)} KG
                </div>
              </div>
              <div className="p-2 border border-pixel-border/60 bg-black/60">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">TOTAL RVS DEALT</div>
                <div className="font-headline font-black text-amber-300 text-sm">
                  +{formatNumber(totalRvsDealt)} RVS
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* WORKOUT CONSISTENCY STREAK HEATMAP */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pixel-green" />
            <h4 className="font-headline font-bold text-xs text-white uppercase tracking-wider">
              28-DAY WORKOUT CONSISTENCY HEATMAP
            </h4>
          </div>
          <span className="text-[9px] text-zinc-400 font-bold">LAST 4 WEEKS</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {calendarDays.map((tile, idx) => (
            <div
              key={idx}
              className={`h-9 border flex flex-col items-center justify-center relative transition-all ${
                tile.hasWorkout
                  ? "border-pixel-green bg-pixel-green/20 text-pixel-green shadow-neon"
                  : "border-zinc-800 bg-black/80 text-zinc-600"
              }`}
              title={`${tile.dateStr}: ${
                tile.hasWorkout
                  ? `Workout Completed (${formatNumber(tile.volOnDate)} KG)`
                  : "Rest Day"
              }`}
            >
              <span className="text-[10px] font-bold">{tile.dayNum}</span>
              {tile.hasWorkout && (
                <div className="w-1.5 h-1.5 rounded-full bg-pixel-green animate-pulse mt-0.5" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-1 font-bold">
          <span>REST DAY (BLACK)</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-zinc-800 bg-black" />
            <div className="w-2.5 h-2.5 border border-pixel-green/50 bg-pixel-green/20" />
            <div className="w-2.5 h-2.5 border border-pixel-green bg-pixel-green" />
          </div>
          <span>WORKOUT LOGGED (NEON GREEN)</span>
        </div>
      </div>

      {/* PROGRESSIVE OVERLOAD ESTIMATOR & TARGET PROTOCOL */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3 shadow-neon">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-amber-400 bg-amber-950/40 flex items-center justify-center text-amber-300">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <span>PROGRESSIVE OVERLOAD PROTOCOL</span>
                <span className="px-1.5 py-0.2 border border-amber-400/80 bg-amber-950/60 text-amber-300 text-[8px] font-bold">
                  DOUBLE PROGRESSION
                </span>
              </h4>
              <p className="text-[9px] text-zinc-400">
                1RM INTENSITY ESTIMATION & NEXT WORKOUT TARGETS
              </p>
            </div>
          </div>

          {/* Formula selection toggle */}
          <div className="flex items-center gap-1 border border-zinc-800 bg-black p-0.5 text-[9px] font-bold">
            <button
              onClick={() => setFormula("epley")}
              className={`px-2 py-0.5 transition-all ${
                formula === "epley"
                  ? "bg-amber-400 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Epley formula: W * (1 + R/30)"
            >
              EPLEY
            </button>
            <button
              onClick={() => setFormula("brzycki")}
              className={`px-2 py-0.5 transition-all ${
                formula === "brzycki"
                  ? "bg-amber-400 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Brzycki formula: W * (36 / (37 - R))"
            >
              BRZYCKI
            </button>
          </div>
        </div>

        {/* EXERCISE SELECTION DROPDOWN */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-pixel-green" />
              <span>SELECT EXERCISE TO TRACK:</span>
            </label>
            {overloadAnalysis.isBodyweight && (
              <span className="text-[9px] text-cyan-300 font-bold uppercase px-1.5 py-0.5 border border-cyan-400/60 bg-cyan-950/40">
                CALISTHENICS (BW: {overloadAnalysis.userBodyweightKg} KG)
              </span>
            )}
          </div>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-black border border-pixel-border px-3 py-2 text-xs font-bold text-white focus:border-pixel-green outline-none uppercase"
          >
            {categorizedExercises.map(([cat, list]) => (
              <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                {list.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} [{ex.equipment}]
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* METRICS & PR HERO PANEL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. CURRENT EST 1RM */}
          <div className="p-2.5 border border-amber-400/80 bg-black/80 space-y-1">
            <div className="text-[9px] text-amber-400 font-bold uppercase flex items-center justify-between">
              <span>CURRENT EST. 1RM</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="font-headline font-black text-amber-300 text-lg">
              {overloadAnalysis.currentEst1RM}{" "}
              <span className="text-xs text-zinc-400 font-normal">KG</span>
            </div>
            <div className="text-[9px] text-zinc-400">
              {overloadAnalysis.progressPct >= 0 ? (
                <span className="text-pixel-green font-bold">
                  +{overloadAnalysis.progressPct}% total progress
                </span>
              ) : (
                <span className="text-red-400 font-bold">
                  {overloadAnalysis.progressPct}% total
                </span>
              )}
            </div>
          </div>

          {/* 2. ALL-TIME PR */}
          <div className="p-2.5 border border-pixel-border/80 bg-black/80 space-y-1">
            <div className="text-[9px] text-zinc-400 font-bold uppercase flex items-center justify-between">
              <span>ALL-TIME PR (1RM)</span>
              <Trophy className="w-3 h-3 text-amber-400" />
            </div>
            <div className="font-headline font-black text-white text-lg">
              {overloadAnalysis.allTimePR1RM}{" "}
              <span className="text-xs text-zinc-400 font-normal">KG</span>
            </div>
            <div className="text-[9px] text-zinc-400 truncate">
              {overloadAnalysis.allTimeBestSet
                ? `${overloadAnalysis.allTimeBestSet.weight}KG × ${overloadAnalysis.allTimeBestSet.reps}R`
                : "No PR logged yet"}
            </div>
          </div>

          {/* 3. LATEST BEST SET */}
          <div className="p-2.5 border border-pixel-border/80 bg-black/80 space-y-1">
            <div className="text-[9px] text-zinc-400 font-bold uppercase flex items-center justify-between">
              <span>LATEST BEST SET</span>
              <Target className="w-3 h-3 text-pixel-green" />
            </div>
            {overloadAnalysis.historyPoints.length > 0 ? (
              <>
                <div className="font-headline font-black text-pixel-green text-sm truncate">
                  {overloadAnalysis.isBodyweight &&
                  overloadAnalysis.historyPoints[overloadAnalysis.historyPoints.length - 1].bestWeight === 0
                    ? `BW × ${overloadAnalysis.historyPoints[overloadAnalysis.historyPoints.length - 1].bestReps} REPS`
                    : `${overloadAnalysis.historyPoints[overloadAnalysis.historyPoints.length - 1].bestWeight}KG × ${overloadAnalysis.historyPoints[overloadAnalysis.historyPoints.length - 1].bestReps}R`}
                </div>
                <div className="text-[9px] text-zinc-400">
                  {overloadAnalysis.historyPoints[overloadAnalysis.historyPoints.length - 1].totalSets} sets logged
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 font-bold">No sets logged</div>
            )}
          </div>

          {/* 4. SESSION VOLUME LOAD */}
          <div className="p-2.5 border border-pixel-border/80 bg-black/80 space-y-1">
            <div className="text-[9px] text-zinc-400 font-bold uppercase flex items-center justify-between">
              <span>SESSION TONNAGE</span>
              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
            </div>
            {overloadAnalysis.historyPoints.length > 0 ? (
              <>
                <div className="font-headline font-black text-cyan-300 text-sm">
                  {formatNumber(
                    overloadAnalysis.historyPoints[overloadAnalysis.historyPoints.length - 1].volumeKg
                  )}{" "}
                  <span className="text-[10px] text-zinc-400 font-normal">KG</span>
                </div>
                <div className="text-[9px] text-zinc-400">
                  {overloadAnalysis.volumeProgressPct >= 0 ? (
                    <span className="text-pixel-green font-bold">
                      +{overloadAnalysis.volumeProgressPct}% vs prev
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">
                      {overloadAnalysis.volumeProgressPct}% vs prev
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 font-bold">0 KG</div>
            )}
          </div>
        </div>

        {/* PLATEAU DETECTED NOTIFICATION */}
        {overloadAnalysis.isPlateau && (
          <div className="p-2.5 border border-amber-500 bg-amber-950/50 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-amber-300 font-bold uppercase text-[10px]">
                PLATEAU DETECTED (3+ SESSIONS WITHOUT 1RM GAIN)
              </div>
              <p className="text-[9px] text-zinc-300 leading-relaxed">
                Strength adaptation has plateaued. Recommended: perform a micro-deload session
                (-20% load) or switch to a higher-rep hypertrophy scheme (10-12 reps) to trigger
                fresh neuromuscular adaptations.
              </p>
            </div>
          </div>
        )}

        {/* BASELINE NOTICE */}
        {overloadAnalysis.isBaseline && (
          <div className="p-2 border border-pixel-border/80 bg-black/60 flex items-center justify-between text-[10px] text-zinc-300">
            <span className="text-zinc-400">
              No previous workout logged for this exercise. Showing estimated starting baseline
              calibrated to your hero stats.
            </span>
          </div>
        )}

        {/* INTERACTIVE CHART: 1RM vs VOLUME VIEW */}
        <div className="p-3 border border-zinc-800 bg-black/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-bold uppercase truncate max-w-[200px]">
                {overloadAnalysis.exerciseName}
              </span>
              <span className="text-[9px] text-zinc-400">
                ({overloadAnalysis.historyPoints.length} SESSIONS)
              </span>
            </div>

            {/* Chart mode toggle */}
            <div className="flex items-center gap-1 border border-zinc-800 bg-black p-0.5 text-[9px] font-bold">
              <button
                onClick={() => setChartMode("1rm")}
                className={`px-2 py-0.5 transition-all ${
                  chartMode === "1rm"
                    ? "bg-pixel-green text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                1RM (INTENSITY)
              </button>
              <button
                onClick={() => setChartMode("volume")}
                className={`px-2 py-0.5 transition-all ${
                  chartMode === "volume"
                    ? "bg-pixel-green text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                VOLUME (TONNAGE)
              </button>
            </div>
          </div>

          {/* SVG/CSS BAR CHART */}
          <div className="h-36 flex items-end justify-between gap-2 pt-4 border-b border-zinc-800 px-2 pb-1">
            {overloadAnalysis.historyPoints.slice(-6).map((point, i) => {
              const val = chartMode === "1rm" ? point.est1RM : point.volumeKg;
              const heightPct = Math.min(
                100,
                Math.max(16, Math.round((val / maxChartValue) * 100))
              );
              const isPR = chartMode === "1rm" && point.est1RM === overloadAnalysis.allTimePR1RM;

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-pixel-green p-1 text-[8px] font-bold text-white whitespace-nowrap z-10 pointer-events-none shadow-neon">
                    <div>{point.date}</div>
                    <div className="text-amber-300">
                      Best: {point.bestWeight > 0 ? `${point.bestWeight}KG` : "BW"} × {point.bestReps}R
                    </div>
                    <div className="text-pixel-green">1RM: {point.est1RM} KG</div>
                    <div className="text-cyan-300">Vol: {point.volumeKg} KG</div>
                  </div>

                  {/* Value tag */}
                  <div className="flex items-center gap-0.5 text-[9px] font-bold">
                    {isPR && <Trophy className="w-2.5 h-2.5 text-amber-400" />}
                    <span className={isPR ? "text-amber-400 font-black" : "text-pixel-green"}>
                      {chartMode === "1rm" ? `${point.est1RM}kg` : `${point.volumeKg}k`}
                    </span>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full transition-all rounded-t-sm ${
                      isPR
                        ? "bg-gradient-to-t from-amber-500/30 to-amber-400 border-t-2 border-amber-400 shadow-gold-glow"
                        : chartMode === "1rm"
                        ? "bg-gradient-to-t from-pixel-green/20 to-pixel-green border-t-2 border-pixel-green"
                        : "bg-gradient-to-t from-cyan-500/20 to-cyan-400 border-t-2 border-cyan-400"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Date and Set label */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-zinc-300 font-bold truncate max-w-[50px]">
                      {point.label}
                    </span>
                    <span className="text-[8px] text-zinc-500 truncate max-w-[50px]">
                      {point.bestWeight > 0 ? `${point.bestWeight}k` : "BW"}×{point.bestReps}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIONABLE NEXT-SESSION TARGETS (DOUBLE PROGRESSION) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-b border-pixel-border/40 pb-1.5">
            <h5 className="font-headline font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>NEXT SESSION OVERLOAD PROTOCOL</span>
            </h5>
            <span className="text-[9px] text-pixel-green font-bold">
              PICK TARGET A OR TARGET B
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* TARGET A: LOAD OVERLOAD */}
            <div className="p-3 border border-amber-400/80 bg-black/70 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.2 border border-amber-400 bg-amber-950/60 text-amber-300 text-[8px] font-bold">
                  TARGET A: LOAD OVERLOAD
                </span>
                <span className="text-[9px] font-bold text-amber-300">
                  {overloadAnalysis.targets.loadTarget.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="font-headline font-black text-white text-base">
                  {overloadAnalysis.targets.loadTarget.targetWeightKg} KG ×{" "}
                  {overloadAnalysis.targets.loadTarget.targetReps} REPS
                </div>
                <div className="text-[9px] font-bold text-pixel-green">
                  EST 1RM: {overloadAnalysis.targets.loadTarget.est1RM} KG
                </div>
              </div>

              <p className="text-[9px] text-zinc-300 leading-tight">
                {overloadAnalysis.targets.loadTarget.description}
              </p>
            </div>

            {/* TARGET B: REP OVERLOAD */}
            <div className="p-3 border border-pixel-green/80 bg-black/70 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.2 border border-pixel-green bg-pixel-green/20 text-pixel-green text-[8px] font-bold">
                  TARGET B: REP OVERLOAD
                </span>
                <span className="text-[9px] font-bold text-pixel-green">
                  {overloadAnalysis.targets.repTarget.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="font-headline font-black text-white text-base">
                  {overloadAnalysis.targets.repTarget.targetWeightKg > 0
                    ? `${overloadAnalysis.targets.repTarget.targetWeightKg} KG`
                    : "BODYWEIGHT"}{" "}
                  × {overloadAnalysis.targets.repTarget.targetReps} REPS
                </div>
                <div className="text-[9px] font-bold text-pixel-green">
                  EST 1RM: {overloadAnalysis.targets.repTarget.est1RM} KG
                </div>
              </div>

              <p className="text-[9px] text-zinc-300 leading-tight">
                {overloadAnalysis.targets.repTarget.description}
              </p>
            </div>
          </div>

          {/* TONNAGE PROGRESSION TARGET */}
          <div className="p-2.5 border border-zinc-800 bg-black/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border border-cyan-400 bg-cyan-950/50 flex items-center justify-center text-cyan-300 text-[9px] font-bold">
                VOL
              </div>
              <div>
                <span className="text-[10px] text-zinc-300 font-bold uppercase">
                  TONNAGE ACCUMULATION GOAL:
                </span>
                <p className="text-[9px] text-zinc-400">
                  {overloadAnalysis.targets.volumeTarget.description}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 border border-cyan-400/50 bg-cyan-950/40">
              {overloadAnalysis.targets.volumeTarget.badge}
            </span>
          </div>
        </div>

        {/* SCIENTIFIC FORMULA FOOTER / EXPLANATION */}
        <div className="pt-1">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="text-[9px] text-zinc-400 hover:text-zinc-200 font-bold flex items-center gap-1 transition-colors uppercase"
          >
            <Info className="w-3 h-3 text-pixel-green" />
            <span>HOW 1RM & PROGRESSIVE OVERLOAD ARE ESTIMATED</span>
          </button>

          {showFormulaInfo && (
            <div className="mt-2 p-3 border border-zinc-800 bg-black/90 text-[9px] text-zinc-400 space-y-1.5 leading-relaxed">
              <div className="text-white font-bold uppercase">
                SCIENTIFIC 1RM METHODOLOGY ({formula.toUpperCase()}):
              </div>
              <p>
                {formula === "epley"
                  ? "• Epley Formula: 1RM = Weight × (1 + Reps / 30). Widely used in powerlifting for sets up to 10-12 reps."
                  : "• Brzycki Formula: 1RM = Weight × (36 / (37 - Reps)). A conservative, linear fatigue curve formula."}
              </p>
              <p>
                • Sets with repetitions &gt; 15 are conservatively capped to avoid aerobic endurance distortions.
              </p>
              <p>
                • Bodyweight calisthenics factor the lifter's actual bodyweight ({userBodyweightKg} KG) plus any added external load.
              </p>
              <p>
                • The Double Progression protocol recommends securing target reps before advancing load by +2.5 KG / +5 KG.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
