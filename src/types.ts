import type { TKey } from '@/i18n/en';
import type { LangPref, Vars } from '@/i18n/types';

export type MuscleGroupId =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

/** Muscle names as they appear in the source exercise database. */
export type SourceMuscle =
  | 'abdominals'
  | 'abductors'
  | 'adductors'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'forearms'
  | 'glutes'
  | 'hamstrings'
  | 'lats'
  | 'lower back'
  | 'middle back'
  | 'neck'
  | 'quadriceps'
  | 'shoulders'
  | 'traps'
  | 'triceps';

export type Equipment =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'band'
  | 'other';

export type Level = 'beginner' | 'intermediate' | 'expert';

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroupId;
  primary: string[];
  secondary: string[];
  equipment: Equipment | string;
  level: Level | string;
  mechanic: 'compound' | 'isolation' | string;
  instructions: string[];
  /** Made by the user (ids start with "custom-"). */
  custom?: boolean;
  /** Custom exercise photo in the app's document directory. */
  photoUri?: string | null;
  /** Deleted by the user: hidden everywhere, but kept so old workouts still show its name. */
  archived?: boolean;
}

export interface SetEntry {
  id: string;
  weight: number | null;
  reps: number | null;
  done: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface ActiveWorkout {
  id: string;
  startedAt: number;
  focus: string;
  groups: MuscleGroupId[];
  splitDayIndex: number | null;
  fromSuggestion: boolean;
  exercises: WorkoutExercise[];
}

export interface WorkoutLog {
  id: string;
  startedAt: number;
  endedAt: number;
  focus: string;
  groups: MuscleGroupId[];
  splitDayIndex: number | null;
  exercises: WorkoutExercise[];
  volume: number;
  setsDone: number;
  xp: number;
  prs: string[];
  /** Started from today's suggested focus. Missing on logs saved before quests existed. */
  fromPlan?: boolean;
}

export interface PersonalRecord {
  weight: number;
  reps: number;
  e1rm: number;
  date: number;
}

export type SplitId = 'fullbody' | 'upper_lower' | 'ppl' | 'bro' | 'two_muscle';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  /** 0 = Monday … 6 = Sunday. */
  days: number[];
  streakWarning: boolean;
}

export interface Profile {
  name: string;
  splitId: SplitId;
  equipment: Equipment[];
  restSeconds: number;
  onboarded: boolean;
  createdAt: number;
  language: LangPref;
  reminder: ReminderSettings;
  /** Profile photo in the app's document directory (not included in backups). */
  avatarUri: string | null;
  /** Weekdays you train, Monday = 0 … Sunday = 6. The rest are scheduled rest days. */
  trainingDays: number[];
}

export interface BodyStat {
  id: string;
  date: number;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  /** Local file in the app's document directory (not included in backups). */
  photoUri: string | null;
}

/** One line of the XP breakdown, translated when shown. */
export interface XpLine {
  key: TKey;
  vars?: Vars;
  amount: number;
}

export interface WorkoutResult {
  log: WorkoutLog;
  breakdown: XpLine[];
  xpBefore: number;
  xpAfter: number;
  newAchievements: string[];
  completedQuests: string[];
  freezeEarned: boolean;
}
