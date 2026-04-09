import { type SQLiteDatabase } from 'expo-sqlite';
import type { Entry } from '../../types';
import { callClaude } from './client';
import {
  getLatestInsight,
  saveInsight,
  getEntriesInRange,
  getEntryCount,
  type InsightRow,
} from '../database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Insight {
  id: string;
  periodStart: string;
  periodEnd: string;
  bullets: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INSIGHT_CADENCE_DAYS = 14;
const MIN_ENTRIES_REQUIRED = 3;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const INSIGHTS_SYSTEM_PROMPT = `You are DevGrowth's growth analyst. Given a set of developer journal entries from a two-week period, produce 2-3 concise insight bullets about the developer's growth patterns.

Cover these dimensions (pick the 2-3 most relevant):
- Skill momentum: which skills are growing, which are stalling
- Focus suggestion: what to work on next based on patterns
- Reflection quality trend: is the developer reflecting more deeply over time
- Confidence/mood patterns: notable shifts and what might be driving them

Rules:
- Each bullet should be 1-2 sentences, actionable and specific
- Reference actual skills and topics from the entries — don't be generic
- Be encouraging but honest
- Return ONLY a JSON array of strings, no wrapper object
- Example: ["Your TypeScript work has accelerated — 5 entries this period vs 2 last. Consider diving into generics next.", "Reflection depth is climbing: your problem analyses are getting more specific about trade-offs."]`;

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

function rowToInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    bullets: JSON.parse(row.bullets),
    generatedAt: row.generated_at,
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function buildUserMessage(entries: Entry[], periodStart: string, periodEnd: string): string {
  const summaries = entries.map((e) => {
    const parts = [
      `Date: ${e.date}`,
      `Worked on: ${e.worked_on}`,
    ];
    if (e.hardest_problem) parts.push(`Challenge: ${e.hardest_problem}`);
    if (e.how_solved) parts.push(`Solution: ${e.how_solved}`);
    parts.push(`Confidence: ${e.confidence}/5, Mood: ${e.mood}/4`);
    if (e.review_score) parts.push(`Reflection score: ${e.review_score.composite.toFixed(1)}/5`);
    if (e.ai_summary) parts.push(`AI summary: ${e.ai_summary}`);
    return parts.join('\n');
  });

  return `Period: ${periodStart} to ${periodEnd}\nEntry count: ${entries.length}\n\n${summaries.join('\n---\n')}`;
}

/**
 * Check if new insights should be generated and generate them if needed.
 * Returns the current (possibly freshly generated) insight, or null if
 * not enough data exists.
 */
export async function getOrGenerateInsight(
  db: SQLiteDatabase
): Promise<Insight | null> {
  // Check entry count first — need at least 3
  const totalEntries = await getEntryCount(db);
  if (totalEntries < MIN_ENTRIES_REQUIRED) return null;

  // Check if we have a recent enough insight
  const latest = await getLatestInsight(db);
  if (latest) {
    const daysSince = Math.floor(
      (Date.now() - new Date(latest.generated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < INSIGHT_CADENCE_DAYS) {
      return rowToInsight(latest);
    }
  }

  // Generate new insight
  const today = new Date();
  const periodEnd = formatDate(today);
  const periodStart = formatDate(subtractDays(today, INSIGHT_CADENCE_DAYS));

  const entries = await getEntriesInRange(db, periodStart, periodEnd);
  if (entries.length < MIN_ENTRIES_REQUIRED) return null;

  const userMessage = buildUserMessage(entries, periodStart, periodEnd);

  const result = await callClaude(
    'insight_generation',
    INSIGHTS_SYSTEM_PROMPT,
    [{ role: 'user', content: userMessage }]
  );

  let bullets: string[];
  try {
    bullets = JSON.parse(result.text);
    if (!Array.isArray(bullets)) throw new Error('Not an array');
  } catch {
    // Fallback: split by newlines if JSON parsing fails
    bullets = result.text
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  const id = await saveInsight(db, { period_start: periodStart, period_end: periodEnd, bullets });

  return {
    id,
    periodStart,
    periodEnd,
    bullets,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Load the latest insight from the DB without triggering generation.
 */
export async function loadLatestInsight(
  db: SQLiteDatabase
): Promise<Insight | null> {
  const row = await getLatestInsight(db);
  return row ? rowToInsight(row) : null;
}
