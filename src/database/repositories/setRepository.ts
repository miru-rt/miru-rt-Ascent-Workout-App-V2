import { getDatabase } from '../database';
import { LoggedSet, ExerciseSession, DBSet } from '../../types';
import { nowISO } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS
// ─────────────────────────────────────────────────────────────────────────────

function mapDbToSet(row: DBSet): LoggedSet {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    weight: row.weight,
    reps: row.reps,
    isWarmup: row.is_warmup === 1,
    isPR: row.is_pr === 1,
    notes: row.notes,
    loggedAt: row.logged_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function logSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  isWarmup = false,
  isPR = false,
  notes: string | null = null,
): Promise<LoggedSet> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO sets
      (id, workout_id, exercise_id, set_number, weight, reps, is_warmup, is_pr, notes, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, workoutId, exerciseId, setNumber, weight, reps, isWarmup ? 1 : 0, isPR ? 1 : 0, notes, now],
  );

  return {
    id,
    workoutId,
    exerciseId,
    setNumber,
    weight,
    reps,
    isWarmup,
    isPR,
    notes,
    loggedAt: now,
  };
}

export async function logSetBatch(
  workoutId: string,
  exerciseId: string,
  sets: Array<{ weight: number; reps: number; isWarmup?: boolean }>,
): Promise<LoggedSet[]> {
  const results: LoggedSet[] = [];
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    if (!set) continue;
    const result = await logSet(
      workoutId,
      exerciseId,
      i + 1,
      set.weight,
      set.reps,
      set.isWarmup ?? false,
    );
    results.push(result);
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSet(
  id: string,
  weight: number,
  reps: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sets SET weight = ?, reps = ? WHERE id = ?',
    [weight, reps, id],
  );
}

export async function markSetAsPR(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sets SET is_pr = 1 WHERE id = ?', [id]);
}

export async function deleteSet(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sets WHERE id = ?', [id]);
}

export async function deleteSetsForWorkoutExercise(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM sets WHERE workout_id = ? AND exercise_id = ?',
    [workoutId, exerciseId],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// READ - SETS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSetsForWorkout(workoutId: string): Promise<LoggedSet[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBSet>(
    `SELECT * FROM sets WHERE workout_id = ? ORDER BY exercise_id, set_number`,
    [workoutId],
  );
  return rows.map(mapDbToSet);
}

export async function getSetsForExerciseInWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<LoggedSet[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBSet>(
    `SELECT * FROM sets
     WHERE workout_id = ? AND exercise_id = ? AND is_warmup = 0
     ORDER BY set_number`,
    [workoutId, exerciseId],
  );
  return rows.map(mapDbToSet);
}

// ─────────────────────────────────────────────────────────────────────────────
// READ - EXERCISE HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function getExerciseHistory(
  exerciseId: string,
  limit = 15,
): Promise<ExerciseSession[]> {
  const db = await getDatabase();

  // Get all workouts that included this exercise (completed only)
  const workouts = await db.getAllAsync<{
    workout_id: string;
    started_at: string;
  }>(
    `SELECT DISTINCT s.workout_id, w.started_at
     FROM sets s
     JOIN workouts w ON s.workout_id = w.id
     WHERE s.exercise_id = ?
       AND w.completed_at IS NOT NULL
       AND s.is_warmup = 0
     ORDER BY w.started_at DESC
     LIMIT ?`,
    [exerciseId, limit],
  );

  const sessions: ExerciseSession[] = [];

  for (const workout of workouts) {
    const rows = await db.getAllAsync<DBSet>(
      `SELECT * FROM sets
       WHERE workout_id = ? AND exercise_id = ? AND is_warmup = 0
       ORDER BY set_number`,
      [workout.workout_id, exerciseId],
    );

    if (rows.length === 0) continue;

    const sets = rows.map((r) => ({ weight: r.weight, reps: r.reps }));
    const volume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
    const maxWeight = Math.max(...sets.map((s) => s.weight));
    const avgReps = sets.reduce((acc, s) => acc + s.reps, 0) / sets.length;
    const hasPR = rows.some((r) => r.is_pr === 1);

    sessions.push({
      date: workout.started_at,
      workoutId: workout.workout_id,
      sets,
      volume,
      maxWeight,
      avgReps,
      isPRSession: hasPR,
    });
  }

  return sessions.reverse(); // oldest first for chart display
}

export async function getLastSessionForExercise(
  exerciseId: string,
): Promise<ExerciseSession | null> {
  const history = await getExerciseHistory(exerciseId, 1);
  return history.length > 0 ? (history[history.length - 1] ?? null) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ - ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMuscleGroupVolume(): Promise<
  Array<{ muscleGroup: string; sets: number }>
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ muscle_group: string; sets: number }>(
    `SELECT e.muscle_group, COUNT(s.id) as sets
     FROM sets s
     JOIN exercises e ON s.exercise_id = e.id
     JOIN workouts w ON s.workout_id = w.id
     WHERE w.completed_at IS NOT NULL
       AND s.is_warmup = 0
       AND w.started_at >= datetime('now', '-4 weeks')
     GROUP BY e.muscle_group
     ORDER BY sets DESC`,
  );
  return rows.map((r) => ({ muscleGroup: r.muscle_group, sets: r.sets }));
}

export async function getRecentPRs(limit = 5): Promise<
  Array<{ exerciseName: string; weight: number; reps: number; date: string }>
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    exercise_name: string;
    weight: number;
    reps: number;
    logged_at: string;
  }>(
    `SELECT e.name as exercise_name, s.weight, s.reps, s.logged_at
     FROM sets s
     JOIN exercises e ON s.exercise_id = e.id
     WHERE s.is_pr = 1
     ORDER BY s.logged_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    exerciseName: r.exercise_name,
    weight: r.weight,
    reps: r.reps,
    date: r.logged_at,
  }));
}
