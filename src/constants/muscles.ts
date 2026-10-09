import type { Slug } from 'react-native-body-highlighter';

import type { MuscleGroupId } from '@/types';

export interface MuscleGroupMeta {
  id: MuscleGroupId;
  label: string;
  /** Body-map regions that light up for this group. */
  slugs: Slug[];
  /** Which side of the body map shows it best. */
  side: 'front' | 'back';
  /** Rough hours to full recovery after a solid session. */
  recoveryHours: number;
}

export const MUSCLE_GROUPS: MuscleGroupMeta[] = [
  { id: 'chest', label: 'Chest', slugs: ['chest'], side: 'front', recoveryHours: 60 },
  { id: 'back', label: 'Back', slugs: ['upper-back', 'lower-back', 'trapezius'], side: 'back', recoveryHours: 60 },
  { id: 'shoulders', label: 'Shoulders', slugs: ['deltoids'], side: 'front', recoveryHours: 48 },
  { id: 'biceps', label: 'Biceps', slugs: ['biceps'], side: 'front', recoveryHours: 40 },
  { id: 'triceps', label: 'Triceps', slugs: ['triceps'], side: 'back', recoveryHours: 40 },
  { id: 'forearms', label: 'Forearms', slugs: ['forearm'], side: 'front', recoveryHours: 32 },
  { id: 'abs', label: 'Abs', slugs: ['abs', 'obliques'], side: 'front', recoveryHours: 32 },
  { id: 'glutes', label: 'Glutes', slugs: ['gluteal'], side: 'back', recoveryHours: 60 },
  { id: 'quads', label: 'Quads', slugs: ['quadriceps', 'adductors'], side: 'front', recoveryHours: 60 },
  { id: 'hamstrings', label: 'Hamstrings', slugs: ['hamstring'], side: 'back', recoveryHours: 60 },
  { id: 'calves', label: 'Calves', slugs: ['calves'], side: 'back', recoveryHours: 36 },
];

export const GROUP_BY_ID = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.id, g])) as Record<
  MuscleGroupId,
  MuscleGroupMeta
>;

/** Maps source-database muscle names to body-map regions. */
export const SOURCE_TO_SLUGS: Record<string, Slug[]> = {
  abdominals: ['abs', 'obliques'],
  abductors: ['gluteal'],
  adductors: ['adductors'],
  biceps: ['biceps'],
  calves: ['calves'],
  chest: ['chest'],
  forearms: ['forearm'],
  glutes: ['gluteal'],
  hamstrings: ['hamstring'],
  lats: ['upper-back'],
  'lower back': ['lower-back'],
  'middle back': ['upper-back'],
  neck: ['neck'],
  quadriceps: ['quadriceps'],
  shoulders: ['deltoids'],
  traps: ['trapezius'],
  triceps: ['triceps'],
};

/** Maps source-database muscle names to the app's muscle groups (for recovery tracking). */
export const SOURCE_TO_GROUP: Record<string, MuscleGroupId | undefined> = {
  abdominals: 'abs',
  abductors: 'glutes',
  adductors: 'quads',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'back',
  'lower back': 'back',
  'middle back': 'back',
  quadriceps: 'quads',
  shoulders: 'shoulders',
  traps: 'back',
  triceps: 'triceps',
};

const SLUG_TO_GROUP: Partial<Record<Slug, MuscleGroupId>> = {};
for (const g of MUSCLE_GROUPS) for (const s of g.slugs) SLUG_TO_GROUP[s] = g.id;
export { SLUG_TO_GROUP };

export const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  cable: 'Cable',
  machine: 'Machine',
  band: 'Band',
  other: 'Other',
};

export const ALL_EQUIPMENT = ['bodyweight', 'dumbbell', 'barbell', 'kettlebell', 'cable', 'machine', 'band'] as const;
