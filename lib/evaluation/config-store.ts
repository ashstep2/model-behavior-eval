// In-memory store for evaluation configs
// In production, use a database or Redis

interface EvaluationConfig {
  useCaseId: string;
  models: string[];
  startedAt: string;
}

const evaluationConfigs = new Map<string, EvaluationConfig>();

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
