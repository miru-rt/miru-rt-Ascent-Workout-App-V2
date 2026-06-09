import { ExercisePRs, ExerciseSession, WarmupSet } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// 1RM CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Epley formula: weight × (1 + reps/30)
 * Most common and well-validated 1RM formula
 */
export function estimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Brzycki formula (alternative, more conservative)
 */
export function brzycki1RM(weight: number, reps: number): number {
  if (reps >= 37) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateSetVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function calculateSessionVolume(sets: Array<{ weight: number; reps: number }>): number {
  return sets.reduce((acc, set) => acc + calculateSetVolume(set.weight, set.reps), 0);
}

export function calculateTotalVolume(sessions: ExerciseSession[]): number {
  return sessions.reduce((acc, s) => acc + s.volume, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// PR DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function computePRs(sessions: ExerciseSession[]): ExercisePRs {
  let maxWeight = 0;
  let maxReps = 0;
  let best1RM = 0;
  let bestVolume = 0;

  for (const session of sessions) {
    if (session.volume > bestVolume) bestVolume = session.volume;

    for (const set of session.sets) {
      if (set.weight > maxWeight) maxWeight = set.weight;
      if (set.reps > maxReps) maxReps = set.reps;

      const oneRM = estimated1RM(set.weight, set.reps);
      if (oneRM > best1RM) best1RM = oneRM;
    }
  }

  return { maxWeight, maxReps, best1RM, bestVolume };
}

export function isNewPR(
  newSet: { weight: number; reps: number },
  currentPRs: ExercisePRs,
): boolean {
  if (newSet.weight > currentPRs.maxWeight) return true;
  if (newSet.reps > currentPRs.maxReps) return true;
  if (estimated1RM(newSet.weight, newSet.reps) > currentPRs.best1RM) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOUBLE PROGRESSION LOGIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Double Progression: Complete ALL sets at the UPPER end of rep range → increase weight.
 * Returns true if the last session shows all sets hit the max reps.
 */
export function checkReadyToProgress(
  sessions: ExerciseSession[],
  repRangeMax: number,
): boolean {
  if (sessions.length === 0) return false;

  const lastSession = sessions[sessions.length - 1];
  return lastSession.sets.every((s) => s.reps >= repRangeMax);
}

/**
 * Calculate the suggested next weight based on current weight and exercise type.
 * Small muscles (arms, core): 1-2kg increments
 * Large muscles (legs, back): 2.5-5kg increments
 */
export function suggestedNextWeight(
  currentWeight: number,
  muscleGroup: string,
): number {
  const largeGroups = ['Legs', 'Back', 'Chest'];
  const isLarge = largeGroups.includes(muscleGroup);

  if (currentWeight === 0) return 0; // bodyweight exercise

  if (currentWeight >= 80) return currentWeight + (isLarge ? 5 : 2.5);
  if (currentWeight >= 40) return currentWeight + (isLarge ? 5 : 2.5);
  if (currentWeight >= 20) return currentWeight + (isLarge ? 2.5 : 1);
  return currentWeight + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// WARMUP CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export function calculateWarmupSets(workingWeight: number): WarmupSet[] {
  if (workingWeight <= 20) return []; // Too light for warmup sets

  const warmupPercentages = [0.4, 0.6, 0.8]; // 40%, 60%, 80%
  const warmupReps = [10, 6, 3];

  return warmupPercentages.map((pct, i) => ({
    setNumber: i + 1,
    weight: Math.round((workingWeight * pct) / 2.5) * 2.5, // Round to nearest 2.5kg
    reps: warmupReps[i] ?? 5,
    percentage: Math.round(pct * 100),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// XP SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export const XP_VALUES = {
  setCompleted: 5,
  workoutCompleted: 50,
  prAchieved: 100,
  streakBonus: 25,    // per day beyond 3 days
  weeklyGoalMet: 75,
} as const;

export function calculateWorkoutXP(
  setsLogged: number,
  isPRWorkout: boolean,
  streakDays: number,
): number {
  let xp = setsLogged * XP_VALUES.setCompleted;
  xp += XP_VALUES.workoutCompleted;
  if (isPRWorkout) xp += XP_VALUES.prAchieved;
  if (streakDays >= 3) xp += (streakDays - 2) * XP_VALUES.streakBonus;
  return xp;
}
