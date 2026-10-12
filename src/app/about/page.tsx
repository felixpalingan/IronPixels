"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Swords,
  Shield,
  HeartPulse,
  Zap,
  Trophy,
  Users,
  Sparkles,
  ChevronDown,
  Play,
  Volume2,
  VolumeX,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Target,
  Flame,
  Github,
  Award,
  Layers,
  Code,
  Globe,
  Menu,
  X,
  Lock,
  Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { soundEngine } from "@/lib/soundEffects";
import { DungeonStageMap } from "@/components/DungeonStageMap";
import { HeroSprite } from "@/components/HeroSprite";
import { EnemySprite } from "@/components/EnemySprite";

interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  mult: number;
  stat: "STR" | "AGI";
}

const SIM_EXERCISES: ExerciseOption[] = [
  { id: "bench_press", name: "Barbell Bench Press", category: "Chest", mult: 1.15, stat: "STR" },
  { id: "back_squat", name: "Barbell Back Squat", category: "Legs", mult: 1.25, stat: "STR" },
  { id: "deadlift", name: "Conventional Deadlift", category: "Back", mult: 1.30, stat: "STR" },
  { id: "ohp", name: "Overhead Press", category: "Shoulders", mult: 1.10, stat: "STR" },
  { id: "pull_up", name: "Pull Up", category: "Back", mult: 1.20, stat: "AGI" },
  { id: "bicep_curl", name: "Dumbbell Bicep Curl", category: "Arms", mult: 0.95, stat: "STR" },
];

const HERO_CLASSES = [
  {
    name: "Knight (Paladin)",
    icon: "/assets/dungeon/heroes/knight_m_idle_anim_f0.png",
    stat: "High STR & VIT",
    desc: "Spesialis angkatan compound berat (Squat, Deadlift, Bench). Memberikan damage pukulan masif dan pertahanan kokoh terhadap serangan bos.",
  },
  {
    name: "Wizard (Mage)",
    icon: "/assets/dungeon/heroes/wizzard_m_idle_anim_f0.png",
    stat: "High STR & LUK",
    desc: "Mengekstraksi kekuatan repetisi tinggi menjadi serangan sihir elementer dengan potensi critical hit yang dahsyat.",
  },
  {
    name: "Elf (Ranger)",
    icon: "/assets/dungeon/heroes/elf_m_idle_anim_f0.png",
    stat: "High AGI & LUK",
    desc: "Unggul dalam latihan kalistenik, mobilitas, dan pull-up. Memanfaatkan bodyweight ratio untuk serangan beruntun berkecepatan tinggi.",
  },
  {
    name: "Dwarf (Berserker)",
    icon: "/assets/dungeon/heroes/dwarf_m_idle_anim_f0.png",
    stat: "High STR & Pure Grit",
    desc: "Bertahan di zona intensitas ekstrim. Setiap set hingga kegagalan otot (failure) memicu lonjakan damage tak terbatas.",
  },
];

const DUNGEON_FLOORS = [
  {
    tier: "Floor 1 - 5",
    title: "Crypt of Novices",
    monster: "/assets/dungeon/monsters/goblin_idle_anim_f0.png",
    bossName: "Goblin Overseer & Imp Pack",
    hp: "1,200 - 3,500 HP",
    desc: "Zona latihan awal bagi rekrutan baru. Bangun ritme latihan dan pelajari mekanika dasar pertempuran.",
  },
  {
    tier: "Floor 6 - 10",
    title: "Shadow Catacombs",
    monster: "/assets/dungeon/monsters/orc_warrior_idle_anim_f0.png",
    bossName: "Orc Warlord & Necromancer",
    hp: "4,500 - 12,000 HP",
    desc: "Bos mulai menerapkan cicilan penalti serangan harian. Konsistensi workout gym mutlak diperlukan agar HP hero tidak terkuras.",
  },
  {
    tier: "Floor 11 - 15",
    title: "Infernal Bastion",
    monster: "/assets/dungeon/monsters/ogre_idle_anim_f0.png",
    bossName: "Dungeon Ogre & Masked Berserker",
    hp: "15,000 - 35,000 HP",
    desc: "Dibutuhkan beban progressive overload yang disiplin dan koordinasi party co-op untuk menembus pertahanan baja.",
  },
  {
    tier: "Floor 16 - 20",
    title: "Abyssal Throne",
    monster: "/assets/dungeon/monsters/big_demon_idle_anim_f0.png",
    bossName: "Ancient Abyssal Overlord",
    hp: "45,000 - 100,000+ HP",
    desc: "Puncak tantangan tertinggi para lifter legendaris. Senjata mythical dan full party raid bersatu menaklukkan takhta abadi.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Apa itu IronPixels?",
    a: "IronPixels adalah aplikasi web gamified fitness RPG retro 16-bit yang mengubah repetisi dan volume angkat beban di gym menjadi kekuatan tempur (Combat Power) untuk menaklukkan bos dungeon, membuka senjata mythical, dan menyelesaikan misi bersama teman.",
  },
  {
    q: "Bagaimana cara kerja penghitungan damage RVS (Real Volume Score)?",
    a: "RVS dihitung secara server-authoritative menggunakan formula yang menyeimbangkan beban angkatan, repetisi, rasio berat badan lifter, jenis gerakan, dan stat hero (STR/AGI), sehingga setiap set latihan memberikan kontribusi serangan yang adil.",
  },
  {
    q: "Apakah mencatat workout memulihkan darah (HP) hero?",
    a: "Ya! Setiap kali Anda menyelesaikan sesi workout gym yang valid, hero Anda langsung mendapatkan Instant 100% Full Heal, memulihkan seluruh HP dan menghapus cicilan penalti serangan bos harian. Hal ini memotivasi konsistensi latihan gym tanpa rasa takut hero mati selama Anda rutin berlatih.",
  },
  {
    q: "Apakah IronPixels gratis dimainkan (Free-to-Play)?",
    a: "IronPixels 100% gratis dimainkan tanpa sistem pay-to-win. Seluruh gold, peti gacha, upgrade Blacksmith, dan equipment diperoleh murni dari konsistensi latihan angkat beban dan progres menembus lantai dungeon.",
  },
  {
    q: "Bagaimana cara bermain co-op raid dungeon bersama teman?",
    a: "Anda dapat membuat atau bergabung ke dalam Party (guild) di tab Social, lalu menantang bos lantai bersama anggota tim secara real-time dengan sinkronisasi instan via Supabase Realtime WebSockets.",
  },
  {
    q: "Bagaimana jika saya perlu Rest Day?",
    a: "Istirahat otot adalah bagian penting dari pembentukan massa dan kekuatan. Di lantai bawah, serangan bos harian tidak langsung menewaskan hero. Anda dapat mengambil rest day 1–2 hari dengan aman, lalu melakukan full heal seketika saat sesi workout berikutnya dicatat.",
  },
];

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive Simulator State
  const [selectedExId, setSelectedExId] = useState<string>("bench_press");
  const [simWeight, setSimWeight] = useState<number>(70);
  const [simReps, setSimReps] = useState<number>(10);
  const [simBodyweight, setSimBodyweight] = useState<number>(75);
  const [simStat, setSimStat] = useState<number>(75);
  const [monsterCurrentHp, setMonsterCurrentHp] = useState<number>(4500);
  const [monsterMaxHp] = useState<number>(5000);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [isHitShaking, setIsHitShaking] = useState<boolean>(false);
  const [floatingDamage, setFloatingDamage] = useState<{ value: number; isCrit: boolean } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getIsMuted());

  const currentExercise = SIM_EXERCISES.find((e) => e.id === selectedExId) || SIM_EXERCISES[0];

  // Calculate live RVS formula
  const actualWeight = currentExercise.stat === "AGI" && simWeight <= 0 ? simBodyweight : Math.max(1, simWeight);
  const bodyweightRatio = actualWeight / Math.max(40, simBodyweight);
  const statMultiplier = simStat / 50;
  const calculatedRvs = Math.round(
    actualWeight * simReps * bodyweightRatio * 0.1 * currentExercise.mult * statMultiplier
  );
  const totalVolume = simWeight * simReps;

  const handleSimulateAttack = () => {
    if (isAttacking) return;
    setIsAttacking(true);
    setIsHitShaking(true);

    const isCrit = Math.random() < 0.25;
    const finalDamage = isCrit ? Math.round(calculatedRvs * 1.5) : calculatedRvs;

    if (!isMuted) {
      soundEngine.play("attack");
    }

    setFloatingDamage({ value: finalDamage, isCrit });

    setMonsterCurrentHp((prev) => Math.max(0, prev - finalDamage));

    setTimeout(() => {
      setIsHitShaking(false);
    }, 400);

    setTimeout(() => {
      setIsAttacking(false);
    }, 600);

    setTimeout(() => {
      setFloatingDamage(null);
    }, 1800);
  };

  const handleResetMonster = () => {
    setMonsterCurrentHp(monsterMaxHp);
    setFloatingDamage(null);
  };

  const handleToggleSound = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.play("select");
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans selection:bg-[#00ff41] selection:text-black relative overflow-x-hidden">
      {/* Background Grid Pattern & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00ff41_1px,transparent_1px)] [background-size:24px_24px] z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#00ff41]/10 blur-[140px] pointer-events-none z-0" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-black border border-[#00ff41]/80 p-0.5 shadow-[0_0_12px_rgba(0,255,65,0.4)] flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/icon.png"
                alt="IronPixels Logo"
                className="w-full h-full object-contain pixelated"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-black text-lg tracking-wider text-white group-hover:text-[#00ff41] transition-colors leading-none">
                IRONPIXELS
              </span>
              <span className="font-mono text-[9px] text-[#00ff41] tracking-widest uppercase font-bold">
                16-BIT FITNESS RPG
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-zinc-400">
            <a href="#filosofi" className="hover:text-[#00ff41] transition-colors">
              Filosofi
            </a>
            <a href="#mekanika" className="hover:text-[#00ff41] transition-colors">
              Mekanika RVS
            </a>
            <a href="#simulator" className="hover:text-[#00ff41] transition-colors flex items-center gap-1.5 text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
              Simulator
            </a>
            <a href="#dungeon" className="hover:text-[#00ff41] transition-colors">
              Dungeon Peta
            </a>
            <a href="#faq" className="hover:text-[#00ff41] transition-colors">
              FAQ
            </a>
            <a href="#developer" className="hover:text-[#00ff41] transition-colors">
              Developer
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 border border-zinc-700 bg-zinc-900/80 hover:border-zinc-500 hover:text-white font-mono text-xs uppercase tracking-wider text-zinc-300 transition-all"
            >
              Masuk Terminal
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 border border-[#00ff41] bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,65,0.35)] transition-all flex items-center gap-1.5"
            >
              <span>Main Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d0d10] border-b border-zinc-800 px-4 py-4 space-y-3 font-mono text-xs uppercase">
            <a
              href="#filosofi"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              Filosofi
            </a>
            <a
              href="#mekanika"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              Mekanika RVS
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[#00ff41] font-bold"
            >
              ⚡ Coba Simulator
            </a>
            <a
              href="#dungeon"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              Dungeon Peta
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              FAQ
            </a>
            <a
              href="#developer"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              Developer &amp; Tech Stack
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 border border-zinc-700 bg-zinc-900 text-white font-mono text-xs"
              >
                Masuk Terminal
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 bg-[#00ff41] text-black font-mono font-bold text-xs shadow-neon"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Cyber Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#00ff41]/50 bg-[#00ff41]/10 text-[#00ff41] font-mono text-[11px] tracking-widest uppercase font-bold shadow-[0_0_15px_rgba(0,255,65,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping" />
            <span>SYSTEM V2.4 // PROTOKOL REAL VOLUME SCORE AKTIF</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight uppercase leading-[1.05] text-white">
            UBAH KERINGAT GYM JADI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff41] via-[#00e5ff] to-[#38bdf8] drop-shadow-[0_0_30px_rgba(0,255,65,0.3)]">
              KEKUATAN TEMPUR 16-BIT
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="font-body text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl leading-relaxed">
            Selamat tinggal aplikasi spreadsheet gym yang kaku dan membosankan. IronPixels
            mengawinkan disiplin <strong className="text-white">progressive overload nyata</strong>{" "}
            dengan petualangan <strong className="text-[#00ff41]">retro dungeon crawler</strong>. Setiap
            kilogram beban dan repetisi yang Anda selesaikan menjadi serangan pamungkas menaklukkan
            bos lantai dungeon.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 stroke-[2.5]" />
              <span>MULAI PETUALANGAN GRATIS</span>
            </Link>

            <a
              href="#simulator"
              className="px-6 py-4 border border-zinc-700 bg-zinc-900/90 hover:border-[#00ff41]/60 text-zinc-200 hover:text-white font-mono text-sm uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-[#00ff41]" />
              <span>COBA SIMULASI RVS</span>
            </a>
          </div>

          {/* Key Value Pill Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 w-full max-w-3xl">
            <div className="p-3 border border-zinc-800 bg-[#121216]/80 text-left">
              <div className="text-[#00ff41] font-mono text-xs font-bold uppercase flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>RVS Engine</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                Formula beban &amp; rasio berat badan adil.
              </div>
            </div>

            <div className="p-3 border border-zinc-800 bg-[#121216]/80 text-left">
              <div className="text-red-400 font-mono text-xs font-bold uppercase flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>100% Full Heal</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                Setiap sesi workout memulihkan seluruh darah.
              </div>
            </div>

            <div className="p-3 border border-zinc-800 bg-[#121216]/80 text-left">
              <div className="text-sky-400 font-mono text-xs font-bold uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Co-Op Parties</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                Raid bos dungeon bersama kawan live.
              </div>
            </div>

            <div className="p-3 border border-zinc-800 bg-[#121216]/80 text-left">
              <div className="text-yellow-400 font-mono text-xs font-bold uppercase flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                <span>Fair Economy</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                100% gratis, tanpa transaksi pay-to-win.
              </div>
            </div>
          </div>
        </div>

        {/* RETRO BATTLE STAGE VISUAL BANNER */}
        <div className="mt-12 max-w-4xl mx-auto border-2 border-zinc-800 bg-[#0d0d12] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Top Arcade Bar */}
          <div className="bg-[#18181f] border-b border-zinc-800 px-4 py-2 flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="text-zinc-300 font-bold ml-2">DUNGEON BATTLE VIEWPORT // FLOOR 20</span>
            </div>
            <div className="text-[#00ff41] font-bold">STATUS: BOSS ENCOUNTER ACTIVE</div>
          </div>

          {/* Dungeon Stage Arena */}
          <div className="py-6 px-4 bg-black flex justify-center overflow-x-auto select-none border-t border-zinc-800">
            <DungeonStageMap floor={20}>
              {/* Left: Party Lineup */}
              <div className="pointer-events-auto flex items-end justify-start gap-3 sm:gap-4 px-1 z-20">
                <HeroSprite
                  currentState="idle"
                  characterClass="knight"
                  gender="m"
                  scale={1.8}
                  weaponIcon="/assets/items/weapons/01.png"
                  showNameTag="LVL 45 KNIGHT"
                  nameTagPosition="top"
                />
                <HeroSprite
                  currentState="idle"
                  characterClass="elf"
                  gender="f"
                  scale={1.6}
                  weaponIcon="/assets/items/weapons/03.png"
                  showNameTag="LVL 42 ELF"
                  nameTagPosition="top"
                />
                <HeroSprite
                  currentState="idle"
                  characterClass="wizzard"
                  gender="m"
                  scale={1.6}
                  weaponIcon="/assets/items/weapons/07.png"
                  showNameTag="LVL 48 MAGE"
                  nameTagPosition="top"
                />
              </div>

              {/* Right: Boss */}
              <div className="pointer-events-auto z-10 flex flex-col items-center justify-end">
                <div className="mb-2 flex flex-col items-center">
                  <span className="font-headline font-black text-[9px] text-red-400 tracking-wider bg-black/90 px-1.5 py-0.5 border border-red-500/80 mb-1">
                    ABYSSAL DEMON OVERLORD
                  </span>
                  <div className="w-24 bg-black border border-red-900 h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 w-3/4 animate-pulse" />
                  </div>
                </div>
                <EnemySprite
                  currentState="idle"
                  spriteConfig={{
                    spriteKey: "big_demon",
                    animPrefix: "idle_anim",
                    hasRunAnim: true,
                    isBig: true,
                  }}
                  scale={2.4}
                />
              </div>
            </DungeonStageMap>
          </div>
        </div>
      </section>

      {/* FILOSOFI SECTION */}
      <section id="filosofi" className="py-20 border-t border-zinc-800 bg-[#0c0c10] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs text-[#00ff41] tracking-widest uppercase font-bold">
              [ LATAR BELAKANG &amp; MISI ]
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              KENAPA KAMI MEMBANGUN IRONPIXELS?
            </h2>
            <p className="font-body text-zinc-400 text-base leading-relaxed">
              Konsistensi di gym itu berat. Mayoritas orang menyerah dalam 3 bulan pertama karena
              kurangnya kepuasan instan dan sistem pencatatan konvensional yang membosankan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Problem 1 */}
            <div className="border border-red-900/50 bg-red-950/20 p-6 space-y-3 relative overflow-hidden">
              <div className="text-red-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">❌</span>
                <span>MASALAH TRACKER BIASA</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-white">Spreadsheet Kaku &amp; Hambar</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Mencatat angka di aplikasi spreadsheet terasa seperti pekerjaan kantor lembur. Tidak
                ada rasa pencapaian heroik, tidak ada musuh yang dikalahkan, dan cepat ditinggalkan saat
                motivasi memudar.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="border border-yellow-900/50 bg-yellow-950/20 p-6 space-y-3 relative overflow-hidden">
              <div className="text-yellow-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>MASALAH MOBILE RPG</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-white">Grinding Jempol &amp; Pay-to-Win</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Game RPG di smartphone hanya menguras dompet dan menuntut ketukan jari berjam-jam tanpa
                membuat badan Anda bertambah sehat atau bugar sedikit pun di dunia nyata.
              </p>
            </div>

            {/* Solution: IronPixels */}
            <div className="border border-[#00ff41]/60 bg-[#00ff41]/5 p-6 space-y-3 relative overflow-hidden shadow-[0_0_30px_rgba(0,255,65,0.1)]">
              <div className="text-[#00ff41] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">⚔️</span>
                <span>SOLUSI IRONPIXELS</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-white">Fusi Nyata Fitness &amp; RPG</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Repetisi dan volume angkat beban Anda menjadi sumber daya utama di dungeon. Stat karakter
                dan perlengkapan legendaris hanya bisa dibuka lewat keringat latihan fisik yang konsisten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MEKANIKA INTI SECTION */}
      <section id="mekanika" className="py-20 border-t border-zinc-800 bg-[#08080a] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs text-[#00ff41] tracking-widest uppercase font-bold">
              [ GAMEPLAY ENGINE ]
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              MEKANIKA PERMAINAN &amp; ARSITEKTUR RVS
            </h2>
            <p className="font-body text-zinc-400 text-base leading-relaxed">
              Didesain dengan perhitungan matematika berimbang sehingga lifter pemula maupun atlet
              berpengalaman dapat bertarung di level yang seimbang dan menantang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {/* Feature 1: Formula RVS */}
            <div className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#00ff41]">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">Formula RVS Authoritative</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Real Volume Score (RVS) dihitung di server:
                <code className="block mt-2 p-2 bg-black border border-zinc-800 text-[#00ff41] font-mono text-xs">
                  RVS = Berat &times; Reps &times; (% BW) &times; Coeff &times; Stat
                </code>
                Menghargai rasio kekuatan terhadap bobot tubuh serta bobot biomekanika gerakan.
              </p>
            </div>

            {/* Feature 2: Instant 100% Heal */}
            <div className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-red-400">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">Instant 100% Full Heal</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Setiap kali sesi workout valid selesai dicatat, hero Anda langsung pulih 100% HP.
                Selama Anda konsisten ke gym, Anda tidak akan pernah tewas oleh serangan bos dungeon!
              </p>
            </div>

            {/* Feature 3: Co-Op Multiplayer */}
            <div className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sky-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">Guild &amp; Party Raid Live</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Bentuk Party bersama teman gym Anda. Serangan yang dicatat anggota party akan memotong
                HP bos lantai yang sama secara real-time melalui WebSocket Supabase.
              </p>
            </div>

            {/* Feature 4: 20 Dungeon Floors */}
            <div className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">20 Lantai Progresi Menantang</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Dari Goblin Novice di lantai 1 hingga Abyssal Overlord di lantai 20. Setiap lantai
                memiliki statistik HP, armor, dan hadiah loot chest yang semakin langka.
              </p>
            </div>

            {/* Feature 5: Gacha & Blacksmith */}
            <div className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">Tempaan Senjata Blacksmith</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Kumpulkan Gold dari raid dan buka peti misterius. Kumpulkan senjata Common, Rare, Epic,
                hingga Mythical untuk meningkatkan bonus HP dan Combat Attack power.
              </p>
            </div>

            {/* Feature 6: Zero Pay-to-Win */}
            <div className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-black text-xl text-white">Murni Free-to-Play</h3>
              <p className="font-body text-zinc-400 text-sm leading-relaxed">
                Tidak ada pembelian koin menggunakan uang asli (no pay-to-win). Status Anda di papan
                peringkat semata-mata mencerminkan keringat dan disiplin gym Anda!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SIMULATOR SECTION */}
      <section id="simulator" className="py-20 border-t border-zinc-800 bg-[#0d0d12] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="font-mono text-xs text-[#00ff41] tracking-widest uppercase font-bold flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>[ SIMULATOR COMBAT POWER INTERAKTIF ]</span>
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              UJI DAMAGE ANGKATAN ANDA SEKARANG
            </h2>
            <p className="font-body text-zinc-400 text-base">
              Pilih salah satu gerakan latihan angkat beban di bawah ini, atur beban dan repetisi, lalu
              lihat kalkulasi RVS serta lancarkan serangan langsung ke monster dungeon!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-[#141418] border border-zinc-800 p-6 space-y-5 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs uppercase text-zinc-400 font-bold">PARAMETER LATIHAN</span>
                <button
                  onClick={handleToggleSound}
                  className={`p-1.5 border text-xs flex items-center gap-1.5 ${
                    isMuted
                      ? "border-red-900 bg-red-950/40 text-red-400"
                      : "border-zinc-700 bg-black text-[#00ff41]"
                  }`}
                  title="Toggle Sound FX"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isMuted ? "MUTED" : "FX ON"}</span>
                </button>
              </div>

              {/* Movement Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 uppercase font-bold">PILIH GERAKAN:</label>
                <select
                  value={selectedExId}
                  onChange={(e) => setSelectedExId(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-zinc-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff41]"
                >
                  {SIM_EXERCISES.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category} &bull; {ex.stat})
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-bold uppercase">BEBAN ANGKATAN:</span>
                  <span className="text-[#00ff41] font-bold text-sm">{simWeight} KG</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="2.5"
                  value={simWeight}
                  onChange={(e) => setSimWeight(parseFloat(e.target.value))}
                  className="w-full accent-[#00ff41] bg-zinc-800 h-2 cursor-pointer"
                />
              </div>

              {/* Reps Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-bold uppercase">JUMLAH REPETISI:</span>
                  <span className="text-[#00ff41] font-bold text-sm">{simReps} REPS</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={simReps}
                  onChange={(e) => setSimReps(parseInt(e.target.value))}
                  className="w-full accent-[#00ff41] bg-zinc-800 h-2 cursor-pointer"
                />
              </div>

              {/* Bodyweight Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-bold uppercase">BERAT BADAN LIFTER:</span>
                  <span className="text-sky-400 font-bold text-sm">{simBodyweight} KG</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="140"
                  step="1"
                  value={simBodyweight}
                  onChange={(e) => setSimBodyweight(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 bg-zinc-800 h-2 cursor-pointer"
                />
              </div>

              {/* Live Calculation Output Card */}
              <div className="bg-black border border-zinc-800 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Volume Set:</span>
                  <span className="text-white font-bold">{totalVolume.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Rasio Beban/BB:</span>
                  <span className="text-white font-bold">{(bodyweightRatio * 100).toFixed(0)}% BW</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2 text-[#00ff41]">
                  <span className="font-bold">HASIL COMBAT RVS:</span>
                  <span className="font-bold text-base">+{calculatedRvs.toLocaleString()} DMG</span>
                </div>
              </div>

              {/* Attack Button */}
              <button
                onClick={handleSimulateAttack}
                disabled={isAttacking}
                className="w-full py-3.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Swords className="w-4 h-4 stroke-[3]" />
                <span>{isAttacking ? "MENYERANG..." : "SERANG BOS SEKARANG!"}</span>
              </button>
            </div>

            {/* Visual Combat Arena Output */}
            <div className="lg:col-span-7 bg-[#101015] border border-zinc-800 p-6 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono text-xs">
                <span className="text-zinc-400 font-bold">SIMULATION ARENA</span>
                <button
                  onClick={handleResetMonster}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET HP</span>
                </button>
              </div>

              {/* Monster Status Bar */}
              <div className="mt-4 space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-bold uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>OGRE DUNGEON GUARDIAN</span>
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {monsterCurrentHp.toLocaleString()} / {monsterMaxHp.toLocaleString()} HP
                  </span>
                </div>
                <div className="w-full h-3 bg-black border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 transition-all duration-300"
                    style={{ width: `${(monsterCurrentHp / monsterMaxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Arena Battle Ground */}
              <div className="relative overflow-hidden flex justify-center my-6 bg-black border border-zinc-800">
                <DungeonStageMap floor={12}>
                  {/* Hero Side */}
                  <div className="pointer-events-auto z-20 flex items-end justify-start px-2">
                    <motion.div
                      animate={isAttacking ? { x: [0, 50, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <HeroSprite
                        currentState={isAttacking ? "attack01" : "idle"}
                        characterClass="knight"
                        gender="m"
                        scale={2.0}
                        weaponIcon="/assets/items/weapons/01.png"
                        showNameTag="YOU (LIFTER)"
                        nameTagPosition="top"
                      />
                    </motion.div>
                  </div>

                  {/* Boss Side */}
                  <div className="pointer-events-auto z-10 flex items-end justify-end px-2">
                    <EnemySprite
                      currentState={isHitShaking ? "hit" : "idle"}
                      spriteConfig={{
                        spriteKey: "ogre",
                        animPrefix: "idle_anim",
                        hasRunAnim: true,
                        isBig: true,
                      }}
                      scale={2.2}
                    />
                  </div>
                </DungeonStageMap>

                {/* Floating Damage Popup */}
                {floatingDamage && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: -25, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-1/4 top-1/4 z-30 font-headline font-black text-xl sm:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,1)] flex flex-col items-center pointer-events-none"
                  >
                    {floatingDamage.isCrit && (
                      <span className="text-yellow-400 text-xs tracking-widest uppercase animate-bounce">
                        ⚡ CRITICAL HIT!
                      </span>
                    )}
                    <span className={floatingDamage.isCrit ? "text-yellow-300" : "text-red-400"}>
                      -{floatingDamage.value.toLocaleString()} DMG
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Result Explainer */}
              <div className="font-mono text-[11px] text-zinc-400 bg-black/60 p-3 border border-zinc-800">
                <span className="text-[#00ff41] font-bold">INFO MEKANIKA: </span>
                Setiap repetisi yang diselesaikan di gym diverifikasi di backend IronPixels untuk
                memastikan integritas data dan mencegah manipulasi progres raid multiplayer.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLASS SELECTION SHOWCASE */}
      <section className="py-20 border-t border-zinc-800 bg-[#08080a] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="font-mono text-xs text-[#00ff41] tracking-widest uppercase font-bold">
              [ 4 KELAS PAHLAWAN ]
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              PILIH ARCHETYPE PETUALANG ANDA
            </h2>
            <p className="font-body text-zinc-400 text-base">
              Setiap kelas memiliki spesialisasi gaya angkatan beban dan keunggulan statistik tempur.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HERO_CLASSES.map((cls, idx) => (
              <div
                key={idx}
                className="border border-zinc-800 bg-[#121216] p-6 space-y-4 hover:border-[#00ff41]/60 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-black border border-zinc-700 p-2 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <img src={cls.icon} alt={cls.name} className="w-full h-full object-contain pixelated" />
                  </div>
                  <h3 className="font-headline font-black text-lg text-white group-hover:text-[#00ff41] transition-colors">
                    {cls.name}
                  </h3>
                  <div className="inline-block px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-[#00ff41] font-mono text-[10px] font-bold uppercase">
                    {cls.stat}
                  </div>
                  <p className="font-body text-zinc-400 text-xs leading-relaxed">{cls.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PETA DUNGEON SHOWCASE */}
      <section id="dungeon" className="py-20 border-t border-zinc-800 bg-[#0c0c10] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="font-mono text-xs text-[#00ff41] tracking-widest uppercase font-bold">
              [ EKSPEDISI LANTAI 1 - 20 ]
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              PETA LANTAI &amp; TANTANGAN BOS
            </h2>
            <p className="font-body text-zinc-400 text-base">
              Setiap lantai menghadirkan bos dengan tingkat ketahanan HP dan ancaman serangan yang
              semakin tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DUNGEON_FLOORS.map((floor, idx) => (
              <div
                key={idx}
                className="border border-zinc-800 bg-[#141418] p-5 space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-mono text-xs text-[#00ff41] font-bold">{floor.tier}</span>
                    <span className="font-mono text-[10px] text-red-400 font-bold">{floor.hp}</span>
                  </div>

                  <div className="w-16 h-16 bg-black border border-zinc-800 p-2 flex items-center justify-center mx-auto">
                    <img
                      src={floor.monster}
                      alt={floor.bossName}
                      className="w-full h-full object-contain pixelated"
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="font-headline font-bold text-base text-white">{floor.title}</h3>
                    <p className="font-mono text-[11px] text-zinc-400">{floor.bossName}</p>
                  </div>

                  <p className="font-body text-xs text-zinc-400 leading-relaxed">{floor.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVELOPER & TECH STACK SECTION (AUTHOR ENTITY HUB) */}
      <section id="developer" className="py-20 border-t border-zinc-800 bg-[#08080a] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto border border-zinc-800 bg-[#121216] p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ff41]/5 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
                <div className="w-28 h-28 bg-black border-2 border-[#00ff41] p-1 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
                  <img
                    src="/icon.png"
                    alt="Almakius Felix Bariq Hekopung - IronPixels Creator"
                    className="w-full h-full object-cover pixelated"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-white">
                    Almakius Felix Bariq Hekopung
                  </h3>
                  <p className="font-mono text-xs text-[#00ff41] font-bold">
                    CREATOR &amp; LEAD ENGINEER
                  </p>
                </div>
                <a
                  href="https://portfolio-felix-bariq.vercel.app"
                  target="_blank"
                  rel="author noopener noreferrer"
                  className="px-3.5 py-1.5 border border-zinc-700 bg-zinc-900 hover:border-[#00ff41] text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00ff41]" />
                  <span>Portfolio Hub</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>

              <div className="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-zinc-800 md:pl-8 pt-6 md:pt-0">
                <span className="font-mono text-[11px] text-[#00ff41] tracking-widest uppercase font-bold">
                  [ ARSITEKTUR TEKNOLOGI ]
                </span>
                <h4 className="font-headline font-black text-2xl text-white">
                  Modern Full-Stack dengan Realtime Engine
                </h4>
                <p className="font-body text-zinc-400 text-sm leading-relaxed">
                  IronPixels dibangun sebagai proyek open engineering yang menggabungkan kecepatan Next.js
                  15 App Router, kehandalan Supabase PostgreSQL &amp; WebSockets, serta estetika retro
                  16-bit pixel art otentik.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 font-mono text-xs">
                  <div className="p-2 bg-black border border-zinc-800 text-zinc-300">
                    &bull; Next.js 15 App Router
                  </div>
                  <div className="p-2 bg-black border border-zinc-800 text-zinc-300">
                    &bull; React 19 Client/Server
                  </div>
                  <div className="p-2 bg-black border border-zinc-800 text-zinc-300">
                    &bull; Supabase Realtime
                  </div>
                  <div className="p-2 bg-black border border-zinc-800 text-zinc-300">
                    &bull; PostgreSQL Database
                  </div>
                  <div className="p-2 bg-black border border-zinc-800 text-zinc-300">
                    &bull; Tailwind CSS &amp; Framer
                  </div>
                  <div className="p-2 bg-black border border-zinc-800 text-zinc-300">
                    &bull; 16-Bit Pixel Assets (0x72)
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <a
                    href="https://github.com/felixpalingan/IronPixels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>felixpalingan/IronPixels</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 border-t border-zinc-800 bg-[#0c0c10] relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-12">
            <span className="font-mono text-xs text-[#00ff41] tracking-widest uppercase font-bold">
              [ PERTANYAAN UMUM ]
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              FREQUENTLY ASKED QUESTIONS (FAQ)
            </h2>
            <p className="font-body text-zinc-400 text-base">
              Jawaban lengkap seputar cara bermain, kalkulasi damage, dan keamanan sistem.
            </p>
          </div>

          <div className="space-y-3 font-mono">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-zinc-800 bg-[#121216] transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-sm font-bold text-zinc-200 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[#00ff41]">Q{index + 1}.</span>
                      <span>{item.q}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform ${
                        isOpen ? "rotate-180 text-[#00ff41]" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 pt-0 text-xs text-zinc-400 font-sans leading-relaxed border-t border-zinc-800/60">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-20 border-t border-zinc-800 bg-[#08080a] relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="w-16 h-16 bg-black border border-[#00ff41] p-1 mx-auto shadow-[0_0_20px_rgba(0,255,65,0.4)]">
            <img src="/icon.png" alt="IronPixels" className="w-full h-full object-contain pixelated" />
          </div>

          <h2 className="font-headline font-black text-3xl sm:text-5xl uppercase text-white">
            SIAP MEMBUAT SETIAP REPETISI BERARTI?
          </h2>

          <p className="font-body text-zinc-400 text-base max-w-2xl mx-auto">
            Bergabunglah dengan para lifter lainnya. Taklukkan lantai dungeon, tempa senjata
            legendaris, dan nikmati sensasi latihan angkat beban yang adiktif!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 stroke-[2.5]" />
              <span>DAFTAR SEKARANG (GRATIS)</span>
            </Link>

            <Link
              href="/login"
              className="px-6 py-4 border border-zinc-700 bg-zinc-900 hover:border-zinc-500 text-zinc-200 hover:text-white font-mono text-sm uppercase tracking-wider transition-all"
            >
              MASUK TERMINAL
            </Link>
          </div>
        </div>
      </section>

      {/* PUBLIC FOOTER */}
      <footer className="border-t border-zinc-800 bg-[#060608] py-12 relative z-10 font-mono text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-black border border-[#00ff41] p-0.5">
              <img src="/icon.png" alt="IronPixels Logo" className="w-full h-full object-contain pixelated" />
            </div>
            <div>
              <span className="text-zinc-300 font-bold">IRONPIXELS</span> &copy; 2026. All rights reserved.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href="https://portfolio-felix-bariq.vercel.app"
              target="_blank"
              rel="author noopener noreferrer"
              className="hover:text-[#00ff41] transition-colors"
            >
              Author Hub (Almakius Felix Bariq Hekopung)
            </a>
            <a
              href="https://github.com/felixpalingan/IronPixels"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub Repository
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-zinc-900 text-center text-[10px] text-zinc-600">
          Disclaimer: IronPixels dirancang sebagai media motivasi dan gamifikasi latihan kebugaran.
          Selalu utamakan bentuk angkatan (form) yang benar, lakukan pemanasan, dan konsultasikan dengan
          tenaga profesional sebelum memulai program latihan intensitas tinggi.
        </div>
      </footer>
    </div>
  );
}
