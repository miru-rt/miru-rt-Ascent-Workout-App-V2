import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { UserProfile, Measurement, MeasurementType } from '../types';
import { getUserProfile, updateProfileName } from '../database/repositories/userRepository';
import {
  addMeasurement,
  getMeasurementHistory,
  getAllLatestMeasurements,
} from '../database/repositories/measurementRepository';

// ─────────────────────────────────────────────────────────────────────────────
// USER STORE
// ─────────────────────────────────────────────────────────────────────────────

interface UserStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  loadProfile: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  immer((set) => ({
    profile: null,
    isLoading: false,
    error: null,

    loadProfile: async () => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const profile = await getUserProfile();
        set((state) => { state.profile = profile; state.isLoading = false; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to load profile';
          state.isLoading = false;
        });
      }
    },

    updateName: async (name) => {
      await updateProfileName(name);
      set((state) => { if (state.profile) state.profile.name = name; });
    },

    refreshProfile: async () => {
      const profile = await getUserProfile();
      set((state) => { state.profile = profile; });
    },
  })),
);

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS STORE
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressStore {
  latestMeasurements: Partial<Record<MeasurementType, Measurement>>;
  bodyweightHistory: Measurement[];
  isLoading: boolean;

  loadMeasurements: () => Promise<void>;
  addBodyweight: (value: number) => Promise<void>;
  addMeasurement: (type: MeasurementType, value: number, unit?: string) => Promise<void>;
  getHistory: (type: MeasurementType) => Promise<Measurement[]>;
}

export const useProgressStore = create<ProgressStore>()(
  immer((set, get) => ({
    latestMeasurements: {},
    bodyweightHistory: [],
    isLoading: false,

    loadMeasurements: async () => {
      set((state) => { state.isLoading = true; });
      try {
        const [latest, bwHistory] = await Promise.all([
          getAllLatestMeasurements(),
          getMeasurementHistory('weight', 30),
        ]);
        set((state) => {
          state.latestMeasurements = latest;
          state.bodyweightHistory = bwHistory;
          state.isLoading = false;
        });
      } catch {
        set((state) => { state.isLoading = false; });
      }
    },

    addBodyweight: async (value) => {
      const measurement = await addMeasurement('weight', value, 'kg');
      set((state) => {
        state.latestMeasurements.weight = measurement;
        state.bodyweightHistory.push(measurement);
      });
    },

    addMeasurement: async (type, value, unit = 'cm') => {
      const effectiveUnit = type === 'weight' ? 'kg' : unit;
      const measurement = await addMeasurement(type, value, effectiveUnit);
      set((state) => {
        state.latestMeasurements[type] = measurement;
      });
    },

    getHistory: async (type) => {
      return getMeasurementHistory(type, 30);
    },
  })),
);
