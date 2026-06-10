# Ascend — Technical Debt

An honest record of current limitations, architectural trade-offs, and future improvements. Read before extending the app significantly.

---

## Table of Contents

1. [Current Limitations](#1-current-limitations)
2. [Architectural Compromises](#2-architectural-compromises)
3. [Performance Concerns](#3-performance-concerns)
4. [Scalability Concerns](#4-scalability-concerns)
5. [Future Improvements — Prioritised](#5-future-improvements--prioritised)
6. [Known Bugs and Edge Cases](#6-known-bugs-and-edge-cases)
7. [Dependency Risk](#7-dependency-risk)
8. [Testing Gaps](#8-testing-gaps)

---

## 1. Current Limitations

### 1.1 SQLite does not work on Expo Web

`expo-sqlite` is a native module and has no web fallback. The app calls `getDatabase()` in `App.tsx` before rendering anything, so launching on web results in an immediate crash.

**Impact:** Web target is completely non-functional.

**Fix options:**
- Use `expo-sqlite/legacy` for web (falls back to `sql.js` via WebAssembly)
- Gate the DB call behind `Platform.OS !== 'web'` and use `AsyncStorage` as a fallback on web
- Accept web is not a target platform (simplest)

---

### 1.2 Workout timer pauses on Android background

React Native's `setInterval` is driven by the JS thread. On Android, when the app is backgrounded for more than a few minutes, the OS throttles or kills the JS thread. The elapsed workout timer stops incrementing.

**Impact:** A user who minimises the app mid-workout will see the timer stuck when they return. The duration saved to the database will be incorrect.

**Fix:**
```typescript
// src/store/workoutStore.ts
// Replace the interval-based elapsed timer with:

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Store only the startedAt timestamp, not elapsed seconds.
// On render, calculate: Math.floor((Date.now() - startedAt) / 1000)
// This is immune to JS thread throttling.
```

This requires adding `expo-task-manager` and `expo-background-fetch` to `package.json`.

---

### 1.3 Progress photo URIs break after app reinstall

Photos are stored by their original `ImagePicker` URI (e.g., `file:///var/mobile/...`). These paths are device-specific and not portable. After reinstalling the app, the `progress_photos` table still holds the old URIs, but the files no longer exist at those paths.

**Impact:** After reinstall, progress photo thumbnails will show broken images.

**Fix:**
```typescript
// In measurementRepository.ts, addProgressPhoto():
import * as FileSystem from 'expo-file-system';

export async function addProgressPhoto(
  sourceUri: string,
  type: 'front' | 'side' | 'back',
  notes: string | null = null,
): Promise<ProgressPhoto> {
  // Copy to app's permanent document directory before saving the URI
  const filename = `progress_${type}_${Date.now()}.jpg`;
  const destUri = `${FileSystem.documentDirectory}photos/${filename}`;
  await FileSystem.makeDirectoryAsync(
    `${FileSystem.documentDirectory}photos/`,
    { intermediates: true },
  );
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });

  // Save destUri instead of sourceUri
  // ...
}
```

---

### 1.4 No multi-user support

The `user_profile` table always uses `id = 'default'`. There is no account system, login, or cloud sync.

**Impact:** App is single-user only. No ability to share data between devices or restore after factory reset.

**Fix path:** Implement Expo Auth Session + a cloud backend (Supabase recommended for SQLite-like API), or at minimum implement iCloud (iOS) / Google Drive (Android) backup via `expo-file-system`.

---

### 1.5 Single program only surfaced in UI

The database schema fully supports multiple programs (the `programs` table, the `is_active` column, `PROGRAM_ID` in constants). However, `PROGRAM_ID` is hard-coded throughout the codebase and the UI has no program selector.

**Impact:** Users cannot switch programs or create custom programs in the UI.

**Files to update when fixing:**
- `src/constants/program.ts` — remove hard-coded `PROGRAM_ID`
- `src/hooks/useProgramExercises.ts` — accept `programId` as parameter
- `src/hooks/useDashboard.ts` — read active program from DB
- `src/screens/WorkoutsScreen.tsx` — add program selector/switcher

---

### 1.6 Warmup calculator built but not exposed in UI

`src/services/warmupService.ts` is complete. `src/utils/calculations.ts` has `calculateWarmupSets()`. But there is no screen, modal, or button that surfaces this to users.

**Fix:** Add a "Show Warmup Sets" button to `ExerciseCard.tsx` that opens a small bottom sheet showing the warm-up plan.

---

### 1.7 Rest timer default not persisted

`restTimerStore.ts` holds the default duration in memory via Zustand. It resets to 90 seconds on every app restart. The ProfileScreen has a "Default Rest Timer" setting that calls `setDuration()` but this value is never written to `AsyncStorage` or SQLite.

**Fix:**
```typescript
// src/store/restTimerStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

setDuration: async (seconds) => {
  await AsyncStorage.setItem('restTimerDefault', String(seconds));
  set((state) => { state.totalSeconds = seconds; });
},

// On store initialisation, read from AsyncStorage:
// const stored = await AsyncStorage.getItem('restTimerDefault');
// if (stored) set((state) => { state.totalSeconds = parseInt(stored); });
```

---

## 2. Architectural Compromises

### 2.1 Types in a single file

All 40+ interfaces are in `src/types/index.ts`. This is convenient for a project this size but becomes unwieldy as the app grows.

**Current trade-off:** Easy to find any type; barrel file is one large import.

**When to split:** When the file exceeds ~400 lines or when distinct domains (workout, measurements, analytics) start having conflicting type names.

**Recommended split:**
```
src/types/
├── workout.ts      ← Exercise, ProgramExercise, WorkoutSession, LoggedSet
├── analytics.ts    ← ExerciseSession, PRs, WeeklyVolume, MuscleVolume
├── user.ts         ← UserProfile, Measurement, ProgressPhoto
├── database.ts     ← All DB* raw row types
└── index.ts        ← re-exports everything: export * from './workout'; etc.
```

---

### 2.2 Repositories don't use transactions for batch operations

`seedSampleHistory()` in `database.ts` runs hundreds of individual `INSERT` statements without wrapping them in a transaction. Similarly, `logSetBatch()` in `setRepository.ts` loops over individual inserts.

**Impact:** Seeding is slow on first launch (~2-3 seconds). Batch set logging is slower than necessary.

**Fix:**
```typescript
// Wrap batch operations in a transaction
await db.withTransactionAsync(async () => {
  for (const set of sets) {
    await db.runAsync('INSERT INTO sets ...', [...]);
  }
});
```

---

### 2.3 State and DB are not kept in sync after external mutations

If something writes to the database directly (e.g., a migration script, a repository called outside of a store action), the Zustand stores won't know about it. They only re-read from the DB when a screen gains focus or `refresh()` is explicitly called.

**Impact:** Stale data can appear in the UI after programmatic database changes.

**Fix:** Use React Query or SWR for server state management, which provides automatic cache invalidation. This would be a significant refactor.

---

### 2.4 `useAnalytics` loads all data on every render

`useAnalytics.ts` runs 5+ parallel DB queries every time `AnalyticsScreen` mounts. On low-end devices with large databases, this can cause a noticeable load delay.

**Fix:** Add a simple cache with a TTL:
```typescript
let analyticsCache: AnalyticsData | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function useAnalytics() {
  if (analyticsCache && Date.now() - cacheTime < CACHE_TTL_MS) {
    return analyticsCache;
  }
  // ... load fresh
}
```

Or use React Query's `staleTime` option.

---

### 2.5 Two stores in one file (userStore.ts)

`src/store/userStore.ts` exports both `useUserStore` (profile) and `useProgressStore` (measurements). These are conceptually different concerns.

**Current trade-off:** Fewer files; simpler imports for small features.

**When to split:** When either store exceeds 80 lines or when they start importing from each other.

---

## 3. Performance Concerns

### 3.1 `FlatList` vs `ScrollView` in exercise screens

`ActiveWorkoutScreen` and `AnalyticsScreen` use `ScrollView` to render all cards at once. For programs with 10+ exercises, all cards are mounted and rendered even if the user hasn't scrolled to them.

**Impact:** On lower-end Android devices, initial render may stutter with 8+ exercise cards.

**Fix:** Replace `ScrollView` with `FlatList`:
```typescript
<FlatList
  data={exercises}
  keyExtractor={(item) => item.id}
  renderItem={({ item: pe }) => (
    <ExerciseCard key={pe.id} programExercise={pe} ... />
  )}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
/>
```

Note: `FlatList` inside a `ScrollView` is forbidden in React Native. You'd need to make the exercise list the only scrollable content on the screen (move the header out).

---

### 3.2 No memoisation on ExerciseCard

`ExerciseCard` re-renders whenever the parent (`ActiveWorkoutScreen`) state changes — which happens every second due to the elapsed timer. This means all 7 exercise cards re-render every second.

**Fix:**
```typescript
// In ExerciseCard.tsx, wrap export in React.memo:
export default React.memo(ExerciseCard, (prev, next) => {
  return (
    prev.loggedSets === next.loggedSets &&
    prev.isReadyToProgress === next.isReadyToProgress &&
    prev.lastSession === next.lastSession
  );
});
```

Also move the elapsed timer into its own component so it's the only thing re-rendering every second.

---

### 3.3 Chart renders block the JS thread

`react-native-chart-kit` renders synchronously on the JS thread using `react-native-svg`. For large datasets (100+ data points), this can cause frame drops.

**Fix for later:** Migrate to `react-native-skia` + `victory-native` v41+ which renders charts on a separate thread via Skia.

---

### 3.4 DB singleton is not connection-pooled

`getDatabase()` returns a single shared `SQLiteDatabase` instance. Concurrent reads from multiple hooks (e.g., on Dashboard load, 4 queries run in `Promise.all`) go through the same connection.

**Impact:** SQLite with WAL mode handles concurrent reads fine, but write operations are serialised. In practice not a problem at the current scale.

**Concern at scale:** If the app adds real-time syncing or background processing, a single connection will bottleneck.

---

## 4. Scalability Concerns

### 4.1 Exercise history query gets slower with more sets

`getExerciseHistory()` in `setRepository.ts` runs:
```sql
SELECT DISTINCT s.workout_id, w.started_at
FROM sets s JOIN workouts w ON s.workout_id = w.id
WHERE s.exercise_id = ? AND w.completed_at IS NOT NULL AND s.is_warmup = 0
ORDER BY w.started_at DESC
LIMIT ?
```

With 3 years of daily training (~500 workouts, ~5000 sets per exercise), this query with the index on `sets(exercise_id)` should still return in < 50ms.

**At 10 years of data:** The `LIMIT` clause keeps this manageable, but the outer loop that loads sets per workout could be batched into a single join query.

---

### 4.2 All measurement history loaded at once

`getMeasurementHistory(type, 30)` fetches the last 30 entries. For bodyweight tracked daily for a year, that's fine. But `getAllLatestMeasurements()` makes 6 sequential DB calls.

**Fix:** Replace with a single query using `GROUP BY`:
```sql
SELECT type, value, unit, MAX(measured_at) as measured_at
FROM measurements
GROUP BY type
```

---

### 4.3 No pagination on recent workouts

`getRecentWorkouts(limit)` fetches a fixed number. The `WorkoutsScreen` requests 8, the dashboard requests 20. As workout history grows, this is fine — the LIMIT clause handles it.

**Concern:** If a "Full History" screen is ever added that loads all workouts, it will need pagination.

---

## 5. Future Improvements — Prioritised

### P0 — Must fix before commercial release

| Item | File(s) | Effort |
|---|---|---|
| Store rest timer default to AsyncStorage | `src/store/restTimerStore.ts` | 1h |
| Copy progress photos to document directory | `src/database/repositories/measurementRepository.ts` | 2h |
| Wrap seed inserts in DB transaction | `src/database/database.ts` | 1h |
| Background-safe workout timer | `src/store/workoutStore.ts` | 4h |

---

### P1 — High value, low complexity

| Item | File(s) | Effort |
|---|---|---|
| Memoize ExerciseCard to prevent per-second re-renders | `src/components/workout/ExerciseCard.tsx` | 2h |
| Warmup sets UI (bottom sheet on exercise card) | New screen + `ExerciseCard.tsx` | 4h |
| Swipe-to-delete a set in active workout | `ExerciseCard.tsx` | 3h |
| Notes per exercise during workout | `workoutStore.ts` + `ExerciseCard.tsx` | 2h |
| All-time PR screen | New screen + `setRepository.ts` | 3h |

---

### P2 — Medium value, medium complexity

| Item | File(s) | Effort |
|---|---|---|
| Multiple program support + program switcher | Many files | 1 day |
| Custom exercise creator screen | New screen + `exerciseRepository.ts` | 4h |
| iCloud/Google Drive backup | New service + `exportService.ts` | 1 day |
| Unit toggle (kg ↔ lbs) with conversion | `theme.ts` + formatters + repo | 4h |
| Push notifications (rest timer, workout reminders) | New service + `app.json` | 4h |
| FlatList migration in ActiveWorkoutScreen | `ActiveWorkoutScreen.tsx` | 2h |

---

### P3 — Low priority, high value at scale

| Item | File(s) | Effort |
|---|---|---|
| React Query for server state management | Full refactor of hooks | 2 days |
| E2E tests (Detox) | New test suite | 3 days |
| Unit tests for calculation utilities | New test files | 1 day |
| Apple Health / Google Fit integration | New service | 2 days |
| react-native-skia charts (smooth, off-thread) | `Charts.tsx` + package changes | 1 day |
| Offline-first sync with Supabase | New services + schema changes | 1 week |

---

## 6. Known Bugs and Edge Cases

### 6.1 First-launch DB seed is slow

On first install, `seedSampleHistory()` inserts ~120 rows (8 weeks × 7 exercises × 2 sets + workout rows). Without transactions, this takes 2-4 seconds on slower devices.

**Symptom:** App shows "Initialising…" splash for longer than expected on first launch.
**Workaround:** Wrap seed inserts in a transaction (see §2.2).

---

### 6.2 Cancelling mid-workout does not delete the in-progress DB row

`workoutStore.cancelWorkout()` clears the in-memory state but does not call `deleteWorkout(workoutId)`. The workout row with `completed_at = NULL` remains in the database.

**Impact:** `getRecentWorkouts()` correctly excludes `WHERE completed_at IS NOT NULL`, so the incomplete row doesn't appear in the UI. But it does accumulate in the table over time.

**Fix:**
```typescript
// In workoutStore.ts, cancelWorkout():
cancelWorkout: async () => {
  const { activeWorkout } = get();
  if (activeWorkout) {
    await deleteWorkout(activeWorkout.workoutId);  // ← add this
  }
  get().stopTimer();
  set(/* clear state */);
},
```

---

### 6.3 Strength trend chart pads with zeros if exercise has fewer sessions than the reference

`useAnalytics.ts` uses "Neutral Grip Lat Pulldown" as the x-axis reference. If "Leg Press" has fewer sessions in the database, the arrays are padded with `0` at the start. A zero value renders as a dip to the bottom of the chart.

**Impact:** Visual glitch on the strength trends chart if exercises have different session counts.

**Fix:** Pad with `null` instead of `0`. `react-native-chart-kit` skips `null` values with a gap in the line.
```typescript
while (legPress.length < labels.length) legPress.unshift(null as unknown as number);
```

Or better: align by date rather than by index.

---

### 6.4 `checkReadyToProgress` ignores warmup sets

The progression check looks at all sets in `lastSession.sets`. If warmup sets are ever logged (currently they are not surfaced in the UI), they would be included in the check and could falsely indicate readiness to progress.

**Impact:** Currently minimal (warmup logging not yet implemented).

**Fix:** Filter warmup sets: `lastSession.sets.filter(s => !s.isWarmup)`.

---

### 6.5 `calculateLevel` can return level 0 for 0 XP

If `totalXP = 0`, the while loop never runs and returns `level = 1` — actually this is correct. But if `getXPForLevel(0)` is ever called (it shouldn't be), it would return `100 * Math.pow(1.5, -1) = 66.7`, causing the calculation to behave unexpectedly.

**Impact:** Not triggered in the current code path (minimum level is 1).

---

## 7. Dependency Risk

### High risk (could break on Expo SDK upgrade)

| Package | Risk | Reason |
|---|---|---|
| `expo-sqlite` | High | New async API was introduced in SDK 50; future breaking changes likely |
| `react-native-chart-kit` | Medium | Not actively maintained; last major release in 2021 |
| `@expo-google-fonts/*` | Low | Stable, but font file names can change between versions |

### Alternatives to evaluate

| Current | Alternative | Reason to switch |
|---|---|---|
| `react-native-chart-kit` | `victory-native` v41 + Skia | Smoother, off-thread rendering |
| `react-native-chart-kit` | `react-native-gifted-charts` | More chart types, active maintenance |
| Plain Zustand | Zustand + React Query | Cleaner server state management |
| expo-sqlite direct | Drizzle ORM + expo-sqlite | Type-safe SQL, migrations system |

---

## 8. Testing Gaps

The project has zero automated tests. All validation is manual and via TypeScript.

### Critical paths with no test coverage

| Path | Test type needed |
|---|---|
| `checkReadyToProgress()` logic | Unit test |
| `suggestedNextWeight()` for edge weights | Unit test |
| `calculateLevel()` XP boundary conditions | Unit test |
| `estimated1RM()` formula accuracy | Unit test |
| DB migration idempotency (running twice) | Integration test |
| Complete workout flow (start → log sets → finish) | E2E test |
| PR detection (new PR vs existing PR) | Integration test |
| Streak calculation across timezone changes | Unit test |

### Recommended test setup

```bash
# Unit tests for utils and services
npx expo install jest @testing-library/react-native @testing-library/jest-native

# E2E tests
npx expo install detox
```

Minimal `jest.config.js`:
```javascript
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

Example unit test for `calculations.ts`:
```typescript
// src/__tests__/calculations.test.ts
import { checkReadyToProgress, suggestedNextWeight } from '../utils/calculations';
import { ExerciseSession } from '../types';

const makeSession = (weight: number, reps1: number, reps2: number): ExerciseSession => ({
  date: new Date().toISOString(),
  workoutId: 'test',
  sets: [{ weight, reps: reps1 }, { weight, reps: reps2 }],
  volume: weight * (reps1 + reps2),
  maxWeight: weight,
  avgReps: (reps1 + reps2) / 2,
  isPRSession: false,
});

describe('checkReadyToProgress', () => {
  it('returns true when all sets hit repRangeMax', () => {
    const sessions = [makeSession(32, 12, 12)];
    expect(checkReadyToProgress(sessions, 12)).toBe(true);
  });

  it('returns false when any set is below repRangeMax', () => {
    const sessions = [makeSession(32, 12, 11)];
    expect(checkReadyToProgress(sessions, 12)).toBe(false);
  });

  it('returns false for empty history', () => {
    expect(checkReadyToProgress([], 12)).toBe(false);
  });
});

describe('suggestedNextWeight', () => {
  it('uses 5kg increment for heavy leg exercises', () => {
    expect(suggestedNextWeight(90, 'Legs')).toBe(95);
  });

  it('uses 1kg increment for light arm exercises', () => {
    expect(suggestedNextWeight(15, 'Arms')).toBe(16);
  });

  it('returns 0 for bodyweight exercises', () => {
    expect(suggestedNextWeight(0, 'Core')).toBe(0);
  });
});
```
