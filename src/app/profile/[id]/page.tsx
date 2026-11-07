"use client";

import { useEffect, useState, use } from "react";
import {
  Shield,
  Zap,
  Flame,
  Trophy,
  Dumbbell,
  Calendar,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Swords,
  UserPlus,
  Heart,
  Clock,
  Layers,
} from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/Skeleton";
import { isExerciseDistanceBased } from "@/lib/exercisesData";

interface HeroData {
  user_id: string;
  username: string;
  character_class: string;
  gender: string;
  level: number;
  current_hp: number;
  max_hp: number;
  exp: number;
  max_exp: number;
  gold: number;
  max_floor: number;
  daily_rvs: number;
  workout_streak: number;
  longest_streak: number;
  combat_power: number;
  stats: {
    str: number;
    agi: number;
    vit: number;
    luk: number;
    base_str: number;
    base_agi: number;
    base_vit: number;
    base_luk: number;
  };
  created_at: string;
  party?: { party_id: string; party_name: string } | null;
}

interface EquippedGear {
  inventory_id: string;
  item_id: string;
  item_name: string;
  type: string;
  rarity: string;
  bonus_str: number;
  bonus_agi: number;
  bonus_vit: number;
  bonus_luk: number;
  bonus_hp: number;
  icon: string;
  image_url: string;
  description: string;
}

interface WorkoutSessionItem {
  session_id: string;
  date: string;
  duration_minutes: number;
  total_rvs: number;
  total_volume_kg: number;
  exercises_log: any[];
  created_at?: string;
}

interface PublicProfileResponse {
  hero: HeroData;
  equipped_gear: EquippedGear[];
  workout_sessions: WorkoutSessionItem[];
  metrics: {
    total_sessions: number;
    lifetime_volume_kg: number;
    lifetime_rvs: number;
    active_streak: number;
    longest_streak: number;
    recent_activity_dates: string[];
  };
}

export default function PublicHeroProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const targetId = resolvedParams.id;

  const [data, setData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/public/${encodeURIComponent(targetId)}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Operative file not found in registry.");
        }
        const json: PublicProfileResponse = await res.json();
        if (isMounted) {
          setData(json);
          // Auto-expand most recent session
          if (json.workout_sessions && json.workout_sessions.length > 0) {
            setExpandedSessionIds({ [json.workout_sessions[0].session_id]: true });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load operative dossier.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (targetId) {
      fetchProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // Helper for Hero Sprite
  const getHeroSpriteUrl = (charClass: string, gender: string) => {
    const cls = (charClass || "WARRIOR").toUpperCase();
    const g = (gender || "m").toLowerCase() === "f" ? "f" : "m";
    if (cls === "MAGE" || cls === "WIZARD") return `/assets/dungeon/heroes/wizzard_${g}_idle_anim_f0.png`;
    if (cls === "ROGUE" || cls === "ASSASSIN") return `/assets/dungeon/heroes/elf_${g}_idle_anim_f0.png`;
    if (cls === "PALADIN" || cls === "TANK") return `/assets/dungeon/heroes/dwarf_${g}_idle_anim_f0.png`;
    return `/assets/dungeon/heroes/knight_${g}_idle_anim_f0.png`;
  };

  // Helper for Rarity border & text colors
  const getRarityBadge = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "mythic":
        return "border-red-500 bg-red-950/40 text-red-400";
      case "legendary":
        return "border-amber-400 bg-amber-950/40 text-amber-300";
      case "epic":
        return "border-purple-500 bg-purple-950/40 text-purple-300";
      case "rare":
        return "border-sky-400 bg-sky-950/40 text-sky-300";
      default:
        return "border-zinc-600 bg-zinc-900/40 text-zinc-300";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-4 sm:p-8 font-mono">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-pixel-border pb-4">
            <Skeleton className="w-32 h-8 bg-zinc-900" />
            <Skeleton className="w-28 h-8 bg-zinc-900" />
          </div>
          <div className="border border-pixel-border bg-surface p-6 space-y-4">
            <div className="flex gap-4 items-center">
              <Skeleton className="w-20 h-20 bg-zinc-900 border border-zinc-700" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-48 h-6 bg-zinc-800" />
                <Skeleton className="w-32 h-4 bg-zinc-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 bg-zinc-900" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black text-white p-4 sm:p-8 font-mono flex items-center justify-center">
        <div className="max-w-md w-full border-2 border-red-500/80 bg-red-950/20 p-6 text-center space-y-4 shadow-red-glow">
          <div className="w-12 h-12 mx-auto bg-red-950 border border-red-500 flex items-center justify-center text-red-400 font-headline font-black text-2xl">
            !
          </div>
          <h2 className="font-headline font-black text-lg uppercase tracking-wide text-red-400">
            HERO DOSSIER NOT FOUND
          </h2>
          <p className="text-xs text-zinc-400">
            {error || "The requested operative identity does not exist in the IronPixels database."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 border border-pixel-green bg-pixel-green/20 hover:bg-pixel-green text-pixel-green hover:text-black font-headline font-bold text-xs uppercase transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO HQ</span>
          </a>
        </div>
      </main>
    );
  }

  const { hero, equipped_gear, workout_sessions, metrics } = data;

  // Build 28-day activity heatmap
  const today = new Date();
  const past28Days: { dateStr: string; label: string; active: boolean }[] = [];
  const activityDateSet = new Set(metrics.recent_activity_dates.map((d) => d.split("T")[0]));

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    past28Days.push({
      dateStr,
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      active: activityDateSet.has(dateStr),
    });
  }

  return (
    <main className="min-h-screen bg-[#07090e] text-white p-3 sm:p-6 lg:p-8 font-mono selection:bg-pixel-green selection:text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Share Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-pixel-border/80 pb-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-zinc-700 bg-surface/80 hover:border-pixel-green text-zinc-300 hover:text-pixel-green text-xs font-bold uppercase transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>HQ / DASHBOARD</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold uppercase transition-all active:scale-95 ${
                copied
                  ? "border-pixel-green bg-pixel-green text-black shadow-neon"
                  : "border-cyan-500/80 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500 hover:text-black"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "LINK COPIED!" : "SHARE DOSSIER"}</span>
            </button>
          </div>
        </header>

        {/* Hero Dossier Card */}
        <section className="relative border-2 border-pixel-border bg-gradient-to-b from-surface via-black to-surface p-5 sm:p-7 shadow-neon overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-pixel-green/10 border-b border-l border-pixel-green/40 text-pixel-green text-[9px] font-bold tracking-widest uppercase">
            OPERATIVE DOSSIER // VERIFIED RECORD
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-3 sm:pt-0">
            {/* Sprite Avatar Frame */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-black/80 border-2 border-pixel-border p-2 flex items-center justify-center shadow-inner flex-shrink-0">
              <img
                src={getHeroSpriteUrl(hero.character_class, hero.gender)}
                alt={hero.character_class}
                className="w-full h-full object-contain pixelated scale-125 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black border border-pixel-green text-pixel-green text-[9px] font-headline font-black uppercase whitespace-nowrap shadow-sm">
                LVL {hero.level}
              </span>
            </div>

            {/* Profile Info & Class Info */}
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-headline font-black text-2xl sm:text-3xl uppercase tracking-wider text-white">
                  {hero.username}
                </h1>
                <span className="px-2 py-0.5 border border-purple-500 bg-purple-950/60 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                  {hero.character_class}
                </span>
                {hero.party && (
                  <span className="px-2 py-0.5 border border-sky-400 bg-sky-950/60 text-sky-300 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>{hero.party.party_name}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-zinc-300">
                    CP: <span className="text-amber-400 font-headline font-black">{formatNumber(hero.combat_power)}</span>
                  </span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-pixel-green" />
                  <span className="font-bold text-zinc-300">
                    DUNGEON: <span className="text-pixel-green font-headline font-black">FLOOR {hero.max_floor}</span>
                  </span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-bold text-zinc-300">
                    HP: <span className="text-rose-400 font-bold">{hero.current_hp} / {hero.max_hp}</span>
                  </span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2 bg-black/60 border border-zinc-800 text-center">
                  <div className="text-[9px] text-zinc-500 font-bold">STRENGTH</div>
                  <div className="font-headline font-black text-sm text-amber-400">
                    {hero.stats.str} <span className="text-[10px] text-zinc-500">({hero.stats.base_str})</span>
                  </div>
                </div>
                <div className="p-2 bg-black/60 border border-zinc-800 text-center">
                  <div className="text-[9px] text-zinc-500 font-bold">AGILITY</div>
                  <div className="font-headline font-black text-sm text-emerald-400">
                    {hero.stats.agi} <span className="text-[10px] text-zinc-500">({hero.stats.base_agi})</span>
                  </div>
                </div>
                <div className="p-2 bg-black/60 border border-zinc-800 text-center">
                  <div className="text-[9px] text-zinc-500 font-bold">VITALITY</div>
                  <div className="font-headline font-black text-sm text-cyan-400">
                    {hero.stats.vit} <span className="text-[10px] text-zinc-500">({hero.stats.base_vit})</span>
                  </div>
                </div>
                <div className="p-2 bg-black/60 border border-zinc-800 text-center">
                  <div className="text-[9px] text-zinc-500 font-bold">LUCK</div>
                  <div className="font-headline font-black text-sm text-purple-400">
                    {hero.stats.luk}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Consistency & Streaks Showcase (HIGHLIGHTED) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-black text-sm uppercase tracking-wider text-pixel-green flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>CONSISTENCY &amp; STREAK METRICS</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Active Streak */}
            <div className="border border-rose-500/60 bg-gradient-to-b from-rose-950/40 to-black p-3.5 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-rose-400 text-[10px] font-bold uppercase">
                <span>ACTIVE STREAK</span>
                <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>
              <div className="font-headline font-black text-2xl text-rose-400">
                {metrics.active_streak} <span className="text-xs font-normal text-rose-300">DAYS</span>
              </div>
              <p className="text-[9px] text-zinc-400">Ongoing streak</p>
            </div>

            {/* Longest Streak (BEST RECORD) */}
            <div className="border-2 border-amber-400/80 bg-gradient-to-b from-amber-950/40 to-black p-3.5 space-y-1 shadow-neon">
              <div className="flex items-center justify-between text-amber-300 text-[10px] font-bold uppercase">
                <span>BEST STREAK RECORD</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-headline font-black text-2xl text-amber-300">
                {metrics.longest_streak} <span className="text-xs font-normal text-amber-200">DAYS</span>
              </div>
              <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">★ All-Time Personal Best</p>
            </div>

            {/* Total Lifetime Volume */}
            <div className="border border-pixel-border bg-black/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase">
                <span>LIFETIME VOLUME</span>
                <Dumbbell className="w-4 h-4 text-pixel-green" />
              </div>
              <div className="font-headline font-black text-2xl text-white">
                {formatNumber(metrics.lifetime_volume_kg)} <span className="text-xs font-normal text-zinc-400">KG</span>
              </div>
              <p className="text-[9px] text-zinc-500">Across {metrics.total_sessions} logged workouts</p>
            </div>

            {/* Total Lifetime RVS */}
            <div className="border border-pixel-border bg-black/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase">
                <span>TOTAL RVS DEALT</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-headline font-black text-2xl text-amber-400">
                {formatNumber(metrics.lifetime_rvs)} <span className="text-xs font-normal text-amber-200/60">RVS</span>
              </div>
              <p className="text-[9px] text-zinc-500">Real Volume Score total</p>
            </div>
          </div>

          {/* 28-Day Consistency Calendar Grid */}
          <div className="border border-pixel-border bg-surface/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pixel-green" />
                <span>28-DAY WORKOUT FREQUENCY HEATMAP</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {activityDateSet.size} Active Days Logged
              </span>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
              {past28Days.map((day) => (
                <div
                  key={day.dateStr}
                  title={`${day.dateStr}: ${day.active ? "Workout Completed!" : "Rest / Missed"}`}
                  className={`h-9 border flex flex-col items-center justify-center p-0.5 text-center transition-all ${
                    day.active
                      ? "border-pixel-green bg-pixel-green/30 text-white font-extrabold shadow-neon"
                      : "border-zinc-800 bg-black/40 text-zinc-600"
                  }`}
                >
                  <span className="text-[8px] uppercase leading-none">{day.label}</span>
                  {day.active && <span className="w-1.5 h-1.5 rounded-full bg-pixel-green mt-1 animate-pulse" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipped Equipment Showcase */}
        <section className="space-y-3">
          <h2 className="font-headline font-black text-sm uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>EQUIPPED HERO ARSENAL</span>
          </h2>

          {equipped_gear.length === 0 ? (
            <div className="border border-pixel-border bg-surface/40 p-4 text-center text-xs text-zinc-500">
              No battle equipment currently equipped.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {equipped_gear.map((gear) => (
                <div
                  key={gear.inventory_id}
                  className={`border p-3 space-y-2 bg-black/70 transition-all ${getRarityBadge(gear.rarity)}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-black border border-zinc-700 p-1 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={gear.image_url}
                        alt={gear.item_name}
                        className="w-full h-full object-contain pixelated"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[8.5px] font-extrabold uppercase opacity-80">{gear.rarity} {gear.type}</div>
                      <div className="font-bold text-xs text-white truncate">{gear.item_name}</div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono space-y-0.5 border-t border-zinc-800 pt-1.5 text-zinc-400">
                    {gear.bonus_str > 0 && <div className="text-amber-400">+{gear.bonus_str} STR</div>}
                    {gear.bonus_agi > 0 && <div className="text-emerald-400">+{gear.bonus_agi} AGI</div>}
                    {gear.bonus_vit > 0 && <div className="text-cyan-400">+{gear.bonus_vit} VIT</div>}
                    {gear.bonus_hp > 0 && <div className="text-rose-400">+{gear.bonus_hp} Max HP</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Verified Workout Log History */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-black text-sm uppercase tracking-wider text-pixel-green flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span>VERIFIED WORKOUT LOGS ({workout_sessions.length})</span>
            </h2>
          </div>

          {workout_sessions.length === 0 ? (
            <div className="border border-pixel-border bg-surface/40 p-8 text-center text-xs text-zinc-500">
              No verified workout sessions on record yet.
            </div>
          ) : (
            <div className="space-y-3">
              {workout_sessions.map((ws) => {
                const isExpanded = Boolean(expandedSessionIds[ws.session_id]);
                const exercises = Array.isArray(ws.exercises_log) ? ws.exercises_log : [];

                return (
                  <div
                    key={ws.session_id}
                    className="border border-pixel-border bg-surface/80 p-4 space-y-3 shadow-md"
                  >
                    <div
                      onClick={() => toggleSession(ws.session_id)}
                      className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-black border border-pixel-green/60 text-pixel-green flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-headline font-bold text-sm text-white uppercase">
                            {new Date(ws.date).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              <span>{ws.duration_minutes} Mins</span>
                            </span>
                            <span>&bull;</span>
                            <span>{exercises.length} Exercises</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-headline font-black text-sm text-pixel-green">
                            +{formatNumber(ws.total_rvs)} RVS
                          </div>
                          <div className="text-[10px] text-zinc-400 font-bold">
                            {formatNumber(ws.total_volume_kg)} KG Volume
                          </div>
                        </div>
                        <button
                          type="button"
                          className="p-1 text-zinc-400 hover:text-white"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-pixel-border/50 pt-3 space-y-2.5">
                        {exercises.map((ex: any, exIdx: number) => {
                          const isDist = isExerciseDistanceBased({
                            name: ex.exercise_name,
                            isDistanceBased: ex.is_distance_based,
                          });
                          const sets = Array.isArray(ex.sets) ? ex.sets : [];

                          return (
                            <div
                              key={exIdx}
                              className="p-2.5 bg-black/80 border border-zinc-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-zinc-200 uppercase">
                                  {ex.exercise_name}
                                </span>
                                {isDist && (
                                  <span className="px-1.5 py-0.5 border border-emerald-400 bg-emerald-950/80 text-emerald-300 text-[8.5px] font-bold uppercase">
                                    📏 DISTANCE (M)
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {sets.map((set: any, setIdx: number) => (
                                  <span
                                    key={setIdx}
                                    className="px-2 py-0.5 border border-zinc-700 bg-zinc-950 text-[9.5px] font-mono text-zinc-300"
                                  >
                                    Set {set.set_number || setIdx + 1}: {set.weight_kg ?? set.weight ?? 0} KG × {set.reps}{" "}
                                    {isDist ? "m" : "reps"}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

