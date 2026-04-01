# DevGrowth — CLAUDE.md

## Project Overview

DevGrowth is a mobile-first gamified reflection journal for developers. Built with React Native (Expo), Supabase, and Claude API.

**Stack:** React Native + Expo (TypeScript) | Supabase (Auth, PostgreSQL, Edge Functions) | Claude API (multi-model) | SQLite (local-first) | Zustand (state)

## Project Structure

```
app/                    # Expo Router file-based routing
  (tabs)/               # Bottom tab navigator (Today, Journey, Skills, Library)
  entry/                # Entry flow (new, review, score)
  onboarding/           # First-launch flow
components/
  ui/                   # Design system primitives (Card, Badge, Button, etc.)
  icons/                # Custom SVG icon components
lib/
  ai/                   # AI layer (router, prompts, extraction, scoring)
  database.ts           # SQLite schema + queries
  supabase.ts           # Supabase client
  sync.ts               # Offline-first sync engine
  gamification.ts       # XP calc, levels, titles
  streak.ts             # Streak logic with weekend grace
store/                  # Zustand stores (entry, user, skills)
theme/                  # Design tokens (colors, typography, spacing)
types/                  # TypeScript interfaces
supabase/
  migrations/           # SQL migration files
  functions/            # Edge Functions (ai-review, weekly-patterns)
```

## Design System — Terminal Luxury

Dark analytical surfaces, monospaced data labels, warm teal growth signals.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2DD4BF` | CTAs, growth indicators, XP |
| AI Blue | `#38BDF8` | AI review elements |
| Purple | `#A78BFA` | Skill levels, titles |
| Amber | `#FBBF24` | Streaks, bookmarks |
| Rose | `#FB7185` | Errors, locked features |
| Background | `#080B11` | App background |
| Surface | `#161D28` | Cards, containers |
| Border | `#1E2736` | Dividers, inactive states |
| Display Font | JetBrains Mono | Labels, data, badges |
| Body Font | DM Sans | Body text, descriptions |

## Commands

```bash
npx expo start         # Dev server
npm test               # Run tests
npm run lint           # Lint
```

## Git Workflow

- **main** — production releases
- **develop** — integration branch, PRs target here
- **feat/{slug}** — feature branches, one per feature doc
- Squash merge into develop. Merge develop into main for releases.

## Key Conventions

- All AI API calls go through Supabase Edge Functions (never client-side API keys)
- Local-first: SQLite is source of truth, Supabase syncs
- Use TypeScript interfaces from `types/index.ts` — no `any` types
- Use design tokens from `theme/` — no hardcoded colors
- Zustand for state management (3 stores: entry, user, skills)

## Execution Style: Incremental & Minimal Context

### Core Rules

**Rule 1: Execute 1–2 Steps at a Time**
- Never execute an entire plan in one pass.
- After completing 1–2 steps, stop and report what you did, what changed, and what comes next.
- Wait for confirmation before proceeding unless told to continue autonomously.
- If a step produces unexpected results, stop immediately.

**Rule 2: Stay at Relevant Minimum Context**
- Only read files directly relevant to the current 1–2 steps.
- Do not preemptively read the entire codebase.
- Target specific line ranges rather than whole files.
- Drop context from completed steps.

### Workflow

**Phase 1: Plan** — Understand → numbered step-by-step plan → wait for approval
**Phase 2: Execute** — Announce step → gather context → change → verify → report (done | verified | next) → wait
**Phase 3: Wrap-up** — Summarize all changes + follow-up items

### Autonomy Signals

- **"step"** — execute exactly 1 step
- **"go"** / **"continue"** — execute next 1–2 steps
- **"auto N"** — execute up to N steps before checking in
- **"finish"** — complete remaining steps, pause if unexpected

Default: 1–2 steps, then check in.

### Anti-Patterns to Avoid

1. Avalanche execution — running the whole plan without stopping
2. Context hoarding — reading 10 files before making one change
3. Silent failure — something goes wrong and you don't surface it
4. Phantom context — referencing code from memory instead of re-reading
5. Gold-plating — adding unrequested improvements mid-plan
