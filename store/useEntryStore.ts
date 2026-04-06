import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Entry, ReviewMessage, ReviewScore } from '../types';
import {
  createEntry,
  getEntry,
  getRecentEntries,
  getEntriesByDate,
  updateEntryReview,
  addReviewMessage,
  getReviewMessages,
} from '../lib/database';

interface EntryDraft {
  date: string;
  worked_on: string;
  hardest_problem: string | null;
  how_solved: string | null;
  confidence: 1 | 2 | 3 | 4 | 5;
  mood: 0 | 1 | 2 | 3 | 4;
}

const EMPTY_DRAFT: EntryDraft = {
  date: '',
  worked_on: '',
  hardest_problem: null,
  how_solved: null,
  confidence: 3,
  mood: 2,
};

interface EntryState {
  // Current draft
  draft: EntryDraft;
  // Recently loaded entries
  entries: Entry[];
  // Current active entry (for review flow)
  activeEntry: Entry | null;
  // Review messages for active entry
  reviewMessages: ReviewMessage[];
  // Loading states
  loading: boolean;

  // Draft actions
  updateDraft: (partial: Partial<EntryDraft>) => void;
  resetDraft: () => void;

  // CRUD actions (require db)
  submitEntry: (db: SQLiteDatabase) => Promise<string>;
  loadRecentEntries: (db: SQLiteDatabase, limit?: number) => Promise<void>;
  loadEntriesByDate: (db: SQLiteDatabase, date: string) => Promise<void>;
  setActiveEntry: (db: SQLiteDatabase, entryId: string) => Promise<void>;
  clearActiveEntry: () => void;
  saveReview: (
    db: SQLiteDatabase,
    entryId: string,
    review: { ai_summary: string; review_score: ReviewScore; xp_earned: number }
  ) => Promise<void>;
  addMessage: (db: SQLiteDatabase, msg: Omit<ReviewMessage, 'id'>) => Promise<void>;

  // Hydration
  hydrate: (db: SQLiteDatabase) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set, get) => ({
  draft: { ...EMPTY_DRAFT },
  entries: [],
  activeEntry: null,
  reviewMessages: [],
  loading: false,

  updateDraft: (partial) =>
    set((state) => ({ draft: { ...state.draft, ...partial } })),

  resetDraft: () => set({ draft: { ...EMPTY_DRAFT } }),

  submitEntry: async (db) => {
    const { draft } = get();
    set({ loading: true });
    try {
      const id = await createEntry(db, {
        date: draft.date,
        worked_on: draft.worked_on,
        hardest_problem: draft.hardest_problem,
        how_solved: draft.how_solved,
        confidence: draft.confidence,
        mood: draft.mood,
      });
      // Reload entries and set as active
      const entry = await getEntry(db, id);
      set((state) => ({
        activeEntry: entry,
        entries: entry ? [entry, ...state.entries] : state.entries,
        draft: { ...EMPTY_DRAFT },
        loading: false,
      }));
      return id;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  loadRecentEntries: async (db, limit = 30) => {
    set({ loading: true });
    const entries = await getRecentEntries(db, limit);
    set({ entries, loading: false });
  },

  loadEntriesByDate: async (db, date) => {
    set({ loading: true });
    const entries = await getEntriesByDate(db, date);
    set({ entries, loading: false });
  },

  setActiveEntry: async (db, entryId) => {
    const entry = await getEntry(db, entryId);
    const messages = entry ? await getReviewMessages(db, entryId) : [];
    set({ activeEntry: entry, reviewMessages: messages });
  },

  clearActiveEntry: () => set({ activeEntry: null, reviewMessages: [] }),

  saveReview: async (db, entryId, review) => {
    await updateEntryReview(db, entryId, review);
    const updated = await getEntry(db, entryId);
    set((state) => ({
      activeEntry: updated,
      entries: state.entries.map((e) => (e.id === entryId && updated ? updated : e)),
    }));
  },

  addMessage: async (db, msg) => {
    await addReviewMessage(db, msg);
    const messages = await getReviewMessages(db, msg.entry_id);
    set({ reviewMessages: messages });
  },

  hydrate: async (db) => {
    set({ loading: true });
    const entries = await getRecentEntries(db, 30);
    set({ entries, loading: false });
  },
}));
