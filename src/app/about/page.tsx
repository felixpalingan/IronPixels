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
  Volume2,
  VolumeX,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Target,
  Github,
  Globe,
  Menu,
  X,
  Flame,
  Check,
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
  tier: string;
}

const SIM_EXERCISES: ExerciseOption[] = [
  { id: "bench_press", name: "Barbell Bench Press", category: "Chest", mult: 1.15, stat: "STR", tier: "Compound (Chest)" },
  { id: "back_squat", name: "Barbell Back Squat", category: "Legs", mult: 1.25, stat: "STR", tier: "Compound (Legs)" },
  { id: "deadlift", name: "Conventional Deadlift", category: "Back", mult: 1.30, stat: "STR", tier: "Compound (Back)" },
  { id: "ohp", name: "Overhead Press", category: "Shoulders", mult: 1.10, stat: "STR", tier: "Compound (Shoulders)" },
  { id: "pull_up", name: "Pull Up (Bodyweight)", category: "Back", mult: 1.20, stat: "AGI", tier: "Bodyweight (Back)" },
  { id: "bicep_curl", name: "Dumbbell Bicep Curl", category: "Arms", mult: 0.95, stat: "STR", tier: "Isolation (Arms)" },
];

interface MobInfo {
  floor: string;
  name: string;
  sprite: string;
  anim: "idle_anim" | "anim";
}

interface DungeonTierInfo {
  floorRange: string;
  name: string;
  boss: string;
  bossSprite: string;
  bossHp: string;
  dailyDamage: string;
  loot: string;
  note: string;
  mobs: MobInfo[];
}

const HERO_CLASSES = [
  {
    id: "warrior",
    name: "Warrior",
    title: "VANGUARD POWERLIFTER",
    icon: "/assets/dungeon/heroes/knight_m_idle_anim_f0.png",
    stat: "Fokus Pure STR & VIT (Powerlifting)",
    favLift: "Barbell Bench Press, Back Squat, Deadlift",
    role: "Pertahanan Kokoh & Damage Fisik Masif",
    desc: "Spesialis angkatan barbel compound berat. Memiliki pertahanan tertinggi terhadap serangan monster dungeon dan menghasilkan damage serangan fisik paling stabil di setiap set latihan berat.",
  },
  {
    id: "hero",
    name: "Hero",
    title: "BALANCED ALL-ROUNDER",
    icon: "/assets/dungeon/heroes/elf_m_idle_anim_f0.png",
    stat: "Fokus Seimbang (STR, AGI, VIT, LUK)",
    favLift: "Overhead Press, Dumbbell Lunges, RDL",
    role: "Serangan Cepat & Peluang Critical Strike",
    desc: "Karakter serba bisa dengan kelincahan dan mobilitas tinggi. Mengombinasikan kekuatan angkat beban dan kelincahan atletis untuk memberikan peluang critical strike yang lebih sering saat menghadapi musuh dungeon.",
  },
  {
    id: "mage",
    name: "Mage",
    title: "ARCANE ATHLETE",
    icon: "/assets/dungeon/heroes/wizzard_m_idle_anim_f0.png",
    stat: "Fokus Stamina, Hipertrofi & Kardio",
    favLift: "Pull-Up, Dips, Push-Up & Repetisi Tinggi",
    role: "Damage Sihir Beruntun & Hipertrofi",
    desc: "Spesialis latihan kalistenik, bodyweight, dan set repetisi tinggi di zona hipertrofi. Mengubah repetisi padat menjadi serangan sihir beruntun yang efektif menembus pertahanan armor bos lantai.",
  },
];

const DUNGEON_TIERS: DungeonTierInfo[] = [
  {
    floorRange: "Lantai 1 - 5",
    name: "Crypt of the Ogre",
    boss: "Ogre King (Bos Lantai 5)",
    bossSprite: "ogre",
    bossHp: "12,000 HP",
    dailyDamage: "10 - 25 HP / hari",
    loot: "Rusty Blades, Leather Armor & Iron Shield",
    note: "Zona permulaan untuk membangun konsistensi latihan gym. Kalahkan 4 mob pendamping di lantai 1–4 sebelum menghadapi tebasan gada Ogre King di lantai 5.",
    mobs: [
      { floor: "Lantai 1", name: "Imp", sprite: "imp", anim: "idle_anim" },
      { floor: "Lantai 2", name: "Swampy", sprite: "swampy", anim: "anim" },
      { floor: "Lantai 3", name: "Goblin", sprite: "goblin", anim: "idle_anim" },
      { floor: "Lantai 4", name: "Skeleton", sprite: "skelet", anim: "idle_anim" },
    ],
  },
  {
    floorRange: "Lantai 6 - 10",
    name: "Catacombs of the Undead",
    boss: "Undead Giant (Bos Lantai 10)",
    bossSprite: "big_zombie",
    bossHp: "30,000 HP",
    dailyDamage: "30 - 65 HP / hari",
    loot: "Heavy Halberd, Chainmail & Ring of Endurance",
    note: "Monster mulai memberikan serangan balasan yang lebih agresif. Disiplin latihan rutin 3–4 kali seminggu akan menjaga heromu selalu prima dan darahnya penuh.",
    mobs: [
      { floor: "Lantai 6", name: "Masked Orc", sprite: "masked_orc", anim: "idle_anim" },
      { floor: "Lantai 7", name: "Poison Slug", sprite: "slug", anim: "anim" },
      { floor: "Lantai 8", name: "Tiny Zombie", sprite: "tiny_zombie", anim: "idle_anim" },
      { floor: "Lantai 9", name: "Muddy", sprite: "muddy", anim: "anim" },
    ],
  },
  {
    floorRange: "Lantai 11 - 15",
    name: "Infernal Bastion",
    boss: "Demon Lord (Bos Lantai 15)",
    bossSprite: "big_demon",
    bossHp: "65,000 HP",
    dailyDamage: "75 - 120 HP / hari",
    loot: "Mithril Armor, Dragon Slayer Axe & Flame Relic",
    note: "Tingkat kesulitan meningkat tajam dengan HP bos yang tebal. Diperlukan progres beban latihan atau kerja sama raid party agar bos lantai 15 bisa ditaklukkan.",
    mobs: [
      { floor: "Lantai 11", name: "Dark Necromancer", sprite: "necromancer", anim: "anim" },
      { floor: "Lantai 12", name: "Pumpkin Dude", sprite: "pumpkin_dude", anim: "idle_anim" },
      { floor: "Lantai 13", name: "Orc Warrior", sprite: "orc_warrior", anim: "idle_anim" },
      { floor: "Lantai 14", name: "Wogol", sprite: "wogol", anim: "idle_anim" },
    ],
  },
  {
    floorRange: "Lantai 16 - 20",
    name: "Abyssal Throne",
    boss: "Abyssal Overlord (Bos Lantai 20)",
    bossSprite: "big_demon",
    bossHp: "125,000 HP",
    dailyDamage: "150 - 250 HP / hari",
    loot: "Excalibur, Mythic Relic & Abyssal Crown",
    note: "Puncak tantangan tertinggi bagi lifter sejati. Hadapi kawanan monster kegelapan dan bos berkekuatan dahsyat untuk merebut gelar penguasa dungeon dan gear legendaris.",
    mobs: [
      { floor: "Lantai 16", name: "Chort Fiend", sprite: "chort", anim: "idle_anim" },
      { floor: "Lantai 17", name: "Ice Zombie", sprite: "ice_zombie", anim: "anim" },
      { floor: "Lantai 18", name: "Orc Shaman", sprite: "orc_shaman", anim: "idle_anim" },
      { floor: "Lantai 19", name: "Shadow Lich", sprite: "necromancer", anim: "anim" },
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "Apa itu IronPixels?",
    a: "IronPixels adalah aplikasi gamified fitness tracker bergaya retro 16-bit RPG. Setiap repetisi dan beban yang kamu angkat di gym otomatis diubah menjadi kekuatan serangan untuk mengalahkan bos dungeon, membuka senjata langka, dan menyelesaikan misi bersama teman.",
  },
  {
    q: "Bagaimana cara kerja penghitungan damage RVS (Real Volume Score)?",
    a: "RVS dihitung berdasarkan formula matematis: Beban Angkatan (kg) × Repetisi × Rasio Berat Badan (% BW) × Multiplier Gerakan. Gerakan compound berat seperti Squat dan Deadlift memiliki kontribusi multiplier lebih besar daripada gerakan isolasi, sehingga sistem adil bagi semua rentang berat badan.",
  },
  {
    q: "Apakah mencatat workout memulihkan darah (HP) hero?",
    a: "Ya! Setiap kali kamu menyelesaikan satu sesi workout di gym, hero kamu langsung pulih 100% HP dan penalti serangan bos harian otomatis terhapus. Selama kamu konsisten berlatih, heromu akan selalu bugar dan siap menjelajah dungeon.",
  },
  {
    q: "Apakah ada sistem pay-to-win menggunakan uang asli?",
    a: "Tidak ada sama sekali. IronPixels 100% gratis dimainkan dan menjunjung tinggi fair play. Semua gold, peti hadiah, senjata, dan upgrade blacksmith diperoleh murni dari kerja keras fisikmu saat berlatih di gym.",
  },
  {
    q: "Bagaimana cara bermain Co-Op Dungeon Raid bersama teman?",
    a: "Kamu bisa membuat atau bergabung ke dalam Party (guild) di tab Social. Saat kamu atau teman satu party menyelesaikan workout di gym, damage dari volume latihan tersebut langsung memotong HP bos lantai yang sama secara real-time via WebSockets.",
  },
  {
    q: "Bagaimana jika saya perlu mengambil Rest Day (Hari Istirahat)?",
    a: "Istirahat adalah bagian penting dari pertumbuhan otot. Serangan bos harian di lantai dungeon tidak langsung menghabiskan darah hero dalam 1-2 hari. Kamu bisa beristirahat dengan tenang selama 1–2 hari, lalu darah heromu akan kembali penuh begitu sesi latihan berikutnya selesai dicatat.",
  },
];

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeCodexTab, setActiveCodexTab] = useState<"classes" | "dungeons">("classes");
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);

  // Simulator State
  const [selectedExId, setSelectedExId] = useState<string>("bench_press");
  const [simWeight, setSimWeight] = useState<number>(80);
  const [simReps, setSimReps] = useState<number>(10);
  const [simBodyweight, setSimBodyweight] = useState<number>(75);
  const [monsterCurrentHp, setMonsterCurrentHp] = useState<number>(4200);
  const [monsterMaxHp] = useState<number>(5000);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [isHitShaking, setIsHitShaking] = useState<boolean>(false);
  const [floatingDamage, setFloatingDamage] = useState<{ value: number; isCrit: boolean } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getIsMuted());
  const [recentCombatLog, setRecentCombatLog] = useState<string[]>([]);

  const currentExercise = SIM_EXERCISES.find((e) => e.id === selectedExId) || SIM_EXERCISES[0];
  const actualWeight = currentExercise.stat === "AGI" && simWeight <= 0 ? simBodyweight : Math.max(1, simWeight);
  const bodyweightRatio = actualWeight / Math.max(40, simBodyweight);
  const calculatedRvs = Math.round(actualWeight * simReps * bodyweightRatio * 0.1 * currentExercise.mult * 1.5);
  const totalVolume = Math.round(simWeight * simReps);

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

    const logEntry = `${isCrit ? "[CRITICAL HIT!] " : ""}${currentExercise.name} (${simWeight} kg × ${simReps} reps) menghasilkan ${finalDamage.toLocaleString()} RVS damage!`;
    setRecentCombatLog((prev) => [logEntry, ...prev.slice(0, 2)]);

    setTimeout(() => setIsHitShaking(false), 400);
    setTimeout(() => setIsAttacking(false), 600);
    setTimeout(() => setFloatingDamage(null), 1800);
  };

  const handleResetMonster = () => {
    setMonsterCurrentHp(monsterMaxHp);
    setFloatingDamage(null);
    setRecentCombatLog([]);
  };

  const handleToggleSound = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.play("select");
    }
  };

  const activeHeroClass = HERO_CLASSES[selectedClassIndex];
  const activeDungeonTier = DUNGEON_TIERS[selectedTierIndex];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col font-sans selection:bg-[#00ff41] selection:text-black relative overflow-x-hidden">
      {/* Subtle CRT Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#48484A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-black border border-[#00ff41] p-0.5 shadow-[0_0_10px_rgba(0,255,65,0.3)] flex items-center justify-center">
              <img src="/icon.png" alt="IronPixels Logo" className="w-full h-full object-contain pixelated" style={{ imageRendering: "pixelated" }} />
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 font-mono text-xs uppercase tracking-wider text-zinc-400">
            <a href="#cerita" className="hover:text-white transition-colors">Tentang Kami</a>
            <a href="#hukum-besi" className="hover:text-white transition-colors">Cara Kerja RVS</a>
            <a href="#simulator" className="hover:text-[#00ff41] transition-colors flex items-center gap-1.5 text-white font-bold">
              <Flame className="w-3.5 h-3.5 text-[#00ff41]" />
              Simulator
            </a>
            <a href="#codex" className="hover:text-white transition-colors">Hero &amp; Dungeon</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#arsitektur" className="hover:text-white transition-colors">Teknologi</a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 border border-[#48484A] bg-[#1C1C1E] hover:border-zinc-300 font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-white transition-all"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 border border-[#00ff41] bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,65,0.35)] transition-all flex items-center gap-1.5"
            >
              <span>Daftar Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white border border-[#48484A] bg-[#1C1C1E]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#131313] border-b border-[#48484A] px-4 py-4 space-y-3 font-mono text-xs uppercase">
            <a href="#cerita" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-zinc-300 hover:text-[#00ff41]">Tentang Kami</a>
            <a href="#hukum-besi" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-zinc-300 hover:text-[#00ff41]">Cara Kerja RVS</a>
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#00ff41] font-bold">⚡ Simulator Tempur</a>
            <a href="#codex" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-zinc-300 hover:text-[#00ff41]">Hero &amp; Dungeon</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-zinc-300 hover:text-[#00ff41]">FAQ</a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="w-full text-center py-2.5 border border-[#48484A] bg-[#1C1C1E] text-white font-mono text-xs">
                Masuk
              </Link>
              <Link href="/register" className="w-full text-center py-2.5 bg-[#00ff41] text-black font-mono font-bold text-xs shadow-neon">
                Daftar Akun Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/40 bg-[#00ff41]/10 text-[#00ff41] font-mono text-xs uppercase tracking-widest font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span>LEVEL UP BADANMU &bull; LEVEL UP HEROMU</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white leading-[1.08]">
            ANGKAT BEBAN DI DUNIA NYATA. TAKLUKKAN BOS DI DUNGEON.
          </h1>

          {/* Subtitle in Natural & Engaging Voice */}
          <p className="font-body text-base sm:text-lg md:text-xl text-zinc-300 max-w-3xl leading-relaxed">
            Bosan mencatat latihan di spreadsheet yang kaku? Di IronPixels, setiap beban dan repetisi
            yang kamu angkat di gym langsung diubah jadi damage tempur hero. Tumbangkan bos dungeon 16-bit,
            buka senjata langka, dan selesaikan raid bareng teman.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 stroke-[2.5]" />
              <span>MULAI PETUALANGAN (GRATIS)</span>
            </Link>

            <a
              href="#simulator"
              className="px-6 py-4 border border-[#48484A] bg-[#1C1C1E] hover:border-[#00ff41] text-zinc-200 hover:text-white font-mono text-sm uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-[#00ff41]" />
              <span>COBA SIMULATOR RVS</span>
            </a>
          </div>
        </div>

        {/* AUTHENTIC DUNGEON VIEWPORT CHASSIS */}
        <div className="mt-12 max-w-3xl mx-auto border-2 border-[#48484A] bg-black shadow-[0_12px_40px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="bg-[#1C1C1E] border-b border-[#48484A] px-4 py-2 flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="text-zinc-200 font-bold ml-2">ARENA BATTLE LIVE // LANTAI 20</span>
            </div>
            <div className="text-[#00ff41] font-bold">ABYSSAL RAID AKTIF</div>
          </div>

          <div className="py-6 px-4 bg-black flex justify-center overflow-x-auto select-none">
            <DungeonStageMap floor={20}>
              {/* Left: Party Heroes */}
              <div className="pointer-events-auto flex items-end justify-start gap-2 sm:gap-3 px-1 z-20">
                <HeroSprite
                  currentState="idle"
                  characterClass="knight"
                  gender="m"
                  scale={1.8}
                  weaponIcon="/assets/items/weapons/01.png"
                  showNameTag="LVL 45 WARRIOR"
                  nameTagPosition="top"
                />
                <HeroSprite
                  currentState="idle"
                  characterClass="elf"
                  gender="f"
                  scale={1.6}
                  weaponIcon="/assets/items/weapons/03.png"
                  showNameTag="LVL 42 HERO"
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

      {/* CERITA DI BALIK IRONPIXELS (SPLIT-SCREEN SECTION) */}
      <section id="cerita" className="py-20 border-t border-[#48484A] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: The Story */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white leading-tight">
                KENAPA KAMI MEMBANGUN IRONPIXELS?
              </h2>
              <div className="font-body text-zinc-300 space-y-4 text-base leading-relaxed">
                <p>
                  Konsistensi di gym sering kali rontok bukan karena kamu kurang niat, tapi karena
                  pencatatan latihan terasa membosankan dan progres fisik butuh waktu lama untuk terlihat.
                  Di sisi lain, mobile game biasa menyita waktu berjam-jam tanpa memberi dampak kebugaran bagi tubuh.
                </p>
                <p>
                  IronPixels menjembatani keduanya: <strong className="text-white">setiap repetisi dan tetes keringatmu di gym punya dampak nyata di dalam game</strong>.
                  Tanpa jalan pintas dan tanpa sistem pay-to-win. Level hero, senjata legendaris, dan ranking guild-mu
                  murni hasil dari disiplin dan kerja keras fisikmu sendiri.
                </p>
              </div>

              <div className="p-4 border-l-2 border-[#00ff41] bg-[#1C1C1E] font-mono text-xs text-zinc-300 space-y-1">
                <div className="text-[#00ff41] font-bold">100% FREE-TO-PLAY &amp; FAIR PLAY:</div>
                <div>Semua exp, senjata, dan hadiah murni diperoleh dari disiplin angkat beban di dunia nyata.</div>
              </div>
            </div>

            {/* Right Column: 3 Pilar Utama */}
            <div id="hukum-besi" className="lg:col-span-6 space-y-4 font-mono">
              <div className="border border-[#48484A] bg-[#131313] p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-black border border-[#00ff41] text-[#00ff41] font-black text-sm flex items-center justify-center">
                    I
                  </span>
                  <h3 className="font-headline font-bold text-lg text-white">FORMULA RVS (REAL VOLUME SCORE)</h3>
                </div>
                <p className="font-body text-sm text-zinc-400 pl-11">
                  Beban angkatan, repetisi, dan jenis gerakan dikalkulasikan secara adil berdasarkan berat badanmu.
                  Latihan compound berat seperti Squat dan Deadlift memberikan kontribusi damage paling masif.
                </p>
              </div>

              <div className="border border-[#48484A] bg-[#131313] p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-black border border-red-500 text-red-400 font-black text-sm flex items-center justify-center">
                    II
                  </span>
                  <h3 className="font-headline font-bold text-lg text-white">REST DAY AMAN, WORKOUT LANGSUNG PULIH</h3>
                </div>
                <p className="font-body text-sm text-zinc-400 pl-11">
                  Satu sesi workout langsung memulihkan 100% darah hero. Butuh rest day 1–2 hari untuk pemulihan otot?
                  Nggak masalah, heromu tetap bertahan dan siap tancap gas di sesi latihan berikutnya.
                </p>
              </div>

              <div className="border border-[#48484A] bg-[#131313] p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-black border border-purple-500 text-purple-400 font-black text-sm flex items-center justify-center">
                    III
                  </span>
                  <h3 className="font-headline font-bold text-lg text-white">RAID BERSAMA TEMAN SATU GUILD</h3>
                </div>
                <p className="font-body text-sm text-zinc-400 pl-11">
                  Bentuk party bareng teman gym-mu. Total damage dari sesi latihan kalian langsung digabungkan
                  secara real-time untuk menumbangkan bos dungeon bersama-sama.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE ARCADE SIMULATOR */}
      <section id="simulator" className="py-20 border-t border-[#48484A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              SIMULATOR SERANGAN RVS
            </h2>
            <p className="font-body text-zinc-300 text-base">
              Pilih gerakan latihan, atur beban dan repetisinya, lalu saksikan langsung seberapa dahsyat
              serangan heromu saat menghantam bos dungeon di bawah ini.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Left Console: Simulator Controls */}
            <div className="lg:col-span-5 bg-[#131313] border-2 border-[#48484A] p-6 space-y-5 font-mono shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-[#48484A] pb-3">
                <span className="text-xs uppercase text-zinc-300 font-bold">KONSOL SIMULATOR</span>
                <button
                  onClick={handleToggleSound}
                  className={`px-2.5 py-1 border text-xs flex items-center gap-1.5 transition-colors ${
                    isMuted ? "border-red-900 bg-red-950/40 text-red-400" : "border-[#48484A] bg-black text-[#00ff41]"
                  }`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isMuted ? "SFX MATI" : "SFX AKTIF"}</span>
                </button>
              </div>

              {/* Movement Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 uppercase font-bold">GERAKAN LATIHAN:</label>
                <select
                  value={selectedExId}
                  onChange={(e) => setSelectedExId(e.target.value)}
                  className="w-full bg-black border border-[#48484A] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff41]"
                >
                  {SIM_EXERCISES.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.tier})
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
                  min="20"
                  max="220"
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
                  max="25"
                  step="1"
                  value={simReps}
                  onChange={(e) => setSimReps(parseInt(e.target.value))}
                  className="w-full accent-[#00ff41] bg-zinc-800 h-2 cursor-pointer"
                />
              </div>

              {/* Bodyweight Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-bold uppercase">BERAT BADAN PENGGUNA:</span>
                  <span className="text-sky-400 font-bold text-sm">{simBodyweight} KG</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="130"
                  step="1"
                  value={simBodyweight}
                  onChange={(e) => setSimBodyweight(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 bg-zinc-800 h-2 cursor-pointer"
                />
              </div>

              {/* Live Formula HUD */}
              <div className="bg-black border border-[#48484A] p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Volume Set:</span>
                  <span className="text-white font-bold">{totalVolume.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Rasio Beban terhadap BB:</span>
                  <span className="text-white font-bold">{(bodyweightRatio * 100).toFixed(0)}% BB</span>
                </div>
                <div className="flex justify-between border-t border-[#48484A] pt-2 text-[#00ff41]">
                  <span className="font-bold">ESTIMASI DAMAGE RVS:</span>
                  <span className="font-bold text-base">+{calculatedRvs.toLocaleString()} DMG</span>
                </div>
              </div>

              {/* Attack Button */}
              <button
                onClick={handleSimulateAttack}
                disabled={isAttacking}
                className="w-full py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Swords className="w-4 h-4 stroke-[3]" />
                <span>{isAttacking ? "MENYERANG BOS..." : "SERANG BOS SEKARANG"}</span>
              </button>
            </div>

            {/* Right Screen: Authentic Arcade Screen */}
            <div className="lg:col-span-7 bg-[#101015] border-2 border-[#48484A] p-6 flex flex-col justify-between min-h-[460px] relative shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-[#48484A] pb-3 font-mono text-xs">
                <span className="text-zinc-300 font-bold">ARENA MONITOR // LANTAI 12</span>
                <button
                  onClick={handleResetMonster}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET DARAH BOS</span>
                </button>
              </div>

              {/* Boss Status Bar */}
              <div className="mt-4 space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-bold uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>OGRE DUNGEON GUARDIAN</span>
                  </span>
                  <span className="text-zinc-300 text-[11px] font-bold">
                    {monsterCurrentHp.toLocaleString()} / {monsterMaxHp.toLocaleString()} HP
                  </span>
                </div>
                <div className="w-full h-3 bg-black border border-[#48484A] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 transition-all duration-300"
                    style={{ width: `${(monsterCurrentHp / monsterMaxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Authentic Dungeon Stage Map */}
              <div className="relative overflow-hidden flex justify-center my-6 bg-black border border-[#48484A]">
                <DungeonStageMap floor={12}>
                  {/* Hero */}
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

                  {/* Boss */}
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

              {/* Combat Event Feed */}
              <div className="font-mono text-xs bg-black p-3 border border-[#48484A] space-y-1 min-h-[58px]">
                {recentCombatLog.length > 0 ? (
                  recentCombatLog.map((log, i) => (
                    <div key={i} className="text-[#00ff41] leading-tight">
                      &gt; {log}
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-500 leading-tight">
                    &gt; Siap bertarung. Atur beban dan repetisi di sebelah kiri, lalu tekan tombol serang.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CODEX HERO & LANTAI DUNGEON */}
      <section id="codex" className="py-20 border-t border-[#48484A] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              KELAS HERO &amp; SHOWCASE MONSTER DUNGEON
            </h2>
            <p className="font-body text-zinc-300 text-base">
              Kenali 3 kelas karakter andalanmu, serta daftar bos utama dan kawanan mobs pendamping di setiap tingkatan lantai dungeon.
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex border border-[#48484A] bg-black p-1 gap-1 font-mono text-xs mt-4">
              <button
                onClick={() => setActiveCodexTab("classes")}
                className={`px-4 py-2 uppercase font-bold transition-all ${
                  activeCodexTab === "classes"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                3 Kelas Hero
              </button>
              <button
                onClick={() => setActiveCodexTab("dungeons")}
                className={`px-4 py-2 uppercase font-bold transition-all ${
                  activeCodexTab === "dungeons"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Showcase Boss &amp; Mobs (Lantai 1-20)
              </button>
            </div>
          </div>

          {/* Tab 1: Hero Classes Codex (3 Classes) */}
          {activeCodexTab === "classes" && (
            <div className="max-w-4xl mx-auto border border-[#48484A] bg-[#131313] p-6 sm:p-8">
              {/* Class Selector Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8 font-mono text-xs">
                {HERO_CLASSES.map((cls, idx) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassIndex(idx)}
                    className={`p-3.5 border text-left flex items-center gap-3 transition-all ${
                      selectedClassIndex === idx
                        ? "border-[#00ff41] bg-[#00ff41]/10 text-white shadow-neon"
                        : "border-[#48484A] bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <img src={cls.icon} alt={cls.name} className="w-full h-full object-contain pixelated" style={{ imageRendering: "pixelated" }} />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white text-sm">{cls.name}</div>
                      <div className="text-[10px] text-[#00ff41] font-normal truncate">{cls.title}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Class Deep View */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-[#48484A] pt-6">
                <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-28 h-28 bg-black border-2 border-[#00ff41] p-3 shadow-[0_0_20px_rgba(0,255,65,0.2)] flex items-center justify-center">
                    <img src={activeHeroClass.icon} alt={activeHeroClass.name} className="w-full h-full object-contain pixelated" style={{ imageRendering: "pixelated" }} />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-xl text-white">{activeHeroClass.name}</h3>
                    <div className="text-xs font-mono text-[#00ff41] font-bold">{activeHeroClass.role}</div>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">FOKUS STATISTIK:</div>
                    <div className="text-white text-sm font-bold">{activeHeroClass.stat}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">GERAKAN FAVORIT:</div>
                    <div className="text-amber-400 text-sm font-bold">{activeHeroClass.favLift}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">SPESIALISASI PERMAINAN:</div>
                    <p className="font-body text-zinc-300 text-sm leading-relaxed">{activeHeroClass.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Dungeon Floors Codex (Boss & Accompanying Mobs Showcase) */}
          {activeCodexTab === "dungeons" && (
            <div className="max-w-4xl mx-auto border border-[#48484A] bg-[#131313] p-6 sm:p-8">
              {/* Floor Tier Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 font-mono text-xs">
                {DUNGEON_TIERS.map((tier, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`p-3 border text-center transition-all ${
                      selectedTierIndex === idx
                        ? "border-[#00ff41] bg-[#00ff41]/10 text-white shadow-neon font-bold"
                        : "border-[#48484A] bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div>{tier.floorRange}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{tier.name}</div>
                  </button>
                ))}
              </div>

              {/* Selected Tier Deep View with Boss & Accompanying Mobs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-[#48484A] pt-6">
                {/* Left: Boss Spotlight */}
                <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4 bg-black/60 border border-[#48484A] p-5">
                  <div className="w-28 h-28 bg-black border-2 border-red-500/80 p-3 shadow-red-glow flex items-center justify-center">
                    <img
                      src={`/assets/dungeon/monsters/${activeDungeonTier.bossSprite}_idle_anim_f0.png`}
                      alt={activeDungeonTier.boss}
                      className="w-full h-full object-contain pixelated -scale-x-100"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-red-400 font-bold tracking-widest uppercase">
                      {activeDungeonTier.floorRange} // TANTANGAN UTAMA
                    </div>
                    <h3 className="font-headline font-black text-xl text-white mt-1">{activeDungeonTier.boss}</h3>
                    <div className="text-xs font-mono text-zinc-400">{activeDungeonTier.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full font-mono text-xs pt-1">
                    <div className="p-2.5 bg-black border border-[#48484A] text-left">
                      <div className="text-[10px] text-zinc-400 font-bold">TOTAL DARAH BOS:</div>
                      <div className="text-white text-xs font-bold mt-0.5">{activeDungeonTier.bossHp}</div>
                    </div>
                    <div className="p-2.5 bg-black border border-[#48484A] text-left">
                      <div className="text-[10px] text-zinc-400 font-bold">PENALTI ABSEN:</div>
                      <div className="text-red-400 text-xs font-bold mt-0.5">{activeDungeonTier.dailyDamage}</div>
                    </div>
                  </div>
                </div>

                {/* Right: Mobs Pendamping & Strategy Notes */}
                <div className="lg:col-span-7 space-y-5 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="text-zinc-400 font-bold uppercase flex items-center justify-between">
                      <span>4 MOBS PENDAMPING LANTAI:</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Kalahkan sebelum bos</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {activeDungeonTier.mobs.map((mob) => (
                        <div
                          key={mob.name}
                          className="p-3 bg-black border border-[#48484A] flex flex-col items-center text-center space-y-1 hover:border-[#00ff41] transition-colors"
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <img
                              src={`/assets/dungeon/monsters/${mob.sprite}_${mob.anim}_f0.png`}
                              alt={mob.name}
                              className="w-full h-full object-contain pixelated"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </div>
                          <div className="text-[10px] text-[#00ff41] font-bold">{mob.floor}</div>
                          <div className="text-xs text-zinc-200 font-bold truncate max-w-full">{mob.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">DROP PERLENGKAPAN:</div>
                    <div className="text-amber-400 text-sm font-bold">{activeDungeonTier.loot}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">CATATAN STRATEGI:</div>
                    <p className="font-body text-zinc-300 text-sm leading-relaxed">{activeDungeonTier.note}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ARSITEKTUR & DEVELOPER PROFILE */}
      <section id="arsitektur" className="py-20 border-t border-[#48484A] bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="border border-[#48484A] bg-[#131313] p-8 sm:p-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-black border-2 border-[#00ff41] p-1 shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                  <img src="/icon.png" alt="Almakius Felix Bariq Hekopung" className="w-full h-full object-cover pixelated" style={{ imageRendering: "pixelated" }} />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-white">Almakius Felix Bariq Hekopung</h3>
                  <p className="font-mono text-xs text-[#00ff41] font-bold">CREATOR &amp; LEAD ENGINEER</p>
                </div>
                <a
                  href="https://portfolio-felix-bariq.vercel.app"
                  target="_blank"
                  rel="author noopener noreferrer"
                  className="px-3.5 py-1.5 border border-[#48484A] bg-black hover:border-[#00ff41] text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00ff41]" />
                  <span>Portfolio Hub</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>

              <div className="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-[#48484A] md:pl-8 pt-6 md:pt-0">
                <h4 className="font-headline font-black text-2xl text-white">
                  DIBANGUN DENGAN TEKNOLOGI MODERN
                </h4>
                <p className="font-body text-zinc-300 text-sm leading-relaxed">
                  IronPixels dikembangkan sebagai platform web app full-stack yang mengawinkan kecepatan
                  Next.js 15 App Router dengan sinkronisasi multiplayer real-time via WebSockets Supabase
                  dan basis data PostgreSQL yang aman.
                </p>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-zinc-300">
                  <div className="p-2 bg-black border border-[#48484A]">&bull; Next.js 15 App Router</div>
                  <div className="p-2 bg-black border border-[#48484A]">&bull; Supabase Realtime</div>
                  <div className="p-2 bg-black border border-[#48484A]">&bull; PostgreSQL RLS Auth</div>
                  <div className="p-2 bg-black border border-[#48484A]">&bull; 16-Bit Pixel Art by 0x72</div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://github.com/felixpalingan/IronPixels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>felixpalingan/IronPixels (Open Source Repository)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 border-t border-[#48484A] bg-[#0E0E0E]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              PERTANYAAN UMUM (FAQ)
            </h2>
            <p className="font-body text-zinc-300 text-base">
              Semua hal yang perlu kamu tahu seputar cara bermain, kalkulasi damage, dan perkembangan heromu.
            </p>
          </div>

          <div className="space-y-3 font-mono">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="border border-[#48484A] bg-[#131313]">
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
                        <div className="p-4 sm:p-5 pt-0 text-xs text-zinc-300 font-sans leading-relaxed border-t border-[#48484A]">
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

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 border-t border-[#48484A] bg-[#0A0A0A] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="w-16 h-16 bg-black border-2 border-[#00ff41] p-1 mx-auto shadow-[0_0_20px_rgba(0,255,65,0.3)]">
            <img src="/icon.png" alt="IronPixels" className="w-full h-full object-contain pixelated" style={{ imageRendering: "pixelated" }} />
          </div>

          <h2 className="font-headline font-black text-3xl sm:text-5xl uppercase text-white leading-tight">
            SIAP MULAI PETUALANGAN GYM-MU?
          </h2>

          <p className="font-body text-zinc-300 text-base max-w-xl mx-auto leading-relaxed">
            Tinggalkan pencatatan yang membosankan. Bawa heromu ke gym hari ini, angkat beban di dunia nyata,
            dan rasakan kepuasan saat setiap set latihan punya arti.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 stroke-[2.5]" />
              <span>DAFTAR SEKARANG (GRATIS)</span>
            </Link>

            <Link
              href="/login"
              className="px-6 py-4 border border-[#48484A] bg-[#1C1C1E] hover:border-zinc-300 text-zinc-200 hover:text-white font-mono text-sm uppercase tracking-wider transition-all"
            >
              MASUK KE TERMINAL
            </Link>
          </div>
        </div>
      </section>

      {/* PUBLIC FOOTER */}
      <footer className="border-t border-[#48484A] bg-[#0A0A0A] py-12 font-mono text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-black border border-[#00ff41] p-0.5">
              <img src="/icon.png" alt="IronPixels" className="w-full h-full object-contain pixelated" style={{ imageRendering: "pixelated" }} />
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
          Catatan: Selalu utamakan teknik gerakan yang benar, lakukan pemanasan sebelum latihan,
          dan sesuaikan beban dengan kemampuan fisik masing-masing.
        </div>
      </footer>
    </div>
  );
}
