import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgramExercise, ExerciseSession, SetEntry } from '../../types';
import { Colors, Fonts, FontSizes, Radius } from '../../constants/theme';
import { MuscleColors } from '../../constants/theme';
import { Tag, Divider } from '../ui/SharedUI';
import { formatSetDisplay, formatWeight } from '../../utils/formatters';

interface ExerciseCardProps {
  programExercise: ProgramExercise;
  lastSession: ExerciseSession | null;
  loggedSets: SetEntry[];
  isReadyToProgress: boolean;
  suggestedNextWeight: number;
  onLogSet: (weight: number, reps: number) => void;
  onRemoveLastSet: () => void;
  onOpenHistory: () => void;
}

export default function ExerciseCard({
  programExercise,
  lastSession,
  loggedSets,
  isReadyToProgress,
  suggestedNextWeight,
  onLogSet,
  onRemoveLastSet,
  onOpenHistory,
}: ExerciseCardProps) {
  const { exercise, targetSets, repRangeMin, repRangeMax } = programExercise;
  const muscleColor = MuscleColors[exercise.muscleGroup] ?? Colors.purple;

  const defaultWeight = isReadyToProgress
    ? suggestedNextWeight
    : lastSession?.sets[0]?.weight ?? programExercise.startWeight;

  const defaultReps = lastSession?.sets[loggedSets.length]?.reps ?? repRangeMin;

  const [weight, setWeight] = useState(String(defaultWeight > 0 ? defaultWeight : ''));
  const [reps, setReps] = useState(String(defaultReps));

  const setsComplete = loggedSets.length >= targetSets;
  const prevSets = lastSession?.sets ?? [];

  const handleLogSet = useCallback(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;

    if (r === 0) {
      Alert.alert('Missing Reps', 'Please enter the number of reps.');
      return;
    }

    onLogSet(w, r);

    // Pre-fill next set with same weight, from previous session if available
    const nextSetIndex = loggedSets.length + 1;
    const nextPrevReps = lastSession?.sets[nextSetIndex]?.reps ?? repRangeMin;
    setReps(String(nextPrevReps));
    // Keep same weight for next set
  }, [weight, reps, onLogSet, loggedSets.length, lastSession, repRangeMin]);

  return (
    <View
      style={[
        styles.container,
        setsComplete && styles.containerComplete,
        isReadyToProgress && !setsComplete && styles.containerProgress,
      ]}
    >
      {/* Exercise header */}
      <TouchableOpacity onPress={onOpenHistory} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <View style={styles.nameRow}>
            <Text style={styles.exerciseName} numberOfLines={2}>{exercise.name}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.purple} />
          </View>
          <View style={styles.tagRow}>
            <Tag color={muscleColor}>{exercise.muscleGroup}</Tag>
            <Tag color={Colors.textTertiary} style={styles.tagGap}>
              {targetSets}×{repRangeMin}–{repRangeMax}
            </Tag>
            {setsComplete && <Tag color={Colors.green} style={styles.tagGap}>✓ Done</Tag>}
          </View>
        </View>
        {isReadyToProgress && !setsComplete && (
          <Tag color={Colors.gold}>⬆ Progress</Tag>
        )}
      </TouchableOpacity>

      <Divider />

      {/* Previous vs Current */}
      <View style={styles.setsGrid}>
        {/* Previous column */}
        <View style={styles.setsCol}>
          <Text style={styles.colHeader}>
            {lastSession ? new Date(lastSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Previous'}
          </Text>
          {prevSets.length > 0 ? (
            prevSets.map((s, i) => (
              <View key={i} style={styles.prevSet}>
                <Text style={styles.prevSetText}>{formatSetDisplay(s.weight, s.reps)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noHistory}>No history</Text>
          )}
        </View>

        {/* Current column */}
        <View style={styles.setsCol}>
          <Text style={[styles.colHeader, styles.colHeaderCurrent]}>Current</Text>
          {loggedSets.length === 0 ? (
            <Text style={styles.noHistory}>Log below ↓</Text>
          ) : (
            loggedSets.map((s, i) => (
              <View key={i} style={styles.currentSet}>
                <Ionicons name="checkmark" size={11} color={Colors.green} />
                <Text style={styles.currentSetText}>
                  {formatSetDisplay(s.weight, s.reps)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Set input row */}
      {!setsComplete && (
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>WEIGHT (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder={String(defaultWeight > 0 ? defaultWeight : '0')}
              placeholderTextColor={Colors.textTertiary}
              style={styles.input}
              selectTextOnFocus
            />
          </View>

          <View style={styles.inputDivider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REPS</Text>
            <TextInput
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder={String(repRangeMin)}
              placeholderTextColor={Colors.textTertiary}
              style={styles.input}
              selectTextOnFocus
            />
          </View>

          <TouchableOpacity onPress={handleLogSet} style={styles.logBtn} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Progression suggestion */}
      {isReadyToProgress && (
        <View style={styles.progressBanner}>
          <Ionicons name="arrow-up" size={13} color={Colors.gold} />
          <Text style={styles.progressText}>
            Ready to progress → {formatWeight(suggestedNextWeight)} next session
          </Text>
        </View>
      )}

      {/* Remove last set */}
      {loggedSets.length > 0 && !setsComplete && (
        <TouchableOpacity onPress={onRemoveLastSet} style={styles.undoBtn}>
          <Text style={styles.undoText}>↩ Undo last set</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  containerComplete: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  containerProgress: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  header: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    marginBottom: 7,
  },
  exerciseName: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagGap: {},
  setsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  setsCol: {
    flex: 1,
  },
  colHeader: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  colHeaderCurrent: {
    color: Colors.purple,
  },
  prevSet: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 5,
  },
  prevSetText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  currentSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.greenDim,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 5,
  },
  currentSetText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.green,
    fontWeight: '700',
  },
  noHistory: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.07)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    padding: 0,
  },
  inputDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  logBtn: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    flexShrink: 0,
  },
  progressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.goldDim,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  progressText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: '700',
  },
  undoBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  undoText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
});
