"use client";

import { useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
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
  const [weightInputStr, setWeightInputStr] = useState<string>("75");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("WARRIOR");
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "FAILED TO INITIALIZE PROFILE.");
        setLoading(false);
      } else {
        if (data.user) {
          localStorage.setItem("ironpixels_profile", JSON.stringify(data.user));
        }
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
                <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest">
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
                className="w-full h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2"
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
              className="border border-zinc-800 bg-[#141416] p-6 space-y-6 shadow-2xl relative"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-[#00ff41] font-bold uppercase tracking-widest">
                  CHARACTER CREATION // STEP 2
                </span>
                <h2 className="font-headline font-black text-xl text-white uppercase tracking-wider">
                  CHOOSE YOUR CLASS
                </h2>
                <p className="text-xs text-zinc-400">
                  Select your hero class archetype to determine base attributes & skill affinities.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CHARACTER_CLASSES.map((cls) => (
                  <button
                    key={cls.name}
                    type="button"
                    onClick={() => setSelectedClass(cls.name)}
                    className={`py-3 px-2 border flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedClass === cls.name
                        ? "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.3)] font-bold"
                        : "border-zinc-800 bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-headline font-extrabold uppercase text-center line-clamp-1">
                      {cls.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="bg-black border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-headline font-black text-sm text-white uppercase">
                    {activeClassDetail.title}
                  </span>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300 uppercase font-bold">
                    {activeClassDetail.roleTag}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 italic">
                  "{activeClassDetail.description}"
                </p>

                <div className="border-t border-zinc-800 pt-2">
                  <StatRadarChart stats={activeClassDetail.stats} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 border border-zinc-700 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase hover:bg-zinc-800"
                >
                  BACK
                </button>

                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="w-2/3 h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
