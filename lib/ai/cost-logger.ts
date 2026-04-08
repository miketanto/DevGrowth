import type { CostLogEntry } from '../../types';

const costLog: CostLogEntry[] = [];

export function logCost(entry: CostLogEntry): void {
  costLog.push(entry);

  if (__DEV__) {
    console.log(
      `[AI Cost] ${entry.task_type} | ${entry.model} | ` +
        `in=${entry.input_tokens} out=${entry.output_tokens} | ` +
        `${entry.latency_ms}ms | cache=${entry.cache_hit} | ` +
        `$${entry.estimated_cost.toFixed(6)}`
    );
  }
}

export function getCostLog(): readonly CostLogEntry[] {
  return costLog;
}

export function getCostSummary(): {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  cacheHitRate: number;
} {
  const totalCalls = costLog.length;
  if (totalCalls === 0) {
    return {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      avgLatencyMs: 0,
      cacheHitRate: 0,
    };
  }

  const totalInputTokens = costLog.reduce((s, e) => s + e.input_tokens, 0);
  const totalOutputTokens = costLog.reduce((s, e) => s + e.output_tokens, 0);
  const totalCost = costLog.reduce((s, e) => s + e.estimated_cost, 0);
  const avgLatencyMs =
    costLog.reduce((s, e) => s + e.latency_ms, 0) / totalCalls;
  const cacheHitRate =
    costLog.filter((e) => e.cache_hit).length / totalCalls;

  return {
    totalCalls,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    avgLatencyMs,
    cacheHitRate,
  };
}
