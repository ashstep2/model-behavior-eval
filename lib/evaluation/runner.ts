import { v4 as uuidv4 } from 'uuid';
import {
  TestCase,
  ModelResponse,
  TestResult,
  TestScore,
  EvaluationResults,
  ModelResults,
  StreamEvent,
  DimensionName,
} from '@/types';
import { queryModel } from '@/lib/models/client';
import { scoreResponses, generateComparison } from './evaluator';
import { getModelDisplayName } from '@/lib/data/models';
import { getUseCase } from '@/lib/data/use-cases';

export async function* runEvaluation(
  useCaseId: string,
  modelIds: string[],
  testCases: TestCase[]
): AsyncGenerator<StreamEvent> {
  const evaluationId = uuidv4();
  const startedAt = new Date().toISOString();
  const testResults: TestResult[] = [];

  const totalSteps = testCases.length * modelIds.length;
  let currentStep = 0;

  for (let testIndex = 0; testIndex < testCases.length; testIndex++) {
    const testCase = testCases[testIndex];
    const responses: ModelResponse[] = [];

    // Query each model for this test case
    for (const modelId of modelIds) {
      currentStep++;

      // Emit progress
      yield {
        type: 'progress',
        data: {
          currentTest: testIndex + 1,
          totalTests: testCases.length,
          currentModel: getModelDisplayName(modelId),
          status: 'querying',
        },
      };

      // Query the model
      const response = await queryModel(modelId, testCase.prompt, testCase.systemPrompt);
      responses.push(response);

      // Emit response
      yield {
        type: 'response',
        data: {
          testId: testCase.id,
          modelId,
          response,
        },
      };
    }

    // Score responses
    yield {
      type: 'progress',
      data: {
        currentTest: testIndex + 1,
        totalTests: testCases.length,
        currentModel: 'Evaluator',
        status: 'scoring',
      },
    };

    const scores = await scoreResponses(testCase, responses);
    const comparison = generateComparison(testCase, scores);

    // Emit scores
    yield {
      type: 'scores',
      data: {
        testId: testCase.id,
        scores,
      },
    };

    testResults.push({
      testCase,
      responses,
      scores,
      comparison,
    });
  }

  // Calculate final results
  const results = calculateResults(
    evaluationId,
    useCaseId,
    modelIds,
    testResults,
    startedAt
  );

  yield {
    type: 'complete',
    data: results,
  };
}

function calculateResults(
  evaluationId: string,
  useCaseId: string,
  modelIds: string[],
  testResults: TestResult[],
  startedAt: string
): EvaluationResults {
  const useCase = getUseCase(useCaseId);

  // Calculate per-model results
  const byModel: Record<string, ModelResults> = {};

  for (const modelId of modelIds) {
    const modelScores: number[] = [];
    const dimensionTotals: Record<DimensionName, number[]> = {
      instruction_following: [],
      output_structure: [],
      reasoning_quality: [],
      safety_alignment: [],
      consistency: [],
      developer_experience: [],
      refusal_calibration: [],
    };
    const latencies: number[] = [];

    for (const result of testResults) {
      const score = result.scores.find((s) => s.modelId === modelId);
      const response = result.responses.find((r) => r.modelId === modelId);

      if (score) {
        modelScores.push(score.overallScore);
        for (const dimScore of score.dimensionScores) {
          if (dimensionTotals[dimScore.dimension]) {
            dimensionTotals[dimScore.dimension].push(dimScore.score);
          }
        }
      }

      if (response) {
        latencies.push(response.latencyMs);
      }
    }

    const overallScore =
      modelScores.length > 0
        ? modelScores.reduce((a, b) => a + b, 0) / modelScores.length
        : 0;

    const dimensionScores: Record<DimensionName, number> = {} as Record<
      DimensionName,
      number
    >;
    for (const [dim, scores] of Object.entries(dimensionTotals)) {
      dimensionScores[dim as DimensionName] =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    }

    const averageLatencyMs =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

    byModel[modelId] = {
      modelId,
      displayName: getModelDisplayName(modelId),
      overallScore,
      dimensionScores,
      averageLatencyMs,
    };
  }

  // Find winner
  const sortedModels = Object.values(byModel).sort(
    (a, b) => b.overallScore - a.overallScore
  );
  const winner = sortedModels[0];

  // Generate recommendation
  const recommendation = generateRecommendation(sortedModels, testResults);

  return {
    id: evaluationId,
    useCaseId,
    useCaseName: useCase?.name || useCaseId,
    models: modelIds,
    startedAt,
    completedAt: new Date().toISOString(),
    summary: {
      winner: winner.modelId,
      winnerScore: winner.overallScore,
      scores: Object.fromEntries(
        Object.entries(byModel).map(([id, m]) => [id, m.overallScore])
      ),
    },
    byModel,
    byTest: testResults,
    recommendation,
  };
}

function generateRecommendation(
  sortedModels: ModelResults[],
  testResults: TestResult[]
): string {
  if (sortedModels.length === 0) {
    return 'No models evaluated.';
  }

  const winner = sortedModels[0];
  const runnerUp = sortedModels[1];

  if (!runnerUp) {
    return `${winner.displayName} scored ${winner.overallScore.toFixed(1)}/5 overall.`;
  }

  const diff = winner.overallScore - runnerUp.overallScore;

  if (diff < 0.2) {
    return `${winner.displayName} and ${runnerUp.displayName} performed similarly (${winner.overallScore.toFixed(1)} vs ${runnerUp.overallScore.toFixed(1)}). Consider other factors like cost and latency.`;
  }

  // Find winner's strengths
  const strengths: string[] = [];
  for (const [dim, score] of Object.entries(winner.dimensionScores)) {
    const runnerScore = runnerUp.dimensionScores[dim as DimensionName];
    if (score > runnerScore + 0.3) {
      strengths.push(dim.replace(/_/g, ' '));
    }
  }

  if (strengths.length > 0) {
    return `${winner.displayName} is recommended (${winner.overallScore.toFixed(1)}/5), showing particular strength in ${strengths.slice(0, 2).join(' and ')}. ${runnerUp.displayName} (${runnerUp.overallScore.toFixed(1)}/5) is a viable alternative.`;
  }

  return `${winner.displayName} is recommended with a score of ${winner.overallScore.toFixed(1)}/5. ${runnerUp.displayName} scored ${runnerUp.overallScore.toFixed(1)}/5.`;
}
