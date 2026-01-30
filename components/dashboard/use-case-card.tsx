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
      className="group relative flex flex-col items-start rounded-lg border border-gray-200 bg-white p-6 text-left transition-colors hover:border-gray-400"
    >
      {useCase.isNew && (
        <span className="absolute right-3 top-3 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
          New
        </span>
      )}
      <span className="mb-4 text-2xl">{useCase.icon}</span>
      <h3 className="text-base font-medium text-black">{useCase.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{useCase.description}</p>
      <span className="mt-4 text-sm text-gray-400">
        {useCase.testCases.length} tests
      </span>
    </button>
  );
}

