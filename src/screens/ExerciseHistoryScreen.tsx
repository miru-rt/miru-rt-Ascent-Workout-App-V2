import React, { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius, MuscleColors } from '../constants/theme';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { ScreenHeader, Tag, SectionLabel, EmptyState } from '../components/ui/SharedUI';
import Card from '../components/ui/Card';
import { ExerciseLineChart } from '../components/charts/Charts';
import { formatDate, formatWeight, formatSetDisplay } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseHistory'>;

type ChartTab = 'weight' | 'reps' | 'volume';

const CHART_COLORS: Record<ChartTab, string> = {
  weight: Colors.purple,
  reps: Colors.blue,
  volume: Colors.gold,
};

export default function ExerciseHistoryScreen({ route, navigation }: Props) {
  const { exerciseId, exerciseName, muscleGroup, repRangeMin, repRangeMax } = route.params;
  const [activeTab, setActiveTab] = useState<ChartTab>('weight');

  const {
    history, prs, lastSession, prevSession,
    isLoading, weightData, repsData, volumeData, chartLabels,
  } = useExerciseHistory(exerciseId);

  const muscleColor = MuscleColors[muscleGroup] ?? Colors.purple;

  // Pick the right dataset for the chart
  const chartDataMap: Record<ChartTab, number[]> = {
    weight: weightData,
    reps: repsData,
    volume: volumeData,
  };
  const activeData = chartDataMap[activeTab];

  // Delta vs previous session
  const delta =
    lastSession && prevSession
      ? (lastSession.sets[0]?.weight ?? 0) - (prevSession.sets[0]?.weight ?? 0)
      : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={exerciseName}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerTags}>
            <Tag color={muscleColor}>{muscleGroup}</Tag>
            <Tag color={Colors.textTertiary} style={styles.tagGap}>
              {repRangeMin}–{repRangeMax}
            </Tag>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Last session callout — always first ── */}
        {lastSession ? (
          <Card variant="highlight" style={styles.lastCard}>
            <View style={styles.lastHeader}>
              <Text style={styles.lastLabel}>
                Last Session — {formatDate(lastSession.date)}
              </Text>
              {delta !== 0 && (
                <View style={styles.deltaRow}>
                  <Ionicons
                    name={delta > 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={delta > 0 ? Colors.green : Colors.red}
                  />
                  <Text style={[styles.deltaText, { color: delta > 0 ? Colors.green : Colors.red }]}>
                    {Math.abs(delta)}kg vs prev
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.lastSets}>
              {lastSession.sets.map((s, i) => (
                <Text key={i} style={styles.lastSetText}>
                  {formatSetDisplay(s.weight, s.reps)}
                </Text>
              ))}
            </View>
          </Card>
        ) : !isLoading ? (
          <Card>
            <EmptyState
              icon="📊"
              title="No history yet"
              description="Complete your first set of this exercise to start tracking."
            />
          </Card>
        ) : null}

        {/* ── Personal Records ── */}
        {history.length > 0 && (
          <>
            <SectionLabel style={styles.sectionLabel}>Personal Records</SectionLabel>
            <View style={styles.prGrid}>
              {[
                { label: 'Max Weight', value: formatWeight(prs.maxWeight), emoji: '🏋️', color: Colors.purple },
                { label: 'Max Reps',   value: String(prs.maxReps),         emoji: '🔢', color: Colors.blue  },
                { label: 'Est. 1RM',   value: formatWeight(prs.best1RM),   emoji: '⚡', color: Colors.gold  },
                { label: 'Best Vol',   value: String(Math.round(prs.bestVolume)), emoji: '📈', color: Colors.green },
              ].map((pr) => (
                <View
                  key={pr.label}
                  style={[
                    styles.prCard,
                    { borderColor: `${pr.color}33`, backgroundColor: `${pr.color}0a` },
                  ]}
                >
                  <Text style={styles.prEmoji}>{pr.emoji}</Text>
                  <Text style={[styles.prValue, { color: pr.color }]}>{pr.value}</Text>
                  <Text style={styles.prLabel}>{pr.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Progress chart ── */}
        {activeData.length > 1 && (
          <>
            <SectionLabel style={styles.sectionLabel}>Progress Chart</SectionLabel>
            <Card>
              {/* Tab switcher */}
              <View style={styles.tabs}>
                {(['weight', 'reps', 'volume'] as ChartTab[]).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.tab,
                      activeTab === tab && {
                        borderColor: CHART_COLORS[tab],
                        backgroundColor: `${CHART_COLORS[tab]}22`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: activeTab === tab ? CHART_COLORS[tab] : Colors.textSecondary },
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ExerciseLineChart
                labels={chartLabels}
                data={activeData}
                color={CHART_COLORS[activeTab]}
                height={160}
                suffix={activeTab === 'weight' ? 'kg' : ''}
              />
            </Card>
          </>
        )}

        {/* ── Session history timeline ── */}
        {history.length > 0 && (
          <>
            <SectionLabel style={styles.sectionLabel}>Session History</SectionLabel>
            <Card>
              {[...history].reverse().map((session, i) => {
                const isPRSession = session.maxWeight === prs.maxWeight && prs.maxWeight > 0;
                return (
                  <View
                    key={`${session.workoutId}-${i}`}
                    style={[
                      styles.sessionRow,
                      i < history.length - 1 && styles.sessionBorder,
                    ]}
                  >
                    <View style={styles.sessionLeft}>
                      <View style={styles.sessionMeta}>
                        <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                        {isPRSession && <Tag color={Colors.gold} style={styles.tagGap}>PR 🏆</Tag>}
                      </View>
                      <View style={styles.sessionSets}>
                        {session.sets.map((s, j) => (
                          <View
                            key={j}
                            style={[
                              styles.setChip,
                              { backgroundColor: isPRSession ? Colors.goldDim : Colors.purpleDim },
                            ]}
                          >
                            <Text
                              style={[
                                styles.setChipText,
                                { color: isPRSession ? Colors.gold : Colors.purple },
                              ]}
                            >
                              {formatSetDisplay(s.weight, s.reps)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.sessionRight}>
                      <Text style={styles.sessionVolLabel}>Vol</Text>
                      <Text style={styles.sessionVol}>{Math.round(session.volume)}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerTags: { flexDirection: 'row', gap: 6 },
  tagGap: {},
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 40 },
  lastCard: { marginBottom: Spacing.lg },
  lastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lastLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.blueLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  lastSets: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  lastSetText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionLabel: { marginTop: 4 },
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  prCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  prEmoji: { fontSize: 22, marginBottom: 6 },
  prValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  prLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  tabs: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sessionRow: { paddingVertical: 13 },
  sessionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  sessionLeft: { flex: 1 },
  sessionRight: { alignItems: 'flex-end', minWidth: 48 },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sessionDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sessionSets: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  setChip: {
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  setChipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  sessionVolLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  sessionVol: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
