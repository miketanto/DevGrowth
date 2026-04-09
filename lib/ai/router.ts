export type AITaskType =
  | 'followup_generation'
  | 'skill_extraction'
  | 'reflection_scoring'
  | 'insight_generation';

export interface ModelConfig {
  modelId: string;
  maxTokens: number;
  temperature: number;
}

const MODEL_MAP: Record<AITaskType, ModelConfig> = {
  followup_generation: {
    modelId: 'claude-sonnet-4-6',
    maxTokens: 1024,
    temperature: 0.7,
  },
  skill_extraction: {
    modelId: 'claude-haiku-4-5-20251001',
    maxTokens: 512,
    temperature: 0.2,
  },
  reflection_scoring: {
    modelId: 'claude-sonnet-4-6',
    maxTokens: 512,
    temperature: 0.3,
  },
  insight_generation: {
    modelId: 'claude-sonnet-4-6',
    maxTokens: 1024,
    temperature: 0.5,
  },
};

export function getModelConfig(task: AITaskType): ModelConfig {
  return MODEL_MAP[task];
}
