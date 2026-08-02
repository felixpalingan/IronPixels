"use client";

import { useState } from "react";
import { Scale, Shield, Swords, Sparkles, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatRadarChart } from "@/components/StatRadarChart";

type CharacterClass = "WARRIOR" | "ROGUE" | "CYBER KNIGHT";

interface ClassDetail {
  name: CharacterClass;
  title: string;
  description: string;
  stats: { str: number; agi: number; vit: number; luk: number };
  badgeColor: string;
}

const CHARACTER_CLASSES: ClassDetail[] = [
  {
    name: "WARRIOR",
    title: "IRON WARRIOR",
    description: "Specialized in heavy bench press and squats. High STR & VIT.",
    stats: { str: 90, agi: 50, vit: 85, luk: 45 },
    badgeColor: "border-health-red text-health-red bg-health-red/10",
  },
  {
    name: "ROGUE",
    title: "SHADOW ROGUE",
    description: "Specialized in high agility movements & curls. High AGI & LUK.",
    stats: { str: 60, agi: 95, vit: 45, luk: 85 },
    badgeColor: "border-pixel-green text-pixel-green bg-pixel-green/10",
  },
  {
    name: "CYBER KNIGHT",
    title: "CYBER KNIGHT",
    description: "Balanced warrior with versatile stamina and all-around strength.",
    stats: { str: 75, agi: 75, vit: 70, luk: 70 },
    badgeColor: "border-exp-blue text-exp-blue bg-exp-blue/10",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [weightKg, setWeightKg] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("WARRIOR");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeClassDetail = CHARACTER_CLASSES.find((c) => c.name === selectedClass)!;

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightKg);
    if (isNaN(val) || val <= 0) {
      setErrorMsg("Please enter a valid positive body weight (e.g. 70.5 kg).");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleCompleteOnboarding = async () => {
    const val = parseFloat(weightKg);
    if (isNaN(val) || val <= 0) {
      setErrorMsg("Body weight must be a positive number.");
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

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to complete onboarding.");
        setLoading(false);
      } else {
        document.cookie = "ironpixels_onboarded=true; path=/; max-age=31536000";
        window.location.href = "/";
      }
    } catch (err) {
      setErrorMsg("An error occurred during onboarding.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4 selection:bg-pixel-green selection:text-black">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img
              src="/icon.png"
              alt="IronPixels Logo"
              className="w-10 h-10 object-contain border border-pixel-green shadow-neon bg-black p-0.5"
            />
            <span className="font-headline font-extrabold text-2xl text-pixel-green tracking-wider uppercase">
              IRONPIXELS
            </span>
          </div>
          <h1 className="font-headline font-extrabold text-xl text-white uppercase tracking-wider">
            HERO INITIALIZATION WIZARD
          </h1>
          <p className="font-mono text-xs text-gray-400">
            STEP {step} OF 2: {step === 1 ? "BODY WEIGHT VALIDATION" : "SELECT YOUR CHARACTER CLASS"}
          </p>
        </div>

        <div className="w-full bg-black border border-pixel-border h-2 relative overflow-hidden">
          <motion.div
            className="bg-pixel-green h-full shadow-neon"
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {errorMsg && (
          <div className="border border-health-red bg-health-red/10 p-3 text-health-red font-mono text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              onSubmit={handleStep1Next}
              className="border-2 border-pixel-border bg-surface p-6 sm:p-8 space-y-6 shadow-neon"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-pixel-green">
                  <Scale className="w-5 h-5" />
                  <h2 className="font-headline font-bold text-base uppercase tracking-wider text-white">
                    BODY WEIGHT REGISTRATION
                  </h2>
                </div>
                <p className="font-mono text-xs text-gray-400">
                  Your body weight is required for the RVS (Relative Volume Score) server calculation engine to guarantee fair RPG damage output.
                </p>
              </div>

              <div className="space-y-2 font-mono">
                <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  CURRENT BODY WEIGHT (KG)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="300"
                    required
                    placeholder="75.0"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-black border border-pixel-border px-4 py-3 text-lg font-bold text-pixel-green focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all"
                  />
                  <span className="absolute right-4 font-mono font-bold text-sm text-gray-400">
                    KG
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 border border-pixel-green bg-pixel-green text-black font-headline font-extrabold text-sm uppercase tracking-wider hover:bg-pixel-green/90 transition-all shadow-neon flex items-center justify-center gap-2"
              >
                <span>NEXT: SELECT CLASS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="border-2 border-pixel-border bg-surface p-6 sm:p-8 space-y-6 shadow-neon"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pixel-green">
                    <Swords className="w-5 h-5" />
                    <h2 className="font-headline font-bold text-base uppercase tracking-wider text-white">
                      CLASS SELECTION
                    </h2>
                  </div>

                  <span className="font-mono text-xs text-pixel-green font-bold bg-black border border-pixel-border px-2 py-1">
                    WEIGHT: {weightKg} KG
                  </span>
                </div>
                <p className="font-mono text-xs text-gray-400">
                  Select your RPG class to calibrate your initial base attributes.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CHARACTER_CLASSES.map((cls) => {
                  const isSelected = selectedClass === cls.name;
                  return (
                    <button
                      key={cls.name}
                      onClick={() => setSelectedClass(cls.name)}
                      className={`p-3 border text-center transition-all flex flex-col items-center justify-between ${
                        isSelected
                          ? "border-pixel-green bg-pixel-green/20 text-white shadow-neon"
                          : "border-pixel-border bg-black/60 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="font-headline font-extrabold text-xs uppercase tracking-wider mb-1">
                        {cls.name}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-pixel-green mt-1" />
                      ) : (
                        <Zap className="w-4 h-4 text-gray-600 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border border-pixel-border bg-black p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-sm text-white uppercase">
                    {activeClassDetail.title}
                  </span>
                  <span className={`px-2 py-0.5 border font-mono text-[10px] font-bold uppercase ${activeClassDetail.badgeColor}`}>
                    {activeClassDetail.name}
                  </span>
                </div>
                <p className="font-mono text-xs text-gray-400">
                  {activeClassDetail.description}
                </p>

                <div className="border border-pixel-border/60 bg-surface/50 p-2">
                  <StatRadarChart stats={activeClassDetail.stats} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 border border-pixel-border bg-black text-gray-300 font-mono font-bold text-xs uppercase hover:text-white transition-colors"
                >
                  BACK
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteOnboarding}
                  className="w-2/3 py-3 border border-pixel-green bg-pixel-green text-black font-headline font-extrabold text-sm uppercase tracking-wider hover:bg-pixel-green/90 transition-all shadow-neon flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>INITIALIZING...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>START GAINS JOURNEY</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
