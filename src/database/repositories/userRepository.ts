import { getDatabase } from '../database';
import { UserProfile, PersonalRecord, DBUserProfile, DBPR, PRType } from '../../types';
import { nowISO } from '../../utils/formatters';
import { calculateLevel } from '../../constants/theme';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function mapDbToProfile(row: DBUserProfile): UserProfile {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    xp: row.xp,
    xpToNextLevel: row.xp_to_next_level,
    streakDays: row.streak_days,
    longestStreak: row.longest_streak,
    lastWorkoutDate: row.last_workout_date,
    totalWorkouts: row.total_workouts,
    totalVolume: row.total_volume,
    createdAt: row.created_at,
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DBUserProfile>(
    `SELECT * FROM user_profile WHERE id = 'default'`,
  );
  return row ? mapDbToProfile(row) : null;
}

export async function updateProfileName(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE user_profile SET name = ? WHERE id = 'default'`, [name]);
}

export async function addXPAndUpdateLevel(xpGained: number): Promise<UserProfile | null> {
  const db = await getDatabase();
  const current = await getUserProfile();
  if (!current) return null;

  const totalXP = current.xp + xpGained;
  const { level, xp, xpToNext } = calculateLevel(totalXP);

  await db.runAsync(
    `UPDATE user_profile SET level = ?, xp = ?, xp_to_next_level = ? WHERE id = 'default'`,
    [level, xp, xpToNext],
  );

  return { ...current, level, xp, xpToNextLevel: xpToNext };
}

export async function updateStreakAfterWorkout(): Promise<void> {
  const db = await getDatabase();
  const profile = await getUserProfile();
  if (!profile) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastDate = profile.lastWorkoutDate?.split('T')[0];

  let newStreak = profile.streakDays;

  if (lastDate === today) {
    // Already worked out today, no streak change
    return;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    newStreak = profile.streakDays + 1;
  } else {
    newStreak = 1; // Reset streak
  }

  const longestStreak = Math.max(newStreak, profile.longestStreak);

  await db.runAsync(
    `UPDATE user_profile
     SET streak_days = ?, longest_streak = ?, last_workout_date = ?,
         total_workouts = total_workouts + 1
     WHERE id = 'default'`,
    [newStreak, longestStreak, nowISO()],
  );
}

export async function updateTotalVolume(volumeAdded: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE user_profile SET total_volume = total_volume + ? WHERE id = 'default'`,
    [volumeAdded],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────

function mapDbToPR(row: DBPR): PersonalRecord {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    type: row.type as PRType,
    value: row.value,
    workoutId: row.workout_id,
    achievedAt: row.achieved_at,
  };
}

export async function upsertPR(
  exerciseId: string,
  type: PRType,
  value: number,
  workoutId: string | null = null,
): Promise<PersonalRecord> {
  const db = await getDatabase();
  const now = nowISO();

  const existing = await db.getFirstAsync<DBPR>(
    `SELECT * FROM personal_records WHERE exercise_id = ? AND type = ?`,
    [exerciseId, type],
  );

  if (existing && existing.value >= value) {
    return mapDbToPR(existing);
  }

  if (existing) {
    await db.runAsync(
      `UPDATE personal_records SET value = ?, workout_id = ?, achieved_at = ? WHERE id = ?`,
      [value, workoutId, now, existing.id],
    );
    return { ...mapDbToPR(existing), value, workoutId, achievedAt: now };
  } else {
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO personal_records (id, exercise_id, type, value, workout_id, achieved_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, exerciseId, type, value, workoutId, now],
    );
    return { id, exerciseId, type, value, workoutId, achievedAt: now };
  }
}

export async function getPRsForExercise(exerciseId: string): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBPR>(
    `SELECT * FROM personal_records WHERE exercise_id = ?`,
    [exerciseId],
  );
  return rows.map(mapDbToPR);
}

export async function getRecentPRRecords(
  limit = 5,
): Promise<Array<PersonalRecord & { exerciseName: string }>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBPR & { name: string }>(
    `SELECT pr.*, e.name
     FROM personal_records pr
     JOIN exercises e ON pr.exercise_id = e.id
     WHERE pr.type = 'max_weight'
     ORDER BY pr.achieved_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({ ...mapDbToPR(r), exerciseName: r.name }));
}
