import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius, MuscleColors } from '../constants/theme';
import { useProgramExercises } from '../hooks/useProgramExercises';
import { ScreenHeader, Tag, SectionLabel, Divider } from '../components/ui/SharedUI';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatWeight, formatRepRange } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDayDetail'>;

export default function WorkoutDayDetailScreen({ route, navigation }: Props) {
  const { workoutDay } = route.params;
  const { exercises } = useProgramExercises(workoutDay);

  const totalSets = exercises.reduce((a, e) => a + e.targetSets, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={workoutDay}
        subtitle={`${exercises.length} exercises · ${totalSets} sets`}
        onBack={() => navigation.goBack()}
        right={
          <Button
            onPress={() => navigation.replace('ActiveWorkout', { workoutDay })}
            icon={<Ionicons name="flash" size={14} color="#fff" />}
            size="sm"
          >
            Start
          </Button>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel style={styles.sectionLabel}>Exercises</SectionLabel>

        {exercises.map((pe, i) => {
          const muscleColor = MuscleColors[pe.exercise.muscleGroup] ?? Colors.purple;

          return (
            <Card key={pe.id} style={styles.exCard}>
              <View style={styles.exRow}>
                <View style={styles.exIndex}>
                  <Text style={styles.exIndexText}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{pe.exercise.name}</Text>
                  <View style={styles.exMeta}>
                    <Tag color={muscleColor}>{pe.exercise.muscleGroup}</Tag>
                    <Text style={styles.exDetail}>
                      {pe.targetSets} sets · {formatRepRange(pe.repRangeMin, pe.repRangeMax)}
                    </Text>
                  </View>
                  {pe.startWeight > 0 && (
                    <Text style={styles.exStart}>
                      Starting weight: {formatWeight(pe.startWeight)}
                    </Text>
                  )}
                </View>
              </View>

              {pe.exercise.instructions ? (
                <>
                  <Divider />
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ExerciseHistory', {
                        exerciseId: pe.exerciseId,
                        exerciseName: pe.exercise.name,
                        muscleGroup: pe.exercise.muscleGroup,
                        repRangeMin: pe.repRangeMin,
                        repRangeMax: pe.repRangeMax,
                      })
                    }
                    style={styles.historyBtn}
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.purple} />
                    <Text style={styles.historyBtnText}>View History</Text>
                    <Ionicons name="chevron-forward" size={13} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </>
              ) : null}
            </Card>
          );
        })}

        <Button
          onPress={() => navigation.replace('ActiveWorkout', { workoutDay })}
          fullWidth
          style={styles.bottomStart}
          icon={<Ionicons name="flash" size={16} color="#fff" />}
        >
          Start {workoutDay}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: Spacing.lg },
  sectionLabel: { marginBottom: 12 },
  exCard: { marginBottom: 10 },
  exRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  exIndex: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exIndexText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.purple,
  },
  exInfo: { flex: 1 },
  exName: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  exMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  exDetail: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  exStart: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 5,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  historyBtnText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.purple,
    fontWeight: '600',
    flex: 1,
  },
  bottomStart: { marginTop: 12, borderRadius: Radius.xl },
});
