import { type AITaskType, getModelConfig } from './router';
import { logCost } from './cost-logger';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!key) {
    throw new Error(
      'Missing EXPO_PUBLIC_CLAUDE_API_KEY. Set it in your .env file.'
    );
  }
  return key;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: { type: 'text'; text: string }[];
  usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number };
  model: string;
}

export interface AIClientResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cacheHit: boolean;
}

export async function callClaude(
  task: AITaskType,
  system: string,
  messages: ClaudeMessage[]
): Promise<AIClientResult> {
  const config = getModelConfig(task);

  let apiKey: string;
  try {
    apiKey = getApiKey();
    console.log(`[AI] API key found: ${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`);
  } catch (e) {
    console.error('[AI] API key error:', e);
    throw e;
  }

  const body = {
    model: config.modelId,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: [
      {
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  };

  console.log(`[AI] >>> ${task} | model: ${config.modelId} | messages: ${messages.length}`);
  console.log(`[AI] >>> system (${system.length} chars):`, system.slice(0, 100) + '...');
  console.log(`[AI] >>> user:`, messages[0]?.content?.slice(0, 200) + '...');

  const start = Date.now();

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`[AI] !!! Network error for ${task}:`, e);
    throw e;
  }

  const latencyMs = Date.now() - start;

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[AI] !!! HTTP ${response.status} for ${task}:`, errorBody);
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data: ClaudeResponse = await response.json();
  const text = data.content[0]?.text ?? '';
  const inputTokens = data.usage.input_tokens;
  const outputTokens = data.usage.output_tokens;
  const cacheHit = (data.usage.cache_read_input_tokens ?? 0) > 0;

  console.log(`[AI] <<< ${task} | ${latencyMs}ms | in:${inputTokens} out:${outputTokens} | cache:${cacheHit}`);
  console.log(`[AI] <<< response (${text.length} chars):`, text.slice(0, 300));

  logCost({
    task_type: task,
    model: config.modelId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    latency_ms: latencyMs,
    cache_hit: cacheHit,
    estimated_cost: estimateCost(config.modelId, inputTokens, outputTokens),
    timestamp: new Date().toISOString(),
  });

  return { text, inputTokens, outputTokens, cacheHit };
}

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Per-million-token pricing (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-5-20250514': { input: 3, output: 15 },
    'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
  };
  const rate = pricing[model] ?? { input: 3, output: 15 };
  return (
    (inputTokens / 1_000_000) * rate.input +
    (outputTokens / 1_000_000) * rate.output
  );
}
