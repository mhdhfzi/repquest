import { MUSCLE_GROUPS } from '@/constants/muscles';
import { hasKey, type TFn } from '@/i18n';
import { weekdayLong } from '@/lib/date';
import type { Reason } from '@/lib/suggestion';
import type { MuscleGroupId, SplitId } from '@/types';

/** Display helpers for data that is stored in English (so old logs and backups stay stable). */

export const muscleLabel = (t: TFn, id: MuscleGroupId) => t(`muscle.${id}`);

export function equipLabel(t: TFn, equipment: string): string {
  const key = `equip.${equipment}`;
  return hasKey(key) ? t(key) : equipment;
}

export const splitName = (t: TFn, id: SplitId) => t(`split.${id}.name`);
export const splitBlurb = (t: TFn, id: SplitId) => t(`split.${id}.blurb`);

/** Workout focus: a split day label ("Push") or a muscle group label ("Chest"). */
export function focusLabel(t: TFn, focus: string): string {
  const key = `focus.${focus}`;
  if (hasKey(key)) return t(key);
  const group = MUSCLE_GROUPS.find((g) => g.label === focus);
  return group ? t(`muscle.${group.id}`) : focus;
}

export function titleLabel(t: TFn, name: string): string {
  const key = `title.${name}`;
  return hasKey(key) ? t(key) : name;
}

/** Muscle names from the exercise database, e.g. "middle back". */
export function sourceMuscleLabel(t: TFn, name: string): string {
  const key = `src.${name}`;
  return hasKey(key) ? t(key) : name;
}

export function tagLabel(t: TFn, kind: 'level' | 'mechanic', value: string): string {
  const key = `${kind}.${value}`;
  return hasKey(key) ? t(key) : value;
}

/** Human text for why today's plan was picked. */
export function reasonText(t: TFn, reason: Reason): string {
  switch (reason.key) {
    case 'reason.next':
      return t('reason.next', { split: splitName(t, reason.splitId) });
    case 'reason.scheduledRest':
      return t('reason.scheduledRest', { day: weekdayLong(reason.weekday) });
    case 'reason.manyDays':
      return t('reason.manyDays', { n: reason.days });
    case 'reason.switched':
      return t('reason.switched', {
        sore: reason.sore.map((g) => muscleLabel(t, g).toLowerCase()).join(t('reason.and')),
        day: focusLabel(t, reason.day),
      });
    default:
      return t(reason.key);
  }
}
