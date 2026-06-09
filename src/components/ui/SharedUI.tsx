import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../../constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// TAG
// ─────────────────────────────────────────────────────────────────────────────

interface TagProps {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md';
}

export function Tag({ children, color = Colors.purple, style, textStyle, size = 'sm' }: TagProps) {
  return (
    <View
      style={[
        styles.tag,
        size === 'md' && styles.tagMd,
        { backgroundColor: `${color}22` },
        style,
      ]}
    >
      <Text style={[styles.tagText, { color }, textStyle]}>{children}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionLabel({ children, right, style }: SectionLabelProps) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionText}>{children}</Text>
      {right && <View>{right}</View>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.purple,
  height = 6,
  style,
  glow = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
            ...(glow && {
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
              elevation: 4,
            }),
          },
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN HEADER
// ─────────────────────────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, right, large = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerInner}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={Colors.purple} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitles}>
          <Text
            style={[styles.headerTitle, large && styles.headerTitleLarge]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
        {right && <View style={styles.headerRight}>{right}</View>}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

interface DividerProps {
  style?: StyleProp<ViewStyle>;
}

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CHIP
// ─────────────────────────────────────────────────────────────────────────────

interface StatChipProps {
  value: string | number;
  label: string;
  color?: string;
}

export function StatChip({ value, label, color = Colors.purple }: StatChipProps) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {icon && <Text style={styles.emptyIcon}>{icon}</Text>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Tag
  tag: {
    borderRadius: Radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  tagMd: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Section Label
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },

  // Progress Bar
  progressTrack: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.full,
  },

  // Screen Header
  header: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerTitleLarge: {
    fontSize: FontSizes['2xl'],
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexShrink: 0,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },

  // Stat Chip
  statChip: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 20,
  },
});
