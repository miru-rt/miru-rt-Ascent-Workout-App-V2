import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '../../types';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../../constants/theme';
import { getLevelTitle } from '../../constants/theme';
import { Tag, ProgressBar } from '../ui/SharedUI';
import { formatLargeNumber } from '../../utils/formatters';

interface CharacterCardProps {
  profile: UserProfile;
  compact?: boolean;
}

export default function CharacterCard({ profile, compact = false }: CharacterCardProps) {
  const title = getLevelTitle(profile.level);
  const xpProgress = profile.xpToNextLevel > 0
    ? profile.xp / profile.xpToNextLevel
    : 0;

  return (
    <LinearGradient
      colors={['#130a2e', '#070f28', '#0e0e1b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.metaLeft}>
          <View style={styles.badgeRow}>
            <Tag color={Colors.gold}>LVL {profile.level}</Tag>
            <Tag color={Colors.purple} style={styles.badgeGap}>{title.toUpperCase()}</Tag>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subtitle}>Athletic Physique · Hypertrophy Phase</Text>
        </View>

        {/* Avatar */}
        <LinearGradient
          colors={Colors.gradientPurpleBlue}
          style={styles.avatar}
        >
          <Text style={styles.avatarEmoji}>⚔️</Text>
        </LinearGradient>
      </View>

      {/* XP Bar */}
      {!compact && (
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>XP Progress</Text>
            <Text style={styles.xpValue}>
              {profile.xp} / {profile.xpToNextLevel}
            </Text>
          </View>
          <ProgressBar progress={xpProgress} height={8} glow />
          <Text style={styles.xpHint}>
            {profile.xpToNextLevel - profile.xp} XP to Level {profile.level + 1}
          </Text>
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Workouts', value: String(profile.totalWorkouts), emoji: '💪' },
          { label: 'Streak', value: `${profile.streakDays}🔥`, emoji: '' },
          { label: 'Volume', value: formatLargeNumber(profile.totalVolume), emoji: '📊' },
        ].map((stat, i) => (
          <View
            key={stat.label}
            style={[
              styles.stat,
              i > 0 && styles.statBorder,
            ]}
          >
            <Text style={styles.statValue}>{stat.emoji}{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.borderHi,
    padding: Spacing.xl,
    overflow: 'hidden',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.04,
    // React Native doesn't support repeating-linear-gradient in background.
    // We simulate with small dots pattern via borderWidth trick — skip for perf.
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  metaLeft: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  badgeGap: {},
  name: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  xpSection: {
    marginBottom: Spacing.lg,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  xpLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  xpValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    fontWeight: '700',
  },
  xpHint: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
