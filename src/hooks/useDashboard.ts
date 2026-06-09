import { useState, useEffect, useCallback } from 'react';
import { UserProfile, WorkoutSession } from '../types';
import { getUserProfile } from '../database/repositories/userRepository';
import { getRecentWorkouts, getWeeklyVolume } from '../database/repositories/workoutRepository';
import { getRecentPRs } from '../database/repositories/setRepository';
import { getMeasurementHistory } from '../database/repositories/measurementRepository';
import { WORKOUT_SCHEDULE } from '../constants/program';

interface RecentPR { exerciseName: string; weight: number; reps: number; date: string }
interface BwPoint { date: string; weight: number }

interface DashboardData {
  profile: UserProfile | null;
  todayWorkoutDay: string | null;
  recentWorkouts: WorkoutSession[];
  recentPRs: RecentPR[];
  bodyweightTrend: BwPoint[];
  currentWeekVolume: number;
  thisWeekWorkouts: number;
  targetWeekWorkouts: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

function getTodayWorkoutDay(): string | null {
  const dayOfWeek = new Date().getDay(); // 0=Sun
  const entry = WORKOUT_SCHEDULE.find((s) => s.dayOfWeek === dayOfWeek);
  return entry?.workoutDay ?? null;
}

function getThisWeekWorkouts(workouts: WorkoutSession[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  weekStart.setHours(0, 0, 0, 0);

  return workouts.filter((w) => {
    const d = new Date(w.startedAt);
    return d >= weekStart && w.completedAt != null;
  }).length;
}

export function useDashboard(): DashboardData {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [recentPRs, setRecentPRs] = useState<RecentPR[]>([]);
  const [bodyweightTrend, setBodyweightTrend] = useState<BwPoint[]>([]);
  const [currentWeekVolume, setCurrentWeekVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prof, workouts, prs, bwHistory, weeklyVol] = await Promise.all([
        getUserProfile(),
        getRecentWorkouts(20),
        getRecentPRs(3),
        getMeasurementHistory('weight', 12),
        getWeeklyVolume(),
      ]);

      const latestWeekVol = weeklyVol.length > 0
        ? (weeklyVol[weeklyVol.length - 1]?.volume ?? 0)
        : 0;

      setProfile(prof);
      setRecentWorkouts(workouts);
      setRecentPRs(prs);
      setBodyweightTrend(
        bwHistory.map((m) => ({ date: m.measuredAt, weight: m.value })),
      );
      setCurrentWeekVolume(latestWeekVol);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const thisWeekWorkouts = getThisWeekWorkouts(recentWorkouts);

  return {
    profile,
    todayWorkoutDay: getTodayWorkoutDay(),
    recentWorkouts,
    recentPRs,
    bodyweightTrend,
    currentWeekVolume,
    thisWeekWorkouts,
    targetWeekWorkouts: 4,
    isLoading,
    refresh: load,
  };
}
