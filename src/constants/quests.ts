import type { Profile, WorkoutLog } from '@/types';

export interface QuestContext {
  /** Workouts in the quest's period (today for daily quests, this week for weekly ones). */
  workouts: WorkoutLog[];
  profile: Profile;
}

export interface Quest {
  id: string;
  scope: 'day' | 'week';
  title: string;
  target: number;
  xp: number;
  icon: { ios: string; android: string };
  progress: (c: QuestContext) => number;
  /** Hide quests the user can't complete with their equipment. */
  available?: (p: Profile) => boolean;
}

const sum = (ws: WorkoutLog[], fn: (w: WorkoutLog) => number) => ws.reduce((n, w) => n + fn(w), 0);
const reps = (w: WorkoutLog) => w.exercises.reduce((n, e) => n + e.sets.reduce((r, s) => r + (s.reps ?? 0), 0), 0);

export const DAILY_QUESTS: Quest[] = [
  {
    id: 'sets_15',
    scope: 'day',
    title: 'Complete 15 sets',
    target: 15,
    xp: 25,
    icon: { ios: 'checkmark.circle', android: 'task_alt' },
    progress: (c) => sum(c.workouts, (w) => w.setsDone),
  },
  {
    id: 'reps_150',
    scope: 'day',
    title: 'Do 150 reps',
    target: 150,
    xp: 25,
    icon: { ios: 'repeat', android: 'repeat' },
    progress: (c) => sum(c.workouts, reps),
  },
  {
    id: 'volume_3000',
    scope: 'day',
    title: 'Lift 3,000 kg in total',
    target: 3000,
    xp: 30,
    icon: { ios: 'scalemass', android: 'fitness_center' },
    progress: (c) => sum(c.workouts, (w) => w.volume),
    available: (p) => p.equipment.some((e) => e !== 'bodyweight' && e !== 'band'),
  },
  {
    id: 'exercises_5',
    scope: 'day',
    title: 'Train 5 different exercises',
    target: 5,
    xp: 20,
    icon: { ios: 'list.bullet', android: 'list' },
    progress: (c) => new Set(c.workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId))).size,
  },
  {
    id: 'follow_plan',
    scope: 'day',
    title: "Follow today's plan",
    target: 1,
    xp: 20,
    icon: { ios: 'map', android: 'map' },
    progress: (c) => c.workouts.filter((w) => w.fromPlan).length,
  },
  {
    id: 'pr',
    scope: 'day',
    title: 'Set a personal record',
    target: 1,
    xp: 40,
    icon: { ios: 'trophy', android: 'emoji_events' },
    progress: (c) => sum(c.workouts, (w) => w.prs.length),
  },
  {
    id: 'before_noon',
    scope: 'day',
    title: 'Finish a workout before noon',
    target: 1,
    xp: 15,
    icon: { ios: 'sun.max', android: 'light_mode' },
    progress: (c) => c.workouts.filter((w) => new Date(w.endedAt).getHours() < 12).length,
  },
];

const LEGS = ['quads', 'hamstrings', 'glutes'];

export const WEEKLY_QUESTS: Quest[] = [
  {
    id: 'legs_week',
    scope: 'week',
    title: 'Train legs this week',
    target: 1,
    xp: 40,
    icon: { ios: 'figure.walk', android: 'directions_walk' },
    progress: (c) => c.workouts.filter((w) => w.groups.some((g) => LEGS.includes(g))).length,
  },
  {
    id: 'workouts_4',
    scope: 'week',
    title: 'Complete 4 workouts this week',
    target: 4,
    xp: 40,
    icon: { ios: 'calendar', android: 'calendar_month' },
    progress: (c) => c.workouts.length,
  },
  {
    id: 'groups_8',
    scope: 'week',
    title: 'Hit 8 muscle groups this week',
    target: 8,
    xp: 40,
    icon: { ios: 'figure.stand', android: 'accessibility_new' },
    progress: (c) => new Set(c.workouts.flatMap((w) => w.groups)).size,
  },
];

export const DAILY_QUEST_COUNT = 3;
