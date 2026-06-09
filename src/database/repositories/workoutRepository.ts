import { getDatabase } from '../database';
import { WorkoutSession, DBWorkout } from '../../types';
import { nowISO } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS
// ─────────────────────────────────────────────────────────────────────────────

function mapDbToWorkout(row: DBWorkout): WorkoutSession {
  return {
    id: row.id,
    programId: row.program_id,
    workoutDay: row.workout_day,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    notes: row.notes,
    totalVolume: row.total_volume,
    totalSets: row.total_sets,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createWorkout(
  workoutDay: string,
  programId: string | null = null,
): Promise<WorkoutSession> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO workouts
      (id, program_id, workout_day, started_at, completed_at,
       duration_seconds, notes, total_volume, total_sets)
     VALUES (?, ?, ?, ?, NULL, NULL, NULL, 0, 0)`,
    [id, programId, workoutDay, now],
  );

  return {
    id,
    programId,
    workoutDay,
    startedAt: now,
    completedAt: null,
    durationSeconds: null,
    notes: null,
    totalVolume: 0,
    totalSets: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function completeWorkout(
  id: string,
  totalVolume: number,
  totalSets: number,
  notes: string | null = null,
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  const workout = await getWorkoutById(id);
  if (!workout) return;

  const startTime = new Date(workout.startedAt);
  const durationSeconds = Math.round((Date.now() - startTime.getTime()) / 1000);

  await db.runAsync(
    `UPDATE workouts
     SET completed_at = ?, duration_seconds = ?, total_volume = ?, total_sets = ?, notes = ?
     WHERE id = ?`,
    [now, durationSeconds, totalVolume, totalSets, notes, id],
  );
}

export async function updateWorkoutNotes(id: string, notes: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workouts SET notes = ? WHERE id = ?', [notes, id]);
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorkoutById(id: string): Promise<WorkoutSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DBWorkout>('SELECT * FROM workouts WHERE id = ?', [id]);
  return row ? mapDbToWorkout(row) : null;
}

export async function getRecentWorkouts(limit = 20): Promise<WorkoutSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBWorkout>(
    `SELECT * FROM workouts
     WHERE completed_at IS NOT NULL
     ORDER BY started_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map(mapDbToWorkout);
}

export async function getWorkoutsForDay(workoutDay: string, limit = 10): Promise<WorkoutSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBWorkout>(
    `SELECT * FROM workouts
     WHERE workout_day = ? AND completed_at IS NOT NULL
     ORDER BY started_at DESC
     LIMIT ?`,
    [workoutDay, limit],
  );
  return rows.map(mapDbToWorkout);
}

export async function getWorkoutDatesInRange(
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ started_at: string }>(
    `SELECT started_at FROM workouts
     WHERE started_at >= ? AND started_at <= ? AND completed_at IS NOT NULL
     ORDER BY started_at DESC`,
    [startDate, endDate],
  );
  return rows.map((r) => r.started_at);
}

export async function getAllCompletedWorkoutDates(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ started_at: string }>(
    `SELECT started_at FROM workouts
     WHERE completed_at IS NOT NULL
     ORDER BY started_at DESC`,
  );
  return rows.map((r) => r.started_at);
}

export async function getWeeklyVolume(): Promise<Array<{ week: string; volume: number; count: number }>> {
  const db = await getDatabase();
  // Get weekly volumes for the last 8 weeks using SQLite date functions
  const rows = await db.getAllAsync<{ week: string; volume: number; count: number }>(
    `SELECT
       strftime('%Y-W%W', started_at) as week,
       SUM(total_volume) as volume,
       COUNT(*) as count
     FROM workouts
     WHERE completed_at IS NOT NULL
       AND started_at >= datetime('now', '-8 weeks')
     GROUP BY week
     ORDER BY week ASC
     LIMIT 8`,
  );
  return rows;
}

export async function getTotalStats(): Promise<{
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
}> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    totalWorkouts: number;
    totalVolume: number;
    totalSets: number;
  }>(
    `SELECT
       COUNT(*) as totalWorkouts,
       COALESCE(SUM(total_volume), 0) as totalVolume,
       COALESCE(SUM(total_sets), 0) as totalSets
     FROM workouts
     WHERE completed_at IS NOT NULL`,
  );

  return row ?? { totalWorkouts: 0, totalVolume: 0, totalSets: 0 };
}
