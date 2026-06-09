import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ActiveWorkoutState, SetEntry, ProgramExercise } from '../types';
import { createWorkout, completeWorkout } from '../database/repositories/workoutRepository';
import { logSet } from '../database/repositories/setRepository';
import { checkAndRecordPR } from '../services/prDetectionService';
import { updateStreakAfterWorkout, updateTotalVolume, addXPAndUpdateLevel } from '../database/repositories/userRepository';
import { calculateWorkoutXP } from '../utils/calculations';
import { PROGRAM_ID } from '../constants/program';

// ─────────────────────────────────────────────────────────────────────────────
// STORE STATE
// ─────────────────────────────────────────────────────────────────────────────

interface WorkoutStore {
  // Active workout
  activeWorkout: ActiveWorkoutState | null;
  isWorkoutActive: boolean;

  // Elapsed timer
  elapsedSeconds: number;
  timerIntervalId: ReturnType<typeof setInterval> | null;

  // PR notifications queue
  pendingPRNotifications: Array<{
    exerciseName: string;
    prTypes: string[];
  }>;

  // Actions
  startWorkout: (workoutDay: string) => Promise<void>;
  logSet: (
    exerciseId: string,
    exercise: ProgramExercise,
    weight: number,
    reps: number,
  ) => Promise<{ isPR: boolean; prTypes: string[] }>;
  removeLastSet: (exerciseId: string) => void;
  updateNote: (exerciseId: string, note: string) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
  clearPRNotification: () => void;
  tickTimer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  getSetsForExercise: (exerciseId: string) => SetEntry[];
  getTotalVolume: () => number;
  getTotalSets: () => number;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  immer((set, get) => ({
    activeWorkout: null,
    isWorkoutActive: false,
    elapsedSeconds: 0,
    timerIntervalId: null,
    pendingPRNotifications: [],

    startWorkout: async (workoutDay: string) => {
      const session = await createWorkout(workoutDay, PROGRAM_ID);

      set((state) => {
        state.activeWorkout = {
          workoutId: session.id,
          workoutDay,
          programId: PROGRAM_ID,
          startedAt: new Date(session.startedAt),
          sets: {},
          notes: {},
        };
        state.isWorkoutActive = true;
        state.elapsedSeconds = 0;
      });

      get().startTimer();
    },

    logSet: async (exerciseId, exercise, weight, reps) => {
      const { activeWorkout } = get();
      if (!activeWorkout) return { isPR: false, prTypes: [] };

      // Check for PR
      const prResult = await checkAndRecordPR(
        exerciseId,
        weight,
        reps,
        activeWorkout.workoutId,
      );

      // Persist to DB
      const currentSets = activeWorkout.sets[exerciseId] ?? [];
      await logSet(
        activeWorkout.workoutId,
        exerciseId,
        currentSets.length + 1,
        weight,
        reps,
        false,
        prResult.isPR,
      );

      // Update local state
      set((state) => {
        if (!state.activeWorkout) return;
        if (!state.activeWorkout.sets[exerciseId]) {
          state.activeWorkout.sets[exerciseId] = [];
        }
        state.activeWorkout.sets[exerciseId]!.push({
          weight,
          reps,
          isWarmup: false,
        });

        if (prResult.isPR) {
          state.pendingPRNotifications.push({
            exerciseName: exercise.exercise.name,
            prTypes: prResult.newPRTypes,
          });
        }
      });

      return { isPR: prResult.isPR, prTypes: prResult.newPRTypes };
    },

    removeLastSet: (exerciseId) => {
      set((state) => {
        if (!state.activeWorkout) return;
        const sets = state.activeWorkout.sets[exerciseId];
        if (sets && sets.length > 0) {
          state.activeWorkout.sets[exerciseId] = sets.slice(0, -1);
        }
      });
    },

    updateNote: (exerciseId, note) => {
      set((state) => {
        if (!state.activeWorkout) return;
        state.activeWorkout.notes[exerciseId] = note;
      });
    },

    finishWorkout: async () => {
      const { activeWorkout } = get();
      if (!activeWorkout) return;

      get().stopTimer();

      const totalVolume = get().getTotalVolume();
      const totalSets = get().getTotalSets();
      const hasPR = get().pendingPRNotifications.length > 0;

      await completeWorkout(activeWorkout.workoutId, totalVolume, totalSets);
      await updateStreakAfterWorkout();
      await updateTotalVolume(totalVolume);

      const xpGained = calculateWorkoutXP(totalSets, hasPR, 14); // using seeded streak
      await addXPAndUpdateLevel(xpGained);

      set((state) => {
        state.activeWorkout = null;
        state.isWorkoutActive = false;
        state.elapsedSeconds = 0;
        state.pendingPRNotifications = [];
      });
    },

    cancelWorkout: async () => {
      get().stopTimer();
      set((state) => {
        state.activeWorkout = null;
        state.isWorkoutActive = false;
        state.elapsedSeconds = 0;
        state.pendingPRNotifications = [];
      });
    },

    clearPRNotification: () => {
      set((state) => {
        state.pendingPRNotifications = state.pendingPRNotifications.slice(1);
      });
    },

    tickTimer: () => {
      set((state) => {
        state.elapsedSeconds += 1;
      });
    },

    startTimer: () => {
      const existingId = get().timerIntervalId;
      if (existingId) clearInterval(existingId);

      const intervalId = setInterval(() => {
        get().tickTimer();
      }, 1000);

      set((state) => {
        state.timerIntervalId = intervalId;
      });
    },

    stopTimer: () => {
      const { timerIntervalId } = get();
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
        set((state) => {
          state.timerIntervalId = null;
        });
      }
    },

    getSetsForExercise: (exerciseId) => {
      const { activeWorkout } = get();
      return activeWorkout?.sets[exerciseId] ?? [];
    },

    getTotalVolume: () => {
      const { activeWorkout } = get();
      if (!activeWorkout) return 0;
      return Object.values(activeWorkout.sets)
        .flat()
        .reduce((acc, s) => acc + s.weight * s.reps, 0);
    },

    getTotalSets: () => {
      const { activeWorkout } = get();
      if (!activeWorkout) return 0;
      return Object.values(activeWorkout.sets)
        .flat()
        .filter((s) => !s.isWarmup).length;
    },
  })),
);
