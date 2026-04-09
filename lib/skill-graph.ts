/**
 * Skill graph: co-occurrence queries and force-directed layout engine.
 * Used by SkillConstellation to position nodes.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Skill, SkillBranch } from '../types';
import { getSkillLevelProgress } from './gamification';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillNode {
  id: string;
  name: string;
  branch: SkillBranch;
  level: number;
  totalXp: number;
  /** XP progress within current level (0–1) */
  xpProgress: number;
  /** Number of entries this skill appears in */
  entryCount: number;
  /** Average composite review score for entries with this skill */
  avgScore: number | null;
  /** Recent XP (last 14 days) — used to pick central node */
  recentXp: number;
  // Layout positions (mutated by simulation)
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Display radius based on level */
  radius: number;
}

export interface SkillEdge {
  source: string; // skill id
  target: string; // skill id
  /** Number of entries where both skills co-occur */
  weight: number;
}

export interface GraphData {
  nodes: SkillNode[];
  edges: SkillEdge[];
  centralNodeId: string | null;
}

// ---------------------------------------------------------------------------
// Branch colors (matches design tokens)
// ---------------------------------------------------------------------------

export const BRANCH_COLORS: Record<SkillBranch, string> = {
  languages: '#2DD4BF',   // teal
  frameworks: '#38BDF8',  // blue
  databases: '#A78BFA',   // purple
  devops: '#FBBF24',      // amber
  architecture: '#FB7185', // rose
  soft_skills: '#64748B',  // gray
};

// ---------------------------------------------------------------------------
// Branch cluster centers (normalized 0–1 space, used as attraction targets)
// ---------------------------------------------------------------------------

const BRANCH_CENTERS: Record<SkillBranch, { x: number; y: number }> = {
  languages: { x: 0.3, y: 0.25 },
  frameworks: { x: 0.7, y: 0.25 },
  databases: { x: 0.2, y: 0.6 },
  devops: { x: 0.8, y: 0.6 },
  architecture: { x: 0.5, y: 0.8 },
  soft_skills: { x: 0.5, y: 0.45 },
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

interface CoOccurrenceRow {
  skill_a: string;
  skill_b: string;
  co_count: number;
}

interface SkillStatRow {
  skill_id: string;
  entry_count: number;
  avg_score: number | null;
}

interface RecentXpRow {
  skill_id: string;
  recent_xp: number;
}

export async function getSkillCoOccurrences(
  db: SQLiteDatabase
): Promise<SkillEdge[]> {
  const rows = await db.getAllAsync<CoOccurrenceRow>(
    `SELECT a.skill_id as skill_a, b.skill_id as skill_b, COUNT(*) as co_count
     FROM entry_skills a
     JOIN entry_skills b ON a.entry_id = b.entry_id
     WHERE a.skill_id < b.skill_id
     GROUP BY a.skill_id, b.skill_id
     ORDER BY co_count DESC`
  );
  return rows.map((r) => ({
    source: r.skill_a,
    target: r.skill_b,
    weight: r.co_count,
  }));
}

export async function getSkillStats(
  db: SQLiteDatabase
): Promise<Map<string, { entryCount: number; avgScore: number | null }>> {
  const rows = await db.getAllAsync<SkillStatRow>(
    `SELECT es.skill_id,
            COUNT(DISTINCT es.entry_id) as entry_count,
            AVG(e.review_score_composite) as avg_score
     FROM entry_skills es
     JOIN entries e ON e.id = es.entry_id
     GROUP BY es.skill_id`
  );
  const map = new Map<string, { entryCount: number; avgScore: number | null }>();
  for (const r of rows) {
    map.set(r.skill_id, {
      entryCount: r.entry_count,
      avgScore: r.avg_score != null ? Math.round(r.avg_score * 10) / 10 : null,
    });
  }
  return map;
}

export async function getRecentSkillXp(
  db: SQLiteDatabase,
  days: number = 14
): Promise<Map<string, number>> {
  const rows = await db.getAllAsync<RecentXpRow>(
    `SELECT es.skill_id, SUM(es.xp_awarded) as recent_xp
     FROM entry_skills es
     JOIN entries e ON e.id = es.entry_id
     WHERE e.date >= date('now', ?)
     GROUP BY es.skill_id`,
    `-${days} days`
  );
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.skill_id, r.recent_xp);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Build graph data from DB
// ---------------------------------------------------------------------------

export async function buildGraphData(
  db: SQLiteDatabase,
  skills: Skill[]
): Promise<GraphData> {
  if (skills.length === 0) {
    return { nodes: [], edges: [], centralNodeId: null };
  }

  const [edges, statsMap, recentXpMap] = await Promise.all([
    getSkillCoOccurrences(db),
    getSkillStats(db),
    getRecentSkillXp(db),
  ]);

  const nodes: SkillNode[] = skills.map((s) => {
    const stats = statsMap.get(s.id);
    const progress = getSkillLevelProgress(s.total_xp);
    return {
      id: s.id,
      name: s.name,
      branch: s.branch,
      level: s.level,
      totalXp: s.total_xp,
      xpProgress: progress.progress,
      entryCount: stats?.entryCount ?? 0,
      avgScore: stats?.avgScore ?? null,
      recentXp: recentXpMap.get(s.id) ?? 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: getNodeRadius(s.level),
    };
  });

  // Central node = highest recent XP, fallback to highest total XP
  let centralNodeId: string | null = null;
  if (nodes.length > 0) {
    const sorted = [...nodes].sort(
      (a, b) => b.recentXp - a.recentXp || b.totalXp - a.totalXp
    );
    centralNodeId = sorted[0].id;
  }

  return { nodes, edges, centralNodeId };
}

// ---------------------------------------------------------------------------
// Node sizing
// ---------------------------------------------------------------------------

/** Radius in logical pixels based on skill level (1–10) */
function getNodeRadius(level: number): number {
  // Level 1: 14, Level 10: 32
  return 14 + (level - 1) * 2;
}

// ---------------------------------------------------------------------------
// Force-directed layout simulation
// ---------------------------------------------------------------------------

export interface SimConfig {
  width: number;
  height: number;
  iterations?: number;
  repulsionStrength?: number;
  edgeStrength?: number;
  clusterStrength?: number;
  centerGravity?: number;
  damping?: number;
}

const DEFAULT_CONFIG: Required<SimConfig> = {
  width: 400,
  height: 500,
  iterations: 120,
  repulsionStrength: 3000,
  edgeStrength: 0.06,
  clusterStrength: 0.03,
  centerGravity: 0.01,
  damping: 0.85,
};

/**
 * Run a simple force-directed simulation. Mutates node.x / node.y in place.
 * Returns the nodes array for convenience.
 */
export function runForceSimulation(
  nodes: SkillNode[],
  edges: SkillEdge[],
  centralNodeId: string | null,
  config: SimConfig
): SkillNode[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { width, height } = cfg;
  const cx = width / 2;
  const cy = height / 2;

  // Build adjacency lookup
  const edgeMap = new Map<string, { target: string; weight: number }[]>();
  for (const e of edges) {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
    if (!edgeMap.has(e.target)) edgeMap.set(e.target, []);
    edgeMap.get(e.source)!.push({ target: e.target, weight: e.weight });
    edgeMap.get(e.target)!.push({ target: e.source, weight: e.weight });
  }

  // Initialize positions: central node at center, others scattered by branch
  for (const node of nodes) {
    if (node.id === centralNodeId) {
      node.x = cx;
      node.y = cy;
    } else {
      const bc = BRANCH_CENTERS[node.branch];
      // Start near branch center with jitter
      node.x = bc.x * width + (Math.random() - 0.5) * width * 0.3;
      node.y = bc.y * height + (Math.random() - 0.5) * height * 0.3;
    }
    node.vx = 0;
    node.vy = 0;
  }

  // Run iterations
  for (let iter = 0; iter < cfg.iterations; iter++) {
    const alpha = 1 - iter / cfg.iterations; // cooling factor

    // Reset forces
    for (const node of nodes) {
      node.vx = 0;
      node.vy = 0;
    }

    // Repulsion: all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) dist = 1;
        const force = (cfg.repulsionStrength * alpha) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // Edge attraction
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.source);
      const b = nodes.find((n) => n.id === edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;
      const strength = cfg.edgeStrength * Math.log(1 + edge.weight) * alpha;
      const fx = (dx / dist) * dist * strength;
      const fy = (dy / dist) * dist * strength;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Branch clustering: pull toward branch center
    for (const node of nodes) {
      if (node.id === centralNodeId) continue; // central node stays centered
      const bc = BRANCH_CENTERS[node.branch];
      const targetX = bc.x * width;
      const targetY = bc.y * height;
      node.vx += (targetX - node.x) * cfg.clusterStrength * alpha;
      node.vy += (targetY - node.y) * cfg.clusterStrength * alpha;
    }

    // Center gravity: gentle pull to center for all
    for (const node of nodes) {
      node.vx += (cx - node.x) * cfg.centerGravity * alpha;
      node.vy += (cy - node.y) * cfg.centerGravity * alpha;
    }

    // Central node: strong pull to center
    if (centralNodeId) {
      const central = nodes.find((n) => n.id === centralNodeId);
      if (central) {
        central.vx += (cx - central.x) * 0.1;
        central.vy += (cy - central.y) * 0.1;
      }
    }

    // Apply velocities with damping, clamp to bounds
    const padding = 40;
    for (const node of nodes) {
      node.vx *= cfg.damping;
      node.vy *= cfg.damping;
      node.x += node.vx;
      node.y += node.vy;
      // Keep within bounds
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Edge strength normalization (for rendering thickness/opacity)
// ---------------------------------------------------------------------------

export function normalizeEdgeWeights(
  edges: SkillEdge[]
): (SkillEdge & { normalized: number })[] {
  if (edges.length === 0) return [];
  const maxWeight = Math.max(...edges.map((e) => e.weight));
  return edges.map((e) => ({
    ...e,
    normalized: maxWeight > 0 ? e.weight / maxWeight : 0,
  }));
}
