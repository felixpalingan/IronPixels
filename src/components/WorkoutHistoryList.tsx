"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Calendar, Flame, ChevronDown, ChevronUp, History, Sparkles, Award, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEffects";
import { WeightUnit, kgToLbs, toDisplayWeight } from "@/lib/unitConversion";

export interface ExerciseSetLog {
  set_number: number;
  weight_kg: number;
  reps: number;
}

export interface ExerciseItemLog {
  exercise_name: string;
  category?: string;
  sets: ExerciseSetLog[];
}

export interface WorkoutSessionLog {
  session_id: string;
  date: string;
  duration_minutes: number;
  total_rvs: number;
  total_volume_kg: number;
  exercises_log: ExerciseItemLog[];
}

interface WorkoutHistoryListProps {
  userId?: string;
}

export function WorkoutHistoryList({ userId = "user-1" }: WorkoutHistoryListProps) {
  const [sessions, setSessions] = useState<WorkoutSessionLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSessionLog | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    try {
      const saved = localStorage.getItem("ironpixels_weight_unit");
      return saved === "lbs" ? "lbs" : "kg";
    } catch (e) {
      return "kg";
    }
  });

  useEffect(() => {
    const localLogs = localStorage.getItem("ironpixels_workout_history");
    if (localLogs) {
      try {
        const parsed = JSON.parse(localLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
        }
      } catch (e) {}
    }

    async function fetchHistory() {
      try {
        const res = await fetch("/api/workout/history");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions)) {
            setSessions(data.sessions);
            localStorage.setItem("ironpixels_workout_history", JSON.stringify(data.sessions));
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const totalSessions = sessions.length;
  const totalLifetimeVolume = sessions.reduce((acc, s) => acc + (s.total_volume_kg || 0), 0);
  const totalLifetimeRvs = sessions.reduce((acc, s) => acc + (s.total_rvs || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const targetId = sessionToDelete.session_id;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/workout/history?session_id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        soundEngine.play("select");
        soundEngine.triggerHaptic([80, 50, 80]);
        const updated = sessions.filter((s) => s.session_id !== targetId);
        setSessions(updated);
        try {
          localStorage.setItem("ironpixels_workout_history", JSON.stringify(updated));
        } catch (e) {}
        setDeleteNotice("WORKOUT SESSION PERMANENTLY REMOVED!");
        setTimeout(() => setDeleteNotice(null), 3500);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to delete workout session.");
      }
    } catch (err) {
      alert("Network error deleting session.");
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-4 font-mono select-none">
      <div className="grid grid-cols-3 gap-2">
        <div className="border border-pixel-border bg-surface p-3 text-center space-y-1 shadow-neon">
          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">TOTAL SESSIONS</div>
          <div className="font-headline font-black text-lg text-white">{totalSessions}</div>
        </div>

        <div className="border border-pixel-border bg-surface p-3 text-center space-y-1 shadow-neon">
          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
            VOLUME LIFTED ({weightUnit.toUpperCase()})
          </div>
          <div className="font-headline font-black text-lg text-[#00ff41]">
            {formatNumber(
              weightUnit === "lbs"
                ? kgToLbs(totalLifetimeVolume)
                : totalLifetimeVolume
            )}{" "}
            {weightUnit.toUpperCase()}
          </div>
        </div>

        <div className="border border-pixel-border bg-surface p-3 text-center space-y-1 shadow-neon">
          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">LIFETIME RVS</div>
          <div className="font-headline font-black text-lg text-amber-400">
            {formatNumber(totalLifetimeRvs)}
          </div>
        </div>
      </div>

      <div className="border border-pixel-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-pixel-border/60 pb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#00ff41]" />
            <span className="font-headline font-extrabold text-sm text-white uppercase tracking-wider">
              WORKOUT LOG HISTORY
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-pixel-border bg-black p-0.5 shadow-neon">
              <button
                type="button"
                onClick={() => {
                  soundEngine.play("select");
                  setWeightUnit("kg");
                  try {
                    localStorage.setItem("ironpixels_weight_unit", "kg");
                  } catch (e) {}
                }}
                className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                  weightUnit === "kg"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="View in Kilograms (KG)"
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.play("select");
                  setWeightUnit("lbs");
                  try {
                    localStorage.setItem("ironpixels_weight_unit", "lbs");
                  } catch (e) {}
                }}
                className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                  weightUnit === "lbs"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="View in Pounds (LBS)"
              >
                LBS
              </button>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold">
              {totalSessions} RECORDS
            </span>
          </div>
        </div>

        {deleteNotice && (
          <div className="p-2 border border-red-500/80 bg-red-950/60 text-red-200 text-xs font-bold text-center tracking-wider animate-pulse uppercase">
            {deleteNotice}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="p-8 border border-dashed border-pixel-border/60 bg-black/40 text-center space-y-3">
            <div className="w-12 h-12 border border-pixel-border bg-black text-zinc-600 flex items-center justify-center mx-auto">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="font-headline font-bold text-xs text-white uppercase">NO WORKOUT LOGS FOUND</div>
              <div className="text-[10px] text-zinc-400 mt-1">
                Log your first workout session to track RVS damage & volume lifted history!
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const isExpanded = expandedId === session.session_id;

              return (
                <div
                  key={session.session_id}
                  className={`border transition-all ${
                    isExpanded
                      ? "border-[#00ff41] bg-black shadow-[0_0_15px_rgba(0,255,65,0.15)]"
                      : "border-pixel-border/60 bg-black/60 hover:border-pixel-border"
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(session.session_id)}
                    className="p-3 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 border border-pixel-border bg-surface flex items-center justify-center text-[#00ff41] font-bold text-xs">
                        <Dumbbell className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="font-headline font-extrabold text-xs text-white uppercase flex items-center gap-2">
                          <span>{session.date}</span>
                          <span className="text-[9px] text-zinc-400 font-mono font-normal">
                            ({session.duration_minutes || 45} MINS)
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5 font-bold">
                          <span className="text-[#00ff41]">
                            {formatNumber(
                              weightUnit === "lbs"
                                ? kgToLbs(session.total_volume_kg)
                                : session.total_volume_kg
                            )}{" "}
                            {weightUnit.toUpperCase()} VOLUME
                          </span>
                          <span>•</span>
                          <span className="text-amber-400">
                            {formatNumber(session.total_rvs)} RVS DMG
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.play("select");
                          setSessionToDelete(session);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 transition-colors cursor-pointer"
                        title="Delete this workout session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        className="p-1 text-zinc-400 hover:text-white"
                        title={isExpanded ? "Collapse details" : "Expand details"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-pixel-border/40 p-3 bg-[#0a0a0c] space-y-2 text-xs">
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                        EXERCISES LOGGED ({session.exercises_log?.length || 0})
                      </div>

                      {session.exercises_log?.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-2 border border-pixel-border/40 bg-black/80 space-y-1"
                        >
                          <div className="font-bold text-white uppercase text-[11px]">
                            {ex.exercise_name}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {ex.sets?.map((set, setIdx) => (
                              <span
                                key={setIdx}
                                className="px-2 py-0.5 border border-pixel-border/60 bg-surface text-[9px] text-zinc-300 font-mono"
                              >
                                Set {set.set_number}: {toDisplayWeight(set.weight_kg, weightUnit)} {weightUnit} x {set.reps} reps
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retro Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm border-2 border-red-500/80 bg-zinc-950 p-5 font-mono space-y-4 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-2 text-red-400 border-b border-red-900/60 pb-2">
              <Trash2 className="w-5 h-5 text-red-500 animate-pulse" />
              <h3 className="font-headline font-black text-sm uppercase text-white tracking-wider">
                DELETE WORKOUT LOG?
              </h3>
            </div>

            <div className="text-xs text-zinc-300 space-y-2">
              <p className="text-zinc-400">
                Are you sure you want to permanently delete this workout session log?
              </p>
              <div className="border border-zinc-800 bg-black p-2.5 text-[11px] space-y-1">
                <div className="text-white font-bold">📅 DATE: {sessionToDelete.date}</div>
                <div className="text-[#00ff41]">
                  ⚡ VOLUME: {formatNumber(sessionToDelete.total_volume_kg)} KG
                </div>
                <div className="text-amber-400">
                  💥 RVS DMG: {formatNumber(sessionToDelete.total_rvs)}
                </div>
                <div className="text-zinc-500 text-[9px] truncate">
                  ID: {sessionToDelete.session_id}
                </div>
              </div>
              <p className="text-[10px] text-red-400/90 font-bold uppercase">
                ⚠️ WARNING: This action cannot be undone!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSessionToDelete(null)}
                className="py-2 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 font-bold text-xs uppercase cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteSession}
                className="py-2 border border-red-600 bg-red-600 hover:bg-red-700 text-white font-headline font-black text-xs uppercase tracking-wider cursor-pointer shadow-neon"
              >
                {isDeleting ? "DELETING..." : "YES, DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
