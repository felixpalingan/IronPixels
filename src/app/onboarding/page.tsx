"use client";

import { useState } from "react";
import { ArrowRight, Minus, Plus, Check, Sparkles, User, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatRadarChart } from "@/components/StatRadarChart";
import { HeroSprite } from "@/components/HeroSprite";

type CharacterClass = "WARRIOR" | "HERO" | "MAGE";
type CharacterGender = "m" | "f";

interface ClassDetail {
  name: CharacterClass;
  title: string;
  roleTag: string;
  description: string;
  hp: number;
  stats: { str: number; agi: number; vit: number; luk: number };
}

const CHARACTER_CLASSES: ClassDetail[] = [
  {
    name: "WARRIOR",
    title: "VANGUARD POWERLIFTER",
    roleTag: "Heavy Weightlifting",
    description: "Specialist in heavy compound lifts (Bench Press, Squat, & Deadlift) possessing immense strength.",
    hp: 1300,
    stats: { str: 95, agi: 30, vit: 85, luk: 40 },
  },
  {
    name: "HERO",
    title: "BALANCED HERO",
    roleTag: "Balanced All-Rounder",
    description: "Versatile all-rounder athlete possessing perfect equilibrium across all physical traits.",
    hp: 1100,
    stats: { str: 70, agi: 70, vit: 70, luk: 70 },
  },
  {
    name: "MAGE",
    title: "ARCANE ATHLETE",
    roleTag: "Cardio & Bodyweight",
    description: "Calisthenics & high-intensity cardio specialist possessing extreme endurance, speed, and agility.",
    hp: 950,
    stats: { str: 40, agi: 95, vit: 60, luk: 85 },
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [weightInputStr, setWeightInputStr] = useState<string>("75");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("WARRIOR");
  const [selectedGender, setSelectedGender] = useState<CharacterGender>("m");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeClassDetail = CHARACTER_CLASSES.find((c) => c.name === selectedClass)!;

  const handleWeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setWeightInputStr(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setWeightKg(num);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    setWeightKg(num);
    setWeightInputStr(num.toString());
  };

  const handleMinus = () => {
    const next = Math.max(30, Number((weightKg - 0.5).toFixed(1)));
    setWeightKg(next);
    setWeightInputStr(next.toString());
  };

  const handlePlus = () => {
    const next = Math.min(250, Number((weightKg + 0.5).toFixed(1)));
    setWeightKg(next);
    setWeightInputStr(next.toString());
  };

  const handleStep1Next = () => {
    const val = parseFloat(weightInputStr);
    if (isNaN(val) || val <= 0 || val > 300) {
      setErrorMsg("INVALID MASS PARAMETER. MUST BE POSITIVE.");
      return;
    }
    setWeightKg(val);
    setErrorMsg("");
    setStep(2);
  };

  const handleCompleteOnboarding = async () => {
    const val = parseFloat(weightInputStr);
    if (isNaN(val) || val <= 0 || val > 300) {
      setErrorMsg("INVALID MASS PARAMETER.");
      setStep(1);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_kg: val,
          character_class: selectedClass,
          gender: selectedGender,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "FAILED TO INITIALIZE PROFILE.");
        setLoading(false);
      } else {
        const savedProf = data.user || data.profile || {
          username: "Felix",
          character_class: selectedClass,
          gender: selectedGender,
          weight_kg: val,
        };
        savedProf.gender = selectedGender;
        savedProf.character_class = selectedClass;
        localStorage.setItem("ironpixels_profile", JSON.stringify(savedProf));
        document.cookie = "ironpixels_onboarded=true; path=/; max-age=31536000";
        window.location.href = "/";
      }
    } catch (err) {
      setErrorMsg("SYSTEM ONBOARDING ERROR.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 relative selection:bg-[#00ff41] selection:text-black font-mono">
      <header className="w-full max-w-md mx-auto flex items-center justify-between border-b border-zinc-800 pb-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-950 border border-zinc-700 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.2)] overflow-hidden">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-cover scale-125" />
          </div>
          <span className="font-headline font-black text-lg tracking-wider uppercase text-white">
            IRON PIXELS
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-[#00ff41]">
          <span>STEP {step}</span>
          <span className="text-zinc-600">/</span>
          <span>2</span>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6 space-y-6">
        {errorMsg && (
          <div className="border border-red-500/80 bg-red-950/40 p-3 text-red-400 font-mono text-xs font-bold uppercase tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="border border-zinc-800 bg-[#141416] p-6 space-y-6 shadow-2xl relative"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  CHARACTER CREATION // STEP 1
                </span>
                <h2 className="font-headline font-black text-xl text-white uppercase tracking-wider">
                  ENTER PHYSICAL BODY MASS
                </h2>
                <p className="text-xs text-zinc-400">
                  Your body weight (kg) calibrates damage formulas & Relative Volume Score.
                </p>
              </div>

              <div className="bg-black border border-zinc-800 p-6 flex flex-col items-center space-y-4 shadow-inner">
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    value={weightInputStr}
                    onChange={handleWeightInputChange}
                    className="w-32 bg-transparent border-b-2 border-[#00ff41] text-center font-headline font-black text-4xl text-white focus:outline-none"
                  />
                  <span className="font-headline font-bold text-lg text-[#00ff41]">KG</span>
                </div>

                <div className="flex items-center gap-3 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={handleMinus}
                    className="w-10 h-10 border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="0.5"
                    value={weightKg}
                    onChange={handleSliderChange}
                    className="w-full accent-[#00ff41] cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={handlePlus}
                    className="w-10 h-10 border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="w-full h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PROCEED TO CLASS SELECTION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="border border-zinc-800 bg-[#141416] p-5 space-y-5 shadow-2xl relative"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  CHARACTER CREATION // STEP 2
                </span>
                <h2 className="font-headline font-black text-xl text-white uppercase tracking-wider">
                  CHOOSE YOUR CLASS SPECIALIZATION
                </h2>
                <p className="text-xs text-zinc-400">
                  Select your training discipline & gender to preview live pixel sprite & stat radar.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  SELECT GENDER:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGender("m")}
                    className={`py-2 px-3 border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedGender === "m"
                        ? "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] shadow-[0_0_12px_rgba(0,255,65,0.3)] font-bold"
                        : "border-zinc-800 bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>♂️ MALE HERO</span>
                    {selectedGender === "m" && <Check className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGender("f")}
                    className={`py-2 px-3 border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedGender === "f"
                        ? "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] shadow-[0_0_12px_rgba(0,255,65,0.3)] font-bold"
                        : "border-zinc-800 bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>♀️ FEMALE HERO</span>
                    {selectedGender === "f" && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  SELECT TRAINING SPECIALIZATION:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CHARACTER_CLASSES.map((cls) => (
                    <button
                      key={cls.name}
                      type="button"
                      onClick={() => setSelectedClass(cls.name)}
                      className={`py-2.5 px-2 border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedClass === cls.name
                          ? "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] shadow-[0_0_12px_rgba(0,255,65,0.3)] font-bold"
                          : "border-zinc-800 bg-black text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-headline font-extrabold uppercase text-center line-clamp-1">
                        {cls.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-black border border-zinc-800 p-4 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <div className="font-headline font-black text-sm text-white uppercase">
                      {activeClassDetail.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 italic">
                      "{activeClassDetail.description}"
                    </div>
                  </div>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[#00ff41] uppercase font-bold whitespace-nowrap">
                    {activeClassDetail.roleTag}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col items-center justify-center relative overflow-hidden h-44 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 bg-radial from-[#00ff41]/10 to-transparent pointer-events-none" />
                    <div className="mb-2">
                      <HeroSprite
                        characterClass={selectedClass}
                        gender={selectedGender}
                        scale={3.2}
                        weaponIcon="/assets/items/weapons/01.png"
                      />
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest z-10 mt-1">
                      {selectedGender === "m" ? "MALE" : "FEMALE"} {activeClassDetail.title}
                    </div>
                  </div>

                  <div className="h-44 flex flex-col justify-center">
                    <StatRadarChart stats={activeClassDetail.stats} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 border border-zinc-700 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase hover:bg-zinc-800 cursor-pointer"
                >
                  BACK
                </button>

                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="w-2/3 h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "INITIALIZING HERO..." : "COMPLETE CREATION"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
