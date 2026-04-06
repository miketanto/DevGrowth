import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { UserProfile } from '../types';
import {
  getUserProfile,
  updateStreakData,
  addOverallXP,
  setOverallLevel,
  getStreakData,
} from '../lib/database';
import { processStreak, getFireTier, type FireTier, type StreakState } from '../lib/streak';
import {
  getOverallLevel,
  getOverallLevelProgress,
  getTitle,
  type Title,
} from '../lib/gamification';

interface UserState {
  profile: UserProfile | null;
  title: Title;
  fireTier: FireTier;
  levelProgress: { current: number; required: number; progress: number };
  loading: boolean;

  // Actions
  hydrate: (db: SQLiteDatabase) => Promise<void>;
  recordEntry: (db: SQLiteDatabase, date: string) => Promise<{ streakSaved: boolean; streakBroken: boolean }>;
  awardXP: (db: SQLiteDatabase, xp: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  title: 'Apprentice Developer',
  fireTier: 'none',
  levelProgress: { current: 0, required: 100, progress: 0 },
  loading: false,

  hydrate: async (db) => {
    set({ loading: true });
    const profile = await getUserProfile(db);
    const title = getTitle(profile.overall_level);
    const fireTier = getFireTier(profile.current_streak);
    const levelProgress = getOverallLevelProgress(profile.overall_xp);
    set({
      profile: { ...profile, title },
      title,
      fireTier,
      levelProgress: {
        current: levelProgress.current,
        required: levelProgress.required,
        progress: levelProgress.progress,
      },
      loading: false,
    });
  },

  recordEntry: async (db, date) => {
    const streakRow = await getStreakData(db);
    const streakState: StreakState = {
      current_streak: streakRow.current_streak,
      longest_streak: streakRow.longest_streak,
      streak_last_date: streakRow.streak_last_date,
      streak_saves_remaining: streakRow.streak_saves_remaining,
      streak_save_reset_date: streakRow.streak_save_reset_date,
      weekend_mode: streakRow.weekend_mode as 'grace' | '7day',
    };

    const update = processStreak(streakState, date);

    await updateStreakData(db, {
      current_streak: update.current_streak,
      longest_streak: update.longest_streak,
      streak_last_date: update.streak_last_date,
      streak_saves_remaining: update.streak_saves_remaining,
      streak_save_reset_date: update.streak_save_reset_date,
    });

    // Re-hydrate profile
    await get().hydrate(db);

    return {
      streakSaved: update.streak_saved,
      streakBroken: update.streak_broken,
    };
  },

  awardXP: async (db, xp) => {
    await addOverallXP(db, xp);
    const profile = await getUserProfile(db);
    const newLevel = getOverallLevel(profile.overall_xp);

    if (newLevel !== profile.overall_level) {
      await setOverallLevel(db, newLevel);
    }

    // Re-hydrate to pick up all changes
    await get().hydrate(db);
  },
}));
