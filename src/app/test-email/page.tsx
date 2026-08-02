"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, Terminal, ShieldAlert, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{ text: string; type: "info" | "success" | "error" }>>([]);

  const addLog = (text: string, type: "info" | "success" | "error" = "info") => {
    setLogs((prev) => [
      { text: `[${new Date().toLocaleTimeString()}] ${text}`, type },
      ...prev,
    ]);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addLog("Please enter a target email address.", "error");
      return;
    }

    setLoading(true);
    addLog(`Initiating test email request to ${email} via Resend SMTP...`, "info");

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        addLog(`ERROR (${res.status}): ${data.error || "Failed to send email."}`, "error");
        if (data.hint) {
          addLog(`HINT: ${data.hint}`, "info");
        }
      } else {
        addLog(`SUCCESS: ${data.message}`, "success");
      }
    } catch (err: any) {
      addLog(`FATAL ERROR: ${err.message || "Network error occurred."}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4 selection:bg-pixel-green selection:text-black">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg border-2 border-pixel-border bg-surface p-6 sm:p-8 space-y-6 shadow-neon"
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
                RESEND SMTP TEST BENCH
              </h1>
              <p className="font-mono text-[10px] text-gray-400">
                VERIFY EMAIL DELIVERABILITY & SUPABASE AUTH TEMPLATE
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

        <form onSubmit={handleSendTestEmail} className="space-y-4 font-mono">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pixel-green" />
              RECIPIENT TEST EMAIL
            </label>
            <input
              type="email"
              required
              placeholder="youremail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-pixel-border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-pixel-green focus:ring-1 focus:ring-pixel-green transition-all placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-pixel-green bg-pixel-green text-black font-headline font-extrabold text-sm uppercase tracking-wider hover:bg-pixel-green/90 transition-all shadow-neon flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>DISPATCHING VIA RESEND...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>SEND TEST EMAIL NOW</span>
              </>
            )}
          </button>
        </form>

        <div className="border border-pixel-border bg-black p-4 space-y-2 font-mono">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider border-b border-pixel-border/40 pb-1.5">
            <Terminal className="w-4 h-4 text-pixel-green" />
            <span>LIVE TERMINAL OUTPUT LOGS</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 text-xs pt-1">
            {logs.length === 0 ? (
              <span className="text-gray-600 italic">
                Ready. Enter an email above and click Send Test Email.
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
