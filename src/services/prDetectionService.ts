import { estimated1RM, computePRs } from '../utils/calculations';
import { getExerciseHistory } from '../database/repositories/setRepository';
import { upsertPR } from '../database/repositories/userRepository';
import { ExercisePRs, PersonalRecord } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// PR TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PRCheckResult {
  isPR: boolean;
  newPRTypes: string[];
  updatedPRs: PersonalRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK AND RECORD PR
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAndRecordPR(
  exerciseId: string,
  weight: number,
  reps: number,
  workoutId: string,
): Promise<PRCheckResult> {
  const history = await getExerciseHistory(exerciseId, 50);
  const currentPRs = computePRs(history);

  const newPRTypes: string[] = [];
  const updatedPRs: PersonalRecord[] = [];

  // Check max weight PR
  if (weight > currentPRs.maxWeight) {
    const pr = await upsertPR(exerciseId, 'max_weight', weight, workoutId);
    newPRTypes.push('Max Weight');
    updatedPRs.push(pr);
  }

  // Check max reps PR
  if (reps > currentPRs.maxReps) {
    const pr = await upsertPR(exerciseId, 'max_reps', reps, workoutId);
    newPRTypes.push('Max Reps');
    updatedPRs.push(pr);
  }

  // Check estimated 1RM PR
  const new1RM = estimated1RM(weight, reps);
  if (new1RM > currentPRs.best1RM) {
    const pr = await upsertPR(exerciseId, 'best_1rm', new1RM, workoutId);
    newPRTypes.push('Estimated 1RM');
    updatedPRs.push(pr);
  }

  return {
    isPR: newPRTypes.length > 0,
    newPRTypes,
    updatedPRs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT PRs FOR AN EXERCISE
// ─────────────────────────────────────────────────────────────────────────────

export async function getCurrentPRs(exerciseId: string): Promise<ExercisePRs> {
  const history = await getExerciseHistory(exerciseId, 50);
  return computePRs(history);
}

export async function getFormattedPRs(exerciseId: string): Promise<ExercisePRs> {
  return getCurrentPRs(exerciseId);
}
