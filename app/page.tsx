'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UseCaseCard, CustomEvalCard } from '@/components/dashboard/use-case-card';
import { RecentList } from '@/components/dashboard/recent-list';
import { USE_CASES } from '@/lib/data/use-cases';
import { useEvaluationStore, useRecentEvaluations } from '@/store/evaluation-store';

export default function Dashboard() {
  const router = useRouter();
  const { setUseCase, reset } = useEvaluationStore();
  const recentEvaluations = useRecentEvaluations();

  const handleSelectUseCase = (useCaseId: string) => {
    reset();
    setUseCase(useCaseId);
    router.push('/evaluate');
  };

  const handleCustomEval = () => {
    reset();
    setUseCase('custom');
    router.push('/evaluate');
  };

  return (
    <div className="mx-auto max-w-container px-6 py-16">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-4xl font-semibold tracking-tight text-black">
          Model Behavior Eval
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Compare LLM behavior for production use cases
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-20">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-gray-400">
          Select a use case
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((useCase) => (
            <UseCaseCard
              key={useCase.id}
              useCase={useCase}
              onSelect={handleSelectUseCase}
            />
          ))}
          <CustomEvalCard onSelect={handleCustomEval} />
        </div>
      </section>

      {/* Recent Evaluations */}
      <section>
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-gray-400">
          Recent evaluations
        </h2>
        <RecentList evaluations={recentEvaluations} />
      </section>
    </div>
  );
}
