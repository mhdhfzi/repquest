import type { WorkoutLog } from '@/types';

export interface Title {
  level: number;
  name: string;
}

export const TITLES: Title[] = [
  { level: 1, name: 'Couch Potato' },
  { level: 3, name: 'Rookie Lifter' },
  { level: 5, name: 'Gym Regular' },
  { level: 8, name: 'Iron Apprentice' },
  { level: 12, name: 'Rep Machine' },
  { level: 16, name: 'Steel Warrior' },
  { level: 20, name: 'Muscle Knight' },
  { level: 25, name: 'Iron Champion' },
  { level: 30, name: 'Titan' },
  { level: 40, name: 'Legend' },
  { level: 50, name: 'Mythic' },
];

export const XP = {
  perSet: 5,
  maxRewardedSets: 30,
  workoutComplete: 50,
  shortWorkout: 20,
  followedPlan: 20,
  personalRecord: 30,
  perStreakDay: 5,
  maxStreakBonus: 100,
  restDay: 10,
} as const;

/** One streak-freeze token per 7 streak days, holding at most 2. */
export const FREEZE = { every: 7, max: 2 } as const;

export interface AchievementContext {
  workouts: WorkoutLog[];
  streak: number;
  prCount: number;
  latest?: WorkoutLog;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: { ios: string; android: string };
  xp: number;
  test: (c: AchievementContext) => boolean;
}

const startOfWeek = (t: number) => {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_rep',
    name: 'First Rep',
    description: 'Finish your first workout',
    icon: { ios: 'flag.checkered', android: 'flag' },
    xp: 25,
    test: (c) => c.workouts.length >= 1,
  },
  {
    id: 'streak_3',
    name: 'Warming Up',
    description: 'Reach a 3-day streak',
    icon: { ios: 'flame', android: 'local_fire_department' },
    xp: 30,
    test: (c) => c.streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: { ios: 'flame.fill', android: 'whatshot' },
    xp: 75,
    test: (c) => c.streak >= 7,
  },
  {
    id: 'balanced',
    name: 'Balanced Build',
    description: 'Train every muscle group in one week',
    icon: { ios: 'figure.strengthtraining.traditional', android: 'accessibility_new' },
    xp: 100,
    test: (c) => {
      const since = startOfWeek(Date.now());
      const hit = new Set(c.workouts.filter((w) => w.startedAt >= since).flatMap((w) => w.groups));
      return hit.size >= 11;
    },
  },
  {
    id: 'leg_day',
    name: 'Leg Day Survivor',
    description: 'Complete 10 workouts that train legs',
    icon: { ios: 'figure.walk', android: 'directions_walk' },
    xp: 80,
    test: (c) => c.workouts.filter((w) => w.groups.includes('quads') || w.groups.includes('hamstrings')).length >= 10,
  },
  {
    id: 'pr_hunter',
    name: 'PR Hunter',
    description: 'Set 10 personal records',
    icon: { ios: 'trophy', android: 'emoji_events' },
    xp: 80,
    test: (c) => c.prCount >= 10,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Finish 5 workouts before 8 AM',
    icon: { ios: 'sunrise', android: 'wb_twilight' },
    xp: 50,
    test: (c) => c.workouts.filter((w) => new Date(w.startedAt).getHours() < 8).length >= 5,
  },
  {
    id: 'tonne',
    name: 'Tonne Club',
    description: 'Lift 1,000 kg total in one workout',
    icon: { ios: 'scalemass', android: 'fitness_center' },
    xp: 60,
    test: (c) => c.workouts.some((w) => w.volume >= 1000),
  },
  {
    id: 'ten',
    name: 'Habit Formed',
    description: 'Complete 10 workouts',
    icon: { ios: 'checkmark.seal', android: 'verified' },
    xp: 60,
    test: (c) => c.workouts.length >= 10,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Complete 100 workouts',
    icon: { ios: 'crown', android: 'workspace_premium' },
    xp: 300,
    test: (c) => c.workouts.length >= 100,
  },
];
