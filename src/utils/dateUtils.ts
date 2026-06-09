import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  subWeeks,
  parseISO,
  differenceInCalendarDays,
} from 'date-fns';

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date);
}

export function getDaysInMonth(date: Date = new Date()): Date[] {
  const start = startOfMonth(date);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return eachDayOfInterval({ start, end });
}

export function getDayOfWeek(date: Date = new Date()): number {
  return getDay(date); // 0 = Sunday, 1 = Monday...
}

export function getLast8WeekStarts(): Date[] {
  const weeks: Date[] = [];
  for (let i = 7; i >= 0; i--) {
    weeks.push(getWeekStart(subWeeks(new Date(), i)));
  }
  return weeks;
}

export function formatWeekRange(date: Date): string {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMM d')}–${format(end, 'd')}`;
  }
  return `${format(start, 'MMM d')}–${format(end, 'MMM d')}`;
}

export function calculateStreak(workoutDates: string[]): number {
  if (workoutDates.length === 0) return 0;

  const sorted = [...workoutDates]
    .map((d) => parseISO(d.split('T')[0] ?? d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const date of sorted) {
    const diff = differenceInCalendarDays(current, date);
    if (diff === 0 || diff === 1) {
      streak++;
      current = date;
    } else {
      break;
    }
  }

  return streak;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getMonthFirstDayOffset(date: Date = new Date()): number {
  // Returns the day of week (0=Sun, 1=Mon...) of the first day of the month
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}
