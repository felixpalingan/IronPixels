"use client";

import { useState, useEffect } from "react";
import {
  LogOut,
  X,
  Shield,
  User,
  Scale,
  Swords,
  Volume2,
  VolumeX,
  Lock,
  Mail,
  RefreshCw,
  Check,
  AlertCircle,
  Copy,
  Smartphone,
  Sliders,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { clearClientSession } from "@/lib/clientSession";
import { soundEngine } from "@/lib/soundEffects";

export interface SettingsUserData {
  user_id: string;
  username: string;
  character_class: string;
  gender?: "m" | "f";
  weight_kg: number;
  weight_unit?: "kg" | "lbs";
  level?: number;
  max_floor?: number;
  workout_streak?: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: SettingsUserData;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onProfileUpdated?: (updated: any) => void;
}

type SettingsTab = "profile" | "system" | "security" | "sync";

export function SettingsModal({
  isOpen,
  onClose,
  userData,
  isMuted = false,
  onToggleMute,
  onProfileUpdated,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Profile Form State
  const [usernameInput, setUsernameInput] = useState(userData?.username || "");
  const [weightInput, setWeightInput] = useState<number>(userData?.weight_kg || 75);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(userData?.weight_unit || "kg");
  const [genderInput, setGenderInput] = useState<"m" | "f">(userData?.gender || "m");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // System & FX State
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => soundEngine.getIsHapticsEnabled());
  const [testAudioNotice, setTestAudioNotice] = useState<string | null>(null);

  // Security State
  const [userEmail, setUserEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync State
  const [syncingData, setSyncingData] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Sync initial props whenever modal opens or userData changes
  useEffect(() => {
    if (isOpen && userData) {
      setUsernameInput(userData.username || "");
      setWeightInput(userData.weight_kg || 75);
      setWeightUnit(userData.weight_unit || "kg");
      setGenderInput(userData.gender || "m");
      setProfileFeedback(null);
      setPasswordFeedback(null);
      setSyncFeedback(null);

      // Fetch authenticated user email
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setUserEmail(user.email);
        }
      });
    }
  }, [isOpen, userData]);

  const handleTabChange = (tab: SettingsTab) => {
    soundEngine.play("select");
    setActiveTab(tab);
    setProfileFeedback(null);
    setPasswordFeedback(null);
    setSyncFeedback(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);
    soundEngine.play("select");

    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setProfileFeedback({ type: "error", text: "Codename must be at least 2 characters" });
      setSavingProfile(false);
      return;
    }

    if (weightInput < 20 || weightInput > 350) {
      setProfileFeedback({ type: "error", text: "Weight must be between 20 and 350 kg" });
      setSavingProfile(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmed,
          weight_kg: weightInput,
          weight_unit: weightUnit,
          gender: genderInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileFeedback({ type: "success", text: "OPERATIVE PROFILE SAVED & SYNCED" });
      soundEngine.play("chest");

      if (onProfileUpdated) {
        onProfileUpdated({
          username: trimmed,
          weight_kg: weightInput,
          weight_unit: weightUnit,
          gender: genderInput,
        });
      }
    } catch (err: any) {
      setProfileFeedback({ type: "error", text: err.message || "Failed to save profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleHaptic = () => {
    const nextVal = soundEngine.toggleHaptics();
    setHapticsEnabled(nextVal);
    if (nextVal) {
      soundEngine.triggerHaptic([50, 40, 50]);
    }
  };

  const handleTestSound = () => {
    soundEngine.play("select");
    setTestAudioNotice("SFX Triggered!");
    setTimeout(() => setTestAudioNotice(null), 1500);
  };

  const handleTestHaptic = () => {
    soundEngine.triggerHaptic([80, 50, 80]);
    setTestAudioNotice("Haptic Pulse Sent!");
    setTimeout(() => setTestAudioNotice(null), 1500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    soundEngine.play("select");

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", text: "Password confirmation does not match" });
      return;
    }

    setUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordFeedback({ type: "success", text: "GUILD PASSKEY UPDATED SUCCESSFULLY" });
      setNewPassword("");
      setConfirmPassword("");
      soundEngine.play("chest");
    } catch (err: any) {
      setPasswordFeedback({ type: "error", text: err.message || "Failed to update passkey" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleForceCloudSync = async () => {
    setSyncingData(true);
    setSyncFeedback(null);
    soundEngine.play("select");

    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const freshProfile = await res.json();
        localStorage.setItem("ironpixels_profile", JSON.stringify(freshProfile));
        if (onProfileUpdated) {
          onProfileUpdated(freshProfile);
        }
        setSyncFeedback("GUILD PROFILE & STATS RE-SYNCED");
        soundEngine.play("chest");
      } else {
        setSyncFeedback("Sync failed: Server error");
      }
    } catch (err) {
      setSyncFeedback("Sync failed: Network timeout");
    } finally {
      setSyncingData(false);
    }
  };

  const handleCopyUserId = () => {
    if (userData?.user_id) {
      navigator.clipboard.writeText(userData.user_id);
      setCopiedId(true);
      soundEngine.play("select");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    soundEngine.play("select");
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearClientSession();
      window.location.href = "/login";
    } catch (err) {
      clearClientSession();
      window.location.href = "/login";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 selection:bg-[#00ff41] selection:text-black"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md border-2 border-zinc-800 bg-[#141416] p-4 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative font-mono text-zinc-200 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00ff41]" />
                <div>
                  <h2 className="font-headline font-extrabold text-sm sm:text-base tracking-wider text-white uppercase">
                    GUILD HQ // ACCOUNT SETTINGS
                  </h2>
                  <p className="text-[10px] text-zinc-500 tracking-wider">
                    OPERATIVE PREFERENCES & CREDENTIALS
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.play("select");
                  onClose();
                }}
                className="p-1.5 border border-zinc-800 bg-black text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 mb-4 bg-black/60 p-1 border border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => handleTabChange("profile")}
                className={`py-1.5 px-1 text-center transition-all flex flex-col items-center gap-1 ${
                  activeTab === "profile"
                    ? "bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/60 shadow-neon"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>PROFILE</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("system")}
                className={`py-1.5 px-1 text-center transition-all flex flex-col items-center gap-1 ${
                  activeTab === "system"
                    ? "bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/60 shadow-neon"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>SYSTEM</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("security")}
                className={`py-1.5 px-1 text-center transition-all flex flex-col items-center gap-1 ${
                  activeTab === "security"
                    ? "bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/60 shadow-neon"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>SECURITY</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("sync")}
                className={`py-1.5 px-1 text-center transition-all flex flex-col items-center gap-1 ${
                  activeTab === "sync"
                    ? "bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/60 shadow-neon"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>SYNC</span>
              </button>
            </div>

            {/* Tab Contents (Scrollable body) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* TAB 1: OPERATIVE PROFILE */}
              {activeTab === "profile" && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Class Badge Overview */}
                  <div className="bg-[#0a0a0c] border border-zinc-800 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-zinc-900 border border-zinc-700">
                        <Swords className="w-5 h-5 text-[#00ff41]" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">SPECIALIZATION</div>
                        <div className="text-xs font-bold text-[#00ff41] uppercase tracking-wide">
                          {userData?.character_class || "WARRIOR"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div className="px-2 py-0.5 border border-zinc-700 bg-black text-[10px] text-zinc-300">
                        LVL {userData?.level || 1}
                      </div>
                      <div className="px-2 py-0.5 border border-amber-500/40 bg-amber-950/20 text-[10px] text-amber-400 font-bold">
                        F{userData?.max_floor || 1}
                      </div>
                    </div>
                  </div>

                  {/* Username Codename */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00ff41]" />
                      OPERATIVE CODENAME
                    </label>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      maxLength={25}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00ff41] transition-colors"
                      placeholder="Enter operative name..."
                    />
                  </div>

                  {/* Body Mass & Unit */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-[#00ff41]" />
                        BODY MASS & METRICS
                      </label>
                      <div className="flex border border-zinc-800 bg-black">
                        <button
                          type="button"
                          onClick={() => setWeightUnit("kg")}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                            weightUnit === "kg"
                              ? "bg-[#00ff41] text-black"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          KG
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightUnit("lbs")}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                            weightUnit === "lbs"
                              ? "bg-[#00ff41] text-black"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          LBS
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWeightInput((prev) => Math.max(20, Math.round((prev - 1) * 10) / 10))}
                        className="w-9 h-9 border border-zinc-800 bg-black hover:border-[#00ff41] text-zinc-300 font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        min="20"
                        max="350"
                        value={weightInput}
                        onChange={(e) => setWeightInput(Number(e.target.value))}
                        className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00ff41] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setWeightInput((prev) => Math.min(350, Math.round((prev + 1) * 10) / 10))}
                        className="w-9 h-9 border border-zinc-800 bg-black hover:border-[#00ff41] text-zinc-300 font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600">
                      *Affects accurate calorie expenditure and RVS combat output.
                    </p>
                  </div>

                  {/* Gender / Avatar Presentation */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
                      AVATAR LINEAGE
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGenderInput("m")}
                        className={`py-2 px-3 border text-xs font-bold text-left transition-all ${
                          genderInput === "m"
                            ? "border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41] shadow-neon"
                            : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        [M] BROTHERHOOD
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenderInput("f")}
                        className={`py-2 px-3 border text-xs font-bold text-left transition-all ${
                          genderInput === "f"
                            ? "border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41] shadow-neon"
                            : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        [F] VALKYRIE
                      </button>
                    </div>
                  </div>

                  {profileFeedback && (
                    <div
                      className={`p-2.5 border text-xs flex items-center gap-2 ${
                        profileFeedback.type === "success"
                          ? "border-[#00ff41]/60 bg-[#00ff41]/10 text-[#00ff41]"
                          : "border-red-500/60 bg-red-950/30 text-red-400"
                      }`}
                    >
                      {profileFeedback.type === "success" ? (
                        <Check className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full h-11 border border-[#00ff41] bg-[#00ff41]/20 hover:bg-[#00ff41]/30 text-[#00ff41] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-neon disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{savingProfile ? "SAVING OPERATIVE..." : "SAVE OPERATIVE PROFILE"}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: SYSTEM & AUDIO */}
              {activeTab === "system" && (
                <div className="space-y-4">
                  {/* Audio / SFX Engine */}
                  <div className="bg-[#0a0a0c] border border-zinc-800 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-red-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-[#00ff41]" />
                          )}
                          8-BIT RETRO SFX AUDIO
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Pixel combat strikes, chests, and alarms
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onToggleMute}
                        className={`px-3 py-1.5 text-xs font-bold uppercase border transition-all cursor-pointer ${
                          isMuted
                            ? "border-red-500/60 bg-red-950/40 text-red-400 hover:bg-red-900/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            : "border-[#00ff41]/60 bg-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41]/30 shadow-neon"
                        }`}
                      >
                        {isMuted ? "MUTED (OFF)" : "ACTIVE (ON)"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-400">AUDIO TEST ENGINE</span>
                      <button
                        type="button"
                        onClick={handleTestSound}
                        className="px-2.5 py-1 border border-zinc-700 bg-black hover:border-[#00ff41] text-[10px] text-zinc-300 font-bold uppercase transition-colors"
                      >
                        PLAY TEST SOUND
                      </button>
                    </div>
                  </div>

                  {/* Haptic Feedback */}
                  <div className="bg-[#0a0a0c] border border-zinc-800 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-amber-400" />
                          TACTILE HAPTIC VIBRATION
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Device vibration upon crit & hit register
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleHaptic}
                        className={`px-3 py-1.5 text-xs font-bold uppercase border transition-all cursor-pointer ${
                          !hapticsEnabled
                            ? "border-zinc-700 bg-black text-zinc-500"
                            : "border-amber-400/60 bg-amber-950/30 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                        }`}
                      >
                        {hapticsEnabled ? "ACTIVE (ON)" : "DISABLED"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-400">HAPTIC TEST PULSE</span>
                      <button
                        type="button"
                        onClick={handleTestHaptic}
                        className="px-2.5 py-1 border border-zinc-700 bg-black hover:border-amber-400 text-[10px] text-zinc-300 font-bold uppercase transition-colors"
                      >
                        TRIGGER PULSE
                      </button>
                    </div>
                  </div>

                  {/* Engine Specs */}
                  <div className="border border-zinc-800 bg-black/40 p-3 text-[10px] text-zinc-500 space-y-1">
                    <div className="text-zinc-400 font-bold uppercase">AUDIO SYNTHESIS ARCHITECTURE:</div>
                    <div>• Pixel Combat Assets + Web Audio API Oscillator Fallback</div>
                    <div>• Persisted across local sessions: ironpixels_sound_muted</div>
                  </div>

                  {testAudioNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 border border-[#00ff41]/60 bg-[#00ff41]/10 text-[#00ff41] text-xs text-center font-bold"
                    >
                      {testAudioNotice}
                    </motion.div>
                  )}

                  {/* Public Guide & About */}
                  <div className="pt-2 border-t border-zinc-800">
                    <a
                      href="/about"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 border border-zinc-700 bg-zinc-900 hover:border-[#00ff41] text-zinc-200 hover:text-white text-xs font-mono font-bold uppercase flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
                        <span>TENTANG IRONPIXELS &amp; PANDUAN PUBLIK</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: SECURITY & CREDENTIALS */}
              {activeTab === "security" && (
                <div className="space-y-4">
                  {/* Email Card */}
                  <div className="bg-[#0a0a0c] border border-zinc-800 p-3.5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      REGISTERED GUILD EMAIL
                    </span>
                    <div className="text-xs font-bold text-white break-all">
                      {userEmail || "Fetching operative email..."}
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#00ff41]" />
                        NEW GUILD PASSKEY
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00ff41] transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        CONFIRM PASSKEY
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new passkey"
                        className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00ff41] transition-colors"
                      />
                    </div>

                    {passwordFeedback && (
                      <div
                        className={`p-2.5 border text-xs flex items-center gap-2 ${
                          passwordFeedback.type === "success"
                            ? "border-[#00ff41]/60 bg-[#00ff41]/10 text-[#00ff41]"
                            : "border-red-500/60 bg-red-950/30 text-red-400"
                        }`}
                      >
                        {passwordFeedback.type === "success" ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{passwordFeedback.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={updatingPassword || !newPassword}
                      className="w-full h-11 border border-zinc-700 bg-black hover:border-[#00ff41] hover:text-[#00ff41] text-zinc-200 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      {updatingPassword ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>{updatingPassword ? "UPDATING PASSKEY..." : "UPDATE GUILD PASSKEY"}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: DATA SYNC & SESSION */}
              {activeTab === "sync" && (
                <div className="space-y-4">
                  {/* Operative UUID */}
                  <div className="bg-[#0a0a0c] border border-zinc-800 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>OPERATIVE UUID</span>
                      <button
                        type="button"
                        onClick={handleCopyUserId}
                        className="text-zinc-400 hover:text-[#00ff41] flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId ? "COPIED!" : "COPY"}</span>
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-300 break-all bg-black p-1.5 border border-zinc-900">
                      {userData?.user_id || "ANONYMOUS"}
                    </div>
                  </div>

                  {/* Cloud Re-sync */}
                  <div className="bg-[#0a0a0c] border border-zinc-800 p-3.5 space-y-2.5">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-[#00ff41]" />
                        CLOUD DATA RE-SYNCHRONIZATION
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Force-pull authoritative profile, inventory, and combat records from Supabase DB.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleForceCloudSync}
                      disabled={syncingData}
                      className="w-full py-2.5 border border-zinc-700 bg-black hover:border-[#00ff41] text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingData ? "animate-spin text-[#00ff41]" : ""}`} />
                      <span>{syncingData ? "SYNCHRONIZING..." : "FORCE CLOUD RE-SYNC"}</span>
                    </button>
                  </div>

                  {syncFeedback && (
                    <div className="p-2.5 border border-[#00ff41]/60 bg-[#00ff41]/10 text-[#00ff41] text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{syncFeedback}</span>
                    </div>
                  )}

                  {/* Logout Danger Zone */}
                  <div className="pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={handleLogout}
                      disabled={loadingLogout}
                      className="w-full h-11 border border-red-500/80 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] disabled:opacity-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{loadingLogout ? "TERMINATING SESSION..." : "TERMINATE GUILD SESSION (LOG OUT)"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="text-center text-[10px] text-zinc-600 uppercase tracking-widest pt-3 border-t border-zinc-800/60 mt-3">
              IRON PIXELS RPG // TERMINAL PROTOCOL 2026
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SettingsModal;
