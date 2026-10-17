interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window store with auto-pruning
const rateLimitStore = new Map<string, RateLimitRecord>();

// Prune expired tokens every 5 minutes to prevent memory leak
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPruneTime = Date.now();

function pruneExpiredEntries(now: number) {
  if (now - lastPruneTime < PRUNE_INTERVAL_MS) return;
  lastPruneTime = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks whether a given identifier has exceeded its rate limit.
 *
 * @param identifier Unique key (e.g., client IP or User ID)
 * @param limit Maximum allowed requests within the window
 * @param windowSecs Window duration in seconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSecs: number = 60
): RateLimitResult {
  const now = Date.now();
  pruneExpiredEntries(now);

  const windowMs = windowSecs * 1000;
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetAt <= now) {
    // New or expired window
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetInSeconds: windowSecs,
    };
  }

  // Active window
  if (record.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetInSeconds,
  };
}

/**
 * Categorizes rate limit tier based on the pathname
 */
export function getRouteRateLimitTier(path: string): { limit: number; windowSecs: number } {
  // High-sensitivity transactional / combat routes (30 requests / min)
  if (
    path.startsWith("/api/combat") ||
    path.startsWith("/api/shop/gacha") ||
    path.startsWith("/api/inventory")
  ) {
    return { limit: 30, windowSecs: 60 };
  }

  // Workout submission route (15 requests / min)
  if (path === "/api/workout/submit") {
    return { limit: 15, windowSecs: 60 };
  }

  // General API routes (100 requests / min)
  return { limit: 100, windowSecs: 60 };
}
