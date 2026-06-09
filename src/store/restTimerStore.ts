import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface RestTimerStore {
  secondsRemaining: number;
  totalSeconds: number;
  isActive: boolean;
  intervalId: ReturnType<typeof setInterval> | null;

  start: (seconds?: number) => void;
  stop: () => void;
  reset: () => void;
  tick: () => void;
  setDuration: (seconds: number) => void;
}

export const useRestTimerStore = create<RestTimerStore>()(
  immer((set, get) => ({
    secondsRemaining: 0,
    totalSeconds: 90,
    isActive: false,
    intervalId: null,

    start: (seconds?: number) => {
      const existing = get().intervalId;
      if (existing) clearInterval(existing);

      const duration = seconds ?? get().totalSeconds;
      const id = setInterval(() => get().tick(), 1000);

      set((state) => {
        state.secondsRemaining = duration;
        state.totalSeconds = duration;
        state.isActive = true;
        state.intervalId = id;
      });
    },

    stop: () => {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);
      set((state) => {
        state.isActive = false;
        state.intervalId = null;
      });
    },

    reset: () => {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);
      set((state) => {
        state.secondsRemaining = 0;
        state.isActive = false;
        state.intervalId = null;
      });
    },

    tick: () => {
      const { secondsRemaining } = get();
      if (secondsRemaining <= 1) {
        get().stop();
        set((state) => { state.secondsRemaining = 0; });
      } else {
        set((state) => { state.secondsRemaining -= 1; });
      }
    },

    setDuration: (seconds) => {
      set((state) => { state.totalSeconds = seconds; });
    },
  })),
);
