# Ascend — Workout Tracker

A premium dark RPG-inspired workout tracking app built with Expo + React Native.

---

## Feature Overview

| Feature | Status |
|---|---|
| Workout logging (sets, weight, reps) | ✅ |
| Exercise history with charts | ✅ |
| Double progression detection | ✅ |
| Personal record tracking | ✅ |
| Rest timer | ✅ |
| Body measurements | ✅ |
| Progress photos | ✅ |
| Analytics (volume, muscle distribution) | ✅ |
| Consistency calendar | ✅ |
| RPG level/XP system | ✅ |
| Data export (CSV/JSON) | ✅ |
| SQLite offline-first database | ✅ |
| Warmup calculator | ✅ |

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 51 (managed workflow) |
| UI | React Native + custom dark theme |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| State | Zustand v4 + Immer |
| Database | Expo SQLite v14 (local, offline-first) |
| Charts | react-native-chart-kit + react-native-svg |
| Fonts | @expo-google-fonts/rajdhani + dm-sans |
| Icons | @expo/vector-icons (Ionicons) |
| Gradients | expo-linear-gradient |
| Photos | expo-image-picker |
| Export | expo-file-system + expo-sharing |
| Language | TypeScript (strict mode, zero errors) |

---

## Project Structure

```
ascend/
├── App.tsx                        # Root entry — fonts, DB init, navigation
├── app.json                       # Expo config
├── babel.config.js                # Babel + module-resolver (path aliases)
├── metro.config.js
├── tsconfig.json                  # Strict TypeScript + path aliases
├── package.json
└── src/
    ├── components/
    │   ├── charts/
    │   │   └── Charts.tsx         # LineChart, BarChart, BodyweightChart, MuscleBar
    │   ├── dashboard/
    │   │   └── CharacterCard.tsx  # RPG level card with XP bar
    │   ├── ui/
    │   │   ├── Button.tsx         # 7 variants (primary, ghost, gold, green…)
    │   │   ├── Card.tsx           # Surface card with border variants
    │   │   └── SharedUI.tsx       # Tag, SectionLabel, ProgressBar, ScreenHeader…
    │   └── workout/
    │       ├── ExerciseCard.tsx   # Core logging card (prev vs current, input, PR)
    │       └── RestTimer.tsx      # Animated rest countdown bar
    ├── constants/
    │   ├── program.ts             # Athletic Physique program seed data
    │   └── theme.ts               # Colors, Fonts, Spacing, Radius, Level system
    ├── database/
    │   ├── database.ts            # DB singleton, migrations, seeding
    │   ├── schema.ts              # All CREATE TABLE statements
    │   └── repositories/
    │       ├── exerciseRepository.ts
    │       ├── measurementRepository.ts
    │       ├── setRepository.ts   # Exercise history, PRs, analytics queries
    │       ├── userRepository.ts  # Profile, XP, streaks
    │       └── workoutRepository.ts
    ├── hooks/
    │   ├── useAnalytics.ts
    │   ├── useDashboard.ts
    │   ├── useExerciseHistory.ts
    │   └── useProgramExercises.ts
    ├── navigation/
    │   ├── RootNavigator.tsx      # Stack: tabs + modals
    │   ├── TabNavigator.tsx       # 5-tab bottom bar
    │   └── types.ts               # Typed route params
    ├── screens/
    │   ├── ActiveWorkoutScreen.tsx     # Live workout logging
    │   ├── AddMeasurementScreen.tsx    # Modal: log weight/measurements
    │   ├── AnalyticsScreen.tsx         # Charts, calendar, PRs
    │   ├── DashboardScreen.tsx         # Home: character card, today's workout
    │   ├── ExerciseHistoryScreen.tsx   # Full history + PRs + charts
    │   ├── ProfileScreen.tsx           # Character stats + settings
    │   ├── ProgressScreen.tsx          # Body tracking + photos
    │   ├── WorkoutDayDetailScreen.tsx  # Exercise list before starting
    │   └── WorkoutsScreen.tsx          # Program overview
    ├── services/
    │   ├── exportService.ts       # CSV + JSON export via expo-sharing
    │   ├── prDetectionService.ts  # Real-time PR checking per set
    │   ├── progressionService.ts  # Double-progression evaluation
    │   └── warmupService.ts       # Warmup set calculator
    ├── store/
    │   ├── restTimerStore.ts      # Shared rest timer (Zustand)
    │   ├── userStore.ts           # Profile + progress (Zustand)
    │   └── workoutStore.ts        # Active workout session (Zustand + Immer)
    ├── types/
    │   └── index.ts               # All TypeScript interfaces and types
    └── utils/
        ├── calculations.ts        # 1RM, volume, progression, XP
        ├── dateUtils.ts           # Week/month helpers, streak calc
        └── formatters.ts          # Date, weight, volume formatters
```

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9 or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: macOS + Xcode 15+
- For Android: Android Studio + JDK 17

### 1 — Clone and Install

```bash
git clone <your-repo-url> ascend
cd ascend
npm install
```

### 2 — Verify TypeScript (optional but recommended)

```bash
npx tsc --noEmit
# Should output nothing (zero errors)
```

---

## Run Instructions

### Start the dev server

```bash
npx expo start
```

Then press:
- `a` — open on Android emulator
- `i` — open on iOS Simulator
- `w` — open in browser (limited, SQLite won't work)
- Scan QR with **Expo Go** app on your physical device

### Run directly on device/emulator

```bash
# Android
npx expo start --android

# iOS
npx expo start --ios
```

---

## Build Instructions

### Development build (recommended for full native features)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
eas login

# Configure (first time only)
eas build:configure

# Build for Android (APK)
eas build --platform android --profile development

# Build for iOS (Simulator)
eas build --platform ios --profile development
```

### Production build

```bash
# Android AAB (for Play Store)
eas build --platform android --profile production

# iOS IPA (for App Store)
eas build --platform ios --profile production
```

Create `eas.json` in the project root:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Android Deployment

### Option A — EAS Build (recommended)

```bash
# 1. Build AAB
eas build --platform android --profile production

# 2. Submit to Play Store
eas submit --platform android
```

### Option B — Local build

```bash
# Eject to bare workflow first (irreversible)
npx expo run:android

# Then build APK
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Signing (required for Play Store)

```bash
# Generate keystore
keytool -genkey -v -keystore ascend.keystore \
  -alias ascend -keyalg RSA -keysize 2048 -validity 10000

# Add to eas.json credentials section or use EAS managed credentials
```

---

## Known Limitations

1. **react-native-chart-kit axis labels** — On narrow screens (< 360px), x-axis labels may overlap. Workaround: use `interval={2}` on XAxis (already applied for history charts).

2. **SQLite on Web** — `expo-sqlite` is not supported in Expo Web. The app will fail to initialise on the web platform. Use native iOS/Android targets.

3. **Progress photo persistence** — Photos are stored by URI path in SQLite. If the user clears app storage or reinstalls, URIs may become invalid. A future version should copy images to the app's document directory.

4. **Workout timer background** — React Native timers pause when the app is backgrounded on some Android devices. A background task (expo-task-manager) should be added for production.

5. **Font loading fallback** — If Google Fonts fail to download (offline first launch), system fonts are used automatically. The Rajdhani/DM Sans aliases won't resolve until fonts are cached.

6. **No multi-program support** — The current schema supports multiple programs but the UI only surfaces the preloaded Athletic Physique program. Adding a program picker is straightforward.

---

## Technical Debt Report

| Item | Priority | Effort |
|---|---|---|
| Background timer via `expo-task-manager` | High | Medium |
| Push notifications for rest timer end | Medium | Low |
| iCloud / Google Drive backup | Medium | High |
| Multi-program UI (selector, custom builder) | Medium | Medium |
| Custom exercise creator screen | Medium | Low |
| Swipe-to-delete sets in active workout | Low | Low |
| Warm-up set flow integrated in active workout | Low | Medium |
| Unit toggle (kg ↔ lbs) with conversion | Low | Low |
| Dark/light theme toggle | Low | Low |
| Apple Health / Google Fit integration | Low | High |
| E2E tests (Detox) | High | High |
| Unit tests for calculation utils | Medium | Low |
| Storybook for UI components | Low | Medium |

---

## Database Schema

```
exercises          — master exercise list (name, muscle, instructions)
programs           — workout programs (Athletic Physique preloaded)
program_exercises  — exercises within a program day (sets, rep range, weight)
workouts           — completed workout sessions
sets               — individual logged sets (weight, reps, is_pr)
measurements       — body measurements over time
user_profile       — single-row profile (level, xp, streak)
personal_records   — best weight/reps/1RM per exercise
progress_photos    — URI + type (front/side/back) per date
_migrations        — migration version tracking
```

All foreign keys enforced with `ON DELETE CASCADE` / `ON DELETE SET NULL`.
WAL journal mode enabled for concurrent read performance.
