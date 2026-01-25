'use client';

import { MODELS } from '@/lib/data/models';
import { useEvaluationStore } from '@/store/evaluation-store';

export function ModelSelector() {
  const { selectedModels, toggleModel } = useEvaluationStore();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Choose 1-3 models to compare
      </p>

      <div className="space-y-2">
        {MODELS.map((model) => {
          const isSelected = selectedModels.includes(model.modelId);
          const isDisabled = !isSelected && selectedModels.length >= 3;

          return (
            <button
              key={model.modelId}
              onClick={() => !isDisabled && toggleModel(model.modelId)}
              disabled={isDisabled}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-black bg-white'
                  : isDisabled
                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black">
                      {model.displayName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {model.provider}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-gray-400">
                    {model.modelId}
                  </div>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedModels.length === 0 && (
        <p className="text-sm text-gray-400">
          Select at least one model to continue
        </p>
      )}
    </div>
  );
}
