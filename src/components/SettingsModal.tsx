"use client";

import { useState } from "react";
import { LogOut, X, Shield, User, Scale, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: {
    username: string;
    character_class: string;
    weight_kg: number;
    user_id: string;
  };
}

export function SettingsModal({ isOpen, onClose, userData }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      document.cookie = "ironpixels_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/login";
    } catch (err) {
      document.cookie = "ironpixels_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-[#00ff41] selection:text-black"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm border-2 border-zinc-800 bg-[#141416] p-6 space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative font-mono"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00ff41]" />
                <span className="font-headline font-extrabold text-base tracking-wider text-white uppercase">
                  GUILD SETTINGS
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 border border-zinc-800 bg-black text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0a0a0c] border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  OPERATIVE
                </span>
                <span className="text-white font-bold">{userData?.username || "Warrior"}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-zinc-400" />
                  CLASS
                </span>
                <span className="text-[#00ff41] font-bold">{userData?.character_class || "CYBER KNIGHT"}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-zinc-400" />
                  MASS
                </span>
                <span className="text-white font-bold">{userData?.weight_kg || 75} KG</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full h-12 border border-red-500/80 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loading ? "TERMINATING SESSION..." : "LOG OUT GUILD SESSION"}</span>
            </button>

            <div className="text-center text-[10px] text-zinc-600 uppercase tracking-widest pt-1 border-t border-zinc-800/60">
              IRON PIXELS RPG © 2026
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SettingsModal;
