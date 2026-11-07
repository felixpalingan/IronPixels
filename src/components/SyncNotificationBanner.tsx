"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SYNC_EVENT_NAME,
  SyncNotificationEvent,
  syncPendingWorkouts,
  getPendingWorkouts,
} from "@/lib/offlineSync";

export function SyncNotificationBanner() {
  const [notification, setNotification] = useState<SyncNotificationEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Initial pending check
    const pending = getPendingWorkouts();
    setPendingCount(pending.length);
    if (pending.length > 0) {
      setNotification({
        type: "offline_queued",
        message: `Ada ${pending.length} sesi latihan offline yang belum tersinkronkan ke server.`,
        count: pending.length,
      });
    }

    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SyncNotificationEvent>;
      if (customEvent.detail) {
        setNotification(customEvent.detail);
        const currentPending = getPendingWorkouts();
        setPendingCount(currentPending.length);

        // Auto dismiss success after 4.5 seconds
        if (customEvent.detail.type === "sync_success") {
          setTimeout(() => {
            setNotification((prev) => (prev?.type === "sync_success" ? null : prev));
          }, 4500);
        }
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSyncEvent);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSyncEvent);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingWorkouts();
    } finally {
      setIsSyncing(false);
      const pending = getPendingWorkouts();
      setPendingCount(pending.length);
    }
  };

  if (!notification && pendingCount === 0) return null;

  const currentNotif = notification || {
    type: "offline_queued" as const,
    message: `Ada ${pendingCount} sesi latihan offline menunggu sinkronisasi.`,
    count: pendingCount,
  };

  const isSuccess = currentNotif.type === "sync_success";
  const isError = currentNotif.type === "sync_error";
  const isOffline = currentNotif.type === "offline_queued";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 pointer-events-auto font-mono text-xs select-none"
      >
        <div
          className={`border-2 p-3 shadow-lg flex items-center justify-between gap-3 ${
            isSuccess
              ? "border-pixel-green bg-black/95 text-pixel-green shadow-[0_0_15px_rgba(0,255,65,0.3)]"
              : isError
              ? "border-red-500 bg-black/95 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              : "border-amber-400 bg-black/95 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-pixel-green shrink-0 animate-pulse" />
            ) : isError ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
            )}

            <div className="space-y-0.5 truncate">
              <div className="font-headline font-black text-[10px] tracking-wider uppercase">
                {isSuccess
                  ? "SINKRONISASI SERVER BERHASIL"
                  : isError
                  ? "SINKRONISASI TERTUNDA"
                  : "MODE OFFLINE AKTIF"}
              </div>
              <p className="text-[9px] text-zinc-300 leading-tight truncate">
                {currentNotif.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOffline || isError ? (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "SYNCING..." : "SYNC NOW"}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

