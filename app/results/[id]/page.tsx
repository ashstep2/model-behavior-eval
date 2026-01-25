'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { SummaryCard } from '@/components/results/summary-card';
import { DimensionTable } from '@/components/results/dimension-table';
import { TestDetail } from '@/components/results/test-detail';
import { ExportButton } from '@/components/results/export-button';
import { useEvaluationStore, useResults } from '@/store/evaluation-store';
import { EvaluationResults } from '@/types';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const storedResults = useResults();
  const { reset } = useEvaluationStore();

  const [results, setResults] = useState<EvaluationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storedResults && storedResults.id === id) {
      setResults(storedResults);
      setLoading(false);
      return;
    }

    const loadResults = async () => {
      try {
        const savedData = localStorage.getItem(`eval-results-${id}`);
        if (savedData) {
          setResults(JSON.parse(savedData));
          setLoading(false);
          return;
        }

        setError('Results not found');
        setLoading(false);
      } catch (e) {
        setError('Failed to load results');
        setLoading(false);
      }
    };

    loadResults();
  }, [id, storedResults]);

  useEffect(() => {
    if (results) {
      localStorage.setItem(`eval-results-${results.id}`, JSON.stringify(results));
    }
  }, [results]);

  const handleNewEvaluation = () => {
    reset();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h2 className="mb-2 text-lg font-semibold text-black">
          Results not found
        </h2>
        <p className="mb-8 text-gray-500">
          Start a new evaluation to see results.
        </p>
        <Button onClick={handleNewEvaluation}>New evaluation</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-12 flex items-start justify-between">
        <div>
          <button
            onClick={handleNewEvaluation}
            className="mb-4 text-sm text-gray-400 hover:text-black"
          >
            ← New evaluation
          </button>
          <h1 className="text-2xl font-semibold text-black">Results</h1>
          <p className="mt-1 text-gray-500">
            {results.useCaseName} · {new Date(results.completedAt).toLocaleDateString()}
          </p>
        </div>
        <ExportButton results={results} />
      </div>

      {/* Summary */}
      <div className="mb-16">
        <SummaryCard results={results} />
      </div>

      {/* Recommendation */}
      <div className="mb-16">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          Recommendation
        </h2>
        <p className="text-black">{results.recommendation}</p>
      </div>

      {/* Dimension Breakdown */}
      <div className="mb-16">
        <DimensionTable results={results} />
      </div>

      {/* Test Details */}
      <div className="mb-16">
        <TestDetail results={results.byTest} />
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button onClick={handleNewEvaluation} size="lg">
          Start new evaluation
        </Button>
      </div>
    </div>
  );
}
