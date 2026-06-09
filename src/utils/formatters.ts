import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// DATE FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  } catch {
    return isoString;
  }
}

export function formatDateLong(isoString: string): string {
  try {
    return format(parseISO(isoString), 'EEEE, MMMM d, yyyy');
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString: string): string {
  try {
    return format(parseISO(isoString), 'MMM d');
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return '';
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatElapsed(startTime: Date): string {
  const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
  return formatDuration(seconds);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

export function formatWeight(kg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (kg === 0) return 'BW';
  if (unit === 'lbs') {
    return `${Math.round(kg * 2.20462)} lbs`;
  }
  // Show decimal only if needed
  if (kg % 1 !== 0) return `${kg.toFixed(1)}kg`;
  return `${kg}kg`;
}

export function formatWeightValue(kg: number): string {
  if (kg === 0) return 'BW';
  if (kg % 1 !== 0) return kg.toFixed(1);
  return String(kg);
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

export function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function formatSetDisplay(weight: number, reps: number): string {
  const w = formatWeightValue(weight);
  return `${w} × ${reps}`;
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

export function formatRepRange(min: number, max: number): string {
  return `${min}–${max} reps`;
}

export function formatSetsReps(sets: number, repMin: number, repMax: number): string {
  return `${sets} × ${repMin}–${repMax}`;
}

export function formatWeekLabel(weekNumber: number): string {
  return `W${weekNumber}`;
}
