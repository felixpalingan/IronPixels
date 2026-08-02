"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Key, Mail, Eye, EyeOff, CornerDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg("ALL FIELDS ARE REQUIRED.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("ACCESS CODE MUST BE AT LEAST 6 CHARACTERS.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) {
        setErrorMsg(error.message.toUpperCase());
        setLoading(false);
      } else if (data.user) {
        window.location.href = "/onboarding";
      }
    } catch (err: any) {
      setErrorMsg("SYSTEM REGISTRATION ERROR.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#00ff41] selection:text-black">
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-zinc-700 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-zinc-700 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-zinc-700 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-zinc-700 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm flex flex-col items-center space-y-6 z-10"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-28 h-28 bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,65,0.25)] relative overflow-hidden">
            <img
              src="/icon.png"
              alt="IronPixels Logo"
              className="w-full h-full object-cover scale-110"
            />
          </div>

          <div className="text-center space-y-1">
            <h1 className="font-headline font-black text-3xl tracking-wider text-white uppercase">
              IRON PIXELS
            </h1>
            <p className="font-mono text-[11px] text-[#00ff41] tracking-widest uppercase font-bold">
              PROFILE INITIALIZATION TERMINAL
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="w-full bg-[#141416] border border-zinc-800 p-5 space-y-4 font-mono">
          {errorMsg && (
            <div className="border border-red-500/80 bg-red-950/40 p-3 text-red-400 text-xs font-bold uppercase tracking-wider">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              GUILD USERNAME
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="ENTER USERNAME..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-800 px-3.5 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              OPERATIVE ID (EMAIL)
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="ENTER EMAIL..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-800 px-3.5 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              ACCESS CODE (PASSWORD)
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-800 pl-3.5 pr-10 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,255,65,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>INITIALIZING...</span>
            ) : (
              <>
                <CornerDownRight className="w-4 h-4 stroke-[3]" />
                <span>CREATE OPERATIVE PROFILE</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center font-mono text-xs text-zinc-400 space-x-1">
          <span>Already Registered?</span>
          <Link href="/login" className="text-[#00ff41] underline hover:text-[#00ff41]/80 font-bold">
            Enter Dungeon
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
