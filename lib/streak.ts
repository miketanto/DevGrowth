/**
 * Streak logic: increment, reset, weekend grace, streak saves, fire progression.
 *
 * Rules:
 * - A streak increments when the user logs an entry on consecutive days.
 * - Missing a weekday resets the streak (unless a streak save is used).
 * - Weekend grace: in 'grace' mode, Saturday/Sunday don't break the streak
 *   but also don't increment it. In '7day' mode, weekends count normally.
 * - Streak saves: users get 1 save per week (resets Monday). A save prevents
 *   a single missed weekday from resetting the streak.
 * - Fire progression: visual tiers based on streak length.
 */

export interface StreakState {
  current_streak: number;
  longest_streak: number;
  streak_last_date: string | null;
  streak_saves_remaining: number;
  streak_save_reset_date: string | null;
  weekend_mode: 'grace' | '7day';
}

export interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  streak_last_date: string;
  streak_saves_remaining?: number;
  streak_save_reset_date?: string | null;
  streak_saved: boolean;
  streak_broken: boolean;
}

export type FireTier = 'none' | 'ember' | 'flame' | 'blaze' | 'inferno';

/** Parse a YYYY-MM-DD string into a Date at midnight UTC. */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a Date to YYYY-MM-DD. */
function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Day of week: 0 = Sunday, 6 = Saturday. */
function dayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/** Returns true if the date falls on Saturday or Sunday. */
function isWeekend(date: Date): boolean {
  const dow = dayOfWeek(date);
  return dow === 0 || dow === 6;
}

/** Get the number of calendar days between two YYYY-MM-DD dates. */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / msPerDay);
}

/** Get next Monday on or after `date` (YYYY-MM-DD). */
function nextMonday(dateStr: string): string {
  const date = parseDate(dateStr);
  const dow = dayOfWeek(date);
  const daysUntilMon = dow === 0 ? 1 : dow === 1 ? 7 : 8 - dow;
  const monday = new Date(date.getTime() + daysUntilMon * 86_400_000);
  return formatDate(monday);
}

/**
 * Check if all days between lastDate (exclusive) and today (exclusive)
 * are weekend days. Used to determine if weekend grace applies.
 */
function allGapDaysAreWeekend(lastDate: string, today: string): boolean {
  const gap = daysBetween(lastDate, today);
  if (gap <= 1) return true; // no gap days to check
  const start = parseDate(lastDate);
  for (let i = 1; i < gap; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    if (!isWeekend(d)) return false;
  }
  return true;
}

/**
 * Process a new entry and compute the updated streak state.
 *
 * @param state Current streak state from the database.
 * @param today The date of the new entry (YYYY-MM-DD).
 * @returns The updated streak fields to persist.
 */
export function processStreak(state: StreakState, today: string): StreakUpdate {
  const weekendMode = state.weekend_mode;
  let { current_streak, longest_streak, streak_saves_remaining } = state;
  let streak_save_reset_date = state.streak_save_reset_date;
  let streak_saved = false;
  let streak_broken = false;

  // Reset weekly streak save allowance on Monday
  if (streak_save_reset_date && today >= streak_save_reset_date) {
    streak_saves_remaining = 1;
    streak_save_reset_date = nextMonday(today);
  } else if (!streak_save_reset_date) {
    streak_save_reset_date = nextMonday(today);
  }

  // First ever entry
  if (!state.streak_last_date) {
    current_streak = 1;
    longest_streak = Math.max(longest_streak, 1);
    return {
      current_streak,
      longest_streak,
      streak_last_date: today,
      streak_saves_remaining,
      streak_save_reset_date,
      streak_saved: false,
      streak_broken: false,
    };
  }

  const gap = daysBetween(state.streak_last_date, today);

  // Same day — no change
  if (gap === 0) {
    return {
      current_streak,
      longest_streak,
      streak_last_date: today,
      streak_saves_remaining,
      streak_save_reset_date,
      streak_saved: false,
      streak_broken: false,
    };
  }

  // Negative gap — entry for a past date, no streak change
  if (gap < 0) {
    return {
      current_streak,
      longest_streak,
      streak_last_date: state.streak_last_date,
      streak_saves_remaining,
      streak_save_reset_date,
      streak_saved: false,
      streak_broken: false,
    };
  }

  // Consecutive day — simple increment
  if (gap === 1) {
    current_streak += 1;
    longest_streak = Math.max(longest_streak, current_streak);
    return {
      current_streak,
      longest_streak,
      streak_last_date: today,
      streak_saves_remaining,
      streak_save_reset_date,
      streak_saved: false,
      streak_broken: false,
    };
  }

  // Gap > 1 day — check weekend grace
  if (weekendMode === 'grace' && allGapDaysAreWeekend(state.streak_last_date, today)) {
    // Weekend grace: streak continues, increment for today
    current_streak += 1;
    longest_streak = Math.max(longest_streak, current_streak);
    return {
      current_streak,
      longest_streak,
      streak_last_date: today,
      streak_saves_remaining,
      streak_save_reset_date,
      streak_saved: false,
      streak_broken: false,
    };
  }

  // Gap includes missed weekdays — try streak save
  if (gap === 2 && streak_saves_remaining > 0) {
    streak_saves_remaining -= 1;
    current_streak += 1;
    longest_streak = Math.max(longest_streak, current_streak);
    streak_saved = true;
    return {
      current_streak,
      longest_streak,
      streak_last_date: today,
      streak_saves_remaining,
      streak_save_reset_date,
      streak_saved,
      streak_broken: false,
    };
  }

  // Streak is broken
  streak_broken = true;
  current_streak = 1;

  return {
    current_streak,
    longest_streak,
    streak_last_date: today,
    streak_saves_remaining,
    streak_save_reset_date,
    streak_saved: false,
    streak_broken,
  };
}

/**
 * Get the fire tier for a given streak length.
 *
 * - 0: none
 * - 1–6: ember
 * - 7–20: flame
 * - 21–49: blaze
 * - 50+: inferno
 */
export function getFireTier(streak: number): FireTier {
  if (streak <= 0) return 'none';
  if (streak < 7) return 'ember';
  if (streak < 21) return 'flame';
  if (streak < 50) return 'blaze';
  return 'inferno';
}
