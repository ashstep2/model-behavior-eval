import { NextRequest } from 'next/server';
import { getEvaluationConfig } from '@/lib/evaluation/config-store';
import { getUseCase } from '@/lib/data/use-cases';
import { runEvaluation } from '@/lib/evaluation/runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for long-running evaluations

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evaluationId } = await params;
  const encoder = new TextEncoder();

  // Get evaluation config
  const config = getEvaluationConfig(evaluationId);

  if (!config) {
    return new Response(
      JSON.stringify({ error: 'Evaluation not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const useCase = getUseCase(config.useCaseId);

  if (!useCase) {
    return new Response(
      JSON.stringify({ error: 'Use case not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Run evaluation and stream events
        for await (const event of runEvaluation(
          config.useCaseId,
          config.models,
          useCase.testCases
        )) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        const errorEvent = {
          type: 'error',
          data: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
        const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
