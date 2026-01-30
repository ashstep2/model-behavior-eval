'use client';

import { useState } from 'react';
import { TestResult } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';
import { getDimensionDisplayName } from '@/lib/data/dimensions';
import { ExpandableText } from '@/components/ui/expandable-text';

interface TestDetailProps {
  results: TestResult[];
}

export function TestDetail({ results }: TestDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Test results
        </h2>
        <button
          onClick={() => setExpandedId(expandedId === 'all' ? null : 'all')}
          className="text-sm text-gray-400 hover:text-black"
        >
          {expandedId === 'all' ? 'Collapse' : 'Expand all'}
        </button>
      </div>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {results.map((result) => (
          <TestResultItem
            key={result.testCase.id}
            result={result}
            isExpanded={expandedId === 'all' || expandedId === result.testCase.id}
            onToggle={() =>
              setExpandedId(
                expandedId === result.testCase.id ? null : result.testCase.id
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

interface TestResultItemProps {
  result: TestResult;
  isExpanded: boolean;
  onToggle: () => void;
}

function TestResultItem({ result, isExpanded, onToggle }: TestResultItemProps) {
  const { testCase, responses, scores, comparison } = result;

  return (
    <div>
      <button
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
        onClick={onToggle}
      >
        <span className="font-medium text-black">{testCase.name}</span>
        <div className="flex items-center gap-4">
          {scores.map((score) => (
            <span key={score.modelId} className="text-sm">
              <span className="text-gray-400">
                {getModelDisplayName(score.modelId)}:
              </span>{' '}
              <span className="font-mono font-medium">
                {score.overallScore.toFixed(1)}
              </span>
            </span>
          ))}
          <span
            className={`text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            ↓
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="animate-fade-in border-t border-gray-100 bg-gray-50 p-6">
          {/* Prompt */}
          <div className="mb-6">
            <div className="mb-2 text-xs font-medium uppercase text-gray-400">
              Prompt
            </div>
            <div className="rounded-md bg-white p-4">
              <ExpandableText
                text={testCase.prompt}
                maxLines={8}
                className="font-mono text-sm text-black"
              />
            </div>
          </div>

          {/* Responses */}
          <div className="mb-6">
            <div className="mb-2 text-xs font-medium uppercase text-gray-400">
              Responses
            </div>
            <div
              className={`grid gap-4 ${
                responses.length > 2 ? 'grid-cols-3' : 'grid-cols-2'
              }`}
            >
              {responses.map((response) => {
                const score = scores.find((s) => s.modelId === response.modelId);
                return (
                  <div
                    key={response.modelId}
                    className="rounded-md border border-gray-200 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                      <span className="text-sm font-medium text-black">
                        {getModelDisplayName(response.modelId)}
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        {response.latencyMs}ms
                      </span>
                    </div>
                    <div className="p-4">
                      {response.error ? (
                        <div className="rounded bg-red-50 p-2 text-xs text-red-600">
                          <span className="font-medium">Error:</span> {response.error}
                        </div>
                      ) : response.response ? (
                        <ExpandableText
                          text={response.response}
                          maxLines={10}
                          className="font-mono text-xs text-gray-600"
                        />
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          No response (model may have refused)
                        </div>
                      )}
                    </div>
                    {score && (
                      <div className="border-t border-gray-100 px-4 py-2 text-sm">
                        Score: <span className="font-mono font-medium">{score.overallScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimension Scores */}
          {scores[0]?.dimensionScores.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 text-xs font-medium uppercase text-gray-400">
                Scores by dimension
              </div>
              <div className="space-y-3">
                {scores[0].dimensionScores.map((dimScore) => (
                  <div key={dimScore.dimension} className="rounded-md bg-white p-4">
                    <div className="mb-2 text-sm font-medium text-black">
                      {getDimensionDisplayName(dimScore.dimension)}
                    </div>
                    <div
                      className={`grid gap-3 ${
                        scores.length > 2 ? 'grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      {scores.map((score) => {
                        const ds = score.dimensionScores.find(
                          (d) => d.dimension === dimScore.dimension
                        );
                        return (
                          <div key={score.modelId}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">
                                {getModelDisplayName(score.modelId)}
                              </span>
                              <span className="font-mono font-medium">
                                {ds?.score.toFixed(1)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {ds?.reasoning}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison */}
          {comparison && (
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-gray-400">
                Analysis
              </div>
              <div className="text-sm text-gray-600">{comparison}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
