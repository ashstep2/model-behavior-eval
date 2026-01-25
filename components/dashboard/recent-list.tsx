'use client';

import { EmptyState } from '@/components/ui/loading';
import { RecentEvaluation } from '@/types';
import { getModelDisplayName } from '@/lib/data/models';

interface RecentListProps {
  evaluations: RecentEvaluation[];
}

export function RecentList({ evaluations }: RecentListProps) {
  if (evaluations.length === 0) {
    return (
      <EmptyState
        title="No evaluations yet"
        description="Start your first evaluation to see results here"
      />
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {evaluations.map((evaluation) => (
        <RecentEvaluationItem key={evaluation.id} evaluation={evaluation} />
      ))}
    </div>
  );
}

function RecentEvaluationItem({ evaluation }: { evaluation: RecentEvaluation }) {
  const modelNames = evaluation.models.map((m) => getModelDisplayName(m)).join(' vs ');
  const timeAgo = getTimeAgo(new Date(evaluation.completedAt));

  return (
    <a
      href={`/results/${evaluation.id}`}
      className="flex items-center justify-between py-4 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-black">{evaluation.useCaseName}</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">{modelNames}</span>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Winner: {getModelDisplayName(evaluation.winner)} ({evaluation.winnerScore.toFixed(1)})
        </div>
      </div>
      <div className="ml-4 flex items-center gap-4">
        <span className="text-sm text-gray-400">{timeAgo}</span>
        <span className="text-gray-400">→</span>
      </div>
    </a>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
