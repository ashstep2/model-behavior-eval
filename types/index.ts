// Dimension names
export type DimensionName =
  | 'instruction_following'
  | 'output_structure'
  | 'reasoning_quality'
  | 'safety_alignment'
  | 'consistency'
  | 'developer_experience';

// Evaluation dimension definition
export interface EvalDimension {
  name: DimensionName;
  displayName: string;
  description: string;
}

// Test case definition
export interface TestCase {
  id: string;
  category: string;
  name: string;
  prompt: string;
  systemPrompt?: string;
  expectedBehavior: string;
  dimensions: DimensionName[];
}

// Use case definition
export interface UseCase {
  id: string;
  name: string;
  description: string;
  icon: string;
  testCases: TestCase[];
}

// Model configuration
export interface ModelConfig {
  provider: 'anthropic' | 'openai';
  modelId: string;
  displayName: string;
  description: string;
}

// Evaluation configuration
export interface EvaluationConfig {
  useCaseId: string;
  models: string[]; // model IDs
  customTestCases?: TestCase[];
}

// Progress update during evaluation
export interface ProgressUpdate {
  currentTest: number;
  totalTests: number;
  currentModel: string;
  status: 'querying' | 'scoring' | 'complete';
}

// Model response
export interface ModelResponse {
  modelId: string;
  response: string;
  latencyMs: number;
  error?: string;
}

// Score for a single dimension
export interface DimensionScore {
  dimension: DimensionName;
  score: number;
  reasoning: string;
}

// Scores for a single test/model combination
export interface TestScore {
  modelId: string;
  dimensionScores: DimensionScore[];
  overallScore: number;
}

// Result for a single test case
export interface TestResult {
  testCase: TestCase;
  responses: ModelResponse[];
  scores: TestScore[];
  comparison?: string;
}

// Per-model aggregated results
export interface ModelResults {
  modelId: string;
  displayName: string;
  overallScore: number;
  dimensionScores: Record<DimensionName, number>;
  averageLatencyMs: number;
}

// Complete evaluation results
export interface EvaluationResults {
  id: string;
  useCaseId: string;
  useCaseName: string;
  models: string[];
  startedAt: string;
  completedAt: string;
  summary: {
    winner: string;
    winnerScore: number;
    scores: Record<string, number>; // modelId -> overall score
  };
  byModel: Record<string, ModelResults>;
  byTest: TestResult[];
  recommendation: string;
}

// Evaluation run status
export interface EvaluationRun {
  id: string;
  config: EvaluationConfig;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: ProgressUpdate;
  startedAt: string;
  completedAt?: string;
  results?: EvaluationResults;
  error?: string;
}

// Stream events
export type StreamEvent =
  | { type: 'progress'; data: ProgressUpdate }
  | { type: 'response'; data: { testId: string; modelId: string; response: ModelResponse } }
  | { type: 'scores'; data: { testId: string; scores: TestScore[] } }
  | { type: 'complete'; data: EvaluationResults }
  | { type: 'error'; data: { message: string } };

// Recent evaluation for dashboard
export interface RecentEvaluation {
  id: string;
  useCaseName: string;
  models: string[];
  winner: string;
  winnerScore: number;
  completedAt: string;
}
