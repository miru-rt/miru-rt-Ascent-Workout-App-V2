import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg: '#07070f',
  surface: '#0e0e1b',
  surfaceAlt: '#12122a',
  surfaceHover: '#181830',

  // Borders
  border: 'rgba(139, 92, 246, 0.14)',
  borderHi: 'rgba(139, 92, 246, 0.42)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',

  // Primary - Purple
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  purpleDim: 'rgba(139, 92, 246, 0.18)',
  purpleGlow: 'rgba(139, 92, 246, 0.35)',

  // Secondary - Blue
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  blueDim: 'rgba(59, 130, 246, 0.16)',

  // Accent - Gold
  gold: '#f59e0b',
  goldLight: '#fbbf24',
  goldDim: 'rgba(245, 158, 11, 0.16)',

  // Success - Green
  green: '#10b981',
  greenLight: '#34d399',
  greenDim: 'rgba(16, 185, 129, 0.16)',

  // Error - Red
  red: '#ef4444',
  redDim: 'rgba(239, 68, 68, 0.16)',

  // Cyan
  cyan: '#06b6d4',
  cyanDim: 'rgba(6, 182, 212, 0.16)',

  // Pink
  pink: '#ec4899',
  pinkDim: 'rgba(236, 72, 153, 0.16)',

  // Text
  textPrimary: '#f0eeff',
  textSecondary: '#8a84b0',
  textTertiary: '#45456a',
  textDisabled: '#2a2a4a',

  // Gradients (start, end)
  gradientPurpleBlue: ['#7c3aed', '#2563eb'] as [string, string],
  gradientCard: ['#130a2e', '#070f28', '#0e0e1b'] as [string, string, string],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// MUSCLE GROUP COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const MuscleColors: Record<string, string> = {
  Back: Colors.purple,
  Chest: Colors.pink,
  Shoulders: Colors.gold,
  Arms: Colors.green,
  Legs: Colors.blue,
  Core: Colors.cyan,
  Glutes: Colors.blueLight,
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

export const Fonts = {
  display: Platform.select({ ios: 'Rajdhani', android: 'Rajdhani', default: 'Rajdhani' }),
  body: Platform.select({ ios: 'DMSans', android: 'DMSans', default: 'DMSans' }),
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  hero: 40,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  full: 999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────

export const Shadows = {
  purple: {
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export const LEVEL_TITLES = [
  'Novice',
  'Apprentice',
  'Warrior',
  'Veteran',
  'Champion',
  'Elite',
  'Master',
  'Grandmaster',
  'Legend',
  'Titan',
] as const;

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? 'Titan';
}

export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calculateLevel(totalXP: number): { level: number; xp: number; xpToNext: number } {
  let level = 1;
  let remaining = totalXP;
  while (remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level);
    level++;
  }
  return { level, xp: remaining, xpToNext: getXPForLevel(level) };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION DURATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const Durations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
