import { WarmupSet } from '../types';
import { calculateWarmupSets } from '../utils/calculations';

// ─────────────────────────────────────────────────────────────────────────────
// WARMUP SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface WarmupPlan {
  workingWeight: number;
  sets: WarmupSet[];
  totalSets: number;
  estimatedMinutes: number;
}

export function generateWarmupPlan(workingWeight: number): WarmupPlan {
  const sets = calculateWarmupSets(workingWeight);

  return {
    workingWeight,
    sets,
    totalSets: sets.length,
    estimatedMinutes: sets.length * 2, // ~2 min per warmup set including rest
  };
}

export function formatWarmupSet(set: WarmupSet): string {
  return `${set.weight}kg × ${set.reps} (${set.percentage}%)`;
}
