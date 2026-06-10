# Ascend — How To Customize

Step-by-step instructions for every common modification, with exact file locations and code examples.

---

## Table of Contents

1. [Adding a New Workout Program](#1-adding-a-new-workout-program)
2. [Adding a New Workout Day](#2-adding-a-new-workout-day)
3. [Adding a New Exercise](#3-adding-a-new-exercise)
4. [Editing Rep Ranges](#4-editing-rep-ranges)
5. [Editing Progression Rules](#5-editing-progression-rules)
6. [Editing Colors](#6-editing-colors)
7. [Editing the Theme (Fonts, Spacing, Radius)](#7-editing-the-theme)
8. [Editing Navigation](#8-editing-navigation)
9. [Editing Analytics](#9-editing-analytics)
10. [Editing Charts](#10-editing-charts)
11. [Editing the XP System](#11-editing-the-xp-system)
12. [Editing the Level/Achievement System](#12-editing-the-levelachievement-system)
13. [Editing Dashboard Cards](#13-editing-dashboard-cards)
14. [Editing Exercise Categories (Muscle Groups)](#14-editing-exercise-categories)

---

## 1. Adding a New Workout Program

A "program" is a named collection of workout days (e.g., "Push Pull Legs").

### Step 1 — Define the program data

**File:** `src/constants/program.ts`

Add a new export block after the existing `PROGRAM_WORKOUTS` array:

```typescript
// Add this after PROGRAM_WORKOUTS

export const PPL_PROGRAM_ID = 'push-pull-legs-v1';

export const PPL_PROGRAM_CONFIG = {
  id: PPL_PROGRAM_ID,
  name: 'Push Pull Legs',
  description: 'Classic 6-day PPL split for intermediate lifters.',
  phase: 'Strength + Hypertrophy',
};

export const PPL_WORKOUTS: WorkoutDayConfig[] = [
  {
    day: 'Push A' as WorkoutDay,   // you'll also need to add to WorkoutDay type
    exercises: [
      {
        name: 'Barbell Bench Press',
        targetSets: 4,
        repRangeMin: 5,
        repRangeMax: 8,
        startWeight: 60,
        muscleGroup: 'Chest',
        equipment: 'Barbell',
        instructions: 'Lie flat, grip just wider than shoulder width...',
      },
      // ... more exercises
    ],
  },
  // ... more days
];
```

### Step 2 — Extend the WorkoutDay type (if using new day names)

**File:** `src/types/index.ts`

```typescript
// Before:
export type WorkoutDay = 'Upper A' | 'Lower A' | 'Upper B' | 'Lower B';

// After:
export type WorkoutDay =
  | 'Upper A' | 'Lower A' | 'Upper B' | 'Lower B'
  | 'Push A'  | 'Pull A'  | 'Legs A'
  | 'Push B'  | 'Pull B'  | 'Legs B';
```

### Step 3 — Seed the new program into the database

**File:** `src/database/database.ts`

Inside the `seedDatabase()` function, add after the existing Athletic Physique seed:

```typescript
async function seedDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = nowISO();

  // ... existing Athletic Physique seeding ...

  // 5. Create PPL program
  await db.runAsync(
    `INSERT OR IGNORE INTO programs (id, name, description, phase, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [PPL_PROGRAM_CONFIG.id, PPL_PROGRAM_CONFIG.name,
     PPL_PROGRAM_CONFIG.description, PPL_PROGRAM_CONFIG.phase, 0, now],
  );

  // 6. Seed PPL exercises
  for (const workoutDay of PPL_WORKOUTS) {
    for (let i = 0; i < workoutDay.exercises.length; i++) {
      const exConfig = workoutDay.exercises[i];
      // ... same pattern as the Athletic Physique seed loop
    }
  }
}
```

### Step 4 — Increment the migration version so the seed runs again

**File:** `src/database/database.ts`

```typescript
// Before:
export const DB_VERSION = 1;

// After:
export const DB_VERSION = 2;   // triggers applyMigration1() again on next launch
```

> **Important:** On a device that already has version 1, you also need to add an `applyMigration2()` function that just inserts the new program rows. See the migrations pattern at the top of `database.ts`.

---

## 2. Adding a New Workout Day

A "workout day" is one session within a program (e.g., adding "Upper C" for a 3-day upper/lower).

### Step 1 — Add to the WorkoutDay type

**File:** `src/types/index.ts`

```typescript
export type WorkoutDay = 'Upper A' | 'Lower A' | 'Upper B' | 'Lower B' | 'Upper C';
//                                                                          ^^^^^^^^ new
```

### Step 2 — Define the exercises for the new day

**File:** `src/constants/program.ts`

Add a new entry to `PROGRAM_WORKOUTS`:

```typescript
export const PROGRAM_WORKOUTS: WorkoutDayConfig[] = [
  // ... existing Upper A, Lower A, Upper B, Lower B ...
  {
    day: 'Upper C',
    exercises: [
      {
        name: 'Incline Dumbbell Press',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        startWeight: 20,
        muscleGroup: 'Chest',
        equipment: 'Dumbbells',
        instructions: 'Set bench to 30–45 degrees...',
      },
      // ... more exercises
    ],
  },
];
```

### Step 3 — Add it to the weekly schedule

**File:** `src/constants/program.ts`

```typescript
export const WORKOUT_SCHEDULE = [
  { dayOfWeek: 1, workoutDay: 'Upper A', label: 'Mon' },
  { dayOfWeek: 2, workoutDay: 'Lower A', label: 'Tue' },
  { dayOfWeek: 3, workoutDay: null,      label: 'Wed' },
  { dayOfWeek: 4, workoutDay: 'Upper B', label: 'Thu' },
  { dayOfWeek: 5, workoutDay: 'Lower B', label: 'Fri' },
  { dayOfWeek: 6, workoutDay: 'Upper C', label: 'Sat' },  // ← new
  { dayOfWeek: 0, workoutDay: null,      label: 'Sun' },
];
```

### Step 4 — Re-seed the database

Follow Step 3 and 4 from "Adding a New Workout Program" above (increment `DB_VERSION`).

---

## 3. Adding a New Exercise

### Option A — Add to an existing workout day (persistent, available to all users)

**File:** `src/constants/program.ts`

Find the correct workout day in `PROGRAM_WORKOUTS` and append to its `exercises` array:

```typescript
{
  day: 'Upper A',
  exercises: [
    // ... existing exercises ...
    {
      name: 'Face Pull',              // ← new exercise
      targetSets: 3,
      repRangeMin: 12,
      repRangeMax: 20,
      startWeight: 10,
      muscleGroup: 'Shoulders',
      equipment: 'Cable Machine',
      instructions: 'Attach rope to high pulley. Pull toward face, elbows high and wide. Focus on rear delts and external rotation.',
    },
  ],
},
```

Then increment `DB_VERSION` in `src/database/database.ts` so the new exercise is seeded on next launch.

---

### Option B — Add a custom exercise at runtime (user-created)

Call `createCustomExercise()` from the exercise repository anywhere in your UI:

```typescript
// Example: inside a "Create Exercise" button handler
import { createCustomExercise } from '@database/repositories/exerciseRepository';

const newExercise = await createCustomExercise(
  'Cable Crunch',          // name
  'Core',                  // muscleGroup (must be a valid MuscleGroup type)
  'Cable Machine',         // equipment
  'Kneel at cable machine. Pull rope down, crunching elbows toward knees.',
);
```

Custom exercises have `is_custom = 1` in the database and can be queried with `getAllExercises()`.

---

## 4. Editing Rep Ranges

### For a single exercise in the program

**File:** `src/constants/program.ts`

Find the exercise and change `repRangeMin` / `repRangeMax`:

```typescript
{
  name: 'EZ-Bar Curl',
  targetSets: 2,
  repRangeMin: 6,   // was 8 — changed to heavier strength range
  repRangeMax: 10,  // was 12
  startWeight: 20,
  // ...
},
```

> **Note:** This only affects new installs or after a DB migration reset. For existing databases, the `program_exercises` row already exists. To update live, you need a migration that runs `UPDATE program_exercises SET rep_range_min = ?, rep_range_max = ? WHERE ...`.

### For all exercises in a muscle group

**File:** `src/database/database.ts`

Add a migration step that bulk-updates the rows:

```typescript
async function applyMigration2(db: SQLite.SQLiteDatabase): Promise<void> {
  // Change all arm exercises to 6–10 range
  await db.execAsync(`
    UPDATE program_exercises
    SET rep_range_min = 6, rep_range_max = 10
    WHERE exercise_id IN (
      SELECT id FROM exercises WHERE muscle_group = 'Arms'
    )
  `);
}
```

---

## 5. Editing Progression Rules

The double-progression system has two parts: detection and suggestion.

### Change when progression triggers

**File:** `src/utils/calculations.ts` — `checkReadyToProgress()` function

```typescript
// Current implementation: ALL sets must hit repRangeMax
export function checkReadyToProgress(
  sessions: ExerciseSession[],
  repRangeMax: number,
): boolean {
  if (sessions.length === 0) return false;
  const lastSession = sessions[sessions.length - 1];
  return lastSession.sets.every((s) => s.reps >= repRangeMax);
}

// Alternative: trigger if average reps across sets >= repRangeMax - 1
export function checkReadyToProgress(
  sessions: ExerciseSession[],
  repRangeMax: number,
): boolean {
  if (sessions.length === 0) return false;
  const lastSession = sessions[sessions.length - 1];
  const avgReps = lastSession.sets.reduce((a, s) => a + s.reps, 0) / lastSession.sets.length;
  return avgReps >= repRangeMax - 1;
}

// Alternative: require hitting repRangeMax in last 2 consecutive sessions
export function checkReadyToProgress(
  sessions: ExerciseSession[],
  repRangeMax: number,
): boolean {
  if (sessions.length < 2) return false;
  return sessions
    .slice(-2)
    .every((s) => s.sets.every((set) => set.reps >= repRangeMax));
}
```

### Change the weight increment size

**File:** `src/utils/calculations.ts` — `suggestedNextWeight()` function

```typescript
export function suggestedNextWeight(
  currentWeight: number,
  muscleGroup: string,
): number {
  const largeGroups = ['Legs', 'Back', 'Chest'];
  const isLarge = largeGroups.includes(muscleGroup);

  if (currentWeight === 0) return 0;

  // Current: tiered increments
  if (currentWeight >= 80) return currentWeight + (isLarge ? 5 : 2.5);
  if (currentWeight >= 40) return currentWeight + (isLarge ? 5 : 2.5);
  if (currentWeight >= 20) return currentWeight + (isLarge ? 2.5 : 1);
  return currentWeight + 1;

  // Alternative: fixed 2.5kg for everything
  // return currentWeight + 2.5;

  // Alternative: percentage-based (5% increase)
  // return Math.round((currentWeight * 1.05) / 2.5) * 2.5;
}
```

### Change how many sessions are checked

**File:** `src/services/progressionService.ts` — `evaluateProgression()`

```typescript
// Current: load last 5 sessions
const history = await getExerciseHistory(programExercise.exerciseId, 5);

// For stricter progression (check last 3):
const history = await getExerciseHistory(programExercise.exerciseId, 3);
```

---

## 6. Editing Colors

**File:** `src/constants/theme.ts` — the `Colors` object

Every color used anywhere in the app comes from this object. Change any value here and it updates everywhere.

```typescript
export const Colors = {
  // ── Backgrounds ──
  bg: '#07070f',          // main screen background — try '#0a0a14' for slightly lighter
  surface: '#0e0e1b',     // card background
  surfaceAlt: '#12122a',  // slightly lighter card (used in chart backgrounds)

  // ── Primary accent (purple) ──
  purple: '#8b5cf6',      // main brand color
  purpleLight: '#a78bfa', // hover/active states
  purpleDim: 'rgba(139, 92, 246, 0.18)', // tinted backgrounds

  // ── To change from purple to teal: ──
  // purple: '#14b8a6',
  // purpleLight: '#2dd4bf',
  // purpleDim: 'rgba(20, 184, 166, 0.18)',

  // ── Secondary accent (blue) ──
  blue: '#3b82f6',        // used for "today" highlights, last session callout

  // ── Achievement color (gold) ──
  gold: '#f59e0b',        // PRs, "ready to progress", level badges

  // ── Success (green) ──
  green: '#10b981',       // completed sets, bodyweight trend

  // ── Danger (red) ──
  red: '#ef4444',         // cancel button, regression indicators

  // ── Text ──
  textPrimary: '#f0eeff',    // main text
  textSecondary: '#8a84b0',  // labels, metadata
  textTertiary: '#45456a',   // very dim text, disabled states
};
```

### Muscle group colors

**File:** `src/constants/theme.ts` — the `MuscleColors` object

```typescript
export const MuscleColors: Record<string, string> = {
  Back:      Colors.purple,   // purple tags for back exercises
  Chest:     Colors.pink,     // pink tags for chest
  Shoulders: Colors.gold,     // gold tags for shoulders
  Arms:      Colors.green,    // green tags for arms
  Legs:      Colors.blue,     // blue tags for legs
  Core:      Colors.cyan,     // cyan tags for core
  Glutes:    Colors.blueLight,

  // To add a new muscle group color:
  // Calves: '#f97316',  // orange
};
```

---

## 7. Editing the Theme

### Fonts

**File:** `src/constants/theme.ts` — the `Fonts` object

```typescript
export const Fonts = {
  display: 'Rajdhani',   // used for numbers, headings, the ASCEND logo
  body: 'DMSans',        // used for all body text
  mono: 'Courier New',   // not currently used in UI
};
```

To switch to different fonts:
1. Install the new font package: `npx expo install @expo-google-fonts/bebas-neue`
2. Import it in `App.tsx` and add to `useFonts({})`
3. Update the font names in `theme.ts`

### Font sizes

```typescript
export const FontSizes = {
  xs: 11,   // tags, timestamps, hints
  sm: 13,   // metadata, secondary text
  md: 15,   // body text, exercise names
  lg: 17,   // section values
  xl: 20,   // card titles
  '2xl': 24, // screen titles
  '3xl': 28, // big stat numbers
  '4xl': 32, // hero numbers
  hero: 40, // not currently used
};
```

### Spacing

```typescript
export const Spacing = {
  xs: 4,    // tight gap between tags
  sm: 8,    // icon-to-label gap
  md: 12,   // inner card padding (tight)
  lg: 16,   // standard horizontal screen padding
  xl: 20,   // screen header padding
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};
```

### Border radius

```typescript
export const Radius = {
  sm: 6,    // tags, small chips
  md: 10,   // buttons, icon containers
  lg: 14,   // cards
  xl: 18,   // large cards
  '2xl': 22, // character card
  full: 999, // progress bars, circular elements
};
```

---

## 8. Editing Navigation

### Add a new tab to the bottom bar

**File:** `src/navigation/types.ts` — add to `MainTabParamList`:

```typescript
export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Progress: undefined;
  Analytics: undefined;
  Profile: undefined;
  Library: undefined;   // ← new tab
};
```

**File:** `src/navigation/TabNavigator.tsx` — add to `TAB_ICONS` and `Tab.Navigator`:

```typescript
const TAB_ICONS = {
  // ... existing entries ...
  Library: { active: 'library', inactive: 'library-outline' },
};

// Inside <Tab.Navigator>:
<Tab.Screen name="Library" component={LibraryScreen} />
```

**File:** Create `src/screens/LibraryScreen.tsx`.

---

### Add a new push screen (detail screen)

**File:** `src/navigation/types.ts` — add to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  // ... existing ...
  ExerciseDetail: {
    exerciseId: string;
    exerciseName: string;
  };
};
```

**File:** `src/navigation/RootNavigator.tsx` — register the screen:

```typescript
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';

// Inside <Stack.Navigator>:
<Stack.Screen
  name="ExerciseDetail"
  component={ExerciseDetailScreen}
  options={{ animation: 'slide_from_right' }}
/>
```

**Navigate to it from any screen:**

```typescript
navigation.navigate('ExerciseDetail', {
  exerciseId: 'some-id',
  exerciseName: 'Bench Press',
});
```

---

### Change the default tab on startup

**File:** `src/navigation/TabNavigator.tsx`

```typescript
<Tab.Navigator
  initialRouteName="Workouts"   // ← change from 'Dashboard'
  screenOptions={...}
>
```

---

### Change modal animation style

**File:** `src/navigation/RootNavigator.tsx`

```typescript
<Stack.Screen
  name="ActiveWorkout"
  component={ActiveWorkoutScreen}
  options={{
    animation: 'fade_from_bottom',  // options: slide_from_bottom, fade, slide_from_right
    gestureEnabled: false,
  }}
/>
```

---

## 9. Editing Analytics

### Add a new chart section to the analytics screen

**File:** `src/screens/AnalyticsScreen.tsx`

1. Add data fetching to `useAnalytics` hook first (see next section).
2. Add a new card to the scroll view:

```typescript
{/* ── New: Workout Duration Trend ── */}
<SectionLabel style={styles.sectionLabel}>Average Workout Duration</SectionLabel>
<Card style={styles.card}>
  <ExerciseLineChart
    labels={durationTrend.labels}
    data={durationTrend.data}
    color={Colors.cyan}
    height={140}
    suffix=" min"
  />
</Card>
```

### Add a new data source to useAnalytics

**File:** `src/hooks/useAnalytics.ts`

Add a new state variable and populate it inside `load()`:

```typescript
const [durationTrend, setDurationTrend] = useState<{ labels: string[]; data: number[] }>({
  labels: [], data: [],
});

// Inside load():
const durations = await db.getAllAsync<{ week: string; avg_minutes: number }>(`
  SELECT strftime('%Y-W%W', started_at) as week,
         AVG(duration_seconds / 60.0) as avg_minutes
  FROM workouts
  WHERE completed_at IS NOT NULL
    AND started_at >= datetime('now', '-8 weeks')
  GROUP BY week
  ORDER BY week ASC
`);

setDurationTrend({
  labels: durations.map((_, i) => `W${i + 1}`),
  data: durations.map((d) => Math.round(d.avg_minutes)),
});
```

---

## 10. Editing Charts

All charts are in `src/components/charts/Charts.tsx`.

### Change chart colors

Charts use a `buildChartConfig(primaryColor)` function. Pass a different color:

```typescript
// In ExerciseLineChart:
<ExerciseLineChart
  labels={chartLabels}
  data={activeData}
  color={Colors.cyan}   // ← was Colors.purple
  height={160}
/>
```

### Change chart height

```typescript
<VolumeBarChart
  labels={volLabels}
  data={volData}
  height={200}   // ← was 140 — make it taller
/>
```

### Change the number of data points shown

**File:** `src/hooks/useExerciseHistory.ts`

```typescript
// Current: last 10 sessions shown in chart
const chartHistory = history.slice(-10);

// Show last 6 for less busy charts:
const chartHistory = history.slice(-6);

// Show all history:
const chartHistory = history;
```

### Switch from bezier to straight lines

**File:** `src/components/charts/Charts.tsx` — `ExerciseLineChart`

```typescript
// Remove the `bezier` prop:
<LineChart
  data={...}
  // bezier    ← remove this line
  ...
/>
```

### Add dot labels to bars

**File:** `src/components/charts/Charts.tsx` — `VolumeBarChart`

```typescript
<BarChart
  data={...}
  showValuesOnTopOfBars={true}   // ← was false
  ...
/>
```

---

## 11. Editing the XP System

### Change XP rewards per action

**File:** `src/utils/calculations.ts` — the `XP_VALUES` object

```typescript
export const XP_VALUES = {
  setCompleted: 5,        // XP per logged set
  workoutCompleted: 50,   // XP bonus for finishing a workout
  prAchieved: 100,        // XP bonus for breaking a PR
  streakBonus: 25,        // XP per streak day beyond 3
  weeklyGoalMet: 75,      // XP for hitting 4 workouts in a week (not yet implemented)
};
```

### Change when streak bonus activates

**File:** `src/utils/calculations.ts` — `calculateWorkoutXP()`

```typescript
export function calculateWorkoutXP(
  setsLogged: number,
  isPRWorkout: boolean,
  streakDays: number,
): number {
  let xp = setsLogged * XP_VALUES.setCompleted;
  xp += XP_VALUES.workoutCompleted;
  if (isPRWorkout) xp += XP_VALUES.prAchieved;

  // Current: streak bonus starts at day 3
  if (streakDays >= 3) xp += (streakDays - 2) * XP_VALUES.streakBonus;

  // Change to: streak bonus starts at day 7
  // if (streakDays >= 7) xp += (streakDays - 6) * XP_VALUES.streakBonus;

  return xp;
}
```

### Change XP required per level

**File:** `src/constants/theme.ts` — `getXPForLevel()`

```typescript
// Current: exponential growth (each level needs 50% more XP than the last)
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
// Level 1: 100, Level 2: 150, Level 3: 225, Level 4: 337...

// Alternative: linear growth (100 XP per level)
export function getXPForLevel(level: number): number {
  return 100 * level;
}
// Level 1: 100, Level 2: 200, Level 3: 300...

// Alternative: fixed 500 XP per level
export function getXPForLevel(level: number): number {
  return 500;
}
```

---

## 12. Editing the Level/Achievement System

### Change level titles

**File:** `src/constants/theme.ts` — the `LEVEL_TITLES` array

```typescript
// Current:
export const LEVEL_TITLES = [
  'Novice', 'Apprentice', 'Warrior', 'Veteran', 'Champion',
  'Elite', 'Master', 'Grandmaster', 'Legend', 'Titan',
] as const;

// Fantasy RPG theme:
export const LEVEL_TITLES = [
  'Squire',   'Knight',   'Paladin',  'Crusader',  'Champion',
  'Guardian', 'Warlord',  'Titan',    'Demigod',   'Immortal',
] as const;

// Simple numbered titles:
export const LEVEL_TITLES = [
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5',
  'Level 6', 'Level 7', 'Level 8', 'Level 9', 'Level 10',
] as const;
```

### Add a new achievement type

Currently PRs are the only achievements. To add workout milestones (e.g., "100 Workouts" badge):

**File:** `src/database/schema.ts` — add an achievements table:

```typescript
export const CREATE_ACHIEVEMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,          -- 'workout_milestone', 'streak_milestone', 'pr_count'
    value INTEGER NOT NULL,      -- the milestone number (100 workouts, 30-day streak...)
    unlocked_at TEXT NOT NULL
  );
`;
```

**File:** `src/services/` — create `achievementService.ts`:

```typescript
export const ACHIEVEMENTS = [
  { type: 'workout_milestone', value: 10,  emoji: '🥉', title: 'First 10' },
  { type: 'workout_milestone', value: 50,  emoji: '🥈', title: 'Halfway Hero' },
  { type: 'workout_milestone', value: 100, emoji: '🥇', title: 'Century Club' },
];

export async function checkWorkoutMilestones(
  totalWorkouts: number,
): Promise<typeof ACHIEVEMENTS[0] | null> {
  const milestone = ACHIEVEMENTS.find(
    (a) => a.type === 'workout_milestone' && a.value === totalWorkouts,
  );
  if (!milestone) return null;

  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO achievements (id, type, value, unlocked_at) VALUES (?, ?, ?, ?)`,
    [uuidv4(), milestone.type, milestone.value, nowISO()],
  );
  return milestone;
}
```

Then call `checkWorkoutMilestones()` inside `workoutStore.finishWorkout()`.

---

## 13. Editing Dashboard Cards

The dashboard is a `ScrollView` of sections. Each section is independent.

**File:** `src/screens/DashboardScreen.tsx`

### Remove a card

Find the section wrapped in `{/* ── Section Name ── */}` comments and delete it:

```typescript
{/* ── Bodyweight Trend ── */}
{(bwData.length > 0 || latestBW) && (   // ← delete from here
  <View style={styles.section}>
    ...
  </View>
)}                                       // ← to here
```

### Add a new card — example: "Upcoming Rest Days"

```typescript
{/* ── Upcoming Schedule ── */}
<View style={styles.section}>
  <SectionLabel>This Week</SectionLabel>
  <Card>
    {WORKOUT_SCHEDULE.map(({ label, workoutDay }) => (
      <View key={label} style={styles.scheduleRow}>
        <Text style={styles.dayLabel}>{label}</Text>
        <Text style={styles.workoutLabel}>
          {workoutDay ?? 'Rest Day'}
        </Text>
      </View>
    ))}
  </Card>
</View>
```

### Change the stats row cards

Find the `{/* ── Stats row ── */}` section and modify the `statCard` array:

```typescript
// Current: Weekly Volume + This Week
// Change to: Total Workouts + Total Volume
<View style={styles.statsRow}>
  <Card style={styles.statCard}>
    <Text style={styles.statLabel}>Total Workouts</Text>
    <Text style={[styles.statValue, { color: Colors.purple }]}>
      {profile?.totalWorkouts ?? 0}
    </Text>
  </Card>
  <Card style={styles.statCard}>
    <Text style={styles.statLabel}>Total Volume</Text>
    <Text style={[styles.statValue, { color: Colors.blue }]}>
      {formatLargeNumber(profile?.totalVolume ?? 0)}
      <Text style={styles.statUnit}> kg</Text>
    </Text>
  </Card>
</View>
```

---

## 14. Editing Exercise Categories

"Muscle group" is the category system. Each exercise has one primary muscle group.

### Add a new muscle group

**File:** `src/types/index.ts`

```typescript
// Before:
export type MuscleGroup =
  | 'Back' | 'Chest' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Glutes';

// After — add Calves, Forearms, etc.:
export type MuscleGroup =
  | 'Back' | 'Chest' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Glutes'
  | 'Calves' | 'Forearms';
```

**File:** `src/constants/theme.ts` — add a color for it:

```typescript
export const MuscleColors: Record<string, string> = {
  // ... existing ...
  Calves:   '#f97316',  // orange
  Forearms: '#84cc16',  // lime green
};
```

### Rename a muscle group

If you want to display "Triceps" instead of grouping it under "Arms":

1. Change the type in `src/types/index.ts`
2. Update exercises in `src/constants/program.ts`
3. Add color in `src/constants/theme.ts`
4. The tag on exercise cards will update automatically

---

## Common Patterns Reference

### Reading from the database

```typescript
import { getDatabase } from '@database/database';

const db = await getDatabase();
const rows = await db.getAllAsync<{ id: string; name: string }>(
  'SELECT id, name FROM exercises WHERE muscle_group = ?',
  ['Back'],
);
```

### Writing a Zustand action that calls the DB

```typescript
// In a Zustand store action:
myAction: async (value: string) => {
  // 1. Persist to database
  await myRepository.save(value);

  // 2. Update in-memory state
  set((state) => {
    state.myValue = value;
  });
},
```

### Navigating with typed params

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';

const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

// Navigate:
navigation.navigate('ExerciseHistory', {
  exerciseId: 'abc-123',
  exerciseName: 'Bench Press',
  muscleGroup: 'Chest',
  repRangeMin: 8,
  repRangeMax: 12,
});
```

### Adding a new prop to an existing component

```typescript
// 1. Add to interface
interface ExerciseCardProps {
  // ... existing props
  showWarmupSets?: boolean;  // ← new optional prop
}

// 2. Destructure in component
export default function ExerciseCard({
  // ... existing
  showWarmupSets = false,    // ← with default value
}: ExerciseCardProps) {
  // 3. Use it
  return (
    <>
      {showWarmupSets && <WarmupSetsSection weight={suggestedNextWeight} />}
      {/* ... rest of component */}
    </>
  );
}
```
