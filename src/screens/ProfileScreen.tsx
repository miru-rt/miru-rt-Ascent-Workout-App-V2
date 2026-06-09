import React, { useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { useRestTimerStore } from '../store/restTimerStore';
import CharacterCard from '../components/dashboard/CharacterCard';
import Card from '../components/ui/Card';
import { SectionLabel } from '../components/ui/SharedUI';
import { exportWorkoutsAsCSV, exportWorkoutsAsJSON } from '../services/exportService';
import { formatLargeNumber } from '../utils/formatters';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingRowProps {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightNode?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ icon, label, value, onPress, isLast, rightNode, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightNode}
      style={[styles.settingRow, !isLast && styles.settingBorder]}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, destructive && styles.settingIconDestructive]}>
          <Ionicons
            name={icon}
            size={17}
            color={destructive ? Colors.red : Colors.purple}
          />
        </View>
        <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {rightNode ?? (
          <>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            {onPress && (
              <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loadProfile } = useUserStore();
  const { totalSeconds: restDefault, setDuration } = useRestTimerStore();

  useFocusEffect(
    useCallback(() => { void loadProfile(); }, [loadProfile]),
  );

  const handleExport = () => {
    Alert.alert('Export Data', 'Choose export format', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'CSV', onPress: () => void exportWorkoutsAsCSV() },
      { text: 'JSON', onPress: () => void exportWorkoutsAsJSON() },
    ]);
  };

  const handleRestTimer = () => {
    Alert.alert(
      'Default Rest Timer',
      'Choose rest duration',
      [60, 90, 120, 180].map((sec) => ({
        text: `${sec}s`,
        onPress: () => setDuration(sec),
        style: restDefault === sec ? ('default' as const) : ('default' as const),
      })),
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>

      {/* ── Character card ── */}
      {profile && (
        <View style={styles.section}>
          <CharacterCard profile={profile} />
        </View>
      )}

      {/* ── All-time stats ── */}
      {profile && (
        <View style={styles.section}>
          <SectionLabel>All-Time Stats</SectionLabel>
          <View style={styles.statsGrid}>
            {[
              { label: 'Workouts',    value: String(profile.totalWorkouts),           color: Colors.purple, emoji: '💪' },
              { label: 'Best Streak', value: `${profile.longestStreak}d`,             color: Colors.gold,   emoji: '🔥' },
              { label: 'Total Volume',value: `${formatLargeNumber(profile.totalVolume)} kg`, color: Colors.blue, emoji: '📊' },
              { label: 'Current Lvl', value: `Lvl ${profile.level}`,                 color: Colors.green,  emoji: '⚔️' },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ── Settings ── */}
      <View style={styles.section}>
        <SectionLabel>Settings</SectionLabel>
        <Card style={styles.settingsCard}>
          <SettingRow
            icon="barbell-outline"
            label="Units"
            value="Metric (kg)"
          />
          <SettingRow
            icon="timer-outline"
            label="Default Rest Timer"
            value={`${restDefault}s`}
            onPress={handleRestTimer}
          />
          <SettingRow
            icon="trending-up-outline"
            label="Progression System"
            value="Double Progression"
          />
          <SettingRow
            icon="notifications-outline"
            label="Reminders"
            value="Off"
          />
          <SettingRow
            icon="flame-outline"
            label="Warmup Sets"
            value="Auto (recommended)"
            isLast
          />
        </Card>
      </View>

      {/* ── Data ── */}
      <View style={styles.section}>
        <SectionLabel>Data</SectionLabel>
        <Card style={styles.settingsCard}>
          <SettingRow
            icon="share-outline"
            label="Export Data"
            onPress={handleExport}
          />
          <SettingRow
            icon="cloud-upload-outline"
            label="Backup"
            value="Coming soon"
            isLast
          />
        </Card>
      </View>

      {/* ── About ── */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <SectionLabel>About</SectionLabel>
        <Card style={styles.settingsCard}>
          <SettingRow
            icon="information-circle-outline"
            label="Version"
            value="1.0.0"
          />
          <SettingRow
            icon="code-slash-outline"
            label="Built with"
            value="Expo + React Native"
            isLast
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  section: { marginBottom: Spacing.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47.5%', alignItems: 'center', padding: 14 },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  settingsCard: { padding: 0 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingIconDestructive: { backgroundColor: Colors.redDim },
  settingLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingLabelDestructive: { color: Colors.red },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
