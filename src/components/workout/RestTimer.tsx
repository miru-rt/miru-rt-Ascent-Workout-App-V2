import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRestTimerStore } from '../../store/restTimerStore';
import { Colors, Fonts, FontSizes } from '../../constants/theme';

export default function RestTimer() {
  const { secondsRemaining, totalSeconds, isActive, stop, start } = useRestTimerStore();

  if (!isActive && secondsRemaining === 0) return null;

  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isAlmostDone = secondsRemaining <= 10;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="timer-outline" size={16} color={Colors.blueLight} />
        <Text style={styles.label}>Rest</Text>
        <Text style={[styles.timer, isAlmostDone && styles.timerAlmostDone]}>
          {timeStr}
        </Text>
        <TouchableOpacity onPress={stop} style={styles.skipBtn} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => start(totalSeconds)} style={styles.resetBtn} hitSlop={8}>
          <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.trackContainer}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isAlmostDone ? Colors.red : Colors.blue,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.blueLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timer: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.blueLight,
    flex: 1,
  },
  timerAlmostDone: {
    color: Colors.red,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 6,
  },
  skipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.blueLight,
    fontWeight: '600',
  },
  resetBtn: {
    padding: 4,
  },
  trackContainer: {
    height: 3,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
