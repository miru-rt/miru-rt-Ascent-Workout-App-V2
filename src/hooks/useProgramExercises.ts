import { useState, useEffect, useCallback } from 'react';
import { ProgramExercise } from '../types';
import { getProgramExercises } from '../database/repositories/exerciseRepository';
import { PROGRAM_ID } from '../constants/program';

interface UseProgramExercisesResult {
  exercises: ProgramExercise[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProgramExercises(workoutDay: string): UseProgramExercisesResult {
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workoutDay) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProgramExercises(PROGRAM_ID, workoutDay);
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  }, [workoutDay]);

  useEffect(() => {
    void load();
  }, [load]);

  return { exercises, isLoading, error, refresh: load };
}
