import { type SQLiteDatabase } from 'expo-sqlite';
import type {
  Entry,
  ReviewScore,
  ReviewMessage,
  Skill,
  SkillBranch,
  UserProfile,
  Resource,
} from '../types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date TEXT NOT NULL,
  worked_on TEXT NOT NULL,
  hardest_problem TEXT,
  how_solved TEXT,
  confidence INTEGER CHECK(confidence BETWEEN 1 AND 5),
  mood INTEGER CHECK(mood BETWEEN 0 AND 4),
  ai_summary TEXT,
  review_score_depth REAL,
  review_score_awareness REAL,
  review_score_actionability REAL,
  review_score_composite REAL,
  xp_earned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS review_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id TEXT NOT NULL REFERENCES entries(id),
  role TEXT CHECK(role IN ('ai', 'user')),
  content TEXT NOT NULL,
  tags TEXT,
  sequence INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  branch TEXT CHECK(branch IN ('languages','frameworks','devops','databases','architecture','soft_skills')),
  level INTEGER DEFAULT 1 CHECK(level BETWEEN 1 AND 10),
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  first_seen TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS entry_skills (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  xp_awarded INTEGER DEFAULT 0,
  PRIMARY KEY (entry_id, skill_id)
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  type TEXT CHECK(type IN ('article','video','course','guide','repo','docs')),
  level TEXT CHECK(level IN ('beginner','intermediate','advanced')),
  skill_tags TEXT,
  bookmarked INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  recommended_after_entry TEXT REFERENCES entries(id)
);

CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  overall_level INTEGER DEFAULT 1,
  overall_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_last_date TEXT,
  streak_saves_remaining INTEGER DEFAULT 1,
  streak_save_reset_date TEXT,
  trial_start_date TEXT,
  is_pro INTEGER DEFAULT 0,
  onboarding_complete INTEGER DEFAULT 0,
  notification_time TEXT DEFAULT '20:00',
  weekend_mode TEXT DEFAULT 'grace'
);

CREATE TABLE IF NOT EXISTS skill_extraction_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  input_pattern TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  hit_count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_hit TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cache_pattern ON skill_extraction_cache(input_pattern);

CREATE TABLE IF NOT EXISTS followup_template_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  skill_combination TEXT NOT NULL,
  questions TEXT NOT NULL,
  times_used INTEGER DEFAULT 1,
  avg_score REAL,
  created_at TEXT DEFAULT (datetime('now')),
  last_used TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_followup_skills ON followup_template_cache(skill_combination);

CREATE TABLE IF NOT EXISTS resource_match_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  skill_tags TEXT NOT NULL,
  resource_ids TEXT NOT NULL,
  match_scores TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  bullets TEXT NOT NULL,
  generated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_insights_period ON insights(period_end DESC);
`;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA_SQL);

  // Ensure singleton user_profile row exists
  const profile = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM user_profile WHERE id = 1'
  );
  if (!profile) {
    await db.runAsync('INSERT INTO user_profile (id) VALUES (1)');
  }
}

// ---------------------------------------------------------------------------
// Row ↔ Domain mappers
// ---------------------------------------------------------------------------

interface EntryRow {
  id: string;
  date: string;
  worked_on: string;
  hardest_problem: string | null;
  how_solved: string | null;
  confidence: number;
  mood: number;
  ai_summary: string | null;
  review_score_depth: number | null;
  review_score_awareness: number | null;
  review_score_actionability: number | null;
  review_score_composite: number | null;
  xp_earned: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

function rowToEntry(row: EntryRow): Entry {
  const review_score: ReviewScore | null =
    row.review_score_composite != null
      ? {
          depth: row.review_score_depth!,
          self_awareness: row.review_score_awareness!,
          actionability: row.review_score_actionability!,
          composite: row.review_score_composite,
        }
      : null;
  return {
    id: row.id,
    date: row.date,
    worked_on: row.worked_on,
    hardest_problem: row.hardest_problem,
    how_solved: row.how_solved,
    confidence: row.confidence as Entry['confidence'],
    mood: row.mood as Entry['mood'],
    ai_summary: row.ai_summary,
    review_score,
    xp_earned: row.xp_earned,
    created_at: row.created_at,
  };
}

interface ReviewMessageRow {
  id: string;
  entry_id: string;
  role: string;
  content: string;
  tags: string | null;
  sequence: number;
  created_at: string;
}

function rowToReviewMessage(row: ReviewMessageRow): ReviewMessage {
  return {
    id: row.id,
    entry_id: row.entry_id,
    role: row.role as ReviewMessage['role'],
    content: row.content,
    tags: row.tags ? JSON.parse(row.tags) : [],
    sequence: row.sequence,
  };
}

interface SkillRow {
  id: string;
  name: string;
  branch: string;
  level: number;
  current_xp: number;
  total_xp: number;
}

function rowToSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name,
    branch: row.branch as SkillBranch,
    level: row.level,
    current_xp: row.current_xp,
    total_xp: row.total_xp,
  };
}

interface UserProfileRow {
  overall_level: number;
  overall_xp: number;
  current_streak: number;
  longest_streak: number;
  streak_last_date: string | null;
  streak_saves_remaining: number;
  streak_save_reset_date: string | null;
  trial_start_date: string | null;
  is_pro: number;
  onboarding_complete: number;
  notification_time: string;
  weekend_mode: string;
}

function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    overall_level: row.overall_level,
    overall_xp: row.overall_xp,
    current_streak: row.current_streak,
    longest_streak: row.longest_streak,
    streak_last_date: row.streak_last_date,
    trial_start_date: row.trial_start_date,
    is_pro: row.is_pro === 1,
    title: '', // computed by gamification module
  };
}

interface ResourceRow {
  id: string;
  title: string;
  url: string | null;
  type: string;
  level: string;
  skill_tags: string | null;
  bookmarked: number;
  completed: number;
}

function rowToResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    type: row.type as Resource['type'],
    level: row.level as Resource['level'],
    skill_tags: row.skill_tags ? JSON.parse(row.skill_tags) : [],
    bookmarked: row.bookmarked === 1,
    completed: row.completed === 1,
  };
}

// ---------------------------------------------------------------------------
// Entries CRUD
// ---------------------------------------------------------------------------

export async function createEntry(
  db: SQLiteDatabase,
  entry: Omit<Entry, 'id' | 'created_at' | 'review_score' | 'xp_earned' | 'ai_summary'>
): Promise<string> {
  const result = await db.runAsync(
    `INSERT INTO entries (date, worked_on, hardest_problem, how_solved, confidence, mood)
     VALUES (?, ?, ?, ?, ?, ?)`,
    entry.date,
    entry.worked_on,
    entry.hardest_problem ?? null,
    entry.how_solved ?? null,
    entry.confidence,
    entry.mood
  );
  // SQLite default generates the id; retrieve it
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM entries WHERE rowid = ?',
    result.lastInsertRowId
  );
  return row!.id;
}

export async function getEntry(db: SQLiteDatabase, id: string): Promise<Entry | null> {
  const row = await db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE id = ?', id);
  return row ? rowToEntry(row) : null;
}

export async function getEntriesByDate(db: SQLiteDatabase, date: string): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT * FROM entries WHERE date = ? ORDER BY created_at DESC',
    date
  );
  return rows.map(rowToEntry);
}

export async function getRecentEntries(db: SQLiteDatabase, limit: number = 30): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT * FROM entries ORDER BY date DESC, created_at DESC LIMIT ?',
    limit
  );
  return rows.map(rowToEntry);
}

export async function updateEntryContent(
  db: SQLiteDatabase,
  id: string,
  content: {
    worked_on: string;
    hardest_problem: string | null;
    how_solved: string | null;
    confidence: number;
    mood: number;
  }
): Promise<void> {
  await db.runAsync(
    `UPDATE entries SET
       worked_on = ?,
       hardest_problem = ?,
       how_solved = ?,
       confidence = ?,
       mood = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    content.worked_on,
    content.hardest_problem,
    content.how_solved,
    content.confidence,
    content.mood,
    id
  );
}

export async function updateEntryReview(
  db: SQLiteDatabase,
  id: string,
  review: { ai_summary: string; review_score: ReviewScore; xp_earned: number }
): Promise<void> {
  await db.runAsync(
    `UPDATE entries SET
       ai_summary = ?,
       review_score_depth = ?,
       review_score_awareness = ?,
       review_score_actionability = ?,
       review_score_composite = ?,
       xp_earned = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    review.ai_summary,
    review.review_score.depth,
    review.review_score.self_awareness,
    review.review_score.actionability,
    review.review_score.composite,
    review.xp_earned,
    id
  );
}

// ---------------------------------------------------------------------------
// Review Messages CRUD
// ---------------------------------------------------------------------------

export async function addReviewMessage(
  db: SQLiteDatabase,
  msg: Omit<ReviewMessage, 'id'>
): Promise<string> {
  const result = await db.runAsync(
    `INSERT INTO review_messages (entry_id, role, content, tags, sequence)
     VALUES (?, ?, ?, ?, ?)`,
    msg.entry_id,
    msg.role,
    msg.content,
    JSON.stringify(msg.tags),
    msg.sequence
  );
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM review_messages WHERE rowid = ?',
    result.lastInsertRowId
  );
  return row!.id;
}

export async function getReviewMessages(
  db: SQLiteDatabase,
  entryId: string
): Promise<ReviewMessage[]> {
  const rows = await db.getAllAsync<ReviewMessageRow>(
    'SELECT * FROM review_messages WHERE entry_id = ? ORDER BY sequence ASC',
    entryId
  );
  return rows.map(rowToReviewMessage);
}

// ---------------------------------------------------------------------------
// Skills CRUD
// ---------------------------------------------------------------------------

export async function upsertSkill(
  db: SQLiteDatabase,
  skill: { name: string; branch: SkillBranch }
): Promise<string> {
  await db.runAsync(
    `INSERT INTO skills (name, branch) VALUES (?, ?)
     ON CONFLICT(name) DO UPDATE SET updated_at = datetime('now')`,
    skill.name,
    skill.branch
  );
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM skills WHERE name = ?',
    skill.name
  );
  return row!.id;
}

export async function getSkill(db: SQLiteDatabase, id: string): Promise<Skill | null> {
  const row = await db.getFirstAsync<SkillRow>('SELECT * FROM skills WHERE id = ?', id);
  return row ? rowToSkill(row) : null;
}

export async function getAllSkills(db: SQLiteDatabase): Promise<Skill[]> {
  const rows = await db.getAllAsync<SkillRow>('SELECT * FROM skills ORDER BY branch, name');
  return rows.map(rowToSkill);
}

export async function addSkillXP(
  db: SQLiteDatabase,
  skillId: string,
  xp: number
): Promise<void> {
  await db.runAsync(
    `UPDATE skills SET
       current_xp = current_xp + ?,
       total_xp = total_xp + ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    xp,
    xp,
    skillId
  );
}

export async function setSkillLevel(
  db: SQLiteDatabase,
  skillId: string,
  level: number,
  currentXp: number
): Promise<void> {
  await db.runAsync(
    `UPDATE skills SET level = ?, current_xp = ?, updated_at = datetime('now') WHERE id = ?`,
    level,
    currentXp,
    skillId
  );
}

// ---------------------------------------------------------------------------
// Entry–Skills junction
// ---------------------------------------------------------------------------

export async function linkEntrySkill(
  db: SQLiteDatabase,
  entryId: string,
  skillId: string,
  xpAwarded: number
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO entry_skills (entry_id, skill_id, xp_awarded) VALUES (?, ?, ?)`,
    entryId,
    skillId,
    xpAwarded
  );
}

export async function getEntrySkills(db: SQLiteDatabase, entryId: string): Promise<Skill[]> {
  const rows = await db.getAllAsync<SkillRow>(
    `SELECT s.* FROM skills s
     INNER JOIN entry_skills es ON es.skill_id = s.id
     WHERE es.entry_id = ?`,
    entryId
  );
  return rows.map(rowToSkill);
}

// ---------------------------------------------------------------------------
// Resources CRUD
// ---------------------------------------------------------------------------

export async function upsertResource(
  db: SQLiteDatabase,
  resource: Resource
): Promise<void> {
  await db.runAsync(
    `INSERT INTO resources (id, title, url, type, level, skill_tags, bookmarked, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       url = excluded.url,
       type = excluded.type,
       level = excluded.level,
       skill_tags = excluded.skill_tags`,
    resource.id,
    resource.title,
    resource.url ?? null,
    resource.type,
    resource.level,
    JSON.stringify(resource.skill_tags),
    resource.bookmarked ? 1 : 0,
    resource.completed ? 1 : 0
  );
}

export async function getBookmarkedResources(db: SQLiteDatabase): Promise<Resource[]> {
  const rows = await db.getAllAsync<ResourceRow>(
    'SELECT * FROM resources WHERE bookmarked = 1 ORDER BY title'
  );
  return rows.map(rowToResource);
}

export async function toggleResourceBookmark(
  db: SQLiteDatabase,
  id: string,
  bookmarked: boolean
): Promise<void> {
  await db.runAsync('UPDATE resources SET bookmarked = ? WHERE id = ?', bookmarked ? 1 : 0, id);
}

export async function toggleResourceCompleted(
  db: SQLiteDatabase,
  id: string,
  completed: boolean
): Promise<void> {
  await db.runAsync('UPDATE resources SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export async function getUserProfile(db: SQLiteDatabase): Promise<UserProfile> {
  const row = await db.getFirstAsync<UserProfileRow>(
    'SELECT * FROM user_profile WHERE id = 1'
  );
  return rowToUserProfile(row!);
}

export async function updateUserProfile(
  db: SQLiteDatabase,
  updates: Partial<
    Omit<UserProfileRow, 'onboarding_complete' | 'notification_time' | 'weekend_mode'>
  >
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  await db.runAsync(
    `UPDATE user_profile SET ${fields.join(', ')} WHERE id = 1`,
    ...values
  );
}

export async function getStreakData(
  db: SQLiteDatabase
): Promise<{
  current_streak: number;
  longest_streak: number;
  streak_last_date: string | null;
  streak_saves_remaining: number;
  streak_save_reset_date: string | null;
  weekend_mode: string;
}> {
  const row = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    streak_last_date: string | null;
    streak_saves_remaining: number;
    streak_save_reset_date: string | null;
    weekend_mode: string;
  }>(
    `SELECT current_streak, longest_streak, streak_last_date,
            streak_saves_remaining, streak_save_reset_date, weekend_mode
     FROM user_profile WHERE id = 1`
  );
  return row!;
}

export async function updateStreakData(
  db: SQLiteDatabase,
  data: {
    current_streak: number;
    longest_streak: number;
    streak_last_date: string;
    streak_saves_remaining?: number;
    streak_save_reset_date?: string | null;
  }
): Promise<void> {
  await db.runAsync(
    `UPDATE user_profile SET
       current_streak = ?,
       longest_streak = ?,
       streak_last_date = ?,
       streak_saves_remaining = COALESCE(?, streak_saves_remaining),
       streak_save_reset_date = COALESCE(?, streak_save_reset_date)
     WHERE id = 1`,
    data.current_streak,
    data.longest_streak,
    data.streak_last_date,
    data.streak_saves_remaining ?? null,
    data.streak_save_reset_date ?? null
  );
}

export async function addOverallXP(
  db: SQLiteDatabase,
  xp: number
): Promise<void> {
  await db.runAsync(
    `UPDATE user_profile SET overall_xp = overall_xp + ? WHERE id = 1`,
    xp
  );
}

export async function setOverallLevel(
  db: SQLiteDatabase,
  level: number
): Promise<void> {
  await db.runAsync(
    `UPDATE user_profile SET overall_level = ? WHERE id = 1`,
    level
  );
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

export async function getEntryCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM entries');
  return row!.count;
}

export async function getDistinctEntryDates(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM entries ORDER BY date DESC'
  );
  return rows.map((r) => r.date);
}

// ---------------------------------------------------------------------------
// Insights CRUD
// ---------------------------------------------------------------------------

export interface InsightRow {
  id: string;
  period_start: string;
  period_end: string;
  bullets: string; // JSON array of strings
  generated_at: string;
}

export async function getLatestInsight(db: SQLiteDatabase): Promise<InsightRow | null> {
  const row = await db.getFirstAsync<InsightRow>(
    'SELECT * FROM insights ORDER BY period_end DESC LIMIT 1'
  );
  return row ?? null;
}

export async function saveInsight(
  db: SQLiteDatabase,
  insight: { period_start: string; period_end: string; bullets: string[] }
): Promise<string> {
  const result = await db.runAsync(
    `INSERT INTO insights (period_start, period_end, bullets) VALUES (?, ?, ?)`,
    insight.period_start,
    insight.period_end,
    JSON.stringify(insight.bullets)
  );
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM insights WHERE rowid = ?',
    result.lastInsertRowId
  );
  return row!.id;
}

export async function getEntriesInRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date ASC`,
    startDate,
    endDate
  );
  return rows.map(rowToEntry);
}
