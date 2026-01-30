'use client';

import { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  bgColor?: 'white' | 'gray';
}

export function ExpandableText({
  text,
  maxLines = 6,
  className = '',
  bgColor = 'white',
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Rough heuristic: if text has many lines or is very long, show expand option
  const lineCount = text.split('\n').length;
  const isLong = lineCount > maxLines || text.length > 500;

  if (!isLong) {
    return (
      <pre className={`whitespace-pre-wrap ${className}`}>{text}</pre>
    );
  }

  const gradientClass = bgColor === 'gray'
    ? 'bg-gradient-to-t from-gray-50 to-transparent'
    : 'bg-gradient-to-t from-white to-transparent';

  return (
    <div className="relative">
      <pre
        className={`whitespace-pre-wrap ${className} ${
          !isExpanded ? 'max-h-36 overflow-hidden' : ''
        }`}
      >
        {text}
      </pre>
      {!isExpanded && (
        <div className={`absolute bottom-0 left-0 right-0 h-12 ${gradientClass}`} />
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs font-medium text-gray-500 hover:text-black"
      >
        {isExpanded ? '↑ Show less' : '↓ Show more'}
      </button>
    </div>
  );
}
