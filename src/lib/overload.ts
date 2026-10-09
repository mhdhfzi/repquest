import type { TFn } from '@/i18n';
import type { Exercise, SetEntry } from '@/types';

const fmt = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Progressive-overload hint from last session's sets, e.g.
 * "Last 3×10 @ 20 kg — try 22.5 kg, or 11 reps".
 */
export function overloadHint(prev: SetEntry[], ex: Exercise, t: TFn): string | null {
  const sets = prev.filter((s) => (s.reps ?? 0) > 0);
  if (!sets.length) return null;

  const top = Math.max(...sets.map((s) => s.weight ?? 0));
  const atTop = sets.filter((s) => (s.weight ?? 0) === top);
  const reps = Math.min(...atTop.map((s) => s.reps ?? 0));
  const shape = `${atTop.length}×${reps}`;

  if (top <= 0) return t('hint.bodyweight', { shape, reps: reps + 1 });

  const step = ex.equipment === 'dumbbell' || ex.equipment === 'kettlebell' ? 2 : 2.5;
  const vars = { shape, w: fmt(top), next: fmt(top + step), reps: reps + 1 };
  // High reps → load is the better lever; low reps → adding a rep is just as good.
  return reps >= 12 ? t('hint.weight', vars) : t('hint.weightOrReps', vars);
}
