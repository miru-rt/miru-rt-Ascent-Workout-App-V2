// ─────────────────────────────────────────────────────────────────────────────
// CORE DOMAIN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type WorkoutDay = 'Upper A' | 'Lower A' | 'Upper B' | 'Lower B';

export type MeasurementType =
  | 'weight'
  | 'waist'
  | 'chest'
  | 'arms'
  | 'thighs'
  | 'hips';

export type PRType =
  | 'max_weight'
  | 'max_reps'
  | 'best_1rm'
  | 'best_volume';

export type MuscleGroup =
  | 'Back'
  | 'Chest'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Glutes';

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: string;
  instructions: string;
  isCustom: boolean;
  createdAt: string;
}

export interface ProgramExercise {
  id: string;
  programId: string;
  workoutDay: WorkoutDay;
  exerciseId: string;
  exercise: Exercise;
  orderIndex: number;
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  startWeight: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT SESSION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  programId: string | null;
  workoutDay: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  totalVolume: number;
  totalSets: number;
}

export interface LoggedSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  isWarmup: boolean;
  isPR: boolean;
  notes: string | null;
  loggedAt: string;
}

// In-progress set entry (before saving to DB)
export interface SetEntry {
  weight: number;
  reps: number;
  isWarmup: boolean;
}

// Active workout state (in-memory, not yet fully persisted)
export interface ActiveWorkoutState {
  workoutId: string;
  workoutDay: string;
  programId: string | null;
  startedAt: Date;
  sets: Record<string, SetEntry[]>; // exerciseId -> logged sets
  notes: Record<string, string>;    // exerciseId -> notes
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY & ANALYTICS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExerciseSession {
  date: string;
  workoutId: string;
  sets: Array<{ weight: number; reps: number }>;
  volume: number;
  maxWeight: number;
  avgReps: number;
  isPRSession: boolean;
}

export interface ExercisePRs {
  maxWeight: number;
  maxReps: number;
  best1RM: number;
  bestVolume: number;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: PRType;
  value: number;
  workoutId: string | null;
  achievedAt: string;
}

export interface WeeklyVolume {
  weekLabel: string;
  weekStart: string;
  volume: number;
  workoutCount: number;
}

export interface MuscleVolume {
  muscleGroup: MuscleGroup;
  sets: number;
  percentage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEASUREMENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Measurement {
  id: string;
  type: MeasurementType;
  value: number;
  unit: string;
  measuredAt: string;
}

export interface ProgressPhoto {
  id: string;
  uri: string;
  type: 'front' | 'side' | 'back';
  takenAt: string;
  notes: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkouts: number;
  totalVolume: number;
  createdAt: string;
}

export interface LevelConfig {
  level: number;
  title: string;
  xpRequired: number;
  xpToNext: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESSION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  increment: number;
  reason: 'double_progression_complete' | 'deload' | 'milestone';
}

export interface WarmupSet {
  setNumber: number;
  weight: number;
  reps: number;
  percentage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  description: string;
  phase: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkoutDayConfig {
  day: WorkoutDay;
  exercises: ProgramExerciseConfig[];
}

export interface ProgramExerciseConfig {
  name: string;
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  startWeight: number;
  muscleGroup: MuscleGroup;
  equipment: string;
  instructions: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE TYPES (raw rows)
// ─────────────────────────────────────────────────────────────────────────────

export interface DBExercise {
  id: string;
  name: string;
  muscle_group: string;
  secondary_muscles: string;
  equipment: string;
  instructions: string;
  is_custom: number;
  created_at: string;
}

export interface DBProgramExercise {
  id: string;
  program_id: string;
  workout_day: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  rep_range_min: number;
  rep_range_max: number;
  start_weight: number;
}

export interface DBWorkout {
  id: string;
  program_id: string | null;
  workout_day: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  total_volume: number;
  total_sets: number;
}

export interface DBSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  is_warmup: number;
  is_pr: number;
  notes: string | null;
  logged_at: string;
}

export interface DBMeasurement {
  id: string;
  type: string;
  value: number;
  unit: string;
  measured_at: string;
}

export interface DBUserProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  streak_days: number;
  longest_streak: number;
  last_workout_date: string | null;
  total_workouts: number;
  total_volume: number;
  created_at: string;
}

export interface DBPR {
  id: string;
  exercise_id: string;
  type: string;
  value: number;
  workout_id: string | null;
  achieved_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  value: number;
  label?: string;
  date?: string;
}

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
  }>;
}
