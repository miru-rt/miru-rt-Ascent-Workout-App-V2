# Ascend — Project Guide

A complete map of the codebase for developers. Read this before touching any file.

---

## Table of Contents

1. [Mental Model](#mental-model)
2. [Complete Folder Structure](#complete-folder-structure)
3. [Configuration Files](#configuration-files)
4. [Types Layer](#types-layer)
5. [Constants Layer](#constants-layer)
6. [Database Layer](#database-layer)
7. [Services Layer](#services-layer)
8. [State Management Layer](#state-management-layer)
9. [Hooks Layer](#hooks-layer)
10. [Components Layer](#components-layer)
11. [Screens Layer](#screens-layer)
12. [Navigation Layer](#navigation-layer)
13. [Feature Maps](#feature-maps)

---

## Mental Model

Before reading file descriptions, understand how data flows through the app:

```
User taps "Log Set"
       │
       ▼
  ExerciseCard (component)
  calls onLogSet()
       │
       ▼
  ActiveWorkoutScreen (screen)
  calls workoutStore.logSet()
       │
       ├──▶ setRepository.logSet()  ──▶  SQLite database (persisted)
       │
       └──▶ prDetectionService      ──▶  personal_records table (if PR)
       │
       ▼
  useWorkoutStore (Zustand)
  updates in-memory sets{}
       │
       ▼
  ExerciseCard re-renders
  shows green "✓ 32kg × 10"
```

The same pattern applies everywhere: **Screen → Store/Hook → Repository → SQLite**.

---

## Complete Folder Structure

```
ascend/
│
├── App.tsx                         ← Entry point. Loads fonts, initialises DB,
│                                     mounts NavigationContainer.
│
├── app.json                        ← Expo project config (name, icons, permissions).
├── babel.config.js                 ← Transpiler config. Enables path aliases (@store, @screens…).
├── metro.config.js                 ← Metro bundler config (Expo default + .cjs extension).
├── tsconfig.json                   ← TypeScript config. Strict mode + path alias definitions.
├── package.json                    ← All dependencies and scripts.
│
└── src/
    │
    ├── types/
    │   └── index.ts                ← Every TypeScript interface in the app lives here.
    │
    ├── constants/
    │   ├── theme.ts                ← All colours, fonts, spacing, radius, shadow values.
    │   └── program.ts              ← The "Athletic Physique" program data (seed data).
    │
    ├── utils/
    │   ├── calculations.ts         ← Pure maths: 1RM, volume, progression, XP.
    │   ├── formatters.ts           ← String formatting: dates, weights, durations.
    │   └── dateUtils.ts            ← Date helpers: week starts, streak calculation.
    │
    ├── database/
    │   ├── schema.ts               ← SQL CREATE TABLE statements.
    │   ├── database.ts             ← DB singleton, migration runner, seed data.
    │   └── repositories/
    │       ├── exerciseRepository.ts    ← Read/write exercises and program structure.
    │       ├── workoutRepository.ts     ← Read/write workout sessions.
    │       ├── setRepository.ts         ← Read/write sets; exercise history queries.
    │       ├── measurementRepository.ts ← Body measurements and progress photos.
    │       └── userRepository.ts        ← User profile, XP, streaks, personal records.
    │
    ├── services/
    │   ├── progressionService.ts   ← Double-progression logic (is user ready to increase weight?).
    │   ├── prDetectionService.ts   ← Detects and records personal records in real time.
    │   ├── exportService.ts        ← Exports workout data as CSV or JSON via device share sheet.
    │   └── warmupService.ts        ← Generates warmup sets for a given working weight.
    │
    ├── store/
    │   ├── workoutStore.ts         ← Active workout session state (in-progress sets, timer).
    │   ├── userStore.ts            ← User profile + body measurements state.
    │   └── restTimerStore.ts       ← Shared rest-timer countdown state.
    │
    ├── hooks/
    │   ├── useExerciseHistory.ts   ← Loads history + PRs for one exercise.
    │   ├── useProgramExercises.ts  ← Loads exercises for a workout day.
    │   ├── useDashboard.ts         ← Aggregates all dashboard data.
    │   └── useAnalytics.ts         ← Loads volume, muscle, and trend data.
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx          ← Reusable button (7 colour variants).
    │   │   ├── Card.tsx            ← Reusable surface card (4 border variants).
    │   │   └── SharedUI.tsx        ← Tag, SectionLabel, ProgressBar, ScreenHeader,
    │   │                             Divider, StatChip, EmptyState.
    │   ├── workout/
    │   │   ├── ExerciseCard.tsx    ← The core workout-logging card.
    │   │   └── RestTimer.tsx       ← Animated rest-timer strip.
    │   ├── dashboard/
    │   │   └── CharacterCard.tsx   ← RPG level/XP card shown on dashboard + profile.
    │   └── charts/
    │       └── Charts.tsx          ← ExerciseLineChart, VolumeBarChart,
    │                                 BodyweightChart, MuscleBar.
    │
    ├── screens/
    │   ├── DashboardScreen.tsx         ← Home tab.
    │   ├── WorkoutsScreen.tsx          ← Program overview tab.
    │   ├── WorkoutDayDetailScreen.tsx  ← Exercise list before starting a day.
    │   ├── ActiveWorkoutScreen.tsx     ← Live logging screen (modal).
    │   ├── ExerciseHistoryScreen.tsx   ← Full history for one exercise (push).
    │   ├── ProgressScreen.tsx          ← Body measurements + photos tab.
    │   ├── AnalyticsScreen.tsx         ← Charts + calendar tab.
    │   ├── ProfileScreen.tsx           ← Character + settings tab.
    │   └── AddMeasurementScreen.tsx    ← Log weight/measurements (modal).
    │
    └── navigation/
        ├── types.ts               ← Typed route-param lists for every navigator.
        ├── TabNavigator.tsx       ← Bottom tab bar (5 tabs).
        └── RootNavigator.tsx      ← Root stack (tabs + modals + push screens).
```

---

## Configuration Files

### `App.tsx`
The root of the application. Three responsibilities:
1. **Font loading** — calls `useFonts()` with Rajdhani and DM Sans from Google Fonts.
2. **Database initialisation** — calls `getDatabase()` which runs migrations and seeds data on first launch.
3. **Navigation mounting** — renders `<NavigationContainer>` with the dark theme once both fonts and DB are ready.

If the app shows a blank screen or crashes on startup, check this file first.

---

### `app.json`
Expo project configuration. Controls:
- App name, slug, version, icon paths
- iOS bundle identifier and permissions (camera, photo library)
- Android package name and permissions
- Expo plugins (expo-font, expo-sqlite, expo-image-picker)

**You must edit this** when changing the app name or submitting to app stores.

---

### `babel.config.js`
Configures two things:
1. `babel-preset-expo` — standard Expo transpilation
2. `module-resolver` plugin — maps `@store/*` → `./src/store/*`, etc.

This is why you can write `import { useWorkoutStore } from '@store/workoutStore'` instead of `'../../../store/workoutStore'`. If you add a new top-level folder under `src/`, register it here and in `tsconfig.json`.

---

### `tsconfig.json`
TypeScript in strict mode. Key settings:
- `"strict": true` — enables all strict checks
- `"noImplicitAny": true` — every variable must have a type
- `"paths"` — path aliases that mirror `babel.config.js`

---

## Types Layer

### `src/types/index.ts`
**Every TypeScript interface in the entire app lives in this one file.** This is intentional — it makes it trivial to find any type definition.

Key type groups:

| Group | Types |
|---|---|
| Core enums | `WorkoutDay`, `MeasurementType`, `PRType`, `MuscleGroup` |
| Exercise | `Exercise`, `ProgramExercise` |
| Workout session | `WorkoutSession`, `LoggedSet`, `SetEntry`, `ActiveWorkoutState` |
| History | `ExerciseSession`, `ExercisePRs`, `PersonalRecord` |
| Analytics | `WeeklyVolume`, `MuscleVolume` |
| Measurements | `Measurement`, `ProgressPhoto` |
| User | `UserProfile`, `LevelConfig` |
| Progression | `ProgressionSuggestion`, `WarmupSet` |
| Program | `Program`, `WorkoutDayConfig`, `ProgramExerciseConfig` |
| DB rows | `DBExercise`, `DBSet`, `DBWorkout`, etc. (raw SQLite row shapes) |
| Chart | `ChartDataPoint`, `LineChartData`, `BarChartData` |

**DB types vs domain types:** Notice there are two sets: `DBExercise` (snake_case, matches SQLite columns) and `Exercise` (camelCase, used in components). Repositories map between them.

---

## Constants Layer

### `src/constants/theme.ts`
The single source of truth for all visual design tokens. If you want to change any colour, font, or spacing value, this is the only file you edit.

```
Colors        — every colour in the app (bg, surface, purple, gold, green…)
MuscleColors  — mapping of muscle group name → colour
Fonts         — font family names (Rajdhani for headings, DMSans for body)
FontSizes     — xs(11) sm(13) md(15) lg(17) xl(20) 2xl(24) 3xl(28) 4xl(32)
Spacing       — xs(4) sm(8) md(12) lg(16) xl(20) 2xl(24)…
Radius        — sm(6) md(10) lg(14) xl(18) 2xl(22) full(999)
Shadows       — purple, gold, card shadow presets
LEVEL_TITLES  — the 10 level name strings ("Novice", "Warrior"…)
getLevelTitle(level)     — returns title for a level number
getXPForLevel(level)     — XP required to reach a level
calculateLevel(totalXP)  — returns {level, xp, xpToNext} from accumulated XP
Durations     — animation timing constants
```

---

### `src/constants/program.ts`
Contains the built-in "Athletic Physique" program data that gets written to the database on first launch.

```
PROGRAM_ID        — UUID-like string used as the program's primary key
PROGRAM_CONFIG    — {id, name, description, phase}
WORKOUT_SCHEDULE  — [{dayOfWeek, workoutDay, label}] — the Mon/Tue/Thu/Fri pattern
PROGRAM_WORKOUTS  — Array of WorkoutDayConfig — the full exercise list for
                    Upper A, Lower A, Upper B, Lower B
```

Each exercise entry in `PROGRAM_WORKOUTS` contains: name, targetSets, repRangeMin, repRangeMax, startWeight, muscleGroup, equipment, and instructions.

**This is the file to edit when adding, removing, or changing exercises in the program.**

---

## Database Layer

### `src/database/schema.ts`
Contains only SQL string constants — no logic. Each `CREATE TABLE IF NOT EXISTS` statement is exported individually so `database.ts` can iterate over them.

Tables:
| Table | Purpose |
|---|---|
| `exercises` | Master list of all exercises (name, muscle group, instructions) |
| `programs` | Workout programs (Athletic Physique is the only one currently) |
| `program_exercises` | Which exercises belong to which workout day, with sets/reps/weight |
| `workouts` | Completed workout sessions (date, duration, total volume) |
| `sets` | Every individual set ever logged (weight, reps, is_pr flag) |
| `measurements` | Body measurements over time (weight, waist, chest…) |
| `user_profile` | Single row for the user (level, XP, streak, totals) |
| `personal_records` | Best weight/reps/1RM per exercise |
| `progress_photos` | URI + type (front/side/back) per photo |
| `_migrations` | Tracks which migration version has been applied |

---

### `src/database/database.ts`
The database singleton. Everything that talks to SQLite goes through this file's `getDatabase()` function.

**What happens on first launch:**
1. `SQLite.openDatabaseAsync('ascend.db')` creates the file
2. `PRAGMA journal_mode = WAL` enables Write-Ahead Logging (better performance)
3. `PRAGMA foreign_keys = ON` enforces relational integrity
4. `runMigrations()` checks the `_migrations` table; if version 0, runs `applyMigration1()`
5. `applyMigration1()` creates all tables, then calls `seedDatabase()`
6. `seedDatabase()` inserts the Athletic Physique program, all exercises, and 8 weeks of sample history

**On subsequent launches:** `getDatabase()` returns the cached `_db` instance immediately.

---

### `src/database/repositories/`

Repositories are the only layer that writes SQL. Nothing else in the app should import `expo-sqlite` directly.

#### `exerciseRepository.ts`
- `getAllExercises()` — full exercise list
- `getExerciseById(id)` — single exercise
- `getExerciseByName(name)` — lookup by name (case-insensitive)
- `searchExercises(query)` — name/muscle search
- `createCustomExercise(...)` — adds a user-defined exercise
- `getProgramExercises(programId, workoutDay)` — the ordered list of exercises for a specific workout day (joins `program_exercises` + `exercises`)
- `getAllWorkoutDays(programId)` — returns `['Upper A', 'Lower A', 'Upper B', 'Lower B']`

#### `workoutRepository.ts`
- `createWorkout(day, programId)` — creates a new in-progress workout row
- `completeWorkout(id, volume, sets)` — stamps `completed_at`, calculates duration
- `getWorkoutById(id)` — single workout
- `getRecentWorkouts(limit)` — last N completed workouts
- `getWorkoutsForDay(day)` — history of a specific day
- `getWeeklyVolume()` — aggregated volume per week for last 8 weeks
- `getTotalStats()` — lifetime totals (workouts, volume, sets)

#### `setRepository.ts`
The most queried repository.
- `logSet(workoutId, exerciseId, setNumber, weight, reps, isWarmup, isPR)` — saves a set
- `logSetBatch(workoutId, exerciseId, sets[])` — saves multiple sets
- `updateSet(id, weight, reps)` — edits a logged set
- `deleteSet(id)` — removes a set
- `getSetsForWorkout(workoutId)` — all sets in a session
- `getExerciseHistory(exerciseId, limit)` — **the core query** — returns `ExerciseSession[]` with sets, volume, and maxWeight per session, newest last
- `getLastSessionForExercise(exerciseId)` — convenience wrapper for the most recent session
- `getMuscleGroupVolume()` — sets per muscle group for last 4 weeks (analytics)
- `getRecentPRs(limit)` — recent `is_pr = 1` sets with exercise names

#### `measurementRepository.ts`
- `addMeasurement(type, value, unit)` — logs a body measurement
- `getMeasurementHistory(type, limit)` — time series for one measurement type
- `getLatestMeasurement(type)` — most recent entry for a type
- `getAllLatestMeasurements()` — latest entry for every type at once
- `addProgressPhoto(uri, type, notes)` — saves a photo URI
- `getProgressPhotos(type?)` — all photos, optionally filtered by front/side/back
- `deleteProgressPhoto(id)`

#### `userRepository.ts`
- `getUserProfile()` — reads the single user row
- `updateProfileName(name)`
- `addXPAndUpdateLevel(xpGained)` — adds XP and recalculates level using `calculateLevel()`
- `updateStreakAfterWorkout()` — checks if yesterday had a workout; increments or resets streak
- `updateTotalVolume(volumeAdded)`
- `upsertPR(exerciseId, type, value, workoutId)` — inserts or updates if the new value is higher
- `getPRsForExercise(exerciseId)` — all 4 PR types for one exercise
- `getRecentPRRecords(limit)` — recent PRs with exercise names (for dashboard)

---

## Services Layer

Services contain **business logic** that combines multiple repositories or does non-trivial calculation. They do not hold state and are called directly (not as hooks).

### `src/services/progressionService.ts`
Implements the **double progression** system.

```
evaluateProgression(programExercise)
  → loads last 5 sessions from setRepository
  → calls checkReadyToProgress() from calculations.ts
  → if all sets hit repRangeMax → isReadyToProgress = true
  → calculates suggestedNextWeight using suggestedNextWeight()
  → returns ProgressionResult {isReadyToProgress, suggestion, lastSessionData, progressPercentage}

evaluateWorkoutProgression(programExercises[])
  → runs evaluateProgression() in parallel for all exercises
  → returns Map<exerciseId, ProgressionResult>

shouldDeload(history[])
  → returns true if weight regressed in last 3 consecutive sessions
```

**Called by:** `ActiveWorkoutScreen` (on load, to pre-fill progression state for each card).

---

### `src/services/prDetectionService.ts`
Checks whether a just-logged set breaks any personal record.

```
checkAndRecordPR(exerciseId, weight, reps, workoutId)
  → loads last 50 sessions
  → computes current PRs with computePRs()
  → compares new set against maxWeight, maxReps, estimated1RM
  → calls upsertPR() for any broken records
  → returns {isPR, newPRTypes[], updatedPRs[]}
```

**Called by:** `workoutStore.logSet()` on every set logged.

---

### `src/services/exportService.ts`
Exports all workout data via the native share sheet.

```
exportWorkoutsAsJSON()  → fetches all workouts + sets → JSON.stringify → expo-sharing
exportWorkoutsAsCSV()   → fetches all workouts + sets → CSV string → expo-sharing
```

**Called by:** `ProfileScreen` export button.

---

### `src/services/warmupService.ts`
```
generateWarmupPlan(workingWeight)
  → calls calculateWarmupSets() from calculations.ts
  → returns {workingWeight, sets[], totalSets, estimatedMinutes}
```

**Not yet surfaced in the UI** — wired up and ready but the warmup flow screen hasn't been built.

---

## State Management Layer

The app uses **Zustand** for state. Zustand stores are like global `useState` — they hold data in memory and can call async functions to sync with the database.

### `src/store/workoutStore.ts`
Manages the **active in-progress workout**. This is the most complex store.

State:
```
activeWorkout: ActiveWorkoutState | null   ← null when no workout in progress
  .workoutId        — the DB row ID of the current workout
  .workoutDay       — "Upper A" etc.
  .startedAt        — Date object (for elapsed timer)
  .sets             — Record<exerciseId, SetEntry[]> — in-memory logged sets
  .notes            — Record<exerciseId, string>

isWorkoutActive: boolean
elapsedSeconds: number                     ← drives the timer display
pendingPRNotifications: [{exerciseName, prTypes[]}]
```

Key actions:
```
startWorkout(day)    → creates DB row → sets activeWorkout
logSet(...)          → calls prDetectionService → calls setRepository → updates sets{}
removeLastSet(exId)  → removes last entry from sets[exId]
finishWorkout()      → calls completeWorkout() → updateStreak() → addXP() → clears state
cancelWorkout()      → clears state without saving
getSetsForExercise(exId) → returns sets[exId] ?? []
getTotalSets()       → counts all non-warmup sets across all exercises
```

**Why Zustand + Immer?** Immer lets you write `state.sets[exId].push(newSet)` directly instead of spread-copying nested objects. Much cleaner for the deeply nested `sets` object.

---

### `src/store/userStore.ts`
Two stores in one file:

**`useUserStore`** — profile data:
```
profile: UserProfile | null
loadProfile()    → reads from userRepository
updateName(name) → writes to userRepository
refreshProfile() → re-reads from userRepository
```

**`useProgressStore`** — body measurements:
```
latestMeasurements: Partial<Record<MeasurementType, Measurement>>
bodyweightHistory: Measurement[]
loadMeasurements()          → reads all latest + bodyweight history
addBodyweight(value)        → writes weight measurement
addMeasurement(type, value) → writes any measurement
```

---

### `src/store/restTimerStore.ts`
A simple countdown timer.
```
secondsRemaining: number
totalSeconds: number    ← default duration (90s, configurable)
isActive: boolean

start(seconds?)  → resets and begins countdown
stop()           → halts countdown
tick()           → decrements secondsRemaining; calls stop() at 0
setDuration(s)   → changes default duration
```

`RestTimer` component reads this store and renders the countdown bar. `workoutStore.logSet()` calls `restTimerStore.start(90)` after every set is logged.

---

## Hooks Layer

Hooks are **React-specific wrappers** around repositories. They handle loading state, error state, and re-fetching. Components call hooks; hooks call repositories.

### `src/hooks/useExerciseHistory.ts`
Input: `exerciseId: string`
Output:
```
history: ExerciseSession[]   ← all sessions, oldest first
prs: ExercisePRs             ← {maxWeight, maxReps, best1RM, bestVolume}
lastSession: ExerciseSession | null
prevSession: ExerciseSession | null
isLoading: boolean
error: string | null
refresh: () => Promise<void>
weightData: number[]         ← pre-computed for chart
repsData: number[]
volumeData: number[]
chartLabels: string[]
```

**Used by:** `ExerciseHistoryScreen`.

---

### `src/hooks/useProgramExercises.ts`
Input: `workoutDay: string`
Output: `{ exercises: ProgramExercise[], isLoading, error, refresh }`

Calls `getProgramExercises(PROGRAM_ID, workoutDay)` from `exerciseRepository`.

**Used by:** `ActiveWorkoutScreen`, `WorkoutDayDetailScreen`.

---

### `src/hooks/useDashboard.ts`
Aggregates dashboard data from multiple repositories in parallel:
- `getUserProfile()`
- `getRecentWorkouts(20)`
- `getRecentPRs(3)`
- `getMeasurementHistory('weight', 12)`
- `getWeeklyVolume()`

Also computes `todayWorkoutDay` by checking the day of week against `WORKOUT_SCHEDULE`.

**Used by:** `DashboardScreen`.

---

### `src/hooks/useAnalytics.ts`
Aggregates analytics data:
- Weekly volume (bar chart data)
- Muscle group distribution (bar data)
- Recent PRs (list)
- Total stats (totals strip)
- All workout dates (calendar)
- Strength trends for 3 key lifts (line chart)

The strength trend query looks up "Neutral Grip Lat Pulldown", "Leg Press", and "EZ-Bar Curl" by name from the database.

**Used by:** `AnalyticsScreen`.

---

## Components Layer

### `src/components/ui/Card.tsx`
A styled `View` (or `TouchableOpacity` if `onPress` is provided). Four `variant` options:
- `default` — standard dark surface with purple border
- `elevated` — same but with purple glow shadow
- `highlight` — blue tinted border (used for "last session" callout)
- `gold` — gold tinted border (used for PRs)

---

### `src/components/ui/Button.tsx`
Seven `variant` options: `primary` (purple-blue gradient), `secondary`, `ghost`, `outline`, `gold`, `green`, `danger`. Three `size` options: `sm`, `md`, `lg`. Supports `loading` spinner, `icon`, and `fullWidth`.

---

### `src/components/ui/SharedUI.tsx`
Exports 7 small components that don't warrant their own files:
- `Tag` — coloured pill badge (muscle group, PR, "Today")
- `SectionLabel` — uppercase section heading with optional right node
- `ProgressBar` — animated fill bar with optional glow
- `ScreenHeader` — back button + title + optional right action
- `Divider` — 1px horizontal rule
- `StatChip` — value + label pair
- `EmptyState` — icon + title + description + optional action button

---

### `src/components/workout/ExerciseCard.tsx`
**The most important component in the app.** Renders one exercise during an active workout. Shows:
- Exercise name (tappable → exercise history)
- Muscle group + rep range tags
- "Previous" column (last session's sets)
- "Current" column (sets logged so far)
- Weight/reps text input + ✓ button
- "Ready to Progress" banner when double progression is complete
- "Undo last set" button

Props it receives from `ActiveWorkoutScreen`:
```
programExercise    — the exercise definition (name, sets, rep range, etc.)
lastSession        — what the user did last time (shown in "Previous" column)
loggedSets         — what's been logged so far this session (shown in "Current")
isReadyToProgress  — whether the ⬆ Progress banner should show
suggestedNextWeight — the pre-calculated next weight
onLogSet(w, r)     — called when ✓ button tapped
onRemoveLastSet()  — called when "Undo" tapped
onOpenHistory()    — called when exercise name tapped
```

---

### `src/components/workout/RestTimer.tsx`
Reads from `useRestTimerStore()` and renders a compact bar at the top of the active workout header. Has Skip and Reset buttons. Hides itself when `isActive === false`.

---

### `src/components/dashboard/CharacterCard.tsx`
Renders the RPG character card. Takes a `UserProfile` prop. Shows level badge, title badge, name, subtitle, XP bar, and a stats row (workouts / streak / volume).

---

### `src/components/charts/Charts.tsx`
Four chart components all built on `react-native-chart-kit`:

- `ExerciseLineChart` — bezier line chart for weight/reps/volume over time
- `VolumeBarChart` — bar chart for weekly volume
- `BodyweightChart` — area-style line chart for bodyweight trend
- `MuscleBar` — custom horizontal bar (pure React Native Views, no chart library)

All charts render a placeholder "No data yet" if the data array is empty.

---

## Screens Layer

### `DashboardScreen.tsx`
**What it shows:** App name, today's workout card, weekly volume stat, this-week progress, recent PRs list, bodyweight mini chart, last workout summary.

**Data source:** `useDashboard()` hook.

**Key interactions:**
- "Start" button → `navigation.navigate('ActiveWorkout', { workoutDay })`
- "Log" (bodyweight) → `navigation.navigate('AddMeasurement', { type: 'weight' })`

---

### `WorkoutsScreen.tsx`
**What it shows:** Weekly schedule strip, list of 4 workout day cards, recent sessions list.

**Data source:** Local `useEffect` calls to `getProgramExercises()` and `getRecentWorkouts()`.

**Key interactions:**
- Tap a day card → `navigation.navigate('WorkoutDayDetail', { workoutDay })`
- "Start" button on a card → `navigation.navigate('ActiveWorkout', { workoutDay })`

---

### `WorkoutDayDetailScreen.tsx`
**What it shows:** Ordered exercise list for one workout day with sets, rep ranges, start weights, and last session data. "View History" button per exercise.

**Data source:** `useProgramExercises(workoutDay)`.

**Accessed from:** `WorkoutsScreen` day card tap.

---

### `ActiveWorkoutScreen.tsx`
**What it shows:** Sticky header (workout name, timer, progress bar, rest timer), scrollable list of `ExerciseCard` components.

**Data sources:**
- `useProgramExercises(workoutDay)` — the exercise list
- `useWorkoutStore` — logged sets, timer, PR notifications
- `evaluateProgression()` — progression state per exercise (loaded on mount)

**On mount:** Calls `workoutStore.startWorkout(day)` which creates the DB row.

**On "Finish":** Calls `workoutStore.finishWorkout()` then navigates back to Dashboard.

**Note:** `gestureEnabled: false` is set in the navigator so users can't accidentally swipe away mid-workout.

---

### `ExerciseHistoryScreen.tsx`
**The most important screen.** One tap from any exercise name in the active workout.

**What it shows:**
1. "Last Session" callout (blue card) — always at the top, answers "what did I do last time?"
2. PR grid — Max Weight, Max Reps, Est. 1RM, Best Volume
3. Progress chart — toggle between Weight / Reps / Volume, last 10 sessions
4. Session history — reverse-chronological list of every session with sets and volume

**Data source:** `useExerciseHistory(exerciseId)`.

**Accessed from:** ExerciseCard (during workout), WorkoutDayDetailScreen (before workout).

---

### `ProgressScreen.tsx`
**What it shows:** Bodyweight line chart, measurement grid (6 types), progress photos (front/side/back).

**Data source:** `useProgressStore`.

**Key interaction:** Tap any measurement cell → `navigation.navigate('AddMeasurement', { type })`.

Photos use `expo-image-picker` for library access. Long-press a photo to delete it.

---

### `AnalyticsScreen.tsx`
**What it shows:** Total stats strip, weekly volume bar chart, muscle distribution bars, strength trends line chart, recent PRs, consistency calendar.

**Data source:** `useAnalytics()`.

The calendar renders a grid of the current month's days, highlighting worked days in purple.

---

### `ProfileScreen.tsx`
**What it shows:** CharacterCard, all-time stats grid, settings list.

**Key interaction:** Export button → `Alert` asking CSV or JSON → `exportService`.

The rest timer duration setting calls `restTimerStore.setDuration()` — takes effect immediately for the next workout.

---

### `AddMeasurementScreen.tsx`
A bottom modal. Shows a type selector (chips for weight/waist/chest/arms/thighs/hips) and a large numeric input. Calls `progressStore.addMeasurement()` on save.

---

## Navigation Layer

### `src/navigation/types.ts`
Defines the typed parameter lists for every navigator. This is how TypeScript knows what params each route accepts.

```typescript
RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>  // nested tabs
  ActiveWorkout: { workoutDay: string; programId?: string }
  ExerciseHistory: { exerciseId, exerciseName, muscleGroup, repRangeMin, repRangeMax }
  WorkoutDayDetail: { workoutDay: string }
  AddMeasurement: { type?: string }
}

MainTabParamList = {
  Dashboard | Workouts | Progress | Analytics | Profile  // all undefined params
}
```

The `declare global` block at the bottom registers `RootStackParamList` with React Navigation's type system so `useNavigation()` is automatically typed everywhere.

---

### `src/navigation/TabNavigator.tsx`
Creates the 5-tab bottom bar. Each tab maps to a screen component.

The tab bar style (background, height, padding) is defined here. The `iconContainer` / `iconContainerActive` styles create the purple pill highlight around the active tab icon.

**To add a 6th tab:** Add an entry to the `NAV_ITEMS` array, add it to `MainTabParamList` in `types.ts`, and register it as a `Tab.Screen` here.

---

### `src/navigation/RootNavigator.tsx`
The root `NativeStackNavigator`. Wraps the tab navigator and adds three types of additional screens:

| Screen | Navigation style | Can swipe back? |
|---|---|---|
| `ActiveWorkout` | `slide_from_bottom` (modal-like) | No (`gestureEnabled: false`) |
| `ExerciseHistory` | `slide_from_right` (push) | Yes |
| `WorkoutDayDetail` | `slide_from_right` (push) | Yes |
| `AddMeasurement` | `slide_from_bottom`, `presentation: 'modal'` | Yes |

---

## Feature Maps

Quick lookup: which files are involved in each feature.

### Navigation
```
src/navigation/types.ts          ← route types
src/navigation/TabNavigator.tsx  ← bottom tabs
src/navigation/RootNavigator.tsx ← stack + modals
```

### Database
```
src/database/schema.ts                          ← table definitions
src/database/database.ts                        ← init, migrations, seeding
src/database/repositories/exerciseRepository.ts
src/database/repositories/workoutRepository.ts
src/database/repositories/setRepository.ts
src/database/repositories/measurementRepository.ts
src/database/repositories/userRepository.ts
```

### Exercise History
```
src/database/repositories/setRepository.ts    ← getExerciseHistory() SQL
src/hooks/useExerciseHistory.ts               ← hook with derived PRs + chart data
src/screens/ExerciseHistoryScreen.tsx         ← the display screen
src/components/charts/Charts.tsx              ← ExerciseLineChart
```

### Progression Logic
```
src/utils/calculations.ts               ← checkReadyToProgress(), suggestedNextWeight()
src/services/progressionService.ts      ← evaluateProgression() (combines data + logic)
src/components/workout/ExerciseCard.tsx ← renders "Ready to Progress" banner
src/store/workoutStore.ts               ← logSet() triggers PR check
```

### Analytics
```
src/hooks/useAnalytics.ts               ← data aggregation
src/screens/AnalyticsScreen.tsx         ← display
src/components/charts/Charts.tsx        ← VolumeBarChart, MuscleBar, ExerciseLineChart
src/database/repositories/setRepository.ts       ← getMuscleGroupVolume()
src/database/repositories/workoutRepository.ts   ← getWeeklyVolume()
```

### Workout Logging
```
src/store/workoutStore.ts                       ← session state + logSet()
src/store/restTimerStore.ts                     ← rest countdown
src/services/prDetectionService.ts              ← PR checking on every set
src/database/repositories/setRepository.ts     ← logSet() SQL
src/database/repositories/workoutRepository.ts ← createWorkout(), completeWorkout()
src/components/workout/ExerciseCard.tsx         ← UI for logging
src/components/workout/RestTimer.tsx            ← rest timer display
src/screens/ActiveWorkoutScreen.tsx             ← the logging screen
```

### Measurements
```
src/database/repositories/measurementRepository.ts ← all measurement SQL
src/store/userStore.ts (useProgressStore)           ← in-memory measurement state
src/screens/ProgressScreen.tsx                      ← display
src/screens/AddMeasurementScreen.tsx                ← input modal
src/components/charts/Charts.tsx (BodyweightChart)  ← chart
```

### Progress Photos
```
src/database/repositories/measurementRepository.ts ← addProgressPhoto(), getProgressPhotos()
src/screens/ProgressScreen.tsx                      ← camera/library picker + display
```

### User Settings
```
src/constants/theme.ts                    ← visual settings (colours, fonts)
src/store/restTimerStore.ts               ← setDuration() for rest timer
src/store/userStore.ts                    ← updateName()
src/database/repositories/userRepository.ts ← updateProfileName()
src/screens/ProfileScreen.tsx             ← settings UI
src/services/exportService.ts             ← data export
```
