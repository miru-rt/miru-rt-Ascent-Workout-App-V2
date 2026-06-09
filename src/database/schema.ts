// SQL statements for all tables

export const CREATE_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    muscle_group TEXT NOT NULL,
    secondary_muscles TEXT NOT NULL DEFAULT '[]',
    equipment TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_PROGRAMS_TABLE = `
  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    phase TEXT NOT NULL DEFAULT 'Hypertrophy',
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_PROGRAM_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS program_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    program_id TEXT NOT NULL,
    workout_day TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    target_sets INTEGER NOT NULL DEFAULT 3,
    rep_range_min INTEGER NOT NULL DEFAULT 8,
    rep_range_max INTEGER NOT NULL DEFAULT 12,
    start_weight REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );
`;

export const CREATE_WORKOUTS_TABLE = `
  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY NOT NULL,
    program_id TEXT,
    workout_day TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_seconds INTEGER,
    notes TEXT,
    total_volume REAL NOT NULL DEFAULT 0,
    total_sets INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
  );
`;

export const CREATE_SETS_TABLE = `
  CREATE TABLE IF NOT EXISTS sets (
    id TEXT PRIMARY KEY NOT NULL,
    workout_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL DEFAULT 1,
    weight REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    is_warmup INTEGER NOT NULL DEFAULT 0,
    is_pr INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    logged_at TEXT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );
`;

export const CREATE_MEASUREMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS measurements (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    measured_at TEXT NOT NULL
  );
`;

export const CREATE_USER_PROFILE_TABLE = `
  CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'Warrior',
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_workout_date TEXT,
    total_workouts INTEGER NOT NULL DEFAULT 0,
    total_volume REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_PERSONAL_RECORDS_TABLE = `
  CREATE TABLE IF NOT EXISTS personal_records (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_id TEXT NOT NULL,
    type TEXT NOT NULL,
    value REAL NOT NULL,
    workout_id TEXT,
    achieved_at TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
  );
`;

export const CREATE_PROGRESS_PHOTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS progress_photos (
    id TEXT PRIMARY KEY NOT NULL,
    uri TEXT NOT NULL,
    type TEXT NOT NULL,
    taken_at TEXT NOT NULL,
    notes TEXT
  );
`;

// Indexes for performance
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_sets_workout_id ON sets(workout_id);
  CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_workouts_started_at ON workouts(started_at);
  CREATE INDEX IF NOT EXISTS idx_workouts_workout_day ON workouts(workout_day);
  CREATE INDEX IF NOT EXISTS idx_program_exercises_program_id ON program_exercises(program_id);
  CREATE INDEX IF NOT EXISTS idx_personal_records_exercise_id ON personal_records(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_measurements_type ON measurements(type);
`;

export const DB_VERSION = 1;

export const ALL_TABLES = [
  CREATE_EXERCISES_TABLE,
  CREATE_PROGRAMS_TABLE,
  CREATE_PROGRAM_EXERCISES_TABLE,
  CREATE_WORKOUTS_TABLE,
  CREATE_SETS_TABLE,
  CREATE_MEASUREMENTS_TABLE,
  CREATE_USER_PROFILE_TABLE,
  CREATE_PERSONAL_RECORDS_TABLE,
  CREATE_PROGRESS_PHOTOS_TABLE,
];
