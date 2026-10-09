import type { MuscleGroupId, SplitId } from '@/types';

export interface SplitDay {
  label: string;
  groups: MuscleGroupId[];
}

export interface Split {
  id: SplitId;
  name: string;
  blurb: string;
  days: SplitDay[];
  /** Training days in a row before a rest day is suggested (default 3). */
  maxStreak?: number;
}

export const SPLITS: Split[] = [
  {
    id: 'ppl',
    name: 'Push · Pull · Legs',
    blurb: 'Balanced and flexible. Great for 3–6 days a week.',
    days: [
      { label: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
      { label: 'Pull', groups: ['back', 'biceps', 'forearms'] },
      { label: 'Legs', groups: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
    ],
  },
  {
    id: 'upper_lower',
    name: 'Upper · Lower',
    blurb: 'Hit everything twice a week in 4 sessions.',
    days: [
      { label: 'Upper', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { label: 'Lower', groups: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
    ],
  },
  {
    id: 'fullbody',
    name: 'Full Body',
    blurb: 'Best for beginners or 2–3 days a week.',
    days: [
      { label: 'Full Body A', groups: ['chest', 'back', 'quads', 'abs'] },
      { label: 'Full Body B', groups: ['shoulders', 'hamstrings', 'glutes', 'biceps', 'triceps'] },
    ],
  },
  {
    id: 'bro',
    name: 'Body Part Split',
    blurb: 'One focus per day, 5 days a week.',
    days: [
      { label: 'Chest', groups: ['chest', 'abs'] },
      { label: 'Back', groups: ['back', 'forearms'] },
      { label: 'Shoulders', groups: ['shoulders', 'abs'] },
      { label: 'Arms', groups: ['biceps', 'triceps', 'forearms'] },
      { label: 'Legs', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  {
    id: 'two_muscle',
    name: 'Two Muscles a Day',
    blurb: '5 days a week, two muscle groups per session.',
    // Each day hits different muscles, so five in a row still leaves time to recover.
    maxStreak: 5,
    days: [
      { label: 'Chest & Triceps', groups: ['chest', 'triceps'] },
      { label: 'Back & Biceps', groups: ['back', 'biceps'] },
      { label: 'Quads & Hamstrings', groups: ['quads', 'hamstrings'] },
      { label: 'Shoulders & Abs', groups: ['shoulders', 'abs'] },
      { label: 'Glutes & Calves', groups: ['glutes', 'calves'] },
    ],
  },
];

export const SPLIT_BY_ID = Object.fromEntries(SPLITS.map((s) => [s.id, s])) as Record<SplitId, Split>;
