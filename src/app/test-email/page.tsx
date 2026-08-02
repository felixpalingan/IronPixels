"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, Terminal, ShieldAlert, CheckCircle2, ArrowLeft, Key, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{ text: string; type: "info" | "success" | "error" }>>([]);

  const addLog = (text: string, type: "info" | "success" | "error" = "info") => {
    setLogs((prev) => [
      { text: `[${new Date().toLocaleTimeString()}] ${text}`, type },
      ...prev,
    ]);
  };

  const handleTestDirectResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addLog("Please enter a target email address.", "error");
      return;
    }

    if (!resendApiKey) {
      addLog("Please enter your Resend API Key (starts with re_...).", "error");
      return;
    }

    setLoading(true);
    addLog(`Testing Direct Resend REST API delivery to ${email}...`, "info");

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resendApiKey, mode: "direct" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        addLog(`DIRECT RESEND ERROR (${res.status}): ${data.error || "Failed."}`, "error");
      } else {
        addLog(`DIRECT RESEND SUCCESS: ${data.message}`, "success");
      }
    } catch (err: any) {
      addLog(`FATAL ERROR: ${err.message || "Network error."}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestSupabaseAuth = async () => {
    if (!email) {
      addLog("Please enter a target email address.", "error");
      return;
    }

    setLoading(true);
    addLog(`Testing Supabase Auth Signup Email trigger for ${email}...`, "info");

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode: "supabase" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        addLog(`SUPABASE AUTH ERROR (${res.status}): ${data.error || "Failed."}`, "error");
      } else {
        addLog(`SUPABASE AUTH SUCCESS: ${data.message}`, "success");
      }
    } catch (err: any) {
      addLog(`FATAL ERROR: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4 selection:bg-pixel-green selection:text-black">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl border-2 border-pixel-border bg-surface p-6 sm:p-8 space-y-6 shadow-neon"
      >
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="IronPixels Logo"
              className="w-8 h-8 object-contain border border-pixel-green shadow-neon bg-black p-0.5"
            />
            <div>
              <h1 className="font-headline font-extrabold text-lg text-pixel-green uppercase tracking-wider">
                RESEND EMAIL TEST BENCH
              </h1>
              <p className="font-mono text-[10px] text-gray-400">
                VERIFY RESEND API & SUPABASE AUTH DELIVERABILITY
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="p-1.5 border border-pixel-border bg-black text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <form onSubmit={handleTestDirectResend} className="space-y-4 font-mono">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pixel-green" />
              RECIPIENT TEST EMAIL
            </label>
            <input
              type="email"
              required
              placeholder="youremail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-pixel-border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-gold-loot" />
              RESEND API KEY (re_...)
            </label>
            <input
              type="password"
              placeholder="re_123456789_abcdefg..."
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              className="w-full bg-black border border-pixel-border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all placeholder:text-gray-600"
            />
            <span className="text-[10px] text-gray-500 block">
              Get your free key from resend.com -&gt; API Keys
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="py-3 border border-pixel-green bg-pixel-green text-black font-headline font-extrabold text-xs uppercase tracking-wider hover:bg-pixel-green/90 transition-all shadow-neon flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>TEST RESEND DIRECT API</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleTestSupabaseAuth}
              className="py-3 border border-exp-blue bg-exp-blue/20 text-exp-blue font-headline font-extrabold text-xs uppercase tracking-wider hover:bg-exp-blue/30 transition-all shadow-blue-glow flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>TEST SUPABASE AUTH SMTP</span>
            </button>
          </div>
        </form>

        <div className="border border-pixel-border bg-black p-4 space-y-2 font-mono">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider border-b border-pixel-border/40 pb-1.5">
            <Terminal className="w-4 h-4 text-pixel-green" />
            <span>LIVE TERMINAL OUTPUT LOGS</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 text-xs pt-1">
            {logs.length === 0 ? (
              <span className="text-gray-600 italic">
                Ready. Paste your Resend API Key above and click TEST.
              </span>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-1.5 border-b border-dashed border-pixel-border/30 pb-0.5 ${
                    log.type === "error"
                      ? "text-health-red"
                      : log.type === "success"
                      ? "text-pixel-green font-bold"
                      : "text-gray-300"
                  }`}
                >
                  {log.type === "error" && <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                  {log.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
