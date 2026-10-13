"use client";

import { useState, useEffect } from "react";
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

export type Lang = "en" | "id";

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

const DICT = {
  en: {
    navAbout: "About Us",
    navRvs: "How RVS Works",
    navSimulator: "Simulator",
    navCodex: "Heroes & Dungeons",
    navFaq: "FAQ",
    navTech: "Tech Stack",
    login: "Log In",
    register: "Play Free",
    registerFreeFull: "START YOUR QUEST (FREE)",
    trySimulator: "TRY RVS SIMULATOR",
    heroTagline: "LEVEL UP YOUR BODY • LEVEL UP YOUR HERO",
    heroHeadline: "LIFT HEAVY IN REAL LIFE. SLAY BOSSES IN THE DUNGEON.",
    heroSubtitle:
      "Tired of lifeless gym spreadsheets? At IronPixels, every rep and kilo you lift in the real world converts directly into combat damage for your hero. Slay 16-bit dungeon bosses, unlock mythic gear, and conquer co-op raids with gym partners.",
    arenaLive: "LIVE BATTLE ARENA // FLOOR 20",
    raidActive: "ABYSSAL RAID ACTIVE",
    bossNameTag: "ABYSSAL DEMON OVERLORD",
    hero1Tag: "LVL 45 WARRIOR",
    hero2Tag: "LVL 42 HERO",
    hero3Tag: "LVL 48 MAGE",

    // Story
    storyHeading: "WHY WE BUILT IRONPIXELS",
    storyP1:
      "Gym consistency breaks down not from a lack of willpower, but because workout logs feel like mindless accounting and physical transformations take months to see. Meanwhile, typical mobile games consume hours without giving your real body any fitness return.",
    storyP2:
      "IronPixels bridges the gap: every rep, set, and drop of sweat has tangible impact in the game world. No pay-to-win shortcuts. Your hero's level, legendary armory, and guild rank are forged purely from your real-world discipline and grit.",
    fairPlayTitle: "100% FREE-TO-PLAY & PURE MERITOCRACY:",
    fairPlayDesc:
      "All EXP, weapons, and tier loot are earned exclusively through physical weightlifting in real life.",

    // Pillars
    pillar1Title: "RVS (REAL VOLUME SCORE) FORMULA",
    pillar1Desc:
      "Lifted weight, reps, and exercise mechanics scale fairly against your body weight. Heavy compounds like Squats and Deadlifts deal massive strike damage.",
    pillar2Title: "REST DAYS WELCOME, SESSIONS RESTORE HP",
    pillar2Desc:
      "Every completed workout restores 100% of your hero's HP. Need 1–2 rest days for muscle recovery? Your hero holds the line and stays ready for your next session.",
    pillar3Title: "CO-OP GUILD RAIDS",
    pillar3Desc:
      "Form a party with your gym crew. Damage from each member's lifting session combines in real time to topple gargantuan floor bosses together.",

    // Simulator
    simHeading: "RVS ATTACK SIMULATOR",
    simSubtitle:
      "Select an exercise, dial in your working weight and reps, and watch your hero crush the dungeon guardian below in real time.",
    simConsoleTitle: "SIMULATOR CONSOLE",
    sfxMuted: "SFX MUTED",
    sfxOn: "SFX ON",
    exerciseLabel: "EXERCISE MOVEMENT:",
    weightLabel: "WORKING WEIGHT:",
    repsLabel: "REPETITIONS:",
    bwLabel: "LIFTER BODYWEIGHT:",
    totalVolume: "Total Set Volume:",
    bwRatio: "Bodyweight Ratio:",
    estDamage: "ESTIMATED RVS DAMAGE:",
    strikeNow: "STRIKE THE BOSS NOW",
    striking: "HERO STRIKING...",
    arenaMonitor: "BATTLE MONITOR // FLOOR 12",
    resetBossHp: "RESET BOSS HP",
    bossTargetTag: "OGRE DUNGEON GUARDIAN",
    critHit: "⚡ CRITICAL HIT!",
    readyCombat:
      "> Ready for combat. Configure weight and reps on the console, then trigger the strike.",
    logDamage: (exercise: string, weight: number, reps: number, dmg: number, isCrit: boolean) =>
      `${isCrit ? "[CRITICAL HIT!] " : ""}${exercise} (${weight} kg × ${reps} reps) deals ${dmg.toLocaleString()} RVS damage!`,
    youLifterTag: "YOU (LIFTER)",

    // Codex
    codexHeading: "HERO CLASSES & DUNGEON BESTIARY",
    codexSubtitle:
      "Inspect your 3 core lifter classes, and discover the floor bosses and accompanying monsters lurking in each dungeon tier.",
    tabClasses: "3 Hero Classes",
    tabDungeons: "Boss & Mobs Bestiary (Floors 1-20)",
    statFocus: "STAT FOCUS:",
    favLifts: "SIGNATURE LIFTS:",
    gameSpec: "COMBAT SPECIALTY:",
    mainChallenge: "PRIMARY ENCOUNTER",
    bossHpLabel: "TOTAL BOSS HP:",
    absencePenalty: "ABSENCE PENALTY:",
    companionMobs: "4 ACCOMPANYING TIER MOBS:",
    defeatBefore: "Defeat prior to boss",
    lootDrops: "TIER EQUIPMENT LOOT:",
    stratNotes: "TACTICAL STRATEGY:",

    // Tech
    techHeading: "ENGINEERED WITH MODERN TECH",
    techDesc:
      "IronPixels is built as a full-stack web platform combining the agility of Next.js 15 App Router with real-time multiplayer WebSockets via Supabase and battle-tested PostgreSQL RLS security.",
    creatorTitle: "CREATOR & LEAD ENGINEER",
    repoLabel: "felixpalingan/IronPixels (Open Source Repository)",
    portfolioLink: "Portfolio Hub",

    // FAQ
    faqHeading: "FREQUENTLY ASKED QUESTIONS",
    faqSubtitle:
      "Everything you need to know about game mechanics, damage calculation, and leveling your hero.",

    // Final CTA
    ctaHeading: "READY TO COMMENCE YOUR QUEST?",
    ctaSubtitle:
      "Ditch lifeless spreadsheets. Take your hero to the gym today, lift heavy in the real world, and feel the thrill of every set having real gaming impact.",
    ctaRegister: "CREATE FREE ACCOUNT",
    ctaLogin: "LAUNCH TERMINAL",

    // Footer
    footerCopy: "All rights reserved.",
    footerNote:
      "Notice: Always prioritize proper lifting form, warm up thoroughly before training, and tailor your working weight to your individual physical capacity.",
  },
  id: {
    navAbout: "Tentang Kami",
    navRvs: "Cara Kerja RVS",
    navSimulator: "Simulator",
    navCodex: "Hero & Dungeon",
    navFaq: "FAQ",
    navTech: "Teknologi",
    login: "Masuk",
    register: "Daftar Gratis",
    registerFreeFull: "MULAI PETUALANGAN (GRATIS)",
    trySimulator: "COBA SIMULATOR RVS",
    heroTagline: "LEVEL UP BADANMU • LEVEL UP HEROMU",
    heroHeadline: "ANGKAT BEBAN DI DUNIA NYATA. TAKLUKKAN BOS DI DUNGEON.",
    heroSubtitle:
      "Bosan mencatat latihan di spreadsheet yang kaku? Di IronPixels, setiap beban dan repetisi yang kamu angkat di gym langsung diubah jadi damage tempur hero. Tumbangkan bos dungeon 16-bit, buka senjata langka, dan selesaikan raid bareng teman.",
    arenaLive: "ARENA BATTLE LIVE // LANTAI 20",
    raidActive: "ABYSSAL RAID AKTIF",
    bossNameTag: "ABYSSAL DEMON OVERLORD",
    hero1Tag: "LVL 45 WARRIOR",
    hero2Tag: "LVL 42 HERO",
    hero3Tag: "LVL 48 MAGE",

    // Story
    storyHeading: "KENAPA KAMI MEMBANGUN IRONPIXELS?",
    storyP1:
      "Konsistensi di gym sering kali rontok bukan karena kamu kurang niat, tapi karena pencatatan latihan terasa membosankan dan progres fisik butuh waktu lama untuk terlihat. Di sisi lain, mobile game biasa menyita waktu berjam-jam tanpa memberi dampak kebugaran bagi tubuh.",
    storyP2:
      "IronPixels menjembatani keduanya: setiap repetisi dan tetes keringatmu di gym punya dampak nyata di dalam game. Tanpa jalan pintas dan tanpa sistem pay-to-win. Level hero, senjata legendaris, dan ranking guild-mu murni hasil dari disiplin dan kerja keras fisikmu sendiri.",
    fairPlayTitle: "100% FREE-TO-PLAY & FAIR PLAY:",
    fairPlayDesc:
      "Semua exp, senjata, dan hadiah murni diperoleh dari disiplin angkat beban di dunia nyata.",

    // Pillars
    pillar1Title: "FORMULA RVS (REAL VOLUME SCORE)",
    pillar1Desc:
      "Beban angkatan, repetisi, dan jenis gerakan dikalkulasikan secara adil berdasarkan berat badanmu. Latihan compound berat seperti Squat dan Deadlift memberikan kontribusi damage paling masif.",
    pillar2Title: "REST DAY AMAN, WORKOUT LANGSUNG PULIH",
    pillar2Desc:
      "Satu sesi workout langsung memulihkan 100% darah hero. Butuh rest day 1–2 hari untuk pemulihan otot? Nggak masalah, heromu tetap bertahan dan siap tancap gas di sesi latihan berikutnya.",
    pillar3Title: "RAID BERSAMA TEMAN SATU GUILD",
    pillar3Desc:
      "Bentuk party bareng teman gym-mu. Total damage dari sesi latihan kalian langsung digabungkan secara real-time untuk menumbangkan bos dungeon bersama-sama.",

    // Simulator
    simHeading: "SIMULATOR SERANGAN RVS",
    simSubtitle:
      "Pilih gerakan latihan, atur beban dan repetisinya, lalu saksikan langsung seberapa dahsyat serangan heromu saat menghantam bos dungeon di bawah ini.",
    simConsoleTitle: "KONSOL SIMULATOR",
    sfxMuted: "SFX MATI",
    sfxOn: "SFX AKTIF",
    exerciseLabel: "GERAKAN LATIHAN:",
    weightLabel: "BEBAN ANGKATAN:",
    repsLabel: "JUMLAH REPETISI:",
    bwLabel: "BERAT BADAN PENGGUNA:",
    totalVolume: "Total Volume Set:",
    bwRatio: "Rasio Beban terhadap BB:",
    estDamage: "ESTIMASI DAMAGE RVS:",
    strikeNow: "SERANG BOS SEKARANG",
    striking: "MENYERANG BOS...",
    arenaMonitor: "ARENA MONITOR // LANTAI 12",
    resetBossHp: "RESET DARAH BOS",
    bossTargetTag: "OGRE DUNGEON GUARDIAN",
    critHit: "⚡ CRITICAL HIT!",
    readyCombat:
      "> Siap bertarung. Atur beban dan repetisi di sebelah kiri, lalu tekan tombol serang.",
    logDamage: (exercise: string, weight: number, reps: number, dmg: number, isCrit: boolean) =>
      `${isCrit ? "[CRITICAL HIT!] " : ""}${exercise} (${weight} kg × ${reps} reps) menghasilkan ${dmg.toLocaleString()} RVS damage!`,
    youLifterTag: "YOU (LIFTER)",

    // Codex
    codexHeading: "KELAS HERO & SHOWCASE MONSTER DUNGEON",
    codexSubtitle:
      "Kenali 3 kelas karakter andalanmu, serta daftar bos utama dan kawanan mobs pendamping di setiap tingkatan lantai dungeon.",
    tabClasses: "3 Kelas Hero",
    tabDungeons: "Showcase Boss & Mobs (Lantai 1-20)",
    statFocus: "FOKUS STATISTIK:",
    favLifts: "GERAKAN FAVORIT:",
    gameSpec: "SPESIALISASI PERMAINAN:",
    mainChallenge: "TANTANGAN UTAMA",
    bossHpLabel: "TOTAL DARAH BOS:",
    absencePenalty: "PENALTI ABSEN:",
    companionMobs: "4 MOBS PENDAMPING LANTAI:",
    defeatBefore: "Kalahkan sebelum bos",
    lootDrops: "DROP PERLENGKAPAN:",
    stratNotes: "CATATAN STRATEGI:",

    // Tech
    techHeading: "DIBANGUN DENGAN TEKNOLOGI MODERN",
    techDesc:
      "IronPixels dikembangkan sebagai platform web app full-stack yang mengawinkan kecepatan Next.js 15 App Router dengan sinkronisasi multiplayer real-time via WebSockets Supabase dan basis data PostgreSQL yang aman.",
    creatorTitle: "CREATOR & LEAD ENGINEER",
    repoLabel: "felixpalingan/IronPixels (Open Source Repository)",
    portfolioLink: "Portfolio Hub",

    // FAQ
    faqHeading: "PERTANYAAN UMUM (FAQ)",
    faqSubtitle:
      "Semua hal yang perlu kamu tahu seputar cara bermain, kalkulasi damage, dan perkembangan heromu.",

    // Final CTA
    ctaHeading: "SIAP MULAI PETUALANGAN GYM-MU?",
    ctaSubtitle:
      "Tinggalkan pencatatan yang membosankan. Bawa heromu ke gym hari ini, angkat beban di dunia nyata, dan rasakan kepuasan saat setiap set latihan punya arti.",
    ctaRegister: "DAFTAR SEKARANG (GRATIS)",
    ctaLogin: "MASUK KE TERMINAL",

    // Footer
    footerCopy: "All rights reserved.",
    footerNote:
      "Catatan: Selalu utamakan teknik gerakan yang benar, lakukan pemanasan sebelum latihan, dan sesuaikan beban dengan kemampuan fisik masing-masing.",
  },
};

const getHeroClasses = (lang: Lang) => [
  {
    id: "warrior",
    name: "Warrior",
    title: "VANGUARD POWERLIFTER",
    icon: "/assets/dungeon/heroes/knight_m_idle_anim_f0.png",
    stat: lang === "en" ? "Pure STR & VIT Focus (Heavy Powerlifting)" : "Fokus Pure STR & VIT (Powerlifting)",
    favLift: "Barbell Bench Press, Back Squat, Deadlift",
    role: lang === "en" ? "Stalwart Defense & Devastating Physical Force" : "Pertahanan Kokoh & Damage Fisik Masif",
    desc:
      lang === "en"
        ? "Specializes in heavy barbell compound lifts. Boasts the highest defense against dungeon damage penalties and delivers devastating, reliable physical force on every heavy work set."
        : "Spesialis angkatan barbel compound berat. Memiliki pertahanan tertinggi terhadap serangan monster dungeon dan menghasilkan damage serangan fisik paling stabil di setiap set latihan berat.",
  },
  {
    id: "hero",
    name: "Hero",
    title: "BALANCED ALL-ROUNDER",
    icon: "/assets/dungeon/heroes/elf_m_idle_anim_f0.png",
    stat: lang === "en" ? "Balanced Attributes (STR, AGI, VIT, LUK)" : "Fokus Seimbang (STR, AGI, VIT, LUK)",
    favLift: lang === "en" ? "Overhead Press, Dumbbell Lunges, Romanian Deadlift" : "Overhead Press, Dumbbell Lunges, RDL",
    role: lang === "en" ? "Swift Strikes & Critical Hit Mastery" : "Serangan Cepat & Peluang Critical Strike",
    desc:
      lang === "en"
        ? "An all-around powerhouse with high agility and mobility. Melds functional strength and conditioning to trigger frequent, high-impact critical strikes against dungeon foes."
        : "Karakter serba bisa dengan kelincahan dan mobilitas tinggi. Mengombinasikan kekuatan angkat beban dan kelincahan atletis untuk memberikan peluang critical strike yang lebih sering saat menghadapi musuh dungeon.",
  },
  {
    id: "mage",
    name: "Mage",
    title: "ARCANE ATHLETE",
    icon: "/assets/dungeon/heroes/wizzard_m_idle_anim_f0.png",
    stat: lang === "en" ? "Stamina, Hypertrophy & Calisthenics" : "Fokus Stamina, Hipertrofi & Kardio",
    favLift: lang === "en" ? "Pull-Ups, Dips, Push-Ups & High-Rep Supersets" : "Pull-Up, Dips, Push-Up & Repetisi Tinggi",
    role: lang === "en" ? "Chained Arcane Damage & Hypertrophy" : "Damage Sihir Beruntun & Hipertrofi",
    desc:
      lang === "en"
        ? "Master of calisthenics, bodyweight mastery, and high-volume hypertrophy sets. Channels relentless reps into chained arcane bursts that shatter tough boss armor."
        : "Spesialis latihan kalistenik, bodyweight, dan set repetisi tinggi di zona hipertrofi. Mengubah repetisi padat menjadi serangan sihir beruntun yang efektif menembus pertahanan armor bos lantai.",
  },
];

const getDungeonTiers = (lang: Lang): DungeonTierInfo[] => [
  {
    floorRange: lang === "en" ? "Floors 1 - 5" : "Lantai 1 - 5",
    name: "Crypt of the Ogre",
    boss: lang === "en" ? "Ogre King (Floor 5 Boss)" : "Ogre King (Bos Lantai 5)",
    bossSprite: "ogre",
    bossHp: "12,000 HP",
    dailyDamage: lang === "en" ? "10 - 25 HP / day" : "10 - 25 HP / hari",
    loot: "Rusty Blades, Leather Armor & Iron Shield",
    note:
      lang === "en"
        ? "The entry proving ground to build your gym consistency. Slay 4 accompanying dungeon mobs across floors 1–4 before withstanding the Ogre King's club on floor 5."
        : "Zona permulaan untuk membangun konsistensi latihan gym. Kalahkan 4 mob pendamping di lantai 1–4 sebelum menghadapi tebasan gada Ogre King di lantai 5.",
    mobs: [
      { floor: lang === "en" ? "Floor 1" : "Lantai 1", name: "Imp", sprite: "imp", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 2" : "Lantai 2", name: "Swampy", sprite: "swampy", anim: "anim" },
      { floor: lang === "en" ? "Floor 3" : "Lantai 3", name: "Goblin", sprite: "goblin", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 4" : "Lantai 4", name: "Skeleton", sprite: "skelet", anim: "idle_anim" },
    ],
  },
  {
    floorRange: lang === "en" ? "Floors 6 - 10" : "Lantai 6 - 10",
    name: "Catacombs of the Undead",
    boss: lang === "en" ? "Undead Giant (Floor 10 Boss)" : "Undead Giant (Bos Lantai 10)",
    bossSprite: "big_zombie",
    bossHp: "30,000 HP",
    dailyDamage: lang === "en" ? "30 - 65 HP / day" : "30 - 65 HP / hari",
    loot: "Heavy Halberd, Chainmail & Ring of Endurance",
    note:
      lang === "en"
        ? "Enemies strike back with fiercer daily retaliation. Training consistently 3–4 days per week keeps your hero energized and your health pool fully topped off."
        : "Monster mulai memberikan serangan balasan yang lebih agresif. Disiplin latihan rutin 3–4 kali seminggu akan menjaga heromu selalu prima dan darahnya penuh.",
    mobs: [
      { floor: lang === "en" ? "Floor 6" : "Lantai 6", name: "Masked Orc", sprite: "masked_orc", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 7" : "Lantai 7", name: "Poison Slug", sprite: "slug", anim: "anim" },
      { floor: lang === "en" ? "Floor 8" : "Lantai 8", name: "Tiny Zombie", sprite: "tiny_zombie", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 9" : "Lantai 9", name: "Muddy", sprite: "muddy", anim: "anim" },
    ],
  },
  {
    floorRange: lang === "en" ? "Floors 11 - 15" : "Lantai 11 - 15",
    name: "Infernal Bastion",
    boss: lang === "en" ? "Demon Lord (Floor 15 Boss)" : "Demon Lord (Bos Lantai 15)",
    bossSprite: "big_demon",
    bossHp: "65,000 HP",
    dailyDamage: lang === "en" ? "75 - 120 HP / day" : "75 - 120 HP / hari",
    loot: "Mithril Armor, Dragon Slayer Axe & Flame Relic",
    note:
      lang === "en"
        ? "Difficulty spikes sharply with massive boss HP pools. Steady progressive overload and party raid coordination are essential to topple the Demon Lord."
        : "Tingkat kesulitan meningkat tajam dengan HP bos yang tebal. Diperlukan progres beban latihan atau kerja sama raid party agar bos lantai 15 bisa ditaklukkan.",
    mobs: [
      { floor: lang === "en" ? "Floor 11" : "Lantai 11", name: "Dark Necromancer", sprite: "necromancer", anim: "anim" },
      { floor: lang === "en" ? "Floor 12" : "Lantai 12", name: "Pumpkin Dude", sprite: "pumpkin_dude", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 13" : "Lantai 13", name: "Orc Warrior", sprite: "orc_warrior", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 14" : "Lantai 14", name: "Wogol", sprite: "wogol", anim: "idle_anim" },
    ],
  },
  {
    floorRange: lang === "en" ? "Floors 16 - 20" : "Lantai 16 - 20",
    name: "Abyssal Throne",
    boss: lang === "en" ? "Abyssal Overlord (Floor 20 Boss)" : "Abyssal Overlord (Bos Lantai 20)",
    bossSprite: "big_demon",
    bossHp: "125,000 HP",
    dailyDamage: lang === "en" ? "150 - 250 HP / day" : "150 - 250 HP / hari",
    loot: "Excalibur, Mythic Relic & Abyssal Crown",
    note:
      lang === "en"
        ? "The ultimate summit for elite lifters. Overcome relentless demonic waves and an apocalyptic overlord to claim legendary artifacts and undisputed glory."
        : "Puncak tantangan tertinggi bagi lifter sejati. Hadapi kawanan monster kegelapan dan bos berkekuatan dahsyat untuk merebut gelar penguasa dungeon dan gear legendaris.",
    mobs: [
      { floor: lang === "en" ? "Floor 16" : "Lantai 16", name: "Chort Fiend", sprite: "chort", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 17" : "Lantai 17", name: "Ice Zombie", sprite: "ice_zombie", anim: "anim" },
      { floor: lang === "en" ? "Floor 18" : "Lantai 18", name: "Orc Shaman", sprite: "orc_shaman", anim: "idle_anim" },
      { floor: lang === "en" ? "Floor 19" : "Lantai 19", name: "Shadow Lich", sprite: "necromancer", anim: "anim" },
    ],
  },
];

const getFaqItems = (lang: Lang) =>
  lang === "en"
    ? [
        {
          q: "What is IronPixels?",
          a: "IronPixels is a gamified 16-bit retro RPG fitness tracker. Every rep and kilo you lift in the gym transforms into attack power to defeat dungeon bosses, forge rare gear, and complete co-op raids with friends.",
        },
        {
          q: "How does the Real Volume Score (RVS) damage calculation work?",
          a: "RVS is calculated with a precise formula: Lifted Weight (kg) × Reps × Bodyweight Ratio (% BW) × Exercise Multiplier. Heavy compound movements like Squats and Deadlifts grant higher multipliers than isolation work, creating a balanced and fair playing field across all bodyweight classes.",
        },
        {
          q: "Does logging a workout restore my hero's health (HP)?",
          a: "Yes! Completing any logged gym session instantly restores 100% of your hero's HP and wipes out daily boss absence damage penalties. As long as you stay active, your hero stays battle-ready.",
        },
        {
          q: "Is there any pay-to-win mechanism using real money?",
          a: "Zero pay-to-win. IronPixels is 100% free to play and upholds strict athletic fair play. All gold, loot chests, weapons, and blacksmith upgrades are earned purely from your sweat and iron in the real world.",
        },
        {
          q: "How do Co-Op Dungeon Raids with friends work?",
          a: "You can create or join a Party (guild) in the Social tab. When you or any guildmate completes a gym workout, the resulting training volume cuts into the shared floor boss's HP in real time via WebSockets.",
        },
        {
          q: "What happens if I take a Rest Day?",
          a: "Rest days are vital for muscular hypertrophy and recovery. Daily boss penalties in the dungeon do not wipe out your hero over 1–2 rest days. Take your rest days with peace of mind—your hero will fully recover upon your next logged session.",
        },
      ]
    : [
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
  const [lang, setLang] = useState<Lang>("en");
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

  // Initialize lang from localStorage if available
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("ironpixels_about_lang") as Lang | null;
      if (savedLang === "en" || savedLang === "id") {
        setLang(savedLang);
      }
    } catch {
      // localStorage may be disabled
    }
  }, []);

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    try {
      localStorage.setItem("ironpixels_about_lang", newLang);
    } catch {
      // localStorage may be disabled
    }
  };

  const t = DICT[lang];
  const heroClasses = getHeroClasses(lang);
  const dungeonTiers = getDungeonTiers(lang);
  const faqItems = getFaqItems(lang);

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

    const logEntry = t.logDamage(currentExercise.name, simWeight, simReps, finalDamage, isCrit);
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

  const activeHeroClass = heroClasses[selectedClassIndex] || heroClasses[0];
  const activeDungeonTier = dungeonTiers[selectedTierIndex] || dungeonTiers[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col font-sans selection:bg-[#00ff41] selection:text-black relative overflow-x-hidden">
      {/* Subtle CRT Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#48484A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-black border border-[#00ff41] p-0.5 shadow-[0_0_10px_rgba(0,255,65,0.3)] flex items-center justify-center">
              <img
                src="/icon.png"
                alt="IronPixels Logo"
                className="w-full h-full object-contain pixelated"
                style={{ imageRendering: "pixelated" }}
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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-zinc-400">
            <a href="#cerita" className="hover:text-white transition-colors">
              {t.navAbout}
            </a>
            <a href="#hukum-besi" className="hover:text-white transition-colors">
              {t.navRvs}
            </a>
            <a
              href="#simulator"
              className="hover:text-[#00ff41] transition-colors flex items-center gap-1.5 text-white font-bold"
            >
              <Flame className="w-3.5 h-3.5 text-[#00ff41]" />
              {t.navSimulator}
            </a>
            <a href="#codex" className="hover:text-white transition-colors">
              {t.navCodex}
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              {t.navFaq}
            </a>
            <a href="#arsitektur" className="hover:text-white transition-colors">
              {t.navTech}
            </a>
          </nav>

          {/* Right Action Bar: Language Toggle + CTA Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Top-Right Retro 16-Bit Language Switcher [ EN | ID ] */}
            <div
              className="flex items-center border border-[#48484A] bg-[#141416] p-0.5 font-mono text-[11px] select-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              role="group"
              aria-label="Language Selector"
            >
              <button
                type="button"
                onClick={() => handleSetLang("en")}
                className={`px-2 sm:px-2.5 py-1 font-bold transition-all ${
                  lang === "en"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Switch to English"
                aria-pressed={lang === "en"}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleSetLang("id")}
                className={`px-2 sm:px-2.5 py-1 font-bold transition-all ${
                  lang === "id"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Ganti ke Bahasa Indonesia"
                aria-pressed={lang === "id"}
              >
                ID
              </button>
            </div>

            {/* Desktop Auth CTAs */}
            <div className="hidden sm:flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-3.5 py-2 border border-[#48484A] bg-[#1C1C1E] hover:border-zinc-300 font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-white transition-all"
              >
                {t.login}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 border border-[#00ff41] bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,65,0.35)] transition-all flex items-center gap-1.5"
              >
                <span>{t.register}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white border border-[#48484A] bg-[#1C1C1E]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#131313] border-b border-[#48484A] px-4 py-4 space-y-3 font-mono text-xs uppercase">
            {/* Language Selector in Mobile Menu */}
            <div className="flex items-center justify-between pb-3 border-b border-[#48484A]">
              <span className="text-zinc-400 text-[11px] font-bold">LANGUAGE / BAHASA:</span>
              <div className="flex items-center border border-[#48484A] bg-[#141416] p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSetLang("en")}
                  className={`px-3 py-1 font-bold ${
                    lang === "en" ? "bg-[#00ff41] text-black shadow-neon" : "text-zinc-400"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLang("id")}
                  className={`px-3 py-1 font-bold ${
                    lang === "id" ? "bg-[#00ff41] text-black shadow-neon" : "text-zinc-400"
                  }`}
                >
                  ID
                </button>
              </div>
            </div>

            <a
              href="#cerita"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              {t.navAbout}
            </a>
            <a
              href="#hukum-besi"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              {t.navRvs}
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-[#00ff41] font-bold"
            >
              ⚡ {t.navSimulator}
            </a>
            <a
              href="#codex"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              {t.navCodex}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              {t.navFaq}
            </a>
            <a
              href="#arsitektur"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#00ff41]"
            >
              {t.navTech}
            </a>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 border border-[#48484A] bg-[#1C1C1E] text-white font-mono text-xs"
              >
                {t.login}
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 bg-[#00ff41] text-black font-mono font-bold text-xs shadow-neon"
              >
                {t.register}
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
            <span>{t.heroTagline}</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white leading-[1.08]">
            {t.heroHeadline}
          </h1>

          {/* Subtitle */}
          <p className="font-body text-base sm:text-lg md:text-xl text-zinc-300 max-w-3xl leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 stroke-[2.5]" />
              <span>{t.registerFreeFull}</span>
            </Link>

            <a
              href="#simulator"
              className="px-6 py-4 border border-[#48484A] bg-[#1C1C1E] hover:border-[#00ff41] text-zinc-200 hover:text-white font-mono text-sm uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-[#00ff41]" />
              <span>{t.trySimulator}</span>
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
              <span className="text-zinc-200 font-bold ml-2">{t.arenaLive}</span>
            </div>
            <div className="text-[#00ff41] font-bold">{t.raidActive}</div>
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
                  showNameTag={t.hero1Tag}
                  nameTagPosition="top"
                />
                <HeroSprite
                  currentState="idle"
                  characterClass="elf"
                  gender="f"
                  scale={1.6}
                  weaponIcon="/assets/items/weapons/03.png"
                  showNameTag={t.hero2Tag}
                  nameTagPosition="top"
                />
                <HeroSprite
                  currentState="idle"
                  characterClass="wizzard"
                  gender="m"
                  scale={1.6}
                  weaponIcon="/assets/items/weapons/07.png"
                  showNameTag={t.hero3Tag}
                  nameTagPosition="top"
                />
              </div>

              {/* Right: Boss */}
              <div className="pointer-events-auto z-10 flex flex-col items-center justify-end">
                <div className="mb-2 flex flex-col items-center">
                  <span className="font-headline font-black text-[9px] text-red-400 tracking-wider bg-black/90 px-1.5 py-0.5 border border-red-500/80 mb-1">
                    {t.bossNameTag}
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

      {/* STORY SECTION */}
      <section id="cerita" className="py-20 border-t border-[#48484A] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: The Story */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white leading-tight">
                {t.storyHeading}
              </h2>
              <div className="font-body text-zinc-300 space-y-4 text-base leading-relaxed">
                <p>{t.storyP1}</p>
                <p>{t.storyP2}</p>
              </div>

              <div className="p-4 border-l-2 border-[#00ff41] bg-[#1C1C1E] font-mono text-xs text-zinc-300 space-y-1">
                <div className="text-[#00ff41] font-bold">{t.fairPlayTitle}</div>
                <div>{t.fairPlayDesc}</div>
              </div>
            </div>

            {/* Right Column: 3 Core Pillars */}
            <div id="hukum-besi" className="lg:col-span-6 space-y-4 font-mono">
              <div className="border border-[#48484A] bg-[#131313] p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-black border border-[#00ff41] text-[#00ff41] font-black text-sm flex items-center justify-center">
                    I
                  </span>
                  <h3 className="font-headline font-bold text-lg text-white">{t.pillar1Title}</h3>
                </div>
                <p className="font-body text-sm text-zinc-400 pl-11">{t.pillar1Desc}</p>
              </div>

              <div className="border border-[#48484A] bg-[#131313] p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-black border border-red-500 text-red-400 font-black text-sm flex items-center justify-center">
                    II
                  </span>
                  <h3 className="font-headline font-bold text-lg text-white">{t.pillar2Title}</h3>
                </div>
                <p className="font-body text-sm text-zinc-400 pl-11">{t.pillar2Desc}</p>
              </div>

              <div className="border border-[#48484A] bg-[#131313] p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-black border border-purple-500 text-purple-400 font-black text-sm flex items-center justify-center">
                    III
                  </span>
                  <h3 className="font-headline font-bold text-lg text-white">{t.pillar3Title}</h3>
                </div>
                <p className="font-body text-sm text-zinc-400 pl-11">{t.pillar3Desc}</p>
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
              {t.simHeading}
            </h2>
            <p className="font-body text-zinc-300 text-base">{t.simSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Left Console: Simulator Controls */}
            <div className="lg:col-span-5 bg-[#131313] border-2 border-[#48484A] p-6 space-y-5 font-mono shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-[#48484A] pb-3">
                <span className="text-xs uppercase text-zinc-300 font-bold">{t.simConsoleTitle}</span>
                <button
                  onClick={handleToggleSound}
                  className={`px-2.5 py-1 border text-xs flex items-center gap-1.5 transition-colors ${
                    isMuted
                      ? "border-red-900 bg-red-950/40 text-red-400"
                      : "border-[#48484A] bg-black text-[#00ff41]"
                  }`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isMuted ? t.sfxMuted : t.sfxOn}</span>
                </button>
              </div>

              {/* Movement Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 uppercase font-bold">{t.exerciseLabel}</label>
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
                  <span className="text-zinc-400 font-bold uppercase">{t.weightLabel}</span>
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
                  <span className="text-zinc-400 font-bold uppercase">{t.repsLabel}</span>
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
                  <span className="text-zinc-400 font-bold uppercase">{t.bwLabel}</span>
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
                  <span>{t.totalVolume}</span>
                  <span className="text-white font-bold">{totalVolume.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t.bwRatio}</span>
                  <span className="text-white font-bold">{(bodyweightRatio * 100).toFixed(0)}% BB</span>
                </div>
                <div className="flex justify-between border-t border-[#48484A] pt-2 text-[#00ff41]">
                  <span className="font-bold">{t.estDamage}</span>
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
                <span>{isAttacking ? t.striking : t.strikeNow}</span>
              </button>
            </div>

            {/* Right Screen: Authentic Arcade Screen */}
            <div className="lg:col-span-7 bg-[#101015] border-2 border-[#48484A] p-6 flex flex-col justify-between min-h-[460px] relative shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-[#48484A] pb-3 font-mono text-xs">
                <span className="text-zinc-300 font-bold">{t.arenaMonitor}</span>
                <button
                  onClick={handleResetMonster}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.resetBossHp}</span>
                </button>
              </div>

              {/* Boss Status Bar */}
              <div className="mt-4 space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-bold uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>{t.bossTargetTag}</span>
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
                        showNameTag={t.youLifterTag}
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
                        {t.critHit}
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
                  <div className="text-zinc-500 leading-tight">{t.readyCombat}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CODEX HERO & DUNGEON BESTIARY */}
      <section id="codex" className="py-20 border-t border-[#48484A] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <h2 className="font-headline font-black text-3xl sm:text-4xl uppercase text-white">
              {t.codexHeading}
            </h2>
            <p className="font-body text-zinc-300 text-base">{t.codexSubtitle}</p>

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
                {t.tabClasses}
              </button>
              <button
                onClick={() => setActiveCodexTab("dungeons")}
                className={`px-4 py-2 uppercase font-bold transition-all ${
                  activeCodexTab === "dungeons"
                    ? "bg-[#00ff41] text-black shadow-neon"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t.tabDungeons}
              </button>
            </div>
          </div>

          {/* Tab 1: Hero Classes Codex (3 Classes) */}
          {activeCodexTab === "classes" && (
            <div className="max-w-4xl mx-auto border border-[#48484A] bg-[#131313] p-6 sm:p-8">
              {/* Class Selector Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8 font-mono text-xs">
                {heroClasses.map((cls, idx) => (
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
                      <img
                        src={cls.icon}
                        alt={cls.name}
                        className="w-full h-full object-contain pixelated"
                        style={{ imageRendering: "pixelated" }}
                      />
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
                    <img
                      src={activeHeroClass.icon}
                      alt={activeHeroClass.name}
                      className="w-full h-full object-contain pixelated"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-xl text-white">{activeHeroClass.name}</h3>
                    <div className="text-xs font-mono text-[#00ff41] font-bold">{activeHeroClass.role}</div>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">{t.statFocus}</div>
                    <div className="text-white text-sm font-bold">{activeHeroClass.stat}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">{t.favLifts}</div>
                    <div className="text-amber-400 text-sm font-bold">{activeHeroClass.favLift}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">{t.gameSpec}</div>
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
                {dungeonTiers.map((tier, idx) => (
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
                      {activeDungeonTier.floorRange} // {t.mainChallenge}
                    </div>
                    <h3 className="font-headline font-black text-xl text-white mt-1">{activeDungeonTier.boss}</h3>
                    <div className="text-xs font-mono text-zinc-400">{activeDungeonTier.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full font-mono text-xs pt-1">
                    <div className="p-2.5 bg-black border border-[#48484A] text-left">
                      <div className="text-[10px] text-zinc-400 font-bold">{t.bossHpLabel}</div>
                      <div className="text-white text-xs font-bold mt-0.5">{activeDungeonTier.bossHp}</div>
                    </div>
                    <div className="p-2.5 bg-black border border-[#48484A] text-left">
                      <div className="text-[10px] text-zinc-400 font-bold">{t.absencePenalty}</div>
                      <div className="text-red-400 text-xs font-bold mt-0.5">{activeDungeonTier.dailyDamage}</div>
                    </div>
                  </div>
                </div>

                {/* Right: Mobs Pendamping & Strategy Notes */}
                <div className="lg:col-span-7 space-y-5 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="text-zinc-400 font-bold uppercase flex items-center justify-between">
                      <span>{t.companionMobs}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">{t.defeatBefore}</span>
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
                    <div className="text-zinc-400 font-bold uppercase">{t.lootDrops}</div>
                    <div className="text-amber-400 text-sm font-bold">{activeDungeonTier.loot}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">{t.stratNotes}</div>
                    <p className="font-body text-zinc-300 text-sm leading-relaxed">{activeDungeonTier.note}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ARCHITECTURE & CREATOR PROFILE */}
      <section id="arsitektur" className="py-20 border-t border-[#48484A] bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="border border-[#48484A] bg-[#131313] p-8 sm:p-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-black border-2 border-[#00ff41] p-1 shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                  <img
                    src="/icon.png"
                    alt="Almakius Felix Bariq Hekopung"
                    className="w-full h-full object-cover pixelated"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-white">Almakius Felix Bariq Hekopung</h3>
                  <p className="font-mono text-xs text-[#00ff41] font-bold">{t.creatorTitle}</p>
                </div>
                <a
                  href="https://portfolio-felix-bariq.vercel.app"
                  target="_blank"
                  rel="author noopener noreferrer"
                  className="px-3.5 py-1.5 border border-[#48484A] bg-black hover:border-[#00ff41] text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00ff41]" />
                  <span>{t.portfolioLink}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>

              <div className="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-[#48484A] md:pl-8 pt-6 md:pt-0">
                <h4 className="font-headline font-black text-2xl text-white">{t.techHeading}</h4>
                <p className="font-body text-zinc-300 text-sm leading-relaxed">{t.techDesc}</p>

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
                    <span>{t.repoLabel}</span>
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
              {t.faqHeading}
            </h2>
            <p className="font-body text-zinc-300 text-base">{t.faqSubtitle}</p>
          </div>

          <div className="space-y-3 font-mono">
            {faqItems.map((item, index) => {
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
            <img
              src="/icon.png"
              alt="IronPixels"
              className="w-full h-full object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <h2 className="font-headline font-black text-3xl sm:text-5xl uppercase text-white leading-tight">
            {t.ctaHeading}
          </h2>

          <p className="font-body text-zinc-300 text-base max-w-xl mx-auto leading-relaxed">
            {t.ctaSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,255,65,0.4)] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 stroke-[2.5]" />
              <span>{t.ctaRegister}</span>
            </Link>

            <Link
              href="/login"
              className="px-6 py-4 border border-[#48484A] bg-[#1C1C1E] hover:border-zinc-300 text-zinc-200 hover:text-white font-mono text-sm uppercase tracking-wider transition-all"
            >
              {t.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* PUBLIC FOOTER */}
      <footer className="border-t border-[#48484A] bg-[#0A0A0A] py-12 font-mono text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-black border border-[#00ff41] p-0.5">
              <img
                src="/icon.png"
                alt="IronPixels"
                className="w-full h-full object-contain pixelated"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div>
              <span className="text-zinc-300 font-bold">IRONPIXELS</span> &copy; 2026. {t.footerCopy}
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
              {t.login}
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              {t.register}
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-zinc-900 text-center text-[10px] text-zinc-600">
          {t.footerNote}
        </div>
      </footer>
    </div>
  );
}
