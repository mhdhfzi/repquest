import { TITLES } from '@/constants/progression';
import { addDays, dayKey, startOfDay, weekdayIndex } from '@/lib/date';

/** Total XP needed to reach a level: 100 × n^1.5 (level 1 starts at 0). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

export interface LevelInfo {
  level: number;
  title: string;
  nextTitle: { level: number; name: string } | null;
  current: number; // xp into this level
  needed: number; // xp span of this level
  progress: number; // 0..1
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const title = [...TITLES].reverse().find((t) => t.level <= level)!;
  const next = TITLES.find((t) => t.level > level) ?? null;
  return {
    level,
    title: title.name,
    nextTitle: next,
    current: totalXp - floor,
    needed: ceil - floor,
    progress: (totalXp - floor) / (ceil - floor),
  };
}

/** Days that count toward the streak: any day with a workout, a logged rest day, or a spent streak freeze. */
export function activeDayKeys(workoutTimes: number[], restDays: string[], frozenDays: string[] = []): Set<string> {
  return new Set([...workoutTimes.map((t) => dayKey(t)), ...restDays, ...frozenDays]);
}

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** True when `t` falls on a weekday you've marked as rest in your weekly schedule. */
export function isScheduledRest(trainingDays: number[], t: number): boolean {
  return !trainingDays.includes(weekdayIndex(t));
}

/**
 * Whole training days missed since the last active day (today excluded — it isn't over yet).
 * Scheduled rest days are skipped, so they never use up a streak freeze.
 * Empty when nothing was missed or there's no recent streak worth protecting.
 */
export function missedDays(days: Set<string>, trainingDays = EVERY_DAY, now = Date.now()): string[] {
  const missed: string[] = [];
  let cursor = addDays(startOfDay(now), -1);
  for (let i = 0; i < 30; i++) {
    if (days.has(dayKey(cursor))) return missed;
    if (!isScheduledRest(trainingDays, cursor)) missed.push(dayKey(cursor));
    cursor = addDays(cursor, -1);
  }
  return [];
}

export interface StreakInfo {
  current: number;
  best: number;
  activeToday: boolean;
}

/**
 * Consecutive active days. The streak stays alive through today (it only breaks once a full
 * training day is missed), and scheduled rest days bridge it without adding to the count.
 */
export function computeStreak(days: Set<string>, trainingDays = EVERY_DAY, now = Date.now()): StreakInfo {
  const today = startOfDay(now);
  const activeToday = days.has(dayKey(today));
  const resting = (t: number) => isScheduledRest(trainingDays, t);

  let current = 0;
  let cursor = activeToday ? today : addDays(today, -1);
  for (let i = 0; i < 400; i++) {
    if (days.has(dayKey(cursor))) current++;
    else if (!resting(cursor)) break;
    cursor = addDays(cursor, -1);
  }

  // Best run: walk every day from the first activity to yesterday with the same rules.
  let best = 0;
  const sorted = [...days].sort();
  if (sorted.length) {
    const [y, m, d] = sorted[0].split('-').map(Number);
    let run = 0;
    for (let t = new Date(y, m - 1, d).getTime(); t < today; t = addDays(t, 1)) {
      if (days.has(dayKey(t))) run++;
      else if (!resting(t)) run = 0;
      best = Math.max(best, run);
    }
  }
  return { current, best: Math.max(best, current), activeToday };
}

/** Epley estimate of one-rep max. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}
