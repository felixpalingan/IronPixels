import {
  getPendingWorkouts,
  addPendingWorkout,
  removePendingWorkout,
  mergeSessionHistories,
  STORAGE_KEY_PENDING,
  STORAGE_KEY_HISTORY,
  WorkoutSubmissionPayload,
} from "../src/lib/offlineSync";

export function runOfflineSyncTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log("\n🧪 Running Offline Sync & Queue Test Suite...");

  // Mock localStorage for test environment if not defined
  const storageMock: Record<string, string> = {};
  const origLocalStorage = (globalThis as any).localStorage;
  (globalThis as any).localStorage = {
    getItem: (key: string) => storageMock[key] || null,
    setItem: (key: string, val: string) => {
      storageMock[key] = val;
    },
    removeItem: (key: string) => {
      delete storageMock[key];
    },
    clear: () => {
      for (const k of Object.keys(storageMock)) delete storageMock[k];
    },
  };

  const samplePayload1: WorkoutSubmissionPayload = {
    session_id: "ws-test-1",
    date: "2026-11-06",
    duration_minutes: 50,
    total_rvs: 850,
    total_volume_kg: 3200,
    exercises_log: [
      {
        exercise_name: "Barbell Back Squat",
        category: "Legs",
        sets: [{ set_number: 1, weight_kg: 100, reps: 5 }],
      },
    ],
  };

  const samplePayload2: WorkoutSubmissionPayload = {
    session_id: "ws-test-2",
    date: "2026-11-07",
    duration_minutes: 45,
    total_rvs: 620,
    total_volume_kg: 2400,
    exercises_log: [],
  };

  // 1. Initial queue should be empty
  localStorage.clear();
  assert(getPendingWorkouts().length === 0, "Initial queue should be empty");

  // 2. Add pending workout to queue
  addPendingWorkout(samplePayload1);
  const queue1 = getPendingWorkouts();
  assert(queue1.length === 1, `Queue should have 1 item (got ${queue1.length})`);
  assert(queue1[0].session_id === "ws-test-1", "Queued session ID should match");
  assert(typeof queue1[0].queued_at === "number", "Queued item should have timestamp");

  // 3. Add second workout to queue
  addPendingWorkout(samplePayload2);
  const queue2 = getPendingWorkouts();
  assert(queue2.length === 2, `Queue should have 2 items (got ${queue2.length})`);

  // 4. Duplicate session_id should update instead of duplicate
  addPendingWorkout({ ...samplePayload1, total_rvs: 900 });
  const queue3 = getPendingWorkouts();
  assert(queue3.length === 2, `Duplicate session_id should not increase queue length (got ${queue3.length})`);
  assert(queue3.find((q) => q.session_id === "ws-test-1")?.total_rvs === 900, "Updated item should reflect new value");

  // 5. Remove pending workout
  removePendingWorkout("ws-test-1");
  const queue4 = getPendingWorkouts();
  assert(queue4.length === 1, `Queue should have 1 item after remove (got ${queue4.length})`);
  assert(queue4[0].session_id === "ws-test-2", "Remaining item should be ws-test-2");

  // 6. Safe merge: local unsynced session should NOT be wiped when server returns stale list
  const serverSessions = [
    { session_id: "ws-server-1", date: "2026-10-31", total_rvs: 1000 },
    { session_id: "ws-server-2", date: "2026-10-30", total_rvs: 600 },
  ];

  const localSessionsWithUnsynced = [
    { session_id: "ws-test-2", date: "2026-11-07", total_rvs: 620 }, // Unsynced in pending queue!
    { session_id: "ws-server-1", date: "2026-10-31", total_rvs: 1000 },
  ];

  const merged = mergeSessionHistories(localSessionsWithUnsynced, serverSessions);
  assert(merged.length === 3, `Merged sessions should have 3 items (got ${merged.length})`);
  assert(merged[0].session_id === "ws-test-2", "Most recent unsynced session should be preserved at top");
  assert(merged[0].is_pending_sync === true, "Unsynced session should be flagged with is_pending_sync");
  assert(merged[1].session_id === "ws-server-1", "Server session should be included");
  assert(merged[2].session_id === "ws-server-2", "Earlier server session should be included");

  // Restore original localStorage if any
  if (origLocalStorage !== undefined) {
    (globalThis as any).localStorage = origLocalStorage;
  }

  return { passed, failed };
}

