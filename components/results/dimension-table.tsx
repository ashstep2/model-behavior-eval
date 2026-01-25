'use client';

import { ScoreBar } from '@/components/ui/progress';
import { EvaluationResults, DimensionName } from '@/types';
import { getDimensionDisplayName } from '@/lib/data/dimensions';
import { getModelDisplayName } from '@/lib/data/models';

interface DimensionTableProps {
  results: EvaluationResults;
}

const DIMENSIONS: DimensionName[] = [
  'instruction_following',
  'output_structure',
  'reasoning_quality',
  'safety_alignment',
  'consistency',
  'developer_experience',
];

export function DimensionTable({ results }: DimensionTableProps) {
  const { byModel } = results;
  const modelIds = Object.keys(byModel);

  const evaluatedDimensions = DIMENSIONS.filter((dim) =>
    modelIds.some((id) => byModel[id].dimensionScores[dim] > 0)
  );

  if (evaluatedDimensions.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-gray-400">
        Dimension breakdown
      </h2>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Dimension
              </th>
              {modelIds.map((modelId) => (
                <th
                  key={modelId}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  {getModelDisplayName(modelId)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {evaluatedDimensions.map((dimension) => {
              const scores = modelIds.map((id) => ({
                modelId: id,
                score: byModel[id].dimensionScores[dimension],
              }));

              const maxScore = Math.max(...scores.map((s) => s.score));

              return (
                <tr key={dimension}>
                  <td className="px-4 py-4 text-sm text-black">
                    {getDimensionDisplayName(dimension)}
                  </td>
                  {scores.map(({ modelId, score }) => (
                    <td key={modelId} className="px-4 py-4">
                      <ScoreBar score={score} className="min-w-28" />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
