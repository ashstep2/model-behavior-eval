'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ModelSelector } from '@/components/evaluate/model-selector';
import { TestPreview } from '@/components/evaluate/test-preview';
import { ProgressView } from '@/components/evaluate/progress-view';
import { USE_CASES } from '@/lib/data/use-cases';
import {
  useEvaluationStore,
  useSelectedUseCase,
  useSelectedModels,
  useCurrentStep,
  useIsRunning,
  useProgress,
  useResults,
} from '@/store/evaluation-store';
import { useEvaluationStream } from '@/hooks/use-evaluation-stream';

const STEPS = ['Models', 'Review', 'Run'];

export default function EvaluatePage() {
  const router = useRouter();

  const selectedUseCaseId = useSelectedUseCase();
  const selectedModels = useSelectedModels();
  const currentStep = useCurrentStep();
  const isRunning = useIsRunning();
  const progress = useProgress();
  const results = useResults();

  const { setStep, nextStep, prevStep, startEvaluation, reset } =
    useEvaluationStore();
  const { responses, scores } = useEvaluationStore();

  const { startStream, stopStream } = useEvaluationStream({
    onComplete: (results) => {
      router.push(`/results/${results.id}`);
    },
    onError: (error) => {
      console.error('Evaluation failed:', error);
    },
  });

  useEffect(() => {
    if (!selectedUseCaseId) {
      router.push('/');
    }
  }, [selectedUseCaseId, router]);

  useEffect(() => {
    if (results) {
      router.push(`/results/${results.id}`);
    }
  }, [results, router]);

  const useCase = selectedUseCaseId
    ? USE_CASES.find((uc) => uc.id === selectedUseCaseId)
    : null;

  if (!selectedUseCaseId || !useCase) {
    return null;
  }

  const canProceed = currentStep === 1 ? selectedModels.length >= 1 : true;

  const handleBack = () => {
    if (currentStep === 1) {
      reset();
      router.push('/');
    } else {
      prevStep();
    }
  };

  const handleContinue = async () => {
    if (currentStep === 2) {
      setStep(3);
      startEvaluation('pending');
      await startStream(selectedUseCaseId, selectedModels);
    } else {
      nextStep();
    }
  };

  const handleCancel = () => {
    stopStream();
    reset();
    router.push('/');
  };

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <button
          onClick={handleBack}
          className="mb-6 text-sm text-gray-400 hover:text-black"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold text-black">{useCase.name}</h1>
        <p className="mt-1 text-gray-500">{useCase.description}</p>
      </div>

      {/* Steps */}
      {!isRunning && (
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            {STEPS.map((step, index) => (
              <span
                key={step}
                className={`text-sm ${
                  index + 1 === currentStep
                    ? 'font-medium text-black'
                    : index + 1 < currentStep
                      ? 'text-gray-400'
                      : 'text-gray-300'
                }`}
              >
                {step}
              </span>
            ))}
          </div>
          <Progress value={progressPercent} size="sm" />
        </div>
      )}

      {/* Content */}
      <div className="mb-12">
        {currentStep === 1 && <ModelSelector />}
        {currentStep === 2 && <TestPreview testCases={useCase.testCases} />}
        {currentStep === 3 && (
          <ProgressView
            progress={progress}
            responses={responses}
            scores={scores}
            testCases={useCase.testCases}
            modelIds={selectedModels}
            onCancel={handleCancel}
          />
        )}
      </div>

      {/* Actions */}
      {!isRunning && currentStep < 3 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleContinue} disabled={!canProceed}>
            {currentStep === 2 ? 'Start evaluation' : 'Continue'}
          </Button>
        </div>
      )}
    </div>
  );
}
