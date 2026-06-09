import React, { useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius, MuscleColors } from '../constants/theme';
import { useDashboard } from '../hooks/useDashboard';
import CharacterCard from '../components/dashboard/CharacterCard';
import { Tag, SectionLabel, EmptyState } from '../components/ui/SharedUI';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BodyweightChart } from '../components/charts/Charts';
import {
  formatDate,
  formatWeight,
  formatLargeNumber,
} from '../utils/formatters';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WORKOUT_DAY_MUSCLES: Record<string, string[]> = {
  'Upper A': ['Back', 'Shoulders', 'Arms', 'Core'],
  'Lower A': ['Legs', 'Glutes', 'Core'],
  'Upper B': ['Back', 'Chest', 'Shoulders', 'Arms'],
  'Lower B': ['Legs', 'Glutes', 'Core'],
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    profile,
    todayWorkoutDay,
    recentWorkouts,
    recentPRs,
    bodyweightTrend,
    currentWeekVolume,
    thisWeekWorkouts,
    targetWeekWorkouts,
    isLoading,
    refresh,
  } = useDashboard();

  const handleStartWorkout = useCallback(
    (day: string) => navigation.navigate('ActiveWorkout', { workoutDay: day }),
    [navigation],
  );

  const bwLabels = bodyweightTrend.slice(-8).map((p) => {
    const d = new Date(p.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const bwData = bodyweightTrend.slice(-8).map((p) => p.weight);
  const latestBW = bodyweightTrend[bodyweightTrend.length - 1]?.weight ?? null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor={Colors.purple}
          colors={[Colors.purple]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>ASCEND</Text>
          <Text style={styles.dateSubtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakCount}>{profile?.streakDays ?? 0}</Text>
        </View>
      </View>

      {/* ── Character Card ── */}
      {profile && (
        <View style={styles.section}>
          <CharacterCard profile={profile} />
        </View>
      )}

      {/* ── Today's Workout ── */}
      <View style={styles.section}>
        <SectionLabel>Today's Workout</SectionLabel>
        {todayWorkoutDay ? (
          <LinearGradient
            colors={['rgba(59,130,246,0.10)', 'rgba(139,92,246,0.07)']}
            style={styles.todayCard}
          >
            <View style={styles.todayLeft}>
              <Text style={styles.todayTitle}>{todayWorkoutDay}</Text>
              <Text style={styles.todayMeta}>Athletic Physique · ~45 min</Text>
              <View style={styles.todayTags}>
                {(WORKOUT_DAY_MUSCLES[todayWorkoutDay] ?? []).map((m) => (
                  <Tag key={m} color={MuscleColors[m] ?? Colors.purple} style={styles.tagGap}>
                    {m}
                  </Tag>
                ))}
              </View>
            </View>
            <Button
              onPress={() => handleStartWorkout(todayWorkoutDay)}
              icon={<Ionicons name="flash" size={15} color="#fff" />}
              style={styles.startBtn}
            >
              Start
            </Button>
          </LinearGradient>
        ) : (
          <Card>
            <View style={styles.restDayRow}>
              <Text style={styles.restEmoji}>🌙</Text>
              <View>
                <Text style={styles.restTitle}>Rest Day</Text>
                <Text style={styles.restSub}>Recovery is part of the process.</Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* ── Stats row ── */}
      <View style={styles.section}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Weekly Volume</Text>
            <Text style={[styles.statValue, { color: Colors.purple }]}>
              {formatLargeNumber(currentWeekVolume)}
              <Text style={styles.statUnit}> kg</Text>
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={[styles.statValue, { color: Colors.blue }]}>
              {thisWeekWorkouts}
              <Text style={styles.statUnit}>/{targetWeekWorkouts}</Text>
            </Text>
            <View style={styles.weekDotsRow}>
              {Array.from({ length: targetWeekWorkouts }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.weekDot,
                    i < thisWeekWorkouts && styles.weekDotFilled,
                  ]}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* ── Recent PRs ── */}
      <View style={styles.section}>
        <SectionLabel>Recent PRs</SectionLabel>
        {recentPRs.length === 0 ? (
          <Card>
            <EmptyState
              icon="🏆"
              title="No PRs yet"
              description="Complete workouts to start tracking personal records."
            />
          </Card>
        ) : (
          <Card>
            {recentPRs.map((pr, i) => (
              <View
                key={i}
                style={[styles.prRow, i < recentPRs.length - 1 && styles.prBorder]}
              >
                <View style={styles.prLeft}>
                  <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                  <Text style={styles.prDate}>{formatDate(pr.date)}</Text>
                </View>
                <Tag color={Colors.gold}>🏆 {formatWeight(pr.weight)}</Tag>
              </View>
            ))}
          </Card>
        )}
      </View>

      {/* ── Bodyweight ── */}
      {(bwData.length > 0 || latestBW) && (
        <View style={styles.section}>
          <SectionLabel>Bodyweight Trend</SectionLabel>
          <Card>
            {latestBW && (
              <View style={styles.bwHeader}>
                <View>
                  <Text style={styles.bwValue}>
                    {latestBW.toFixed(1)}{' '}
                    <Text style={styles.bwUnit}>kg</Text>
                  </Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate('AddMeasurement', { type: 'weight' })}
                  icon={<Ionicons name="add" size={14} color={Colors.textSecondary} />}
                >
                  Log
                </Button>
              </View>
            )}
            {bwData.length > 1 ? (
              <BodyweightChart labels={bwLabels} data={bwData} height={120} />
            ) : (
              <Text style={styles.bwHint}>Log more entries to see your trend.</Text>
            )}
          </Card>
        </View>
      )}

      {/* ── Last Workout ── */}
      {recentWorkouts[0] && (
        <View style={[styles.section, { marginBottom: 12 }]}>
          <SectionLabel>Last Workout</SectionLabel>
          <Card>
            <View style={styles.lastRow}>
              <View>
                <Text style={styles.lastDay}>{recentWorkouts[0].workoutDay}</Text>
                <Text style={styles.lastMeta}>
                  {formatDate(recentWorkouts[0].startedAt)} ·{' '}
                  {Math.round((recentWorkouts[0].durationSeconds ?? 0) / 60)} min ·{' '}
                  {recentWorkouts[0].totalSets} sets
                </Text>
              </View>
              <Text style={[styles.lastVolume, { color: Colors.purple }]}>
                {formatLargeNumber(recentWorkouts[0].totalVolume)} kg
              </Text>
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['4xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  appName: {
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.purple,
  },
  dateSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldDim,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  streakFire: { fontSize: 18 },
  streakCount: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.gold,
  },
  section: { marginBottom: Spacing.lg },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.28)',
    padding: Spacing.lg,
  },
  todayLeft: { flex: 1, marginRight: 12 },
  todayTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  todayMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    marginBottom: 8,
  },
  todayTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagGap: {},
  startBtn: { flexShrink: 0 },
  restDayRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  restEmoji: { fontSize: 28 },
  restTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  restSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1 },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
  },
  statUnit: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  weekDotsRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  weekDot: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  weekDotFilled: { backgroundColor: Colors.blue },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  prBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prLeft: { flex: 1, marginRight: 12 },
  prExercise: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  prDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bwHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bwValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bwUnit: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  bwHint: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  lastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastDay: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  lastMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  lastVolume: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
});
