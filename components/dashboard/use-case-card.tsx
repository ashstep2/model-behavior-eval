'use client';

import { UseCase } from '@/types';

interface UseCaseCardProps {
  useCase: UseCase;
  onSelect: (id: string) => void;
}

export function UseCaseCard({ useCase, onSelect }: UseCaseCardProps) {
  return (
    <button
      onClick={() => onSelect(useCase.id)}
      className="group flex flex-col items-start rounded-lg border border-gray-200 bg-white p-6 text-left transition-colors hover:border-gray-400"
    >
      <span className="mb-4 text-2xl">{useCase.icon}</span>
      <h3 className="text-base font-medium text-black">{useCase.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{useCase.description}</p>
      <span className="mt-4 text-sm text-gray-400">
        {useCase.testCases.length} tests
      </span>
    </button>
  );
}

export function CustomEvalCard({ onSelect }: { onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group flex flex-col items-start rounded-lg border border-dashed border-gray-300 bg-white p-6 text-left transition-colors hover:border-gray-400"
    >
      <span className="mb-4 text-2xl">+</span>
      <h3 className="text-base font-medium text-black">Custom</h3>
      <p className="mt-1 text-sm text-gray-500">Define your own test cases</p>
    </button>
  );
}
