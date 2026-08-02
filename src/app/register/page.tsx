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
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signInError && signInData.user) {
            window.location.href = "/onboarding";
            return;
          }
          setErrorMsg("USER ALREADY REGISTERED. PLEASE LOG IN OR DELETE USER FROM SUPABASE AUTH.");
        } else {
          setErrorMsg(error.message.toUpperCase());
        }
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER USERNAME..."
                className="w-full bg-black border border-zinc-800 px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00ff41] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER EMAIL..."
                className="w-full bg-black border border-zinc-800 px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00ff41] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              ACCESS CODE (PASSWORD)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="MINIMUM 6 CHARACTERS..."
                className="w-full bg-black border border-zinc-800 px-3 py-2.5 pr-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00ff41] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-xs uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? "INITIALIZING PROFILE..." : "CREATE RECRUIT ACCOUNT"}
          </button>
        </form>

        <div className="text-center font-mono text-xs">
          <span className="text-zinc-500">ALREADY HAVE A WARRIOR PROFILE? </span>
          <Link
            href="/login"
            className="text-[#00ff41] hover:underline font-bold inline-flex items-center gap-1"
          >
            LOGIN TERMINAL
            <CornerDownRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
