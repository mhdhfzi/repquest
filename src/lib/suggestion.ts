import { SPLIT_BY_ID, type SplitDay } from '@/constants/splits';
import { addDays, dayKey, weekdayIndex } from '@/lib/date';
import { allExercises } from '@/lib/exercises';
import { averageRecovery, computeRecovery } from '@/lib/recovery';
import type { MuscleGroupId, Profile, SplitId, WorkoutLog } from '@/types';

export type SuggestionKind = 'train' | 'rest' | 'done' | 'rested';

/** Why today's plan was chosen; turned into text by `reasonText`. */
export type Reason =
  | { key: 'reason.done' | 'reason.rested' | 'reason.recovering' }
  | { key: 'reason.manyDays'; days: number }
  | { key: 'reason.scheduledRest'; weekday: number }
  | { key: 'reason.next'; splitId: SplitId }
  | { key: 'reason.switched'; sore: MuscleGroupId[]; day: string };

export interface Suggestion {
  kind: SuggestionKind;
  day: SplitDay & { index: number };
  exerciseIds: string[];
  reason: Reason;
  readiness: number;
}

const SMALL_GROUPS: MuscleGroupId[] = ['abs', 'calves', 'forearms', 'biceps', 'triceps'];

/** Deterministic pseudo-random so today's plan doesn't reshuffle on every render. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function buildExerciseList(
  groups: MuscleGroupId[],
  profile: Profile,
  workouts: WorkoutLog[],
  seed: string,
): string[] {
  const allowed = new Set<string>([...profile.equipment, 'bodyweight']);
  const lastUsed = new Set(workouts.slice(-3).flatMap((w) => w.exercises.map((e) => e.exerciseId)));
  const rand = seeded(seed);

  // Big muscles get 2 exercises while the session is short; small ones get 1.
  const counts = groups.map((g) => (SMALL_GROUPS.includes(g) || groups.length > 4 ? 1 : 2));
  let total = counts.reduce((a, b) => a + b, 0);
  for (let i = 0; total < 5 && i < groups.length; i++) {
    if (!SMALL_GROUPS.includes(groups[i])) {
      counts[i]++;
      total++;
    }
  }

  const picked: string[] = [];
  groups.forEach((g, i) => {
    const pool = allExercises().filter((e) => e.group === g && allowed.has(e.equipment) && e.level !== 'expert')
      .map((e) => ({
        e,
        score: (e.mechanic === 'compound' ? 2 : 0) + (lastUsed.has(e.id) ? -1.5 : 0) + rand() * 1.6,
      }))
      .sort((a, b) => b.score - a.score);
    for (const { e } of pool.slice(0, counts[i])) picked.push(e.id);
  });
  return picked;
}

export function suggestToday(profile: Profile, workouts: WorkoutLog[], restDays: string[], now = Date.now()): Suggestion {
  const split = SPLIT_BY_ID[profile.splitId];
  const today = dayKey(now);
  const rec = computeRecovery(workouts, now);

  const last = [...workouts].reverse().find((w) => w.splitDayIndex !== null);
  const plannedIndex =
    last && last.splitDayIndex !== null && split.days[last.splitDayIndex]?.label === last.focus
      ? (last.splitDayIndex + 1) % split.days.length
      : 0;

  const withIndex = (index: number) => ({ ...split.days[index], index });
  const plan = (index: number) =>
    buildExerciseList(split.days[index].groups, profile, workouts, `${today}:${profile.splitId}:${index}`);

  const doneToday = workouts.find((w) => dayKey(w.startedAt) === today);
  if (doneToday) {
    // The log may come from a different split (changed since), so only trust a matching day.
    const logged = doneToday.splitDayIndex;
    const idx = logged !== null && split.days[logged]?.label === doneToday.focus ? logged : plannedIndex;
    return { kind: 'done', day: withIndex(idx), exerciseIds: [], reason: { key: 'reason.done' }, readiness: 1 };
  }
  if (restDays.includes(today)) {
    return { kind: 'rested', day: withIndex(plannedIndex), exerciseIds: plan(plannedIndex), reason: { key: 'reason.rested' }, readiness: 1 };
  }

  // A rest day in your weekly schedule.
  const weekday = weekdayIndex(now);
  if (!profile.trainingDays.includes(weekday)) {
    return {
      kind: 'rest',
      day: withIndex(plannedIndex),
      exerciseIds: plan(plannedIndex),
      reason: { key: 'reason.scheduledRest', weekday },
      readiness: averageRecovery(rec, split.days[plannedIndex].groups),
    };
  }

  // Three training days in a row → recommend recovery.
  const trainedDays = new Set(workouts.map((w) => dayKey(w.startedAt)));
  // With a weekly schedule the rest days are already planned, so this rule only applies to "every day".
  const maxStreak = split.maxStreak ?? 3;
  const streakOfTraining =
    profile.trainingDays.length === 7 &&
    Array.from({ length: maxStreak }, (_, i) => i + 1).every((n) => trainedDays.has(dayKey(addDays(now, -n))));

  const plannedReady = averageRecovery(rec, split.days[plannedIndex].groups);
  if (plannedReady >= 0.8 && !streakOfTraining) {
    return {
      kind: 'train',
      day: withIndex(plannedIndex),
      exerciseIds: plan(plannedIndex),
      reason: { key: 'reason.next', splitId: split.id },
      readiness: plannedReady,
    };
  }

  // Planned muscles still sore — find the most recovered day in the split.
  const ranked = split.days
    .map((d, i) => ({ i, r: averageRecovery(rec, d.groups) }))
    .sort((a, b) => b.r - a.r);
  const best = ranked[0];

  if (!streakOfTraining && best.r >= 0.7 && best.i !== plannedIndex) {
    const sore = split.days[plannedIndex].groups.filter((g) => rec[g] < 0.8);
    return {
      kind: 'train',
      day: withIndex(best.i),
      exerciseIds: plan(best.i),
      reason: { key: 'reason.switched', sore: sore.slice(0, 2), day: split.days[best.i].label },
      readiness: best.r,
    };
  }

  return {
    kind: 'rest',
    day: withIndex(plannedIndex),
    exerciseIds: plan(plannedIndex),
    reason: streakOfTraining ? { key: 'reason.manyDays', days: maxStreak } : { key: 'reason.recovering' },
    readiness: plannedReady,
  };
}
