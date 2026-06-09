import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STACK PARAMS
// ─────────────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ActiveWorkout: {
    workoutDay: string;
    programId?: string;
  };
  ExerciseHistory: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    repRangeMin: number;
    repRangeMax: number;
  };
  WorkoutDayDetail: {
    workoutDay: string;
  };
  AddMeasurement: {
    type?: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TAB PARAMS
// ─────────────────────────────────────────────────────────────────────────────

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Progress: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN PROP TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL NAVIGATION TYPE DECLARATION
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
