/**
 * Streak and Consistency Calculation Engine for IronPixels
 * Computes current active streak and all-time longest streak from workout session dates.
 */

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

/**
 * Normalizes a date or date-string to YYYY-MM-DD
 */
export function normalizeDateString(dateInput: string | Date): string {
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split("T")[0];
  }
  const str = String(dateInput).trim();
  const match = str.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) {
    return match[0];
  }
  return str.split(/[T ]/)[0];
}

/**
 * Converts a YYYY-MM-DD string to day number (days since Unix epoch UTC)
 */
function toEpochDay(dateStr: string): number {
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    return NaN;
  }
  const [year, month, day] = parts;
  const utcDate = Date.UTC(year, month - 1, day);
  return Math.floor(utcDate / 86400000);
}

/**
 * Calculates current active streak and all-time longest streak.
 *
 * @param sessionDates Array of dates (strings or Dates) representing completed workout sessions.
 * @param referenceDate Optional reference date (default: today's date in YYYY-MM-DD).
 */
export function calculateStreaks(
  sessionDates: (string | Date)[],
  referenceDate?: string | Date
): StreakResult {
  if (!Array.isArray(sessionDates) || sessionDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
    };
  }

  // Deduplicate and filter valid dates
  const uniqueDateSet = new Set<string>();
  for (const raw of sessionDates) {
    if (!raw) continue;
    const normalized = normalizeDateString(raw);
    if (!isNaN(toEpochDay(normalized))) {
      uniqueDateSet.add(normalized);
    }
  }

  if (uniqueDateSet.size === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
    };
  }

  const sortedDates = Array.from(uniqueDateSet).sort();
  const sortedEpochDays = sortedDates.map((d) => ({
    dateStr: d,
    day: toEpochDay(d),
  }));

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDay: number | null = null;

  for (const item of sortedEpochDays) {
    if (prevDay === null) {
      runningStreak = 1;
    } else if (item.day === prevDay + 1) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }

    prevDay = item.day;
  }

  const lastItem = sortedEpochDays[sortedEpochDays.length - 1];
  const refDateStr = referenceDate
    ? normalizeDateString(referenceDate)
    : new Date().toISOString().split("T")[0];
  const refEpochDay = toEpochDay(refDateStr);

  let currentStreak = 0;
  if (!isNaN(refEpochDay)) {
    // If last workout was today (0 days ago) or yesterday (1 day ago), streak is actively alive
    const daysSinceLastWorkout = refEpochDay - lastItem.day;
    if (daysSinceLastWorkout === 0 || daysSinceLastWorkout === 1) {
      currentStreak = runningStreak;
    } else if (daysSinceLastWorkout < 0) {
      // Future-dated workout or timezone ahead: preserve running streak
      currentStreak = runningStreak;
    } else {
      // More than 1 day missed
      currentStreak = 0;
    }
  } else {
    currentStreak = runningStreak;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastWorkoutDate: lastItem.dateStr,
  };
}
