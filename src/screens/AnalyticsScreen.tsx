import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, FontSizes, Spacing, MuscleColors } from '../constants/theme';
import { useAnalytics } from '../hooks/useAnalytics';
import Card from '../components/ui/Card';
import { Tag, SectionLabel } from '../components/ui/SharedUI';
import { VolumeBarChart, ExerciseLineChart, MuscleBar } from '../components/charts/Charts';
import { formatLargeNumber, formatDate, formatWeight } from '../utils/formatters';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const {
    weeklyVolume, muscleVolume, recentPRs, totalStats,
    workoutDates, strengthTrends, isLoading, refresh,
  } = useAnalytics();

  const volLabels = weeklyVolume.map((w) => w.week);
  const volData   = weeklyVolume.map((w) => w.volume);
  const maxMuscle = Math.max(...muscleVolume.map((m) => m.sets), 1);

  // Consistency calendar — current month
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDow = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const workedDays = new Set(
    workoutDates.map((d) => {
      const dt = new Date(d);
      return dt.getMonth() === today.getMonth() ? dt.getDate() : -1;
    }),
  );

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
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Performance insights</Text>
      </View>

      {/* ── Totals strip ── */}
      <View style={styles.totalsRow}>
        {[
          { label: 'Workouts',  value: String(totalStats.totalWorkouts), color: Colors.purple },
          { label: 'Total Vol', value: formatLargeNumber(totalStats.totalVolume), color: Colors.blue },
          { label: 'Total Sets',value: String(totalStats.totalSets), color: Colors.gold },
        ].map((s, i) => (
          <Card key={s.label} style={[styles.totalCard, i > 0 && styles.totalCardGap]}>
            <Text style={[styles.totalValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.totalLabel}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {/* ── Weekly Volume ── */}
      <SectionLabel style={styles.sectionLabel}>Weekly Volume (kg)</SectionLabel>
      <Card style={styles.card}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartBig, { color: Colors.purple }]}>
              {volData.length > 0 ? formatLargeNumber(volData[volData.length - 1] ?? 0) : '—'} kg
            </Text>
            <Text style={styles.chartSub}>This week</Text>
          </View>
          <Tag color={Colors.gold}>Last 8 weeks</Tag>
        </View>
        <VolumeBarChart labels={volLabels} data={volData} height={140} />
      </Card>

      {/* ── Muscle Distribution ── */}
      <SectionLabel style={styles.sectionLabel}>Muscle Volume (sets · last 4 wks)</SectionLabel>
      <Card style={styles.card}>
        {muscleVolume.length === 0 ? (
          <Text style={styles.emptyHint}>Complete workouts to see muscle distribution.</Text>
        ) : (
          muscleVolume.map((m) => (
            <MuscleBar
              key={m.muscleGroup}
              name={m.muscleGroup}
              sets={m.sets}
              maxSets={maxMuscle}
              color={MuscleColors[m.muscleGroup] ?? Colors.purple}
            />
          ))
        )}
      </Card>

      {/* ── Strength Trends ── */}
      {strengthTrends.labels.length > 1 && (
        <>
          <SectionLabel style={styles.sectionLabel}>Strength Trends</SectionLabel>
          <Card style={styles.card}>
            <ExerciseLineChart
              labels={strengthTrends.labels}
              data={strengthTrends.latPulldown}
              color={Colors.purple}
              height={150}
              suffix="kg"
            />
            <View style={styles.legend}>
              {[
                { label: 'Lat Pulldown', color: Colors.purple },
                { label: 'Leg Press',    color: Colors.blue   },
                { label: 'EZ Curl',      color: Colors.gold   },
              ].map(({ label, color }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}

      {/* ── Recent PRs ── */}
      {recentPRs.length > 0 && (
        <>
          <SectionLabel style={styles.sectionLabel}>Recent PRs</SectionLabel>
          <Card style={styles.card}>
            {recentPRs.map((pr, i) => (
              <View
                key={i}
                style={[styles.prRow, i < recentPRs.length - 1 && styles.prBorder]}
              >
                <View style={styles.prLeft}>
                  <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                  <Text style={styles.prDate}>{formatDate(pr.date)}</Text>
                </View>
                <Tag color={Colors.gold}>🏆 {formatWeight(pr.weight)} × {pr.reps}</Tag>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* ── Consistency Calendar ── */}
      <SectionLabel style={styles.sectionLabel}>
        {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </SectionLabel>
      <Card style={styles.card}>
        {/* Day of week headers */}
        <View style={styles.calRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={`hdr-${i}`} style={styles.calDayHdr}>{d}</Text>
          ))}
        </View>

        {/* Calendar cells */}
        <View style={styles.calGrid}>
          {Array.from({ length: firstDow }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.calCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isWorked = workedDays.has(day);
            const isToday = day === today.getDate();
            return (
              <View
                key={day}
                style={[
                  styles.calCell,
                  isWorked && styles.calCellWorked,
                  isToday && styles.calCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.calCellText,
                    isWorked && styles.calCellTextWorked,
                    isToday && styles.calCellTextToday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.calLegend}>
          {[
            { color: Colors.purple, label: 'Workout' },
            { color: 'rgba(255,255,255,0.05)', label: 'Rest' },
          ].map(({ color, label }) => (
            <View key={label} style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: color }]} />
              <Text style={styles.calLegendText}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  header: { marginBottom: Spacing.xl },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  totalsRow: { flexDirection: 'row', marginBottom: Spacing.xl },
  totalCard: { flex: 1, alignItems: 'center' },
  totalCardGap: { marginLeft: 10 },
  totalValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  totalLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  sectionLabel: { marginBottom: 10 },
  card: { marginBottom: Spacing.xl },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  chartBig: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  chartSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyHint: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 3, borderRadius: 2 },
  legendText: { fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textSecondary },
  prRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  prBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  prLeft: { flex: 1, marginRight: 10 },
  prExercise: { fontFamily: Fonts.body, fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textPrimary },
  prDate: { fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  calRow: { flexDirection: 'row', marginBottom: 8 },
  calDayHdr: {
    flex: 1, textAlign: 'center',
    fontFamily: Fonts.body, fontSize: 10, fontWeight: '700',
    color: Colors.textTertiary, paddingBottom: 4,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 3,
  },
  calCellWorked: { backgroundColor: Colors.purple },
  calCellToday: { borderWidth: 1, borderColor: Colors.blue },
  calCellText: { fontFamily: Fonts.body, fontSize: 9, color: Colors.textTertiary },
  calCellTextWorked: { color: '#fff', fontWeight: '700' },
  calCellTextToday: { color: Colors.blueLight, fontWeight: '700' },
  calLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 14 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calLegendDot: { width: 10, height: 10, borderRadius: 3 },
  calLegendText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textSecondary },
});
