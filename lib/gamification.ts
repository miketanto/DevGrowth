/**
 * XP calculation, level thresholds, and title lookup.
 *
 * Overall levels 1–100 with titles:
 *   1–5: Apprentice Developer
 *   6–15: Journeyman Developer
 *   16–30: Craftsman Developer
 *   31–50: Expert Developer
 *   51–75: Architect
 *   76–100: Grandmaster
 *
 * Skill levels 1–10 with per-skill XP track:
 *   xp_required(level) = floor(100 * 1.65^(level-2)) for levels 2–10
 */

import type { ReviewScore } from '../types';

// ---------------------------------------------------------------------------
// Overall level thresholds
// ---------------------------------------------------------------------------

/** Pre-computed XP thresholds for overall levels 1–100. */
const OVERALL_XP_THRESHOLDS: number[] = buildOverallThresholds();

function buildOverallThresholds(): number[] {
  // Levels 1–5 are explicitly defined
  const explicit = [0, 100, 250, 500, 850];
  // After that, use a curve: each level requires progressively more XP
  // Level 6 starts at 1300, continuing with ~150*level increments
  const thresholds = [...explicit];
  for (let lvl = 6; lvl <= 100; lvl++) {
    // Quadratic-ish curve: previous + 100 + 50*(level-1)
    const prev = thresholds[lvl - 2]; // index = level - 1, so lvl-2 = previous level's index
    const increment = 100 + 50 * (lvl - 1);
    thresholds.push(prev + increment);
  }
  return thresholds;
}

/**
 * Get the overall level for a given total XP.
 * Returns a level between 1 and 100.
 */
export function getOverallLevel(totalXp: number): number {
  for (let i = OVERALL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= OVERALL_XP_THRESHOLDS[i]) {
      return i + 1; // levels are 1-indexed
    }
  }
  return 1;
}

/**
 * Get the XP required to reach a specific overall level.
 */
export function getOverallXpForLevel(level: number): number {
  const idx = Math.max(0, Math.min(level - 1, OVERALL_XP_THRESHOLDS.length - 1));
  return OVERALL_XP_THRESHOLDS[idx];
}

/**
 * Get XP progress within the current level.
 * Returns { current, required, progress } where progress is 0–1.
 */
export function getOverallLevelProgress(totalXp: number): {
  level: number;
  current: number;
  required: number;
  progress: number;
} {
  const level = getOverallLevel(totalXp);
  const currentThreshold = getOverallXpForLevel(level);
  const nextThreshold =
    level < 100 ? getOverallXpForLevel(level + 1) : currentThreshold + 1000;
  const current = totalXp - currentThreshold;
  const required = nextThreshold - currentThreshold;
  return {
    level,
    current,
    required,
    progress: required > 0 ? Math.min(current / required, 1) : 1,
  };
}

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

export type Title =
  | 'Apprentice Developer'
  | 'Journeyman Developer'
  | 'Craftsman Developer'
  | 'Expert Developer'
  | 'Architect'
  | 'Grandmaster';

/**
 * Get the title for a given overall level.
 */
export function getTitle(level: number): Title {
  if (level <= 5) return 'Apprentice Developer';
  if (level <= 15) return 'Journeyman Developer';
  if (level <= 30) return 'Craftsman Developer';
  if (level <= 50) return 'Expert Developer';
  if (level <= 75) return 'Architect';
  return 'Grandmaster';
}

// ---------------------------------------------------------------------------
// Skill level thresholds
// ---------------------------------------------------------------------------

/** XP required to reach skill level N (2–10). Level 1 requires 0 XP. */
export function getSkillXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.65, level - 2));
}

/**
 * Get the skill level for a given total skill XP.
 * Returns a level between 1 and 10.
 */
export function getSkillLevel(totalXp: number): number {
  for (let lvl = 10; lvl >= 2; lvl--) {
    if (totalXp >= getSkillXpForLevel(lvl)) {
      return lvl;
    }
  }
  return 1;
}

/**
 * Get skill XP progress within the current skill level.
 */
export function getSkillLevelProgress(totalXp: number): {
  level: number;
  current: number;
  required: number;
  progress: number;
} {
  const level = getSkillLevel(totalXp);
  const currentThreshold = getSkillXpForLevel(level);
  const nextThreshold =
    level < 10 ? getSkillXpForLevel(level + 1) : currentThreshold + 1000;
  const current = totalXp - currentThreshold;
  const required = nextThreshold - currentThreshold;
  return {
    level,
    current,
    required,
    progress: required > 0 ? Math.min(current / required, 1) : 1,
  };
}

// ---------------------------------------------------------------------------
// XP Calculation
// ---------------------------------------------------------------------------

export interface XPBreakdown {
  base: number;
  followups: number;
  depth_bonus: number;
  pattern_bonus: number;
  total: number;
}

/**
 * Calculate XP earned for an entry.
 *
 * @param hasFollowups Whether the user answered AI follow-up questions.
 * @param followupCount Number of follow-up exchanges completed.
 * @param reviewScore The AI review composite scores.
 * @param isPatternEntry Whether this entry shows a repeated skill/topic pattern.
 */
export function calculateXP(params: {
  hasFollowups: boolean;
  followupCount: number;
  reviewScore: ReviewScore | null;
  isPatternEntry: boolean;
}): XPBreakdown {
  // Base XP: every entry earns 10 XP just for logging
  const base = 10;

  // Follow-up bonus: 5 XP per follow-up exchange, max 3
  const followups = params.hasFollowups
    ? Math.min(params.followupCount, 3) * 5
    : 0;

  // Depth bonus: based on composite review score (1.0–5.0)
  // Score 3.0+ earns bonus: (score - 2) * 5, max 15
  let depth_bonus = 0;
  if (params.reviewScore && params.reviewScore.composite >= 3.0) {
    depth_bonus = Math.min(Math.round((params.reviewScore.composite - 2) * 5), 15);
  }

  // Pattern bonus: 5 XP if this entry shows a recurring skill pattern
  const pattern_bonus = params.isPatternEntry ? 5 : 0;

  const total = base + followups + depth_bonus + pattern_bonus;

  return { base, followups, depth_bonus, pattern_bonus, total };
}
