import type { ExtendedBodyPart } from 'react-native-body-highlighter';

import { GROUP_BY_ID, SOURCE_TO_GROUP, SOURCE_TO_SLUGS } from '@/constants/muscles';
import { EXERCISES } from '@/data/exercises';
import type { Exercise, MuscleGroupId } from '@/types';

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Custom exercises live in the store; it registers them here so plain lookups find them too.
let customList: Exercise[] = [];
let customById: Record<string, Exercise> = {};

export function registerCustomExercises(list: Exercise[]) {
  customList = list;
  customById = Object.fromEntries(list.map((e) => [e.id, e]));
}

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_BY_ID[id] ?? customById[id];
}

/** Built-in exercises plus your own (deleted ones excluded). Yours come first. */
export function allExercises(): Exercise[] {
  return [...customList.filter((e) => !e.archived), ...EXERCISES];
}

/** Source-database muscle names for each group, so custom exercises light up the body map. */
export const GROUP_TO_SOURCE: Record<MuscleGroupId, string[]> = {
  chest: ['chest'],
  back: ['lats', 'middle back'],
  shoulders: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  abs: ['abdominals'],
  glutes: ['glutes'],
  quads: ['quadriceps'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
};

/** Two frames (start / end position) used for the looping preview. */
export function exerciseFrames(id: string): [string, string] {
  return [`${IMAGE_BASE}/${id}/0.jpg`, `${IMAGE_BASE}/${id}/1.jpg`];
}

/** Body-map data: primary muscles at intensity 2, secondary at 1. */
export function bodyDataForExercise(e: Exercise): ExtendedBodyPart[] {
  const parts = new Map<string, number>();
  for (const m of e.secondary) for (const s of SOURCE_TO_SLUGS[m] ?? []) parts.set(s, 1);
  for (const m of e.primary) for (const s of SOURCE_TO_SLUGS[m] ?? []) parts.set(s, 2);
  return [...parts].map(([slug, intensity]) => ({ slug: slug as ExtendedBodyPart['slug'], intensity }));
}

export function bodyDataForGroups(groups: MuscleGroupId[]): ExtendedBodyPart[] {
  return groups.flatMap((g) => GROUP_BY_ID[g].slugs.map((slug) => ({ slug, intensity: 2 })));
}

/** Every muscle group an exercise works, with weight 1 for primary and 0.5 for secondary. */
export function groupsWorked(e: Exercise): Partial<Record<MuscleGroupId, number>> {
  const out: Partial<Record<MuscleGroupId, number>> = { [e.group]: 1 };
  for (const m of e.primary) {
    const g = SOURCE_TO_GROUP[m];
    if (g) out[g] = 1;
  }
  for (const m of e.secondary) {
    const g = SOURCE_TO_GROUP[m];
    if (g && !out[g]) out[g] = 0.5;
  }
  return out;
}

export function isBodyweight(e: Exercise): boolean {
  return e.equipment === 'bodyweight' || e.equipment === 'band' || e.equipment === 'other';
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
