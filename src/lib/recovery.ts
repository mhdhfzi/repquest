import { GROUP_BY_ID, MUSCLE_GROUPS } from '@/constants/muscles';
import { getExercise, groupsWorked } from '@/lib/exercises';
import type { MuscleGroupId, WorkoutLog } from '@/types';

const HOUR = 60 * 60 * 1000;

/**
 * Recovery per muscle group, 0 (just trained) → 1 (fully recovered).
 * Secondary involvement counts as half a session, so it recovers twice as fast.
 */
export function computeRecovery(workouts: WorkoutLog[], now = Date.now()): Record<MuscleGroupId, number> {
  const out = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.id, 1])) as Record<MuscleGroupId, number>;
  const recent = workouts.filter((w) => now - w.endedAt < 5 * 24 * HOUR);

  for (const w of recent) {
    const hit: Partial<Record<MuscleGroupId, number>> = {};
    for (const we of w.exercises) {
      if (!we.sets.some((s) => s.done)) continue;
      const ex = getExercise(we.exerciseId);
      if (!ex) continue;
      for (const [g, weight] of Object.entries(groupsWorked(ex)) as [MuscleGroupId, number][]) {
        hit[g] = Math.max(hit[g] ?? 0, weight);
      }
    }
    for (const [g, weight] of Object.entries(hit) as [MuscleGroupId, number][]) {
      const needed = GROUP_BY_ID[g].recoveryHours * HOUR * weight;
      const frac = Math.min(1, Math.max(0, (now - w.endedAt) / needed));
      out[g] = Math.min(out[g], frac);
    }
  }
  return out;
}

export function averageRecovery(rec: Record<MuscleGroupId, number>, groups: MuscleGroupId[]): number {
  if (!groups.length) return 1;
  return groups.reduce((a, g) => a + rec[g], 0) / groups.length;
}

/** Body-map colour bucket for a recovery value. */
export function recoveryIntensity(r: number): number {
  if (r < 0.4) return 1; // fatigued
  if (r < 0.8) return 2; // recovering
  return 3; // ready
}
