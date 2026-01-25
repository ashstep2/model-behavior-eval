'use client';

import { EvaluationResults } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';

interface SummaryCardProps {
  results: EvaluationResults;
}

export function SummaryCard({ results }: SummaryCardProps) {
  const { byModel } = results;

  const sortedModels = Object.values(byModel).sort(
    (a, b) => b.overallScore - a.overallScore
  );

  return (
    <div className="space-y-8">
      <div
        className={`grid gap-6 ${
          sortedModels.length > 2 ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {sortedModels.map((model, index) => {
          const isWinner = index === 0;
          const percentage = (model.overallScore / 5) * 100;

          return (
            <div
              key={model.modelId}
              className={`rounded-lg border p-6 ${
                isWinner ? 'border-black' : 'border-gray-200'
              }`}
            >
              <div className="mb-1 text-sm text-gray-500">
                {getModelDisplayName(model.modelId)}
              </div>

              <div className="mb-4 text-4xl font-semibold tracking-tight text-black">
                {model.overallScore.toFixed(1)}
                <span className="text-xl text-gray-400">/5</span>
              </div>

              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {isWinner && (
                <div className="text-sm font-medium text-black">Recommended</div>
              )}

              <div className="mt-2 text-xs text-gray-400">
                Avg {Math.round(model.averageLatencyMs)}ms
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
