'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EvaluationConfig,
  EvaluationResults,
  ProgressUpdate,
  ModelResponse,
  RecentEvaluation,
  TestScore,
} from '@/types';

interface EvaluationState {
  // Configuration
  selectedUseCase: string | null;
  selectedModels: string[];
  currentStep: number;

  // Running state
  isRunning: boolean;
  evaluationId: string | null;
  progress: ProgressUpdate | null;
  responses: Record<string, Record<string, ModelResponse>>; // testId -> modelId -> response
  scores: Record<string, TestScore[]>; // testId -> scores

  // Results
  results: EvaluationResults | null;

  // History
  recentEvaluations: RecentEvaluation[];

  // Actions
  setUseCase: (id: string | null) => void;
  toggleModel: (modelId: string) => void;
  setSelectedModels: (modelIds: string[]) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Running actions
  startEvaluation: (evaluationId: string) => void;
  updateProgress: (progress: ProgressUpdate) => void;
  addResponse: (testId: string, modelId: string, response: ModelResponse) => void;
  addScores: (testId: string, scores: TestScore[]) => void;
  completeEvaluation: (results: EvaluationResults) => void;
  failEvaluation: (error: string) => void;

  // History actions
  addRecentEvaluation: (evaluation: RecentEvaluation) => void;
  clearHistory: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  selectedUseCase: null,
  selectedModels: [],
  currentStep: 1,
  isRunning: false,
  evaluationId: null,
  progress: null,
  responses: {},
  scores: {},
  results: null,
};

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set, get) => ({
      ...initialState,
      recentEvaluations: [],

      setUseCase: (id) => set({ selectedUseCase: id }),

      toggleModel: (modelId) =>
        set((state) => {
          const models = state.selectedModels.includes(modelId)
            ? state.selectedModels.filter((m) => m !== modelId)
            : state.selectedModels.length < 3
              ? [...state.selectedModels, modelId]
              : state.selectedModels;
          return { selectedModels: models };
        }),

      setSelectedModels: (modelIds) => set({ selectedModels: modelIds }),

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

      startEvaluation: (evaluationId) =>
        set({
          isRunning: true,
          evaluationId,
          progress: null,
          responses: {},
          scores: {},
          results: null,
        }),

      updateProgress: (progress) => set({ progress }),

      addResponse: (testId, modelId, response) =>
        set((state) => ({
          responses: {
            ...state.responses,
            [testId]: {
              ...(state.responses[testId] || {}),
              [modelId]: response,
            },
          },
        })),

      addScores: (testId, scores) =>
        set((state) => ({
          scores: {
            ...state.scores,
            [testId]: scores,
          },
        })),

      completeEvaluation: (results) =>
        set((state) => {
          // Add to recent evaluations
          const recent: RecentEvaluation = {
            id: results.id,
            useCaseName: results.useCaseName,
            models: results.models,
            winner: results.summary.winner,
            winnerScore: results.summary.winnerScore,
            completedAt: results.completedAt,
          };

          return {
            isRunning: false,
            results,
            recentEvaluations: [recent, ...state.recentEvaluations].slice(0, 10),
          };
        }),

      failEvaluation: (error) =>
        set({
          isRunning: false,
          progress: null,
        }),

      addRecentEvaluation: (evaluation) =>
        set((state) => ({
          recentEvaluations: [evaluation, ...state.recentEvaluations].slice(0, 10),
        })),

      clearHistory: () => set({ recentEvaluations: [] }),

      reset: () => set(initialState),
    }),
    {
      name: 'model-behavior-eval-storage',
      partialize: (state) => ({
        recentEvaluations: state.recentEvaluations,
      }),
    }
  )
);

// Selector hooks for better performance
export const useSelectedUseCase = () =>
  useEvaluationStore((state) => state.selectedUseCase);
export const useSelectedModels = () =>
  useEvaluationStore((state) => state.selectedModels);
export const useCurrentStep = () => useEvaluationStore((state) => state.currentStep);
export const useIsRunning = () => useEvaluationStore((state) => state.isRunning);
export const useProgress = () => useEvaluationStore((state) => state.progress);
export const useResults = () => useEvaluationStore((state) => state.results);
export const useRecentEvaluations = () =>
  useEvaluationStore((state) => state.recentEvaluations);
