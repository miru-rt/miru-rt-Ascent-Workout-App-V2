import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius, MuscleColors } from '../constants/theme';
import { getProgramExercises } from '../database/repositories/exerciseRepository';
import { getRecentWorkouts } from '../database/repositories/workoutRepository';
import { PROGRAM_ID, WORKOUT_SCHEDULE } from '../constants/program';
import { ProgramExercise, WorkoutSession } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Tag, SectionLabel } from '../components/ui/SharedUI';
import { formatDate } from '../utils/formatters';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WORKOUT_DAYS = ['Upper A', 'Lower A', 'Upper B', 'Lower B'] as const;

interface DaySummary {
  day: string;
  exercises: ProgramExercise[];
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [summaries, recent] = await Promise.all([
          Promise.all(
            WORKOUT_DAYS.map(async (day) => ({
              day,
              exercises: await getProgramExercises(PROGRAM_ID, day),
            })),
          ),
          getRecentWorkouts(8),
        ]);
        setDaySummaries(summaries);
        setRecentWorkouts(recent);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const todayDow = new Date().getDay();
  const todayEntry = WORKOUT_SCHEDULE.find((s) => s.dayOfWeek === todayDow);
  const todayWorkout = todayEntry?.workoutDay ?? null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.programTitle}>Athletic Physique</Text>
        <Text style={styles.programMeta}>Upper-Lower Split · 4 days/week</Text>
      </View>

      {/* Weekly schedule strip */}
      <SectionLabel>Weekly Schedule</SectionLabel>
      <View style={styles.scheduleRow}>
        {WORKOUT_SCHEDULE.map(({ label: dayLabel, workoutDay, dayOfWeek }) => {
          const isToday = dayOfWeek === todayDow;
          const hasWorkout = workoutDay !== null;
          return (
            <View
              key={dayLabel}
              style={[
                styles.scheduleCell,
                hasWorkout && styles.scheduleCellActive,
                isToday && styles.scheduleCellToday,
              ]}
            >
              <Text style={[styles.scheduleDayLabel, isToday && styles.scheduleDayToday]}>
                {dayLabel}
              </Text>
              <Text
                style={[
                  styles.scheduleWorkout,
                  hasWorkout && styles.scheduleWorkoutActive,
                  isToday && styles.scheduleWorkoutToday,
                ]}
                numberOfLines={2}
              >
                {workoutDay ? workoutDay.replace(' ', '\n') : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Workout days */}
      <View style={styles.section}>
        <SectionLabel>Workout Days</SectionLabel>
        {daySummaries.map(({ day, exercises }) => {
          const isToday = day === todayWorkout;
          const uniqueMuscles = [...new Set(exercises.map((e) => e.exercise.muscleGroup))];
          const totalSets = exercises.reduce((a, e) => a + e.targetSets, 0);

          return (
            <Card
              key={day}
              onPress={() => navigation.navigate('WorkoutDayDetail', { workoutDay: day })}
              style={[styles.dayCard, isToday && styles.dayCardToday]}
            >
              <View style={styles.dayCardInner}>
                <View style={styles.dayLeft}>
                  {isToday && (
                    <Tag color={Colors.blue} style={styles.todayBadge}>TODAY</Tag>
                  )}
                  <Text style={styles.dayName}>{day}</Text>
                  <Text style={styles.dayMeta}>
                    {exercises.length} exercises · {totalSets} sets
                  </Text>
                  <View style={styles.dayTags}>
                    {uniqueMuscles.slice(0, 3).map((m) => (
                      <Tag key={m} color={MuscleColors[m] ?? Colors.purple} style={styles.tagGap}>
                        {m}
                      </Tag>
                    ))}
                    {uniqueMuscles.length > 3 && (
                      <Tag color={Colors.textTertiary}>+{uniqueMuscles.length - 3}</Tag>
                    )}
                  </View>
                </View>
                <View style={styles.dayRight}>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  <Button
                    variant={isToday ? 'primary' : 'ghost'}
                    size="sm"
                    onPress={() => navigation.navigate('ActiveWorkout', { workoutDay: day })}
                    icon={<Ionicons name="flash-outline" size={12} color={isToday ? '#fff' : Colors.textSecondary} />}
                    style={styles.startBtn}
                  >
                    Start
                  </Button>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Recent workouts */}
      {recentWorkouts.length > 0 && (
        <View style={styles.section}>
          <SectionLabel>Recent Sessions</SectionLabel>
          <Card>
            {recentWorkouts.slice(0, 5).map((w, i) => (
              <View
                key={w.id}
                style={[styles.recentRow, i < Math.min(recentWorkouts.length, 5) - 1 && styles.recentBorder]}
              >
                <View style={styles.recentLeft}>
                  <Text style={styles.recentDay}>{w.workoutDay}</Text>
                  <Text style={styles.recentMeta}>
                    {formatDate(w.startedAt)} ·{' '}
                    {w.durationSeconds ? `${Math.round(w.durationSeconds / 60)} min` : '—'} ·{' '}
                    {w.totalSets} sets
                  </Text>
                </View>
                <Text style={styles.recentVol}>
                  {w.totalVolume > 0 ? `${Math.round(w.totalVolume).toLocaleString()} kg` : '—'}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  header: { marginBottom: Spacing.xl },
  programTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  programMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  scheduleRow: { flexDirection: 'row', gap: 4, marginBottom: Spacing.xl },
  scheduleCell: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 6,
    alignItems: 'center',
  },
  scheduleCellActive: {
    backgroundColor: Colors.purpleDim,
    borderColor: Colors.border,
  },
  scheduleCellToday: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleDim,
  },
  scheduleDayLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  scheduleDayToday: { color: Colors.purple },
  scheduleWorkout: {
    fontFamily: Fonts.body,
    fontSize: 8,
    fontWeight: '600',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 11,
  },
  scheduleWorkoutActive: { color: Colors.purpleLight },
  scheduleWorkoutToday: { color: Colors.purple },
  section: { marginBottom: Spacing.lg },
  dayCard: { marginBottom: 10 },
  dayCardToday: {
    borderColor: 'rgba(59,130,246,0.35)',
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  dayCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayLeft: { flex: 1, marginRight: 8 },
  todayBadge: { marginBottom: 6, alignSelf: 'flex-start' },
  dayName: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  dayMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dayTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagGap: {},
  dayRight: {
    alignItems: 'flex-end',
    gap: 10,
    flexShrink: 0,
  },
  startBtn: {},
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  recentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentLeft: { flex: 1 },
  recentDay: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recentMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recentVol: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.purple,
  },
});
