export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  worked_on: string;
  hardest_problem: string | null;
  how_solved: string | null;
  confidence: 1 | 2 | 3 | 4 | 5;
  mood: 0 | 1 | 2 | 3 | 4;
  ai_summary: string | null;
  review_score: ReviewScore | null;
  xp_earned: number;
  created_at: string;
}

export interface ReviewScore {
  depth: number; // 1.0 - 5.0
  self_awareness: number;
  actionability: number;
  composite: number;
}

export interface ReviewMessage {
  id: string;
  entry_id: string;
  role: 'ai' | 'user';
  content: string;
  tags: string[];
  sequence: number;
}

export type SkillBranch =
  | 'languages'
  | 'frameworks'
  | 'devops'
  | 'databases'
  | 'architecture'
  | 'soft_skills';

export interface Skill {
  id: string;
  name: string;
  branch: SkillBranch;
  level: number; // 1-10
  current_xp: number; // XP toward next level
  total_xp: number;
}

export interface UserProfile {
  overall_level: number;
  overall_xp: number;
  current_streak: number;
  longest_streak: number;
  streak_last_date: string | null;
  trial_start_date: string | null;
  is_pro: boolean;
  title: string; // computed from level
}

export interface Resource {
  id: string;
  title: string;
  url: string | null;
  type: 'article' | 'video' | 'course' | 'guide' | 'repo' | 'docs';
  level: 'beginner' | 'intermediate' | 'advanced';
  skill_tags: string[];
  bookmarked: boolean;
  completed: boolean;
  match_pct?: number; // AI-computed relevance
}

export interface AIReviewResult {
  follow_up_questions: { question: string; tags: string[] }[];
  extracted_skills: { name: string; branch: SkillBranch }[];
  scores: ReviewScore;
  xp_breakdown: { base: number; followups: number; depth_bonus: number };
  recommended_resources: Resource[];
  summary: string;
}

export interface CostLogEntry {
  task_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cache_hit: boolean;
  estimated_cost: number;
  timestamp: string;
}
