"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Dumbbell, Award, Zap, Flame, ChevronRight, BarChart3, ShieldCheck } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { EXERCISE_DATABASE, ExerciseDefinition } from "@/lib/exercisesData";

interface AnalyticsViewProps {
  userId?: string;
  heroStats?: { level: number; str: number; agi: number; vit: number; luk: number };
}

export function AnalyticsView({ userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c", heroStats }: AnalyticsViewProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("barbell-bench-press");
  const [streakCount, setStreakCount] = useState<number>(1);
  const [totalVolumeKg, setTotalVolumeKg] = useState<number>(0);
  const [totalRvsDealt, setTotalRvsDealt] = useState<number>(0);
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);

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
        vol += Number(sess.total_volume || sess.volume) || 0;
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
        workoutDatesMap.set(dateStr, currentVol + (Number(sess.total_volume || sess.volume) || 1));
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
  const selectedExDef = EXERCISE_DATABASE.find((e) => e.id === selectedExerciseId) || EXERCISE_DATABASE[0];

  // Calculate real progressive overload 1RM trend for selected exercise
  const computeOverloadTrend = () => {
    const points: Array<{ label: string; weight: number; est1RM: number }> = [];

    history.forEach((sess: any) => {
      const dateStr = (sess.created_at || sess.date || "").split("T")[0];
      const dateLabel = dateStr ? dateStr.substring(5) : "Session";
      const exercisesList = sess.exercises_log || sess.exercises || [];

      let maxW = 0;
      let maxReps = 0;

      if (Array.isArray(exercisesList)) {
        exercisesList.forEach((ex: any) => {
          const exName = ex.exercise_name || ex.name || "";
          if (
            exName.toLowerCase() === selectedExDef.name.toLowerCase() ||
            ex.definitionId === selectedExDef.id
          ) {
            const sets = ex.sets || [];
            sets.forEach((st: any) => {
              const w = Number(st.weight_kg || st.weight) || 0;
              const r = Number(st.reps) || 0;
              if (w > maxW || (w === maxW && r > maxReps)) {
                maxW = w;
                maxReps = r;
              }
            });
          }
        });
      }

      if (maxW > 0) {
        const est1RM = Math.round(maxW * (1 + maxReps / 30));
        points.push({
          label: dateLabel,
          weight: maxW,
          est1RM,
        });
      }
    });

    // Sort chronologically
    points.reverse();

    // If no real entries yet, provide baseline prediction scaled by hero STR/AGI
    if (points.length === 0) {
      const baseStr = heroStats?.str || 85;
      const baseWeight = Math.round(baseStr * 0.7);
      return [
        { label: "Baseline", weight: baseWeight, est1RM: Math.round(baseWeight * 1.15) },
        { label: "Goal +10%", weight: Math.round(baseWeight * 1.1), est1RM: Math.round(baseWeight * 1.25) },
      ];
    }

    return points.slice(-5);
  };

  const trendPoints = computeOverloadTrend();
  const currentEst1RM = trendPoints[trendPoints.length - 1]?.est1RM || 0;
  const initialEst1RM = trendPoints[0]?.est1RM || currentEst1RM;
  const progressPct =
    initialEst1RM > 0
      ? Math.round(((currentEst1RM - initialEst1RM) / initialEst1RM) * 100)
      : 0;

  const maxChart1RM = Math.max(...trendPoints.map((p) => p.est1RM), 10);

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      {/* HEADER CARD */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3 shadow-neon">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 border border-[#00ff41] bg-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span>HERO GYM ANALYTICS</span>
                <span className="px-1.5 py-0.2 border border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] text-[8px] font-bold uppercase">
                  LIVE DB SYNC
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                REALTIME PROGRESSIVE OVERLOAD & CONSISTENCY TRACKER
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
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">SESSIONS LOGGED</div>
            <div className="font-headline font-black text-white text-sm">{history.length} SESSIONS</div>
          </div>
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">TOTAL VOLUME</div>
            <div className="font-headline font-black text-[#00ff41] text-sm">{formatNumber(totalVolumeKg)} KG</div>
          </div>
          <div className="p-2 border border-pixel-border/60 bg-black/60">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">TOTAL RVS DEALT</div>
            <div className="font-headline font-black text-amber-300 text-sm">+{formatNumber(totalRvsDealt)} RVS</div>
          </div>
        </div>
      </div>

      {/* WORKOUT CONSISTENCY STREAK HEATMAP */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00ff41]" />
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
                  ? "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] shadow-neon"
                  : "border-zinc-800 bg-black/80 text-zinc-600"
              }`}
              title={`${tile.dateStr}: ${
                tile.hasWorkout ? `Workout Completed (${formatNumber(tile.volOnDate)} KG)` : "Rest Day"
              }`}
            >
              <span className="text-[10px] font-bold">{tile.dayNum}</span>
              {tile.hasWorkout && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse mt-0.5" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-1 font-bold">
          <span>REST DAY (BLACK)</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-zinc-800 bg-black" />
            <div className="w-2.5 h-2.5 border border-[#00ff41]/50 bg-[#00ff41]/20" />
            <div className="w-2.5 h-2.5 border border-[#00ff41] bg-[#00ff41]" />
          </div>
          <span>WORKOUT LOGGED (NEON GREEN)</span>
        </div>
      </div>

      {/* PROGRESSIVE OVERLOAD BAR CHART */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h4 className="font-headline font-bold text-xs text-white uppercase tracking-wider">
              PROGRESSIVE OVERLOAD (1RM ESTIMATOR)
            </h4>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 font-bold uppercase">SELECT EXERCISE TO TRACK:</label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-black border border-pixel-border px-3 py-2 text-xs font-bold text-white focus:border-[#00ff41] outline-none uppercase"
          >
            {EXERCISE_DATABASE.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 border border-zinc-800 bg-black/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-bold uppercase">{selectedExDef.name}</span>
            <span className="text-amber-300 font-bold">
              EST. 1RM: {currentEst1RM} KG ({progressPct >= 0 ? `+${progressPct}%` : `${progressPct}%`} PROGRESS)
            </span>
          </div>

          {/* SVG BAR CHART */}
          <div className="h-32 flex items-end justify-between gap-2 pt-4 border-b border-zinc-800 px-2 pb-1">
            {trendPoints.map((t, i) => {
              const heightPct = Math.max(15, Math.round((t.est1RM / maxChart1RM) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-[#00ff41]">{t.est1RM}kg</span>
                  <div
                    className="w-full bg-gradient-to-t from-[#00ff41]/20 to-[#00ff41] border-t-2 border-[#00ff41] transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-zinc-400 font-bold truncate max-w-[45px]">{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
