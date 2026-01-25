'use client';

import { useCallback, useRef, useState } from 'react';
import { StreamEvent, EvaluationResults } from '@/types';
import { useEvaluationStore } from '@/store/evaluation-store';

interface UseEvaluationStreamOptions {
  onComplete?: (results: EvaluationResults) => void;
  onError?: (error: string) => void;
}

export function useEvaluationStream(options: UseEvaluationStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    updateProgress,
    addResponse,
    addScores,
    completeEvaluation,
    failEvaluation,
  } = useEvaluationStore();

  const startStream = useCallback(
    async (useCaseId: string, modelIds: string[]) => {
      setError(null);
      setIsConnected(false);

      // First, start the evaluation
      abortControllerRef.current = new AbortController();

      try {
        const startResponse = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useCaseId, models: modelIds }),
          signal: abortControllerRef.current.signal,
        });

        if (!startResponse.ok) {
          const errorData = await startResponse.json();
          throw new Error(errorData.error || 'Failed to start evaluation');
        }

        const { evaluationId } = await startResponse.json();

        // Connect to SSE stream
        const eventSource = new EventSource(
          `/api/evaluate/${evaluationId}/stream`
        );
        eventSourceRef.current = eventSource;
        setIsConnected(true);

        eventSource.onmessage = (event) => {
          try {
            const streamEvent: StreamEvent = JSON.parse(event.data);

            switch (streamEvent.type) {
              case 'progress':
                updateProgress(streamEvent.data);
                break;

              case 'response':
                addResponse(
                  streamEvent.data.testId,
                  streamEvent.data.modelId,
                  streamEvent.data.response
                );
                break;

              case 'scores':
                addScores(streamEvent.data.testId, streamEvent.data.scores);
                break;

              case 'complete':
                completeEvaluation(streamEvent.data);
                eventSource.close();
                setIsConnected(false);
                options.onComplete?.(streamEvent.data);
                break;

              case 'error':
                setError(streamEvent.data.message);
                failEvaluation(streamEvent.data.message);
                eventSource.close();
                setIsConnected(false);
                options.onError?.(streamEvent.data.message);
                break;
            }
          } catch (e) {
            console.error('Failed to parse stream event:', e);
          }
        };

        eventSource.onerror = () => {
          setError('Connection lost');
          eventSource.close();
          setIsConnected(false);
        };

        return evaluationId;
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          return null;
        }
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(errorMessage);
        failEvaluation(errorMessage);
        options.onError?.(errorMessage);
        return null;
      }
    },
    [
      updateProgress,
      addResponse,
      addScores,
      completeEvaluation,
      failEvaluation,
      options,
    ]
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    error,
    startStream,
    stopStream,
  };
}
