import {
  checkReadyToProgress,
  suggestedNextWeight,
  estimated1RM,
} from '../utils/calculations';
import { getExerciseHistory } from '../database/repositories/setRepository';
import { ExerciseSession, ProgramExercise, ProgressionSuggestion } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// DOUBLE PROGRESSION EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressionResult {
  isReadyToProgress: boolean;
  suggestion: ProgressionSuggestion | null;
  lastSessionData: ExerciseSession | null;
  currentWeight: number;
  progressPercentage: number; // how far through current rep range (0-100)
}

export async function evaluateProgression(
  programExercise: ProgramExercise,
): Promise<ProgressionResult> {
  const history = await getExerciseHistory(programExercise.exerciseId, 5);

  if (history.length === 0) {
    return {
      isReadyToProgress: false,
      suggestion: null,
      lastSessionData: null,
      currentWeight: programExercise.startWeight,
      progressPercentage: 0,
    };
  }

  const lastSession = history[history.length - 1];
  if (!lastSession) {
    return {
      isReadyToProgress: false,
      suggestion: null,
      lastSessionData: null,
      currentWeight: programExercise.startWeight,
      progressPercentage: 0,
    };
  }

  const currentWeight = lastSession.sets[0]?.weight ?? programExercise.startWeight;
  const isReady = checkReadyToProgress(history, programExercise.repRangeMax);

  // Calculate progress percentage within current rep range
  const totalRange = programExercise.repRangeMax - programExercise.repRangeMin;
  const avgReps = lastSession.avgReps;
  const repsAboveMin = Math.max(0, avgReps - programExercise.repRangeMin);
  const progressPercentage = totalRange > 0
    ? Math.min(100, (repsAboveMin / totalRange) * 100)
    : 0;

  const suggestion: ProgressionSuggestion | null = isReady
    ? {
        exerciseId: programExercise.exerciseId,
        exerciseName: programExercise.exercise.name,
        currentWeight,
        suggestedWeight: suggestedNextWeight(
          currentWeight,
          programExercise.exercise.muscleGroup,
        ),
        increment:
          suggestedNextWeight(currentWeight, programExercise.exercise.muscleGroup) -
          currentWeight,
        reason: 'double_progression_complete',
      }
    : null;

  return {
    isReadyToProgress: isReady,
    suggestion,
    lastSessionData: lastSession,
    currentWeight,
    progressPercentage,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH EVALUATION FOR ALL EXERCISES IN A WORKOUT
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateWorkoutProgression(
  programExercises: ProgramExercise[],
): Promise<Map<string, ProgressionResult>> {
  const results = new Map<string, ProgressionResult>();

  await Promise.all(
    programExercises.map(async (pe) => {
      const result = await evaluateProgression(pe);
      results.set(pe.exerciseId, result);
    }),
  );

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELOAD DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suggests a deload if performance has regressed over 2+ consecutive sessions
 */
export function shouldDeload(history: ExerciseSession[]): boolean {
  if (history.length < 3) return false;

  const last3 = history.slice(-3);
  const weights = last3.map((s) => s.maxWeight);
  // Check for consistent weight regression
  return (weights[1] ?? 0) < (weights[0] ?? 0) && (weights[2] ?? 0) < (weights[1] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// PREDICTED MAX
// ─────────────────────────────────────────────────────────────────────────────

export function predictNextSessionMax(
  history: ExerciseSession[],
  repRangeMin: number,
): number {
  if (history.length === 0) return 0;

  const lastSession = history[history.length - 1];
  if (!lastSession) return 0;

  const baseWeight = lastSession.sets[0]?.weight ?? 0;
  const baseReps = lastSession.sets[0]?.reps ?? repRangeMin;

  return estimated1RM(baseWeight, baseReps);
}
