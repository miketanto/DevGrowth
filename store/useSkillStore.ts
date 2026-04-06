import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Skill, SkillBranch } from '../types';
import {
  getAllSkills,
  upsertSkill,
  addSkillXP,
  setSkillLevel,
  linkEntrySkill,
  getEntrySkills,
} from '../lib/database';
import { getSkillLevel, getSkillLevelProgress } from '../lib/gamification';

interface SkillWithProgress extends Skill {
  levelProgress: { current: number; required: number; progress: number };
}

function enrichSkill(skill: Skill): SkillWithProgress {
  const levelProgress = getSkillLevelProgress(skill.total_xp);
  return { ...skill, levelProgress };
}

interface SkillState {
  skills: SkillWithProgress[];
  loading: boolean;

  // Grouped view
  skillsByBranch: () => Record<SkillBranch, SkillWithProgress[]>;

  // Actions
  hydrate: (db: SQLiteDatabase) => Promise<void>;
  ensureSkill: (
    db: SQLiteDatabase,
    skill: { name: string; branch: SkillBranch }
  ) => Promise<string>;
  awardSkillXP: (
    db: SQLiteDatabase,
    skillId: string,
    xp: number
  ) => Promise<void>;
  linkToEntry: (
    db: SQLiteDatabase,
    entryId: string,
    skillId: string,
    xp: number
  ) => Promise<void>;
  getSkillsForEntry: (
    db: SQLiteDatabase,
    entryId: string
  ) => Promise<Skill[]>;
}

const BRANCHES: SkillBranch[] = [
  'languages',
  'frameworks',
  'devops',
  'databases',
  'architecture',
  'soft_skills',
];

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  loading: false,

  skillsByBranch: () => {
    const grouped = Object.fromEntries(
      BRANCHES.map((b) => [b, [] as SkillWithProgress[]])
    ) as Record<SkillBranch, SkillWithProgress[]>;
    for (const skill of get().skills) {
      grouped[skill.branch].push(skill);
    }
    return grouped;
  },

  hydrate: async (db) => {
    set({ loading: true });
    const raw = await getAllSkills(db);
    set({ skills: raw.map(enrichSkill), loading: false });
  },

  ensureSkill: async (db, skill) => {
    const id = await upsertSkill(db, skill);
    await get().hydrate(db);
    return id;
  },

  awardSkillXP: async (db, skillId, xp) => {
    await addSkillXP(db, skillId, xp);

    // Check if skill leveled up
    const allSkills = await getAllSkills(db);
    const skill = allSkills.find((s) => s.id === skillId);
    if (skill) {
      const newLevel = getSkillLevel(skill.total_xp);
      if (newLevel !== skill.level) {
        const currentLevelXp = skill.total_xp; // total_xp is already updated
        await setSkillLevel(db, skillId, newLevel, currentLevelXp);
      }
    }

    await get().hydrate(db);
  },

  linkToEntry: async (db, entryId, skillId, xp) => {
    await linkEntrySkill(db, entryId, skillId, xp);
  },

  getSkillsForEntry: async (db, entryId) => {
    return getEntrySkills(db, entryId);
  },
}));
