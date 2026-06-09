import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32; // full width minus 2×16px padding

// ─────────────────────────────────────────────────────────────────────────────
// BASE CHART CONFIG
// ─────────────────────────────────────────────────────────────────────────────

function buildChartConfig(primaryColor: string) {
  return {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `${primaryColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: () => Colors.textTertiary,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '4',
      strokeWidth: '0',
      fill: primaryColor,
    },
    propsForLabels: {
      fontFamily: Fonts.body,
      fontSize: 9,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4 4',
      stroke: Colors.border,
      strokeWidth: 1,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE PROGRESS LINE CHART
// ─────────────────────────────────────────────────────────────────────────────

interface LineChartProps {
  labels: string[];
  data: number[];
  color?: string;
  height?: number;
  suffix?: string;
  yAxisMin?: number;
}

export function ExerciseLineChart({
  labels,
  data,
  color = Colors.purple,
  height = 160,
  suffix = '',
  yAxisMin,
}: LineChartProps) {
  if (!data.length || data.every((v) => v === 0)) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>No data yet</Text>
      </View>
    );
  }

  const safeData = data.map((v) => (isNaN(v) ? 0 : v));
  const safeLabels = labels.length === data.length ? labels : data.map(() => '');

  return (
    <LineChart
      data={{ labels: safeLabels, datasets: [{ data: safeData }] }}
      width={CHART_WIDTH}
      height={height}
      chartConfig={buildChartConfig(color)}
      bezier
      style={styles.chart}
      withInnerLines
      withOuterLines={false}
      withVerticalLabels={safeLabels.some(Boolean)}
      withHorizontalLabels
      yAxisSuffix={suffix}
      fromZero={false}
      getDotColor={() => color}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY VOLUME BAR CHART
// ─────────────────────────────────────────────────────────────────────────────

interface VolumeChartProps {
  labels: string[];
  data: number[];
  height?: number;
  highlightLast?: boolean;
}

export function VolumeBarChart({
  labels,
  data,
  height = 150,
  highlightLast = true,
}: VolumeChartProps) {
  if (!data.length || data.every((v) => v === 0)) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>No data yet</Text>
      </View>
    );
  }

  return (
    <BarChart
      data={{ labels, datasets: [{ data }] }}
      width={CHART_WIDTH}
      height={height}
      chartConfig={buildChartConfig(Colors.purple)}
      style={styles.chart}
      withInnerLines
      showValuesOnTopOfBars={false}
      yAxisLabel=""
      yAxisSuffix=""
      fromZero
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BODYWEIGHT AREA CHART (line chart with fill)
// ─────────────────────────────────────────────────────────────────────────────

interface BodyweightChartProps {
  labels: string[];
  data: number[];
  height?: number;
}

export function BodyweightChart({ labels, data, height = 120 }: BodyweightChartProps) {
  if (!data.length || data.every((v) => v === 0)) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>No data yet — log your weight</Text>
      </View>
    );
  }

  const safeData = data.map((v) => (isNaN(v) ? 0 : v));
  const safeLabels = labels.length === data.length ? labels : data.map(() => '');

  return (
    <LineChart
      data={{ labels: safeLabels, datasets: [{ data: safeData }] }}
      width={CHART_WIDTH}
      height={height}
      chartConfig={buildChartConfig(Colors.green)}
      bezier
      style={styles.chart}
      withInnerLines={false}
      withOuterLines={false}
      withVerticalLabels={false}
      withHorizontalLabels
      yAxisSuffix="kg"
      fromZero={false}
      getDotColor={() => Colors.green}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSCLE DISTRIBUTION — custom, no chart-kit needed
// ─────────────────────────────────────────────────────────────────────────────

interface MuscleBarProps {
  name: string;
  sets: number;
  maxSets: number;
  color: string;
}

export function MuscleBar({ name, sets, maxSets, color }: MuscleBarProps) {
  const pct = maxSets > 0 ? (sets / maxSets) * 100 : 0;

  return (
    <View style={styles.muscleRow}>
      <Text style={styles.muscleName}>{name}</Text>
      <View style={styles.muscleTrack}>
        <View style={[styles.muscleFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.muscleSets}>{sets}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
  },
  placeholderText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  muscleName: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    width: 80,
    fontWeight: '500',
  },
  muscleTrack: {
    flex: 1,
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  muscleFill: {
    height: '100%',
    borderRadius: 4,
    opacity: 0.85,
  },
  muscleSets: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
});
