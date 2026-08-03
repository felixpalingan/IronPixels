"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Calendar, Flame, ChevronDown, ChevronUp, History, Sparkles, Award } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

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
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
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

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-4 font-mono select-none">
      <div className="grid grid-cols-3 gap-2">
        <div className="border border-pixel-border bg-surface p-3 text-center space-y-1 shadow-neon">
          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">TOTAL SESSIONS</div>
          <div className="font-headline font-black text-lg text-white">{totalSessions}</div>
        </div>

        <div className="border border-pixel-border bg-surface p-3 text-center space-y-1 shadow-neon">
          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">VOLUME LIFTED</div>
          <div className="font-headline font-black text-lg text-[#00ff41]">
            {formatNumber(totalLifetimeVolume)} KG
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

          <span className="text-[10px] text-zinc-400 font-bold">
            {totalSessions} RECORDS
          </span>
        </div>

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
                            {formatNumber(session.total_volume_kg)} KG VOLUME
                          </span>
                          <span>•</span>
                          <span className="text-amber-400">
                            {formatNumber(session.total_rvs)} RVS DMG
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="p-1 text-zinc-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
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
                                Set {set.set_number}: {set.weight_kg} kg x {set.reps} reps
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
    </div>
  );
}
