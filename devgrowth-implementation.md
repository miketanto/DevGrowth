# DEVGROWTH — Implementation Document

**A technical build guide for Claude Code**

Version 1.0 | March 2026
React Native + Expo | Supabase | Claude API

---

## 1. Project Overview

DevGrowth is a mobile-first gamified reflection journal for developers. Users log their coding day through a structured entry, then an AI engine reviews their work by asking contextual follow-up questions, extracts skills, awards XP based on reflection depth, and recommends study resources. The core metaphor is a chess game review applied to your coding day.

### 1.1 Architecture Summary

The app uses a three-layer architecture: a React Native client with local-first SQLite storage, a Supabase backend for auth/sync/edge functions, and a multi-model AI layer that routes tasks to the cheapest Claude model that clears the quality bar.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Client | React Native + Expo | Cross-platform mobile app with offline-first SQLite |
| Backend | Supabase | Auth, PostgreSQL, Edge Functions, Realtime sync |
| AI | Claude API (multi-model) | Haiku for extraction, Sonnet for review/scoring, Opus for patterns |
| State | SQLite + AsyncStorage | Local-first drafts, fast reads, sync when online |

### 1.2 Design System Reference

The UI follows a **Terminal Luxury** aesthetic: dark analytical surfaces, monospaced data labels, warm teal growth signals. See the prototype `.jsx` file for the full interactive reference.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2DD4BF` (Electric Teal) | CTAs, growth indicators, XP, progress bars |
| AI Blue | `#38BDF8` | AI review elements, chat bubbles, review scores |
| Mastery Purple | `#A78BFA` | Skill levels, titles, framework branch |
| Streak Amber | `#FBBF24` | Streaks, fire icon, bookmarks, database branch |
| Alert Rose | `#FB7185` | Low confidence, locked features, errors |
| Background | `#080B11` | App background (near-black with blue undertone) |
| Surface | `#161D28` | Cards, elevated containers |
| Border | `#1E2736` | Dividers, card borders, inactive states |
| Display Font | JetBrains Mono | Labels, data, badges, monospaced accents |
| Body Font | DM Sans | Body text, descriptions, form inputs |

---

## 2. Project Structure

Initialize with Expo managed workflow. The structure below reflects the full app; build only the files needed for each phase.

```bash
npx create-expo-app DevGrowth --template blank-typescript
cd DevGrowth
npx expo install expo-sqlite expo-notifications expo-secure-store
npm install @supabase/supabase-js react-native-reanimated
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-svg zustand
```

```
devgrowth/
  app/                          # Expo Router file-based routing
    (tabs)/                     # Bottom tab navigator
      _layout.tsx               # Tab bar config (4 tabs)
      today.tsx                 # Today screen (default)
      journey.tsx               # Timeline of past entries
      skills.tsx                # Skill tree view
      library.tsx               # Resource library
    entry/                      # Entry flow (not in tabs)
      new.tsx                   # Daily entry form
      review.tsx                # AI review conversation
      score.tsx                 # Review score reveal
    profile.tsx                 # Profile / stats
    paywall.tsx                 # Pro upgrade screen
    onboarding/                 # First-launch flow
      index.tsx                 # Welcome
      how-it-works.tsx          # Step explanation
      pick-skills.tsx           # Initial skill selection
    _layout.tsx                 # Root layout (auth gate)
  components/
    ui/                         # Design system primitives
      Card.tsx
      Badge.tsx
      ProgressBar.tsx
      Button.tsx
      ScreenHeader.tsx
    icons/                      # Custom SVG icon components
      index.tsx                 # Barrel export all icons
    SkillTree.tsx               # Constellation SVG visualization
    ReviewChat.tsx              # AI review chat UI
    StreakCard.tsx               # Streak display with week dots
    ScoreRing.tsx               # Animated conic score ring (SVG)
    ConfidenceSlider.tsx        # 1-5 button row
    MoodPicker.tsx              # SVG face icons
    EntryCard.tsx               # Journey entry row
    LevelDots.tsx               # 10-dot level indicator
  lib/
    supabase.ts                 # Supabase client init
    database.ts                 # SQLite schema + queries
    sync.ts                     # Offline-first sync engine
    ai/
      router.ts                 # Task-to-model routing
      prompts.ts                # All prompt templates
      extract-skills.ts         # Haiku: skill tag extraction
      generate-followups.ts     # Sonnet: follow-up questions
      score-reflection.ts       # Sonnet: quality scoring
      recommend-resources.ts    # Sonnet: resource matching
      detect-patterns.ts        # Opus: weekly patterns (batched)
    gamification.ts             # XP calc, level thresholds, titles
    streak.ts                   # Streak logic with weekend grace
  store/
    useEntryStore.ts            # Zustand: current entry state
    useUserStore.ts             # Zustand: profile, level, streak
    useSkillStore.ts            # Zustand: skill tree data
  theme/
    colors.ts                   # Color tokens
    typography.ts               # Font families + sizes
    spacing.ts                  # Spacing scale
  types/
    index.ts                    # All TypeScript interfaces
  supabase/
    migrations/                 # SQL migration files
    functions/                  # Edge Functions
      ai-review/index.ts        # Server-side AI orchestration
      weekly-patterns/index.ts  # Opus batch job
```

---

## 3. Database Schema

### 3.1 Local SQLite (Offline-First)

Every table includes `synced_at` and `updated_at` columns. Entries are written locally first, then synced to Supabase when online. The sync engine uses `updated_at` comparison with last-write-wins conflict resolution.

```sql
-- lib/database.ts: SQLite schema

CREATE TABLE entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date TEXT NOT NULL,                    -- YYYY-MM-DD
  worked_on TEXT NOT NULL,
  hardest_problem TEXT,
  how_solved TEXT,
  confidence INTEGER CHECK(confidence BETWEEN 1 AND 5),
  mood INTEGER CHECK(mood BETWEEN 0 AND 4),
  ai_summary TEXT,                       -- AI-generated entry summary
  review_score_depth REAL,
  review_score_awareness REAL,
  review_score_actionability REAL,
  review_score_composite REAL,
  xp_earned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE TABLE review_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id TEXT NOT NULL REFERENCES entries(id),
  role TEXT CHECK(role IN ('ai', 'user')),
  content TEXT NOT NULL,
  tags TEXT,                              -- JSON array of skill tags
  sequence INTEGER NOT NULL,              -- message order
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE skills (
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

CREATE TABLE entry_skills (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  xp_awarded INTEGER DEFAULT 0,
  PRIMARY KEY (entry_id, skill_id)
);

CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  type TEXT CHECK(type IN ('article','video','course','guide','repo','docs')),
  level TEXT CHECK(level IN ('beginner','intermediate','advanced')),
  skill_tags TEXT,                        -- JSON array
  bookmarked INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  recommended_after_entry TEXT REFERENCES entries(id)
);

CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY CHECK(id = 1),   -- singleton
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
  weekend_mode TEXT DEFAULT 'grace'       -- 'grace' or '7day'
);
```

### 3.2 Cache Tables (Cost Optimization)

These tables power the AI cost reduction strategy described in Section 8.

```sql
CREATE TABLE skill_extraction_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  input_pattern TEXT NOT NULL,            -- normalized text trigger (e.g., 'react hooks')
  skill_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  hit_count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_hit TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_cache_pattern ON skill_extraction_cache(input_pattern);

CREATE TABLE followup_template_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  skill_combination TEXT NOT NULL,        -- sorted, comma-separated skill names
  questions TEXT NOT NULL,                 -- JSON array of question templates
  times_used INTEGER DEFAULT 1,
  avg_score REAL,                          -- avg reflection score when these Qs used
  created_at TEXT DEFAULT (datetime('now')),
  last_used TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_followup_skills ON followup_template_cache(skill_combination);

CREATE TABLE resource_match_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  skill_tags TEXT NOT NULL,               -- sorted JSON array of skill names
  resource_ids TEXT NOT NULL,             -- JSON array of matched resource IDs
  match_scores TEXT NOT NULL,             -- JSON array of match percentages
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT                          -- invalidate when library updates
);
```

### 3.3 Supabase PostgreSQL (Cloud)

Mirror the SQLite schema in Postgres with Row Level Security. Each table gets a `user_id` column referencing `auth.users`. RLS policies ensure users only access their own data. The Supabase schema adds server-side timestamps and enables realtime subscriptions for future multi-device sync.

### 3.4 XP and Level Thresholds

| Level | Total XP Required | Title |
|-------|------------------|-------|
| 1-5 | 0 / 100 / 250 / 500 / 850 | Apprentice Developer |
| 6-15 | 1,300 / 1,850 / 2,500 / 3,250 / 4,100 ... | Journeyman Developer |
| 16-30 | 5,050 / 6,100 / 7,250 ... | Craftsman Developer |
| 31-50 | Escalating curve ... | Expert Developer |
| 51-75 | Escalating curve ... | Architect |
| 76-100 | Escalating curve ... | Grandmaster |

Skill levels 1-10 use a separate XP track per skill: Lv.2 = 100 XP, Lv.3 = 250 XP, scaling to Lv.10 = 5,000 XP. Use an exponential formula: `xp_required = floor(100 * 1.65^(level-2))` for levels 2-10.

---

## 4. AI Layer Implementation

### 4.1 Model Router

The router is a simple config-driven switch in `lib/ai/router.ts`. No AI-based routing. Each task type maps to a model tier. The config is hot-swappable from the server.

| Task | Model | Estimated Cost/Call |
|------|-------|-------------------|
| Skill extraction + summary + categorization | `claude-haiku-4-5-20251001` | ~$0.002 (combined) |
| Follow-up questions (2-3) | `claude-sonnet-4-6` | ~$0.011 |
| Reflection quality scoring | `claude-sonnet-4-6` | ~$0.007 |
| Resource recommendation | `claude-sonnet-4-6` | ~$0.005 |
| Weekly pattern detection | `claude-opus-4-6` (batch) | ~$0.04 |
| Deep coaching moments | `claude-opus-4-6` | ~$0.06 |

> **Note:** Mood/confidence parsing has been removed as an AI task. The user already selects these via UI controls — there is zero reason to pay AI to parse what the user explicitly chose.

### 4.2 Prompt Templates

All prompts live in `lib/ai/prompts.ts`. Each returns a messages array. System prompts are designed for prompt caching (identical across users). Key prompts:

**Follow-up Generation (Sonnet):** The system prompt establishes the chess review mentor persona. It receives the full entry text plus the user's skill history and confidence pattern. It must output exactly 2-3 questions as a JSON array, each with a `question` string and an array of `tags`. Questions should be contextual and probing, never generic.

**Skill Extraction (Haiku):** Receives entry text + review conversation. Outputs a JSON array of skill objects: `{ name, branch, confidence_signal }`. Must normalize skill names (e.g., "React.js" and "ReactJS" both map to "React"). Include a branch classification from the fixed set. This call also produces the entry summary and skill categorization in one combined output.

**Reflection Scoring (Sonnet):** Receives the full review conversation. Outputs three scores (1.0-5.0): `depth`, `self_awareness`, `actionability`, plus a one-sentence summary of each dimension. The composite score is the average.

### 4.3 Server-Side Orchestration

The AI pipeline runs in a Supabase Edge Function (`supabase/functions/ai-review/index.ts`) to keep API keys off the client. The flow after entry submission:

1. Client submits entry to Edge Function with entry text + user context.
2. **Cache check:** Look up skill extraction cache for known patterns in the entry text.
3. Edge Function calls Haiku for skill extraction + summarization (combined call, skip if fully cached).
4. Edge Function calls Sonnet for follow-up question generation, passing extracted skills as context.
5. Follow-up questions are streamed back to the client. User responds to each one.
6. After all responses, Edge Function calls Sonnet for reflection scoring and resource matching in parallel (check resource cache first).
7. Results (scores, skills, XP, resources) are written to Supabase and pushed to client.
8. Client syncs results to local SQLite. Cache results for future lookups.

### 4.4 Prompt Caching Strategy

Every API call includes the `anthropic-beta: prompt-caching-2024-07-31` header. System prompts are identical per task type across all users, so cache hit rates should be high. This reduces input token costs by up to 90% on repeated prompts. The system prompt for follow-up generation is the longest (~800 tokens) and benefits most from caching.

```typescript
// lib/ai/router.ts - Structure every API call as:
// system: [LONG CACHEABLE PERSONA + RULES + OUTPUT FORMAT]  (800+ tokens)
// user:   [SHORT USER-SPECIFIC CONTEXT + ENTRY TEXT]

// Front-load the system prompt with persona, rules, and output format.
// Put user-specific context (entry text, skill history) in the user message,
// not the system prompt. This maximizes cache hit rate.
```

---

## 5. Build Phases

Each phase is designed to be a single Claude Code session (or a few focused sessions). Complete each phase before starting the next. Test by using the app yourself daily.

### Phase 1: Foundation + Daily Entry (Week 1)

**Goal:** Working app with entry form, local storage, and basic navigation. No AI yet.

| Task | Files | Details |
|------|-------|---------|
| Expo project setup | `package.json`, `app.json`, `tsconfig.json` | Initialize with TypeScript template, install all deps listed in Section 2 |
| Theme system | `theme/colors.ts`, `typography.ts`, `spacing.ts` | Export all design tokens from the prototype. Dark theme only for v1 |
| Design primitives | `components/ui/*` | Card, Badge, ProgressBar, Button, ScreenHeader. Match prototype exactly |
| SVG icon library | `components/icons/index.tsx` | Port all Icons from prototype to react-native-svg components |
| SQLite schema | `lib/database.ts` | Create all tables from Section 3 (including cache tables). Init on app launch. Singleton user_profile row |
| Tab navigation | `app/(tabs)/_layout.tsx` | 4-tab bottom bar: Today, Journey, Skills, Library. Custom tab bar matching prototype |
| Today screen | `app/(tabs)/today.tsx` | Streak card, CTA button, stats cards, yesterday's summary. Pull from SQLite |
| Entry form | `app/entry/new.tsx` | All fields, confidence slider, mood picker. Save to SQLite on submit |
| Onboarding flow | `app/onboarding/*` | 3-screen flow. Set onboarding_complete flag. Skill picker saves initial skills |
| Streak logic | `lib/streak.ts` | Weekend grace, streak saves, fire progression. Update on entry submission |

### Phase 2: AI Review Engine (Week 2)

**Goal:** Full AI review flow working end-to-end. This is the core product.

| Task | Files | Details |
|------|-------|---------|
| Supabase setup | `lib/supabase.ts`, `supabase/migrations/*` | Create project, set up auth, mirror SQLite schema in Postgres, enable RLS |
| AI router | `lib/ai/router.ts` | Config map from task enum to model string. Retry-on-failure escalation. Cache check before every call |
| Prompt templates | `lib/ai/prompts.ts` | All prompts from Section 4.2. Export as functions that take context params |
| Edge Function: review | `supabase/functions/ai-review/index.ts` | Full orchestration pipeline from Section 4.3 with cache checks. Stream follow-ups to client |
| Review chat UI | `app/entry/review.tsx`, `components/ReviewChat.tsx` | Typing indicator, AI message bubbles, user response textarea, progress bar |
| Skill extraction | `lib/ai/extract-skills.ts` | Parse Haiku response, normalize names, upsert skills in SQLite. Write to cache |
| XP calculation | `lib/gamification.ts` | Deterministic rules: base 10 + 15/followup + 10 depth bonus + 25 pattern. No AI |
| Score screen | `app/entry/score.tsx`, `components/ScoreRing.tsx` | Animated SVG ring reveal, dimension breakdown, XP summary with skill badges |
| Reflection scoring | `lib/ai/score-reflection.ts` | Call Sonnet, parse 3 dimension scores, save to entry record |
| Cost logging | `lib/ai/cost-logger.ts` | Log every AI call: task type, model, tokens in/out, latency, cache hit/miss, cost |

### Phase 3: Skill Tree + Journey (Week 3)

**Goal:** Visual skill tree, journey timeline, and profile screen all populated with real data.

| Task | Files | Details |
|------|-------|---------|
| Skill tree visualization | `components/SkillTree.tsx`, `app/(tabs)/skills.tsx` | SVG constellation with branch nodes. Tap to expand. Level rings + dots per skill |
| Journey timeline | `app/(tabs)/journey.tsx`, `components/EntryCard.tsx` | Scrollable list, confidence sparkline chart, colored timeline dots by score |
| Profile screen | `app/profile.tsx` | Avatar, level/title, streak, stats grid, review quality chart, achievements |
| Resource library | `app/(tabs)/library.tsx` | AI recommendations section + full library. Bookmark toggle. Type icons |
| Resource matching | `lib/ai/recommend-resources.ts` | Sonnet matches recent entry skills to curated resource DB. Show match %. Cache results |
| Offline sync engine | `lib/sync.ts` | Queue writes when offline, sync on connectivity. Last-write-wins. Retry logic |
| Level-up animations | `components/ui/*` | Reanimated: XP counter increment, level-up celebration, new skill branch unlock |

### Phase 4: Monetization + Polish (Week 4)

**Goal:** Paywall, notifications, and the polish needed for daily use.

| Task | Files | Details |
|------|-------|---------|
| Reverse trial logic | `lib/trial.ts`, `store/useUserStore.ts` | Track trial_start_date. Day 10 soft nudge. Day 14 lock AI features |
| Paywall screen | `app/paywall.tsx` | Personalized value proof, annual/monthly toggle, lifetime anchor. From prototype |
| Blurred AI preview | `app/entry/review.tsx` | Post-trial: show blurred AI response with unlock CTA. Gaussian blur overlay |
| Push notifications | `lib/notifications.ts` | Expo Notifications. Daily reminder at user-configured time. Streak-aware copy |
| Monthly summary | `supabase/functions/weekly-patterns/index.ts` | Opus batch call once/week. Store pattern insights. Surface in Today screen |
| Error handling | Throughout | API failures, offline edge cases, empty states, loading skeletons |
| App Store prep | `app.json`, `assets/*` | Icon, splash screen, store screenshots, metadata |

---

## 6. Claude Code Session Guide

Each session below is designed to be a single focused Claude Code conversation. Copy the session prompt and paste it to start building. Reference this document and the prototype file as context.

### Session 1: Project Init + Theme + Primitives

```
I'm building DevGrowth, a React Native + Expo app.
Initialize the project with TypeScript, install these deps:
  expo-sqlite, expo-secure-store, @supabase/supabase-js,
  react-native-reanimated, react-native-svg,
  @react-navigation/native, @react-navigation/bottom-tabs, zustand

Then create the theme system (theme/colors.ts, typography.ts, spacing.ts)
using these exact tokens:
  Primary teal: #2DD4BF, AI blue: #38BDF8, Purple: #A78BFA,
  Amber: #FBBF24, Rose: #FB7185, BG: #080B11,
  Surface: #161D28, Border: #1E2736
  Fonts: JetBrains Mono (mono), DM Sans (body)

Then build the design system primitives in components/ui/:
  Card, Badge, ProgressBar, Button, ScreenHeader
These should be dark-themed, match the design tokens exactly.
Card: surfaceRaised bg, 1px border, 16px radius, optional glow prop.
Badge: mono font, uppercase, colored bg at 0.1 opacity.
ProgressBar: gradient fill with glow shadow.
Button: primary (teal bg) and secondary (surface bg, border) variants.
```

### Session 2: Icons + Navigation + Today Screen

```
Build the SVG icon library in components/icons/index.tsx.
Port these from the prototype: fire, check, x, plus, arrowLeft,
  chat, bookmark, star, zap, trophy, target, book, film, fileText,
  code, graduation, pencil, shield, seed, diamond,
  branchLang, branchFramework, branchDevops, branchDB, lock.
Use react-native-svg. Each icon takes size and color props.

Then set up Expo Router with file-based routing:
  app/(tabs)/_layout.tsx - 4 tabs with custom tab bar
  app/(tabs)/today.tsx - Today screen
The tab bar should match the prototype: dark surface bg,
  teal active indicator line, mono uppercase labels.

Build the Today screen with: StreakCard, CTA button to start entry,
  two stat cards (Level + Review Avg), yesterday entry card,
  fastest growing skills row. Use placeholder data for now.
```

### Session 3: SQLite + Entry Form + Streak

```
Set up the SQLite database in lib/database.ts.
[Paste the full schema from Section 3.1 and 3.2 of the implementation doc]

Create the Zustand stores:
  store/useEntryStore.ts - current entry draft state
  store/useUserStore.ts - profile, level, streak, trial state
  store/useSkillStore.ts - all skills with levels and XP

Build the entry form at app/entry/new.tsx:
  - 3 text fields (worked on, hardest problem, how solved)
  - ConfidenceSlider component (1-5 buttons, color-coded)
  - MoodPicker component (5 SVG face icons)
  - Submit button that saves to SQLite and navigates to review

Implement streak logic in lib/streak.ts:
  - Weekend grace (Sat/Sun don't break streak unless 7-day mode)
  - One streak save per month
  - Update streak on each entry submission
```

### Session 4: AI Review Engine (Edge Function + Client)

```
Build the AI review pipeline.

Server side (supabase/functions/ai-review/index.ts):
  1. Receive entry text + user context
  2. Check skill_extraction_cache for known patterns
  3. Call Haiku for skill extraction + summarization (combined, skip if cached)
  4. Call Sonnet for 2-3 follow-up questions
  5. Stream questions back to client
  6. After user responds, call Sonnet for reflection scoring
  7. Check resource_match_cache before calling Sonnet for resources
  8. Return: skills[], scores{}, xp, resource recommendations[]
  9. Write results to cache tables for future lookups

Client side (app/entry/review.tsx):
  - ReviewChat component with AI typing indicator (3 pulsing dots)
  - AI question bubble (blue-purple gradient bg, left-aligned)
  - User response textarea (right-aligned, surface bg)
  - Progress bar showing question X of Y
  - Submit navigates to next question or score screen

Create all prompt templates in lib/ai/prompts.ts.
System prompts should be 800+ tokens to benefit from caching.
Follow-up prompt must output JSON: [{question, tags}]
Score prompt must output JSON: {depth, awareness, actionability, summaries}

Also create lib/ai/cost-logger.ts:
  Log every AI call with: task_type, model, input_tokens, output_tokens,
  latency_ms, cache_hit (boolean), estimated_cost.
  Store in Supabase analytics table.
```

### Session 5: Score Screen + Gamification

```
Build the review score reveal at app/entry/score.tsx.
  - Animated SVG ring (stroke-dashoffset reveal over 1.2s)
  - 3 dimension bars: depth, self-awareness, actionability
  - XP earned card with breakdown and skill badges
  - "Done" button returns to Today

Implement gamification engine in lib/gamification.ts:
  - XP rules: base 10, +15/followup, +10 depth bonus, +25 pattern
  - Skill level thresholds: xp_required = floor(100 * 1.65^(level-2))
  - Overall level thresholds and title mapping
  - Level-up detection (returns {leveled_up, new_level, new_title})

Wire everything together:
  - Entry submission triggers AI pipeline
  - AI results update skills, XP, level in SQLite + Zustand
  - Today screen reflects updated stats on return
```

### Session 6: Skills + Journey + Library + Profile

```
Build the remaining 4 screens:

Skills (app/(tabs)/skills.tsx):
  - SkillTree SVG constellation (center node + 4 branch nodes)
  - Tap branch to expand: show skills with level rings + dots
  - Other branches collapse to quick-switch buttons

Journey (app/(tabs)/journey.tsx):
  - Confidence sparkline (7-day bar chart, color by value)
  - Scrollable entry list with timeline dots colored by score
  - Each entry: title, date, score, XP, skill badges

Library (app/(tabs)/library.tsx):
  - "Based on today's review" section with match %
  - Full resource list with type icons, bookmark toggle

Profile (app/profile.tsx):
  - Avatar, level ring, title, streak stats, 2x2 stat grid
  - Review quality bar chart (4 weeks)
  - Achievement badges (earned vs locked states)
```

### Session 7: Paywall + Trial + Notifications

```
Implement the monetization layer:

Trial system (lib/trial.ts):
  - Track trial_start_date in user_profile
  - Day 10: show soft nudge with personalized stats
  - Day 14: lock AI features, show blurred preview
  - Free tier: entry form + streaks work, AI features locked

Paywall (app/paywall.tsx):
  - "Your trial ends in X days" badge
  - Personalized value proof card (skills found, Qs asked, etc.)
  - "Without Pro you lose" list with lock icons
  - Annual/monthly toggle, lifetime anchor card
  - Primary CTA: teal, full width

Push notifications (lib/notifications.ts):
  - Expo Notifications setup with permission request
  - Daily reminder at user-configured time
  - Copy rotation: streak-aware, skill-aware messages
  - Smart suppression: don't remind for meals already logged
    (store full timestamps from day one to enable future
    pattern-based notification timing)
```

---

## 7. Key Technical Decisions

### 7.1 Why Local-First

Entries should work fully offline. The user might be on a plane, in a tunnel, or at a cafe with bad wifi. The daily entry is the core habit, and any friction breaks it. SQLite is the source of truth; Supabase is the sync layer. If the server is down, the app still works. AI features degrade gracefully: the entry saves locally, and AI review runs when connectivity returns.

### 7.2 Why Edge Functions for AI

Never put API keys on the client. All Claude API calls go through Supabase Edge Functions. This also enables server-side prompt caching (system prompts are identical across users), request logging for cost monitoring, and the ability to swap models without an app update. The Edge Function acts as an orchestrator that calls multiple models in sequence and returns the combined result.

### 7.3 Why Zustand Over Context

Three stores (entry, user, skills) with clear boundaries. Zustand gives us persistence middleware for hydrating from SQLite on app launch, selector-based re-renders (only the component that needs streak count re-renders when it changes), and simple async actions for the AI pipeline. No provider nesting, no boilerplate.

### 7.4 Why Not Expo Router API Routes

Supabase Edge Functions give us auth context (the JWT is already verified), database access without a separate connection, and built-in CORS handling. Expo Router API routes would require duplicating auth logic and adding a separate API server to deploy.

### 7.5 Cost Guardrails

Estimated daily AI cost per user: $0.008 (with optimizations from Section 8). At $49.99/year, that is a 94% gross margin on AI spend. Guardrails to implement: per-user daily call limit (prevent abuse), Opus calls only via server-side cron (never user-triggered), cost logging per Edge Function invocation, and alerts if daily cost per user exceeds $0.05.

---

## 8. AI Cost Optimization Playbook

These strategies are adapted from real-world lessons building AI-powered consumer apps. The core insight: **most AI calls in a daily-use app are redundant.** Users do the same things repeatedly, and paying frontier model prices for repeated work destroys margins. The goal is to reduce the estimated $0.027/user/day (uncached) to under $0.010/user/day while maintaining quality.

### 8.1 Response Caching (Biggest Impact)

Developers, like everyone, are creatures of habit. They work with the same languages, frameworks, and tools day after day. If a user mentions React in Monday's entry and again on Tuesday, you should not pay Haiku to extract and categorize "React" a second time. The same applies to resource recommendations: if the library already matched Docker resources yesterday, the same resources are still relevant today.

**Expected impact:** 50-70% reduction in Haiku calls, 20-30% reduction in Sonnet calls. Based on real-world data from similar apps, 60-70% of API calls hit cached results once caching is implemented.

**Implementation:** The three cache tables in Section 3.2 power this. Before calling any AI model:
1. **Skill extraction:** Tokenize the entry text, look for known patterns in `skill_extraction_cache`. If all skills are cached, skip Haiku entirely.
2. **Follow-up questions:** Hash the sorted skill combination, check `followup_template_cache`. If a hit with avg_score > 3.5, use the cached questions (with slight variation via a cheap Haiku call to personalize). Only call Sonnet for genuinely novel skill combinations.
3. **Resource matching:** Check `resource_match_cache` for the same skill tag set. Cache for 7 days, invalidate when the resource library updates.

### 8.2 Tiered Model Routing for Edits

Not every user action requires the same model. Classify the action before choosing the model, not after.

| User Action | Model | Why |
|-------------|-------|-----|
| New entry submitted | Haiku (extract) + Sonnet (follow-ups) | Full pipeline. Core experience |
| Entry text edited after submission | Haiku only | Re-extract skills from diff. Skip follow-ups unless major change |
| User edits a follow-up response | No AI call | Responses already stored. Recalculate XP deterministically |
| Portion/quantity edit (e.g., "2 hours" → "3 hours") | No AI call | Deterministic XP adjustment. No re-extraction needed |
| Same skills as yesterday, new work | Cache hit + Sonnet | Skills from cache, only call Sonnet for fresh follow-up questions |
| Weekly pattern analysis | Opus (batch API at 50% discount) | Batched, not real-time. Run once per week via cron |

### 8.3 Smart Deduplication in the Pipeline

The AI review pipeline originally planned 4-6 calls per entry. Several can be eliminated or combined:

- **Combine skill extraction + entry summarization + skill categorization into one Haiku call.** All three operate on the same input text. One call with a combined output schema is cheaper than three separate calls.
- **Remove mood/confidence parsing entirely.** The user already selected mood and confidence via UI controls. Zero reason to pay AI to parse what the user explicitly chose.
- **Cache resource recommendations for repeat skill combinations.** If a user works with React + TypeScript three days in a row, the resource recommendations will be nearly identical. Cache for 7 days.

### 8.4 Revised Cost Estimate (With Optimizations)

| Operation | Model | Before | After (Optimized) | Savings |
|-----------|-------|--------|-------------------|---------|
| Skill extraction + summary + categorization | Haiku | $0.0037 (3 calls) | $0.0020 (1 combined, 60% cache hit) | 46% |
| Mood/confidence parse | Haiku | $0.0007 | $0 (removed, use UI values) | 100% |
| Follow-up questions | Sonnet | $0.0105 | $0.0090 (cached skill context) | 14% |
| Reflection scoring | Sonnet | $0.0066 | $0.0066 (no change, always unique) | 0% |
| Resource matching | Sonnet | $0.0054 | $0.0015 (cache hit 70% of time) | 72% |
| **DAILY TOTAL (with prompt caching)** | | **$0.027** | **$0.008** | **70% reduction** |

At $0.008/user/day, a paying user at $49.99/year generates $50 in revenue against approximately $2.92 in AI costs, yielding a **94% gross margin** on AI spend.

### 8.5 Cost Monitoring and Alerts

Implement cost tracking from day one. Do not wait until the bill surprises you.

- **Log every AI call:** task type, model, input tokens, output tokens, latency, cache hit/miss, cost. Store in a Supabase analytics table.
- **Daily cost dashboard:** Total cost, cost per user, cost per model, cache hit rate. Build a simple admin screen or use PostHog LLM analytics.
- **Alerts:** If daily cost per user exceeds $0.05, or if cache hit rate drops below 40%, trigger a notification. These are early warnings of regression.
- **Model cost benchmarks:** Track the typical monthly cost per model. If Haiku costs suddenly spike, investigate whether a prompt change reduced cache hits or a code change is sending unnecessary calls.

### 8.6 Future: On-Device Models

As on-device inference matures, several Haiku-tier tasks can migrate to the phone at zero API cost. Skill tag extraction, entry summarization, and skill categorization are all strong candidates for on-device models within 12-18 months. The router architecture is designed so that swapping a cloud model call for a local inference call requires only a config change, not an app rewrite. Monitor Apple Intelligence and Gemini Nano capabilities and plan to migrate when quality reaches parity.

---

## 9. TypeScript Interfaces

Define these in `types/index.ts`. Every data structure in the app derives from these interfaces.

```typescript
// types/index.ts

export interface Entry {
  id: string;
  date: string;                         // YYYY-MM-DD
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
  depth: number;                         // 1.0 - 5.0
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

export type SkillBranch = 'languages' | 'frameworks' | 'devops'
  | 'databases' | 'architecture' | 'soft_skills';

export interface Skill {
  id: string;
  name: string;
  branch: SkillBranch;
  level: number;                         // 1-10
  current_xp: number;                    // XP toward next level
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
  title: string;                         // computed from level
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
  match_pct?: number;                    // AI-computed relevance
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
```
