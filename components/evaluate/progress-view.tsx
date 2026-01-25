'use client';

import { Progress } from '@/components/ui/progress';
import { LoadingDots } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { ProgressUpdate, ModelResponse, TestScore, TestCase } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';

interface ProgressViewProps {
  progress: ProgressUpdate | null;
  responses: Record<string, Record<string, ModelResponse>>;
  scores: Record<string, TestScore[]>;
  testCases: TestCase[];
  modelIds: string[];
  onCancel: () => void;
}

export function ProgressView({
  progress,
  responses,
  scores,
  testCases,
  modelIds,
  onCancel,
}: ProgressViewProps) {
  const progressPercent = progress
    ? ((progress.currentTest - 1) / progress.totalTests) * 100 +
      (1 / progress.totalTests) * (progress.status === 'scoring' ? 80 : 50)
    : 0;

  const currentTest = progress ? testCases[progress.currentTest - 1] : null;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {progress?.status === 'scoring' ? 'Scoring responses' : 'Running evaluation'}
          </span>
          <span className="font-mono text-sm text-gray-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Current Test */}
      {currentTest && progress && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Test {progress.currentTest} of {progress.totalTests}
            </span>
            <span className="font-medium text-black">{currentTest.name}</span>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 text-xs font-medium uppercase text-gray-400">
              Prompt
            </div>
            <div className="line-clamp-3 font-mono text-sm text-gray-600">
              {currentTest.prompt}
            </div>
          </div>

          {/* Model Responses */}
          <div className={`grid gap-4 ${modelIds.length > 1 ? 'grid-cols-2' : ''}`}>
            {modelIds.map((modelId) => {
              const response = responses[currentTest.id]?.[modelId];
              const isQuerying =
                progress.status === 'querying' &&
                progress.currentModel === getModelDisplayName(modelId);

              return (
                <div
                  key={modelId}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-black">
                      {getModelDisplayName(modelId)}
                    </span>
                    {response ? (
                      <span className="font-mono text-xs text-gray-400">
                        {response.latencyMs}ms
                      </span>
                    ) : isQuerying ? (
                      <LoadingDots />
                    ) : null}
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {response ? (
                      <pre className="whitespace-pre-wrap font-mono text-xs text-gray-600">
                        {response.response || response.error || 'No response'}
                      </pre>
                    ) : isQuerying ? (
                      <span className="text-sm text-gray-400">Generating...</span>
                    ) : (
                      <span className="text-sm text-gray-300">Waiting</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {Object.keys(scores).length > 0 && (
        <div>
          <div className="mb-3 text-xs font-medium uppercase text-gray-400">
            Completed
          </div>
          <div className="space-y-2">
            {testCases
              .filter((tc) => scores[tc.id])
              .map((tc) => {
                const testScores = scores[tc.id];
                return (
                  <div
                    key={tc.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3"
                  >
                    <span className="text-sm text-black">{tc.name}</span>
                    <div className="flex gap-4">
                      {testScores.map((score) => (
                        <span key={score.modelId} className="text-sm">
                          <span className="text-gray-400">
                            {getModelDisplayName(score.modelId)}:
                          </span>{' '}
                          <span className="font-mono font-medium">
                            {score.overallScore.toFixed(1)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cancel */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
