import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getUseCase } from '@/lib/data/use-cases';
import { getModelConfig } from '@/lib/data/models';
import { setEvaluationConfig } from '@/lib/evaluation/config-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { useCaseId, models } = body;

    // Validate use case
    const useCase = getUseCase(useCaseId);
    if (!useCase) {
      return NextResponse.json(
        { error: `Invalid use case: ${useCaseId}` },
        { status: 400 }
      );
    }

    // Validate models
    if (!Array.isArray(models) || models.length === 0 || models.length > 3) {
      return NextResponse.json(
        { error: 'Select 1-3 models to compare' },
        { status: 400 }
      );
    }

    for (const modelId of models) {
      const config = getModelConfig(modelId);
      if (!config) {
        return NextResponse.json(
          { error: `Invalid model: ${modelId}` },
          { status: 400 }
        );
      }
    }

    // Create evaluation ID
    const evaluationId = uuidv4();

    // Store config for the stream endpoint
    setEvaluationConfig(evaluationId, {
      useCaseId,
      models,
      startedAt: new Date().toISOString(),
    });

    return NextResponse.json({ evaluationId });
  } catch (error) {
    console.error('Error starting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to start evaluation' },
      { status: 500 }
    );
  }
}
