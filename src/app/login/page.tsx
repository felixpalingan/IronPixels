"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Key, ArrowRight, CornerDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayConnected, setStayConnected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("OPERATIVE ID & ACCESS CODE REQUIRED.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message.toUpperCase());
        setLoading(false);
      } else if (data.user) {
        document.cookie = "ironpixels_onboarded=true; path=/; max-age=31536000";
        window.location.href = "/";
      }
    } catch (err: any) {
      setErrorMsg("SYSTEM TERMINAL AUTHENTICATION ERROR.");
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
          <div className="w-28 h-28 bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,65,0.25)] relative">
            <img
              src="/icon.png"
              alt="IronPixels Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center space-y-1">
            <h1 className="font-headline font-black text-3xl tracking-wider text-white uppercase">
              IRON PIXELS
            </h1>
            <p className="font-mono text-[11px] text-[#00ff41] tracking-widest uppercase font-bold">
              SYSTEM ACCESS TERMINAL
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="w-full bg-[#141416] border border-zinc-800 p-5 space-y-4 font-mono">
          {errorMsg && (
            <div className="border border-red-500/80 bg-red-950/40 p-3 text-red-400 text-xs font-bold uppercase tracking-wider">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              OPERATIVE ID (EMAIL)
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="ENTER ID..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-800 px-3.5 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all font-mono"
              />
              <span className="absolute right-3 top-3.5 w-1.5 h-3 bg-[#00ff41]/50 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              ACCESS CODE
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-800 px-3.5 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all font-mono"
              />
              <span className="absolute right-3 top-3.5 w-1.5 h-3 bg-[#00ff41]/50 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent">
              <input
                type="checkbox"
                checked={stayConnected}
                onChange={(e) => setStayConnected(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#00ff41] bg-black border-zinc-800 rounded-none cursor-pointer"
              />
              <span>Stay Connected</span>
            </label>

            <button type="button" className="text-sky-400 underline hover:text-sky-300">
              Lost Code?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-mono font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,255,65,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>AUTHENTICATING...</span>
            ) : (
              <>
                <CornerDownRight className="w-4 h-4 stroke-[3]" />
                <span>ENTER DUNGEON</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center font-mono text-xs text-zinc-400 space-x-1">
          <span>New Operative?</span>
          <Link href="/register" className="text-fuchsia-400 underline hover:text-fuchsia-300 font-bold">
            Initialize Profile
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
