import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';
import { useWorkoutStore } from '../store/workoutStore';
import { useRestTimerStore } from '../store/restTimerStore';
import { useProgramExercises } from '../hooks/useProgramExercises';
import { getExerciseHistory } from '../database/repositories/setRepository';
import { evaluateProgression } from '../services/progressionService';
import { ExerciseSession, ProgramExercise } from '../types';
import ExerciseCard from '../components/workout/ExerciseCard';
import RestTimer from '../components/workout/RestTimer';
import { ProgressBar } from '../components/ui/SharedUI';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWorkout'>;

interface ExerciseMeta {
  lastSession: ExerciseSession | null;
  isReadyToProgress: boolean;
  nextWeight: number;
}

export default function ActiveWorkoutScreen({ route, navigation }: Props) {
  const { workoutDay } = route.params;
  const insets = useSafeAreaInsets();

  const {
    isWorkoutActive, elapsedSeconds,
    startWorkout, logSet, removeLastSet,
    finishWorkout, cancelWorkout, getSetsForExercise,
    getTotalSets, pendingPRNotifications, clearPRNotification,
  } = useWorkoutStore();

  const { start: startRest } = useRestTimerStore();
  const { exercises } = useProgramExercises(workoutDay);
  const [exerciseMeta, setExerciseMeta] = useState<Record<string, ExerciseMeta>>({});

  // Initialise workout session on mount
  useEffect(() => {
    if (!isWorkoutActive) {
      void startWorkout(workoutDay);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load exercise history / progression meta
  useEffect(() => {
    if (!exercises.length) return;
    const loadMeta = async () => {
      const entries = await Promise.all(
        exercises.map(async (pe) => {
          const history = await getExerciseHistory(pe.exerciseId, 3);
          const result = await evaluateProgression(pe);
          return [
            pe.exerciseId,
            {
              lastSession: history[history.length - 1] ?? null,
              isReadyToProgress: result.isReadyToProgress,
              nextWeight: result.suggestion?.suggestedWeight ?? pe.startWeight,
            },
          ] as [string, ExerciseMeta];
        }),
      );
      setExerciseMeta(Object.fromEntries(entries));
    };
    void loadMeta();
  }, [exercises]);

  // PR notification toast
  useEffect(() => {
    if (pendingPRNotifications[0]) {
      const note = pendingPRNotifications[0];
      Alert.alert(
        '🏆 New PR!',
        `${note.exerciseName}\n${note.prTypes.join(' · ')}`,
        [{ text: 'Nice!', onPress: clearPRNotification }],
      );
    }
  }, [pendingPRNotifications, clearPRNotification]);

  const handleLogSet = useCallback(
    async (pe: ProgramExercise, weight: number, reps: number) => {
      await logSet(pe.exerciseId, pe, weight, reps);
      startRest(90);
    },
    [logSet, startRest],
  );

  const handleFinish = useCallback(() => {
    const totalSets = getTotalSets();
    Alert.alert(
      'Finish Workout?',
      `You've logged ${totalSets} set${totalSets !== 1 ? 's' : ''}. Save this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            await finishWorkout();
            navigation.replace('MainTabs', { screen: 'Dashboard' });
          },
        },
      ],
    );
  }, [getTotalSets, finishWorkout, navigation]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Workout?',
      'All progress will be lost.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: async () => {
            await cancelWorkout();
            navigation.goBack();
          },
        },
      ],
    );
  }, [cancelWorkout, navigation]);

  const totalSets = getTotalSets();
  const targetSets = exercises.reduce((a, e) => a + e.targetSets, 0);
  const progressPct = targetSets > 0 ? totalSets / targetSets : 0;

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.workoutTitle}>{workoutDay}</Text>
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.timer}>{timeStr}</Text>
              <Text style={styles.setCount}>
                · {totalSets}/{targetSets} sets
              </Text>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Ionicons name="close" size={18} color={Colors.red} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.finishText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ProgressBar
          progress={progressPct}
          height={4}
          style={styles.progressBar}
          glow
        />

        <RestTimer />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {exercises.map((pe) => {
          const meta = exerciseMeta[pe.exerciseId];
          const loggedSets = getSetsForExercise(pe.exerciseId);

          return (
            <ExerciseCard
              key={pe.id}
              programExercise={pe}
              lastSession={meta?.lastSession ?? null}
              loggedSets={loggedSets}
              isReadyToProgress={meta?.isReadyToProgress ?? false}
              suggestedNextWeight={meta?.nextWeight ?? pe.startWeight}
              onLogSet={(w, r) => void handleLogSet(pe, w, r)}
              onRemoveLastSet={() => removeLastSet(pe.exerciseId)}
              onOpenHistory={() =>
                navigation.navigate('ExerciseHistory', {
                  exerciseId: pe.exerciseId,
                  exerciseName: pe.exercise.name,
                  muscleGroup: pe.exercise.muscleGroup,
                  repRangeMin: pe.repRangeMin,
                  repRangeMax: pe.repRangeMax,
                })
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: 'rgba(7,7,15,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  workoutTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  timer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  setCount: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
  },
  headerBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.redDim,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.green,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  finishText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: { marginHorizontal: Spacing.lg, marginBottom: 10 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 60 },
});
