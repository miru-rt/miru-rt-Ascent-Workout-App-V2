import * as SQLite from 'expo-sqlite';
import { ALL_TABLES, CREATE_INDEXES, DB_VERSION } from './schema';
import { PROGRAM_CONFIG, PROGRAM_WORKOUTS, PROGRAM_ID } from '../constants/program';
import { nowISO } from '../utils/formatters';
import { v4 as uuidv4 } from 'uuid';

let _db: SQLite.SQLiteDatabase | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE SINGLETON
// ─────────────────────────────────────────────────────────────────────────────

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync('ascend.db');

  // Enable WAL mode for better concurrent performance
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  await runMigrations(_db);
  return _db;
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create migrations tracking table first
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations',
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < DB_VERSION) {
    await applyMigration1(db);
    await db.runAsync(
      'INSERT INTO _migrations (version, applied_at) VALUES (?, ?)',
      [DB_VERSION, nowISO()],
    );
  }
}

async function applyMigration1(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create all tables
  for (const tableSQL of ALL_TABLES) {
    await db.execAsync(tableSQL);
  }

  // Create indexes
  await db.execAsync(CREATE_INDEXES);

  // Seed initial data
  await seedDatabase(db);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE SEEDING
// ─────────────────────────────────────────────────────────────────────────────

async function seedDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = nowISO();

  // 1. Create user profile
  await db.runAsync(
    `INSERT OR IGNORE INTO user_profile
      (id, name, level, xp, xp_to_next_level, streak_days, longest_streak,
       last_workout_date, total_workouts, total_volume, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['default', 'Warrior', 1, 0, 100, 0, 0, null, 0, 0, now],
  );

  // 2. Create Athletic Physique program
  await db.runAsync(
    `INSERT OR IGNORE INTO programs (id, name, description, phase, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      PROGRAM_CONFIG.id,
      PROGRAM_CONFIG.name,
      PROGRAM_CONFIG.description,
      PROGRAM_CONFIG.phase,
      1,
      now,
    ],
  );

  // 3. Create exercises and program_exercises for each workout day
  for (const workoutDay of PROGRAM_WORKOUTS) {
    for (let i = 0; i < workoutDay.exercises.length; i++) {
      const exConfig = workoutDay.exercises[i];
      if (!exConfig) continue;

      // Check if exercise already exists (by name)
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM exercises WHERE name = ?',
        [exConfig.name],
      );

      let exerciseId: string;

      if (existing) {
        exerciseId = existing.id;
      } else {
        exerciseId = uuidv4();
        await db.runAsync(
          `INSERT INTO exercises
            (id, name, muscle_group, secondary_muscles, equipment, instructions, is_custom, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exerciseId,
            exConfig.name,
            exConfig.muscleGroup,
            JSON.stringify([]),
            exConfig.equipment,
            exConfig.instructions,
            0,
            now,
          ],
        );
      }

      // Create program exercise link
      const programExId = uuidv4();
      await db.runAsync(
        `INSERT OR IGNORE INTO program_exercises
          (id, program_id, workout_day, exercise_id, order_index, target_sets,
           rep_range_min, rep_range_max, start_weight)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          programExId,
          PROGRAM_ID,
          workoutDay.day,
          exerciseId,
          i,
          exConfig.targetSets,
          exConfig.repRangeMin,
          exConfig.repRangeMax,
          exConfig.startWeight,
        ],
      );
    }
  }

  // 4. Seed sample workout history for demo purposes
  await seedSampleHistory(db, now);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE HISTORY SEEDING (for a realistic first-launch experience)
// ─────────────────────────────────────────────────────────────────────────────

async function seedSampleHistory(db: SQLite.SQLiteDatabase, now: string): Promise<void> {
  // Generate 8 weeks of history for Upper A exercises
  const upperAExercises = await db.getAllAsync<{ id: string; name: string; start_weight: number }>(
    `SELECT e.id, e.name, pe.start_weight
     FROM program_exercises pe
     JOIN exercises e ON pe.exercise_id = e.id
     WHERE pe.program_id = ? AND pe.workout_day = 'Upper A'
     ORDER BY pe.order_index`,
    [PROGRAM_ID],
  );

  const pastDates: string[] = [];
  for (let weeksAgo = 8; weeksAgo >= 1; weeksAgo--) {
    const d = new Date();
    d.setDate(d.getDate() - weeksAgo * 7);
    pastDates.push(d.toISOString());
  }

  for (let wk = 0; wk < pastDates.length; wk++) {
    const dateStr = pastDates[wk];
    if (!dateStr) continue;

    const workoutId = uuidv4();
    const workoutDate = new Date(dateStr);
    const completedAt = new Date(workoutDate.getTime() + 45 * 60_000).toISOString();

    let workoutVolume = 0;
    let workoutSets = 0;
    const setRows: Array<[string, string, string, number, number, number, number, number, string, string]> = [];

    for (const ex of upperAExercises) {
      const progressFactor = Math.floor(wk / 3);
      const baseWeight = ex.start_weight ?? 0;
      const inc = baseWeight >= 50 ? 5 : baseWeight >= 20 ? 2.5 : 1;
      const weight = baseWeight + progressFactor * inc;
      const reps1 = Math.min(9 + (wk % 3), 12);
      const reps2 = Math.max(reps1 - 1, 8);

      for (let s = 0; s < 2; s++) {
        const reps = s === 0 ? reps1 : reps2;
        setRows.push([
          uuidv4(), workoutId, ex.id, s + 1, weight, reps, 0, 0, dateStr, dateStr,
        ]);
        workoutVolume += weight * reps;
        workoutSets++;
      }
    }

    await db.runAsync(
      `INSERT INTO workouts
        (id, program_id, workout_day, started_at, completed_at,
         duration_seconds, total_volume, total_sets)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [workoutId, PROGRAM_ID, 'Upper A', dateStr, completedAt, 2700, workoutVolume, workoutSets],
    );

    for (const setData of setRows) {
      await db.runAsync(
        `INSERT INTO sets
          (id, workout_id, exercise_id, set_number, weight, reps, is_warmup, is_pr, logged_at, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        setData,
      );
    }

    // Update user profile stats
    await db.runAsync(
      `UPDATE user_profile
       SET total_workouts = total_workouts + 1,
           total_volume = total_volume + ?,
           last_workout_date = ?
       WHERE id = 'default'`,
      [workoutVolume, dateStr],
    );
  }

  // Set streak and XP based on seeded data
  await db.runAsync(
    `UPDATE user_profile
     SET streak_days = 14,
         longest_streak = 14,
         xp = 340,
         level = 7,
         xp_to_next_level = 500,
         total_workouts = 47,
         total_volume = 142380
     WHERE id = 'default'`,
  );
}
