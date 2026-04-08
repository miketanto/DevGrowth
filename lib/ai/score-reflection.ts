import type { ReviewScore } from '../../types';
import { callClaude } from './client';
import { buildScoringPrompt, type ScoringPromptInput } from './prompts';

interface ScoringResponse {
  depth: number;
  self_awareness: number;
  actionability: number;
  summary: string;
}

function clampScore(value: number): number {
  return Math.round(Math.max(1, Math.min(5, value)) * 2) / 2;
}

function parseScoringJson(text: string): { scores: ReviewScore; summary: string } {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse scoring response: no JSON object found');
  }

  const raw: unknown = JSON.parse(jsonMatch[0]);

  if (
    typeof raw !== 'object' ||
    raw === null ||
    typeof (raw as ScoringResponse).depth !== 'number' ||
    typeof (raw as ScoringResponse).self_awareness !== 'number' ||
    typeof (raw as ScoringResponse).actionability !== 'number'
  ) {
    throw new Error('Failed to parse scoring response: missing required fields');
  }

  const parsed = raw as ScoringResponse;
  const depth = clampScore(parsed.depth);
  const self_awareness = clampScore(parsed.self_awareness);
  const actionability = clampScore(parsed.actionability);
  const composite =
    Math.round(((depth + self_awareness + actionability) / 3) * 10) / 10;

  return {
    scores: { depth, self_awareness, actionability, composite },
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  };
}

export async function scoreReflection(
  input: ScoringPromptInput
): Promise<{ scores: ReviewScore; summary: string }> {
  const { system, user } = buildScoringPrompt(input);

  const result = await callClaude('reflection_scoring', system, [
    { role: 'user', content: user },
  ]);

  return parseScoringJson(result.text);
}
