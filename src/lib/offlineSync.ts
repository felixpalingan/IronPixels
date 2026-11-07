export interface WorkoutSubmissionPayload {
  session_id: string;
  user_id?: string;
  date: string;
  duration_minutes: number;
  total_rvs: number;
  total_volume_kg: number;
  exercises_log: any[];
  queued_at?: number;
  retry_count?: number;
}

export type SyncNotificationType =
  | "offline_queued"
  | "syncing"
  | "sync_success"
  | "sync_error";

export interface SyncNotificationEvent {
  type: SyncNotificationType;
  message: string;
  count?: number;
  sessionId?: string;
}

export const STORAGE_KEY_PENDING = "ironpixels_pending_workout_sync";
export const STORAGE_KEY_HISTORY = "ironpixels_workout_history";
export const SYNC_EVENT_NAME = "ironpixels:sync_status";

/**
 * Safe accessor for localStorage across browser and test environments.
 */
function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

/**
 * Dispatches a custom sync status event for UI toast/banner components.
 */
export function dispatchSyncNotification(detail: SyncNotificationEvent) {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail }));
    } catch (e) {
      // In non-browser or test environments where CustomEvent might be missing
    }
  }
}

/**
 * Retrieves all workouts waiting in the offline queue.
 */
export function getPendingWorkouts(): WorkoutSubmissionPayload[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY_PENDING);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read pending workouts queue:", e);
    return [];
  }
}

/**
 * Adds a workout to the offline sync queue.
 */
export function addPendingWorkout(payload: WorkoutSubmissionPayload): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const queue = getPendingWorkouts();
    const existingIdx = queue.findIndex((q) => q.session_id === payload.session_id);

    const queuedItem: WorkoutSubmissionPayload = {
      ...payload,
      queued_at: payload.queued_at || Date.now(),
      retry_count: payload.retry_count || 0,
    };

    if (existingIdx >= 0) {
      queue[existingIdx] = queuedItem;
    } else {
      queue.push(queuedItem);
    }

    storage.setItem(STORAGE_KEY_PENDING, JSON.stringify(queue));
    dispatchSyncNotification({
      type: "offline_queued",
      message: "OFFLINE: Sesi latihan tersimpan di memori HP. Otomatis disinkronkan ke server begitu ada sinyal.",
      sessionId: payload.session_id,
      count: queue.length,
    });
  } catch (e) {
    console.error("Failed to store pending workout:", e);
  }
}

/**
 * Removes a successfully synced workout from the queue.
 */
export function removePendingWorkout(sessionId: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const queue = getPendingWorkouts();
    const filtered = queue.filter((q) => q.session_id !== sessionId);
    storage.setItem(STORAGE_KEY_PENDING, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to remove pending workout:", e);
  }
}

/**
 * Merges local sessions and server sessions safely without overwriting pending unsynced sessions.
 */
export function mergeSessionHistories(
  localSessions: any[],
  serverSessions: any[]
): any[] {
  const mergedMap = new Map<string, any>();
  const pendingQueue = getPendingWorkouts();
  const pendingIds = new Set(pendingQueue.map((p) => p.session_id));

  // 1. First add server sessions (canonical source of truth from database)
  if (Array.isArray(serverSessions)) {
    for (const s of serverSessions) {
      const id = s.session_id || s.id;
      if (id) mergedMap.set(id, s);
    }
  }

  // 2. Preserve any local sessions that are either in pending queue or not in server yet
  if (Array.isArray(localSessions)) {
    for (const s of localSessions) {
      const id = s.session_id || s.id;
      if (!id) continue;

      if (pendingIds.has(id)) {
        // Mark clearly as pending sync
        mergedMap.set(id, { ...s, is_pending_sync: true });
      } else if (!mergedMap.has(id)) {
        // Local session not yet acknowledged by server: keep it!
        mergedMap.set(id, s);
      }
    }
  }

  // Convert to array and sort by date descending
  return Array.from(mergedMap.values()).sort((a, b) => {
    const da = new Date(a.date || a.created_at || 0).getTime();
    const db = new Date(b.date || b.created_at || 0).getTime();
    return db - da;
  });
}

/**
 * Submits a workout to the server, and automatically intercepts any network
 * or server error into the offline sync queue.
 */
export async function submitWorkoutWithOfflineFallback(
  payload: WorkoutSubmissionPayload
): Promise<{
  success: boolean;
  offline: boolean;
  profile?: any;
  error?: string;
}> {
  // Always ensure it is saved in local history immediately so the user never loses sight of it
  const storage = getStorage();
  if (storage) {
    try {
      const localHistory = JSON.parse(storage.getItem(STORAGE_KEY_HISTORY) || "[]");
      const updated = [
        { ...payload, is_pending_sync: true },
        ...localHistory.filter((s: any) => s.session_id !== payload.session_id),
      ];
      storage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {}
  }

  // Check if browser is known to be offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    addPendingWorkout(payload);
    return {
      success: true,
      offline: true,
      error: "Perangkat sedang offline. Sesi tersimpan di antrean sinkronisasi lokal.",
    };
  }

  try {
    const res = await fetch("/api/workout/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      removePendingWorkout(payload.session_id);

      // Remove the pending sync flag from local history
      if (storage) {
        try {
          const localHistory = JSON.parse(storage.getItem(STORAGE_KEY_HISTORY) || "[]");
          const cleaned = localHistory.map((s: any) =>
            s.session_id === payload.session_id ? { ...s, is_pending_sync: false } : s
          );
          storage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(cleaned));
        } catch (e) {}
      }

      dispatchSyncNotification({
        type: "sync_success",
        message: "SYNC SUCCESS: Sesi latihan berhasil disinkronkan ke server!",
        sessionId: payload.session_id,
      });

      return {
        success: true,
        offline: false,
        profile: data.profile,
      };
    }

    // Server returned an error (e.g. 500, 401, 429)
    let errMsg = `Server error (${res.status})`;
    try {
      const errData = await res.json();
      if (errData?.error) errMsg = errData.error;
    } catch (e) {}

    addPendingWorkout(payload);
    return {
      success: true,
      offline: true,
      error: errMsg,
    };
  } catch (err: any) {
    // Network failure (offline, timeout, DNS drop at gym)
    addPendingWorkout(payload);
    return {
      success: true,
      offline: true,
      error: err?.message || "Koneksi jaringan terputus. Sesi tersimpan offline.",
    };
  }
}

/**
 * Processes all pending workouts in the offline queue and submits them to the server.
 */
export async function syncPendingWorkouts(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = getPendingWorkouts();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  dispatchSyncNotification({
    type: "syncing",
    message: `Menyinkronkan ${queue.length} sesi latihan offline ke server...`,
    count: queue.length,
  });

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const res = await fetch("/api/workout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        removePendingWorkout(item.session_id);
        syncedCount++;

        // Update local session flag
        const storage = getStorage();
        if (storage) {
          try {
            const localHistory = JSON.parse(storage.getItem(STORAGE_KEY_HISTORY) || "[]");
            const cleaned = localHistory.map((s: any) =>
              s.session_id === item.session_id ? { ...s, is_pending_sync: false } : s
            );
            storage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(cleaned));
          } catch (e) {}
        }
      } else {
        item.retry_count = (item.retry_count || 0) + 1;
        failedCount++;
      }
    } catch (e) {
      item.retry_count = (item.retry_count || 0) + 1;
      failedCount++;
    }
  }

  if (syncedCount > 0) {
    dispatchSyncNotification({
      type: "sync_success",
      message: `🎉 BERHASIL: ${syncedCount} sesi latihan offline berhasil disinkronkan ke server!`,
      count: syncedCount,
    });
  } else if (failedCount > 0) {
    dispatchSyncNotification({
      type: "sync_error",
      message: `Gagal sinkronisasi ${failedCount} sesi. Akan dicoba kembali otomatis saat sinyal stabil.`,
      count: failedCount,
    });
  }

  return { syncedCount, failedCount };
}

/**
 * Initializes automatic background listeners for offline recovery.
 */
export function initAutoSync(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    syncPendingWorkouts().catch(() => {});
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      syncPendingWorkouts().catch(() => {});
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Trigger sync check on startup
  setTimeout(() => {
    syncPendingWorkouts().catch(() => {});
  }, 2000);

  return () => {
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
