import type { Entry, SkillBranch } from '../../types';

// -- System prompts (cached via cache_control) --

const REVIEW_SYSTEM_PROMPT = `You are DevGrowth's AI reviewer — a senior engineering mentor who helps developers reflect on their daily work. You are warm but precise. You ask questions that push the developer to think deeper about their decisions, trade-offs, and growth.

Rules:
- Ask 2-3 follow-up questions based on the entry
- Each question should target a different dimension: technical depth, self-awareness, or actionability
- Tag each question with relevant skill areas
- Keep questions concise (1-2 sentences each)
- Never be condescending — treat the developer as a capable peer`;

const SKILL_EXTRACTION_SYSTEM_PROMPT = `You are a skill classifier for a developer growth app. Given a journal entry and optional follow-up conversation, extract the technical and soft skills demonstrated.

Rules:
- Return a JSON array of objects with "name" and "branch" fields
- Normalize skill names to lowercase, canonical forms (e.g., "React" not "react.js" or "ReactJS")
- Branch must be one of: languages, frameworks, devops, databases, architecture, soft_skills
- Extract 2-6 skills per entry — be specific, not generic
- Only extract skills actually demonstrated or discussed, not just mentioned`;

const SCORING_SYSTEM_PROMPT = `You are a reflection quality scorer for a developer growth app. Score the developer's reflection across three dimensions.

Dimensions (each 1.0 to 5.0, increments of 0.5):
- depth: How deeply did they analyze the problem and their approach?
- self_awareness: Did they recognize what they didn't know, what went wrong, or what they'd do differently?
- actionability: Did they identify concrete next steps or lessons they can apply?

Rules:
- Return a JSON object with "depth", "self_awareness", "actionability", and "summary" fields
- summary: 1-2 sentence assessment of the reflection quality
- Be calibrated: a typical brief entry is 2.0-2.5, a thoughtful one is 3.5-4.0, exceptional is 4.5+
- Score based on the full conversation (entry + follow-up responses)`;

// -- Prompt builders --

export interface FollowUpPromptInput {
  entry: Pick<Entry, 'worked_on' | 'hardest_problem' | 'how_solved' | 'confidence'>;
}

export function buildFollowUpPrompt(input: FollowUpPromptInput): {
  system: string;
  user: string;
} {
  const { entry } = input;
  const parts = [
    `**What I worked on:** ${entry.worked_on}`,
    entry.hardest_problem ? `**Hardest problem:** ${entry.hardest_problem}` : null,
    entry.how_solved ? `**How I solved it:** ${entry.how_solved}` : null,
    `**Confidence today:** ${entry.confidence}/5`,
  ].filter(Boolean);

  return {
    system: REVIEW_SYSTEM_PROMPT,
    user: `Here's my dev journal entry for today:\n\n${parts.join('\n')}\n\nPlease ask me 2-3 follow-up questions to help me reflect deeper. Return as JSON:\n[{ "question": "...", "tags": ["skill1", "skill2"] }]`,
  };
}

export interface SkillExtractionPromptInput {
  entry: Pick<Entry, 'worked_on' | 'hardest_problem' | 'how_solved'>;
  conversation: { role: 'ai' | 'user'; content: string }[];
}

export function buildSkillExtractionPrompt(input: SkillExtractionPromptInput): {
  system: string;
  user: string;
} {
  const { entry, conversation } = input;
  const entryText = [
    `Worked on: ${entry.worked_on}`,
    entry.hardest_problem ? `Hardest problem: ${entry.hardest_problem}` : null,
    entry.how_solved ? `How solved: ${entry.how_solved}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const convoText = conversation
    .map((m) => `${m.role === 'ai' ? 'Reviewer' : 'Developer'}: ${m.content}`)
    .join('\n');

  return {
    system: SKILL_EXTRACTION_SYSTEM_PROMPT,
    user: `Entry:\n${entryText}\n\nConversation:\n${convoText}\n\nExtract skills as JSON:\n[{ "name": "...", "branch": "languages|frameworks|devops|databases|architecture|soft_skills" }]`,
  };
}

export interface ScoringPromptInput {
  entry: Pick<Entry, 'worked_on' | 'hardest_problem' | 'how_solved' | 'confidence'>;
  conversation: { role: 'ai' | 'user'; content: string }[];
}

export function buildScoringPrompt(input: ScoringPromptInput): {
  system: string;
  user: string;
} {
  const { entry, conversation } = input;
  const entryText = [
    `Worked on: ${entry.worked_on}`,
    entry.hardest_problem ? `Hardest problem: ${entry.hardest_problem}` : null,
    entry.how_solved ? `How solved: ${entry.how_solved}` : null,
    `Confidence: ${entry.confidence}/5`,
  ]
    .filter(Boolean)
    .join('\n');

  const convoText = conversation
    .map((m) => `${m.role === 'ai' ? 'Reviewer' : 'Developer'}: ${m.content}`)
    .join('\n');

  return {
    system: SCORING_SYSTEM_PROMPT,
    user: `Score this reflection.\n\nEntry:\n${entryText}\n\nFollow-up conversation:\n${convoText}\n\nReturn JSON:\n{ "depth": N, "self_awareness": N, "actionability": N, "summary": "..." }`,
  };
}
