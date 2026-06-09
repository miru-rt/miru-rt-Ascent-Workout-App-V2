import { useState, useEffect, useCallback } from 'react';
import { getWeeklyVolume, getAllCompletedWorkoutDates, getTotalStats } from '../database/repositories/workoutRepository';
import { getMuscleGroupVolume, getExerciseHistory, getRecentPRs } from '../database/repositories/setRepository';
import { getDatabase } from '../database/database';
import { ExerciseSession, MuscleVolume } from '../types';

interface WeeklyVolEntry { week: string; volume: number; count: number }
interface PREntry { exerciseName: string; weight: number; reps: number; date: string }
interface StatsTotal { totalWorkouts: number; totalVolume: number; totalSets: number }

interface AnalyticsData {
  weeklyVolume: WeeklyVolEntry[];
  muscleVolume: MuscleVolume[];
  recentPRs: PREntry[];
  totalStats: StatsTotal;
  workoutDates: string[];
  strengthTrends: {
    labels: string[];
    latPulldown: number[];
    legPress: number[];
    ezCurl: number[];
  };
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function getHistoryByName(name: string): Promise<ExerciseSession[]> {
  const db = await getDatabase();
  const ex = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM exercises WHERE name = ? COLLATE NOCASE',
    [name],
  );
  if (!ex) return [];
  return getExerciseHistory(ex.id, 10);
}

export function useAnalytics(): AnalyticsData {
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolEntry[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolume[]>([]);
  const [recentPRs, setRecentPRs] = useState<PREntry[]>([]);
  const [totalStats, setTotalStats] = useState<StatsTotal>({ totalWorkouts: 0, totalVolume: 0, totalSets: 0 });
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [strengthTrends, setStrengthTrends] = useState<AnalyticsData['strengthTrends']>({
    labels: [], latPulldown: [], legPress: [], ezCurl: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wVol, mVol, prs, stats, dates] = await Promise.all([
        getWeeklyVolume(),
        getMuscleGroupVolume(),
        getRecentPRs(5),
        getTotalStats(),
        getAllCompletedWorkoutDates(),
      ]);

      const totalMuscleVol = mVol.reduce((a, m) => a + m.sets, 0);
      const formattedMuscle: MuscleVolume[] = mVol.map((m) => ({
        muscleGroup: m.muscleGroup as MuscleVolume['muscleGroup'],
        sets: m.sets,
        percentage: totalMuscleVol > 0 ? Math.round((m.sets / totalMuscleVol) * 100) : 0,
      }));

      const formattedWeekly: WeeklyVolEntry[] = wVol.map((w, i) => ({
        week: `W${i + 1}`,
        volume: w.volume,
        count: w.count,
      }));

      // Strength trends
      const [nlpHistory, lpHistory, curlHistory] = await Promise.all([
        getHistoryByName('Neutral Grip Lat Pulldown'),
        getHistoryByName('Leg Press'),
        getHistoryByName('EZ-Bar Curl'),
      ]);

      const refHistory = nlpHistory.slice(-8);
      const labels = refHistory.map((s) => {
        const d = new Date(s.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
      const latPulldown = refHistory.map((s) => s.maxWeight);
      let legPress = lpHistory.slice(-8).map((s) => s.maxWeight);
      let ezCurl = curlHistory.slice(-8).map((s) => s.maxWeight);

      // Pad arrays to same length
      while (legPress.length < labels.length) legPress.unshift(legPress[0] ?? 0);
      while (ezCurl.length < labels.length) ezCurl.unshift(ezCurl[0] ?? 0);

      setWeeklyVolume(formattedWeekly);
      setMuscleVolume(formattedMuscle);
      setRecentPRs(prs);
      setTotalStats(stats);
      setWorkoutDates(dates);
      setStrengthTrends({ labels, latPulldown, legPress, ezCurl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    weeklyVolume, muscleVolume, recentPRs, totalStats,
    workoutDates, strengthTrends, isLoading, error, refresh: load,
  };
}
