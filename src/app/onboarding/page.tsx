"use client";

import { useState } from "react";
import { ArrowRight, Minus, Plus, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatRadarChart } from "@/components/StatRadarChart";

type CharacterClass = "WARRIOR" | "ROGUE" | "CYBER KNIGHT";

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
    title: "VANGUARD WARRIOR",
    roleTag: "Melee / Tank",
    description: "Heavy armor specialist with formidable physical strength & high resistance.",
    hp: 1250,
    stats: { str: 85, agi: 30, vit: 80, luk: 15 },
  },
  {
    name: "ROGUE",
    title: "SHADOW STRIKER",
    roleTag: "Agility / Burst",
    description: "Swift assassin possessing lethal critical hit chance and extreme speed.",
    hp: 950,
    stats: { str: 55, agi: 95, vit: 40, luk: 85 },
  },
  {
    name: "CYBER KNIGHT",
    title: "CYBER KNIGHT",
    description: "Balanced futuristic paladin with versatile combat adaptability.",
    roleTag: "Balanced / Versatile",
    hp: 1100,
    stats: { str: 70, agi: 70, vit: 70, luk: 70 },
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("WARRIOR");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeClassDetail = CHARACTER_CLASSES.find((c) => c.name === selectedClass)!;

  const handleStep1Next = () => {
    if (weightKg <= 0 || weightKg > 300) {
      setErrorMsg("INVALID MASS PARAMETER.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleCompleteOnboarding = async () => {
    if (weightKg <= 0 || weightKg > 300) {
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
          weight_kg: weightKg,
          character_class: selectedClass,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "FAILED TO INITIALIZE PROFILE.");
        setLoading(false);
      } else {
        document.cookie = "ironpixels_onboarded=true; path=/; max-age=31536000";
        window.location.href = "/";
      }
    } catch (err) {
      setErrorMsg("SYSTEM ONBOARDING ERROR.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 relative selection:bg-[#00ff41] selection:text-black">
      <header className="w-full max-w-md mx-auto flex items-center justify-between border-b border-zinc-800 pb-3 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-zinc-900 border border-zinc-700 p-0.5 flex items-center justify-center">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-headline font-extrabold text-base tracking-wider uppercase text-white">
            IRON PIXELS
          </span>
        </div>

        <button className="p-1.5 text-zinc-400 hover:text-white">
          <Settings className="w-4 h-4" />
        </button>
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex flex-col items-center space-y-8 text-center"
            >
              <div className="space-y-1">
                <h1 className="font-headline font-black text-2xl tracking-wider uppercase text-white">
                  SET YOUR BASE MASS
                </h1>
                <p className="font-mono text-xs text-zinc-400 tracking-widest uppercase font-bold">
                  CALIBRATION PHASE 2/3
                </p>
              </div>

              <div className="w-full max-w-xs bg-[#161618] border border-zinc-800 p-6 relative flex items-center justify-center space-x-3">
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00ff41]" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00ff41]" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00ff41]" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00ff41]" />

                <span className="font-headline font-black text-5xl text-white tracking-tight">
                  {weightKg}
                </span>
                <span className="font-mono font-bold text-lg text-zinc-400 self-end mb-1">
                  KG
                </span>
              </div>

              <div className="w-full max-w-xs flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWeightKg((prev) => Math.max(30, prev - 1))}
                  className="w-11 h-11 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-white transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="40"
                  max="160"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="flex-1 accent-[#00ff41] bg-zinc-800 h-1.5 cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setWeightKg((prev) => Math.min(200, prev + 1))}
                  className="w-11 h-11 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="w-full h-12 bg-[#c8e6c9] hover:bg-[#b9f6ca] text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,230,201,0.3)] mt-6"
              >
                <span>CONFIRM STATS</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex flex-col items-center space-y-6 text-center"
            >
              <div className="space-y-1">
                <h1 className="font-headline font-black text-2xl tracking-wider uppercase text-white">
                  CHOOSE YOUR CLASS
                </h1>
                <p className="font-mono text-xs text-zinc-400 tracking-widest uppercase font-bold">
                  SELECT YOUR COMBAT PROTOCOL
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {CHARACTER_CLASSES.map((cls) => {
                  const isSelected = selectedClass === cls.name;
                  return (
                    <button
                      key={cls.name}
                      onClick={() => setSelectedClass(cls.name)}
                      className={`p-3 border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                        isSelected
                          ? "border-[#00ff41] bg-[#00ff41]/10 text-white shadow-[0_0_15px_rgba(0,255,65,0.2)]"
                          : "border-zinc-800 bg-[#141416] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span className="font-headline font-bold text-xs uppercase">
                        {cls.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="w-full bg-[#141416] border border-zinc-800 p-5 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-black text-lg text-white uppercase">
                    {activeClassDetail.title}
                  </span>
                  <span className="bg-[#1e2e1e] text-[#00ff41] border border-[#00ff41]/40 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider">
                    {activeClassDetail.roleTag}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs border-y border-zinc-800/80 py-3">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">HP</span>
                    <span className="text-sky-400 font-bold text-sm">
                      {activeClassDetail.hp.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">STR</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {activeClassDetail.stats.str}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">AGI</span>
                    <span className="text-fuchsia-400 font-bold text-sm">
                      {activeClassDetail.stats.agi}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">LUK</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {activeClassDetail.stats.luk}
                    </span>
                  </div>
                </div>

                <div className="border border-zinc-800 bg-black/60 p-2">
                  <StatRadarChart stats={activeClassDetail.stats} />
                </div>
              </div>

              <div className="w-full flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-12 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-bold text-xs uppercase hover:text-white transition-colors"
                >
                  BACK
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteOnboarding}
                  className="w-2/3 h-12 bg-[#c8e6c9] hover:bg-[#b9f6ca] text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,230,201,0.3)] disabled:opacity-50"
                >
                  {loading ? (
                    <span>INITIALIZING...</span>
                  ) : (
                    <>
                      <span>CONFIRM SELECTION</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-md mx-auto text-center font-mono text-[10px] text-zinc-600 uppercase tracking-widest pt-2">
        IRON PIXELS RPG © 2026
      </footer>
    </div>
  );
}
