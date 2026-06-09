import { getDatabase } from '../database';
import { Exercise, ProgramExercise, DBExercise, DBProgramExercise, MuscleGroup } from '../../types';
import { nowISO } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS
// ─────────────────────────────────────────────────────────────────────────────

function mapDbToExercise(row: DBExercise): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group as MuscleGroup,
    secondaryMuscles: JSON.parse(row.secondary_muscles ?? '[]') as string[],
    equipment: row.equipment,
    instructions: row.instructions,
    isCustom: row.is_custom === 1,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBExercise>('SELECT * FROM exercises ORDER BY name');
  return rows.map(mapDbToExercise);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DBExercise>('SELECT * FROM exercises WHERE id = ?', [id]);
  return row ? mapDbToExercise(row) : null;
}

export async function getExerciseByName(name: string): Promise<Exercise | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DBExercise>(
    'SELECT * FROM exercises WHERE name = ? COLLATE NOCASE',
    [name],
  );
  return row ? mapDbToExercise(row) : null;
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBExercise>(
    `SELECT * FROM exercises
     WHERE name LIKE ? OR muscle_group LIKE ?
     ORDER BY name`,
    [`%${query}%`, `%${query}%`],
  );
  return rows.map(mapDbToExercise);
}

export async function createCustomExercise(
  name: string,
  muscleGroup: MuscleGroup,
  equipment: string,
  instructions: string,
): Promise<Exercise> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO exercises (id, name, muscle_group, secondary_muscles, equipment, instructions, is_custom, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, muscleGroup, '[]', equipment, instructions, 1, now],
  );

  return {
    id,
    name,
    muscleGroup,
    secondaryMuscles: [],
    equipment,
    instructions,
    isCustom: true,
    createdAt: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM EXERCISE QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getProgramExercises(
  programId: string,
  workoutDay: string,
): Promise<ProgramExercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DBProgramExercise & DBExercise>(
    `SELECT pe.*, e.name, e.muscle_group, e.secondary_muscles,
            e.equipment, e.instructions, e.is_custom, e.created_at
     FROM program_exercises pe
     JOIN exercises e ON pe.exercise_id = e.id
     WHERE pe.program_id = ? AND pe.workout_day = ?
     ORDER BY pe.order_index`,
    [programId, workoutDay],
  );

  return rows.map((row) => ({
    id: row.id,
    programId: row.program_id,
    workoutDay: row.workout_day as ProgramExercise['workoutDay'],
    exerciseId: row.exercise_id,
    orderIndex: row.order_index,
    targetSets: row.target_sets,
    repRangeMin: row.rep_range_min,
    repRangeMax: row.rep_range_max,
    startWeight: row.start_weight,
    exercise: {
      id: row.exercise_id,
      name: row.name,
      muscleGroup: row.muscle_group as MuscleGroup,
      secondaryMuscles: JSON.parse(row.secondary_muscles ?? '[]') as string[],
      equipment: row.equipment,
      instructions: row.instructions,
      isCustom: row.is_custom === 1,
      createdAt: row.created_at,
    },
  }));
}

export async function getAllWorkoutDays(programId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ workout_day: string }>(
    `SELECT DISTINCT workout_day FROM program_exercises WHERE program_id = ? ORDER BY
     CASE workout_day
       WHEN 'Upper A' THEN 1
       WHEN 'Lower A' THEN 2
       WHEN 'Upper B' THEN 3
       WHEN 'Lower B' THEN 4
       ELSE 5
     END`,
    [programId],
  );
  return rows.map((r) => r.workout_day);
}
