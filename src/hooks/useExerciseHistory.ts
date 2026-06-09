import { useState, useEffect, useCallback } from 'react';
import { ExerciseSession, ExercisePRs } from '../types';
import { getExerciseHistory } from '../database/repositories/setRepository';
import { computePRs } from '../utils/calculations';

interface UseExerciseHistoryResult {
  history: ExerciseSession[];
  prs: ExercisePRs;
  lastSession: ExerciseSession | null;
  prevSession: ExerciseSession | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Chart data
  weightData: number[];
  repsData: number[];
  volumeData: number[];
  chartLabels: string[];
}

export function useExerciseHistory(exerciseId: string): UseExerciseHistoryResult {
  const [history, setHistory] = useState<ExerciseSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!exerciseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExerciseHistory(exerciseId, 15);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const prs = computePRs(history);
  const lastSession = history.length > 0 ? (history[history.length - 1] ?? null) : null;
  const prevSession = history.length > 1 ? (history[history.length - 2] ?? null) : null;

  // Chart data — limit to last 10 for readability
  const chartHistory = history.slice(-10);
  const chartLabels = chartHistory.map((s) => {
    const d = new Date(s.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const weightData = chartHistory.map((s) => s.maxWeight);
  const repsData = chartHistory.map((s) => parseFloat(s.avgReps.toFixed(1)));
  const volumeData = chartHistory.map((s) => s.volume);

  return {
    history,
    prs,
    lastSession,
    prevSession,
    isLoading,
    error,
    refresh: load,
    weightData,
    repsData,
    volumeData,
    chartLabels,
  };
}
