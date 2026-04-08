import type { SkillBranch } from '../../types';
import { callClaude } from './client';
import { buildSkillExtractionPrompt, type SkillExtractionPromptInput } from './prompts';

export interface ExtractedSkill {
  name: string;
  branch: SkillBranch;
}

const VALID_BRANCHES: Set<string> = new Set<string>([
  'languages',
  'frameworks',
  'devops',
  'databases',
  'architecture',
  'soft_skills',
]);

function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.js$/i, '').replace(/\.ts$/i, '');
}

function isValidBranch(value: string): value is SkillBranch {
  return VALID_BRANCHES.has(value);
}

function parseSkillsJson(text: string): ExtractedSkill[] {
  // Extract JSON array from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const raw: unknown[] = JSON.parse(jsonMatch[0]);

  return raw
    .filter(
      (item): item is { name: string; branch: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === 'string' &&
        typeof (item as Record<string, unknown>).branch === 'string'
    )
    .filter((item) => isValidBranch(item.branch))
    .map((item) => ({
      name: normalizeName(item.name),
      branch: item.branch as SkillBranch,
    }))
    .filter((skill) => skill.name.length > 0);
}

export async function extractSkills(
  input: SkillExtractionPromptInput
): Promise<ExtractedSkill[]> {
  const { system, user } = buildSkillExtractionPrompt(input);

  const result = await callClaude('skill_extraction', system, [
    { role: 'user', content: user },
  ]);

  return parseSkillsJson(result.text);
}
