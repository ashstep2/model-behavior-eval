'use client';

import { useState } from 'react';
import { TestCase } from '@/types';
import { getDimensionDisplayName } from '@/lib/data/dimensions';

interface TestPreviewProps {
  testCases: TestCase[];
}

export function TestPreview({ testCases }: TestPreviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {testCases.length} test cases will be run
      </p>

      <div className="divide-y divide-gray-100">
        {testCases.map((testCase) => (
          <TestCaseItem
            key={testCase.id}
            testCase={testCase}
            isExpanded={expandedId === testCase.id}
            onToggle={() =>
              setExpandedId(expandedId === testCase.id ? null : testCase.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

interface TestCaseItemProps {
  testCase: TestCase;
  isExpanded: boolean;
  onToggle: () => void;
}

function TestCaseItem({ testCase, isExpanded, onToggle }: TestCaseItemProps) {
  return (
    <div className="py-4">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={onToggle}
      >
        <div>
          <span className="font-medium text-black">{testCase.name}</span>
          <span className="ml-2 text-sm text-gray-400">{testCase.category}</span>
        </div>
        <span
          className={`text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          ↓
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {testCase.systemPrompt && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-gray-400">
                System
              </div>
              <div className="rounded-md bg-gray-50 p-3 font-mono text-sm text-gray-600">
                {testCase.systemPrompt}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 text-xs font-medium uppercase text-gray-400">
              Prompt
            </div>
            <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 font-mono text-sm text-black">
              {testCase.prompt}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase text-gray-400">
              Expected
            </div>
            <div className="text-sm text-gray-600">{testCase.expectedBehavior}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {testCase.dimensions.map((dim) => (
              <span
                key={dim}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                {getDimensionDisplayName(dim)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
