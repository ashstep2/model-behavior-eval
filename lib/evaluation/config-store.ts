// In-memory store for evaluation configs
// In production, use a database or Redis

interface EvaluationConfig {
  useCaseId: string;
  models: string[];
  startedAt: string;
}

// Use globalThis to persist across Next.js hot reloads in development
const globalForConfigs = globalThis as unknown as {
  evaluationConfigs: Map<string, EvaluationConfig> | undefined;
};

const evaluationConfigs =
  globalForConfigs.evaluationConfigs ?? new Map<string, EvaluationConfig>();

if (process.env.NODE_ENV !== 'production') {
  globalForConfigs.evaluationConfigs = evaluationConfigs;
}

export function setEvaluationConfig(
  evaluationId: string,
  config: EvaluationConfig
): void {
  evaluationConfigs.set(evaluationId, config);

  // Clean up after 1 hour
  setTimeout(() => {
    evaluationConfigs.delete(evaluationId);
  }, 60 * 60 * 1000);
}

export function getEvaluationConfig(
  evaluationId: string
): EvaluationConfig | undefined {
  return evaluationConfigs.get(evaluationId);
}

export function deleteEvaluationConfig(evaluationId: string): void {
  evaluationConfigs.delete(evaluationId);
}
