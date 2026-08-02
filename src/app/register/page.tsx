"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Key, Mail, User, Swords, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
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
        setErrorMsg(error.message);
      } else if (data.user) {
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg("An unexpected registration error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4 selection:bg-pixel-green selection:text-black">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md border-2 border-pixel-border bg-surface p-6 sm:p-8 space-y-6 shadow-neon"
      >
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/icon.png"
              alt="IronPixels Logo"
              className="w-10 h-10 object-contain border border-pixel-green shadow-neon bg-black p-0.5"
            />
            <span className="font-headline font-extrabold text-2xl text-pixel-green tracking-wider uppercase">
              IRONPIXELS
            </span>
          </div>

          <h1 className="font-headline font-bold text-lg text-white uppercase tracking-wider">
            CREATE GUILD ACCOUNT
          </h1>
          <p className="font-mono text-xs text-gray-400">
            JOIN THE GUILD AND LEVEL UP YOUR PHYSICAL GAINS
          </p>
        </div>

        <div className="grid grid-cols-2 border border-pixel-border bg-black p-1 font-mono text-xs font-bold">
          <Link
            href="/login"
            className="py-2 text-center text-gray-400 hover:text-white uppercase transition-colors"
          >
            LOG IN
          </Link>
          <button className="py-2 bg-pixel-green text-black shadow-neon uppercase">
            REGISTER
          </button>
        </div>

        {errorMsg && (
          <div className="border border-health-red bg-health-red/10 p-3 text-health-red font-mono text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 font-mono">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-pixel-green" />
              GUILD USERNAME
            </label>
            <input
              type="text"
              required
              placeholder="ShadowKnight99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-pixel-border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pixel-green" />
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              placeholder="warrior@ironpixels.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-pixel-border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-pixel-green" />
              PASSWORD
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-pixel-border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-pixel-green bg-pixel-green text-black font-headline font-extrabold text-sm uppercase tracking-wider hover:bg-pixel-green/90 transition-all shadow-neon flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>CREATING ACCOUNT...</span>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                <span>CONTINUE TO ONBOARDING</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center font-mono text-[10px] text-gray-500 uppercase tracking-widest pt-2 border-t border-pixel-border/50">
          POWERED BY SUPABASE AUTH & RVS ENGINE
        </div>
      </motion.div>
    </div>
  );
}
