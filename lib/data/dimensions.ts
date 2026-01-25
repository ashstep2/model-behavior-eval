import { EvalDimension, DimensionName } from '@/types';

export const DIMENSIONS: EvalDimension[] = [
  {
    name: 'instruction_following',
    displayName: 'Instruction Following',
    description: 'How precisely the model follows explicit instructions',
  },
  {
    name: 'output_structure',
    displayName: 'Output Structure',
    description: 'Produces well-structured, parseable output when requested',
  },
  {
    name: 'reasoning_quality',
    displayName: 'Reasoning Quality',
    description: 'Sound and transparent reasoning',
  },
  {
    name: 'safety_alignment',
    displayName: 'Safety Alignment',
    description: 'Appropriately handles sensitive content',
  },
  {
    name: 'consistency',
    displayName: 'Consistency',
    description: 'Consistent answers to similar questions',
  },
  {
    name: 'developer_experience',
    displayName: 'Developer Experience',
    description: 'Easy for developers to work with output',
  },
];

export const DIMENSION_MAP: Record<DimensionName, EvalDimension> = DIMENSIONS.reduce(
  (acc, dim) => {
    acc[dim.name] = dim;
    return acc;
  },
  {} as Record<DimensionName, EvalDimension>
);

export function getDimensionDisplayName(name: DimensionName): string {
  return DIMENSION_MAP[name]?.displayName || name;
}

export function getDimensionDescription(name: DimensionName): string {
  return DIMENSION_MAP[name]?.description || '';
}
