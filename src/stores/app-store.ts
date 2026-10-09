import { AppState as RNAppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ACHIEVEMENTS, FREEZE, XP } from '@/constants/progression';
import { dayKey, uid } from '@/lib/date';
import { getExercise, registerCustomExercises } from '@/lib/exercises';
import { activeDayKeys, computeStreak, estimate1RM, missedDays } from '@/lib/progression';
import { questStatus } from '@/lib/quests';
import { appStorage } from '@/lib/storage';
import type {
  ActiveWorkout,
  BodyStat,
  Exercise,
  MuscleGroupId,
  PersonalRecord,
  Profile,
  SetEntry,
  WorkoutExercise,
  WorkoutLog,
  WorkoutResult,
  XpLine,
} from '@/types';

export interface SyncMeta {
  /** Account this phone's data was last synced with. */
  ownerId?: string;
  /** Server time of the cloud copy we last matched. */
  cloudSyncedAt?: number;
  /** Phone time of that sync. */
  localSyncedAt?: number;
  /** Phone time of the latest change to synced data. */
  localChangedAt?: number;
}

interface StartOptions {
  focus: string;
  groups: MuscleGroupId[];
  exerciseIds: string[];
  splitDayIndex?: number | null;
  fromSuggestion?: boolean;
}

interface AppState {
  hydrated: boolean;
  profile: Profile;
  workouts: WorkoutLog[];
  restDays: string[];
  frozenDays: string[];
  freezeTokens: number;
  /** Quest key → time claimed, so each quest pays out once per period. */
  questsClaimed: Record<string, number>;
  xpTotal: number;
  prs: Record<string, PersonalRecord>;
  prCount: number;
  achievements: Record<string, number>;
  favorites: string[];
  /** Your own exercise list per split day, keyed by `planKey`. Absent = use the suggestion. */
  customPlans: Record<string, string[]>;
  customExercises: Exercise[];
  /** Chose "Use without an account" on the login page. */
  guest: boolean;
  /** Bookkeeping for cloud sync (never synced or backed up itself). */
  syncMeta: SyncMeta;
  bodyStats: BodyStat[];
  active: ActiveWorkout | null;
  lastResult: WorkoutResult | null;

  completeOnboarding: (p: Partial<Profile>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  toggleFavorite: (id: string) => void;
  /** Save a custom exercise list for a split day, or `null` to go back to the suggestion. */
  setCustomPlan: (key: string, exerciseIds: string[] | null) => void;
  setGuest: (guest: boolean) => void;
  /** Replace synced data with the account's copy, keeping this phone's photos and running workout. */
  applyCloud: (data: PersistedData) => void;
  /**
   * Record a finished sync for `ownerId`. `cloudAt` is the server's timestamp for that copy;
   * `localAt` is when this phone's data was captured, so edits made mid-upload still count as unsynced.
   */
  markSynced: (ownerId: string, cloudAt: number, localAt: number) => void;
  /** Create or update one of your own exercises. */
  saveCustomExercise: (exercise: Exercise) => void;
  /** Hide a custom exercise and take it out of plans and favourites; history keeps its name. */
  deleteCustomExercise: (id: string) => void;

  startWorkout: (o: StartOptions) => void;
  addExercise: (id: string) => void;
  removeExercise: (index: number) => void;
  addSet: (exIndex: number) => void;
  removeSet: (exIndex: number, setId: string) => void;
  updateSet: (exIndex: number, setId: string, patch: Partial<SetEntry>) => void;
  /** Tick every unticked set that has a weight and reps entered. */
  completeEnteredSets: () => void;
  discardWorkout: () => void;
  finishWorkout: () => WorkoutResult | null;

  addBodyStat: (entry: Omit<BodyStat, 'id'>) => void;
  deleteBodyStat: (id: string) => void;
  /** Replace all data with a validated backup. */
  restoreBackup: (data: PersistedData) => void;

  logRestDay: () => number;
  /** Spend freeze tokens to cover missed days, if there are enough to save the streak. */
  applyStreakFreezes: () => void;
  resetAll: () => void;
}


const DEFAULT_PROFILE: Profile = {
  name: '',
  splitId: 'ppl',
  equipment: ['bodyweight', 'dumbbell'],
  restSeconds: 90,
  onboarded: false,
  createdAt: 0,
  language: 'system',
  reminder: { enabled: false, hour: 18, minute: 0, days: [0, 2, 4], streakWarning: true },
  avatarUri: null,
  trainingDays: [0, 1, 2, 3, 4, 5, 6],
};

const INITIAL = {
  profile: DEFAULT_PROFILE,
  workouts: [] as WorkoutLog[],
  restDays: [] as string[],
  frozenDays: [] as string[],
  freezeTokens: 0,
  questsClaimed: {} as Record<string, number>,
  xpTotal: 0,
  prs: {} as Record<string, PersonalRecord>,
  prCount: 0,
  achievements: {} as Record<string, number>,
  favorites: [] as string[],
  customPlans: {} as Record<string, string[]>,
  customExercises: [] as Exercise[],
  guest: false,
  syncMeta: {} as SyncMeta,
  bodyStats: [] as BodyStat[],
  active: null as ActiveWorkout | null,
  lastResult: null as WorkoutResult | null,
};

/** Identifies one day of one split, e.g. "ppl:0" for Push. */
export const planKey = (splitId: string, dayIndex: number) => `${splitId}:${dayIndex}`;

// Saved on the phone but not part of your training data (not backed up or synced).
const DEVICE_ONLY = ['active', 'lastResult', 'guest', 'syncMeta'] as const;

/** Your training data: what backups contain and what cloud sync uploads. */
export type PersistedData = Omit<typeof INITIAL, (typeof DEVICE_ONLY)[number]>;
export const BACKUP_KEYS = Object.keys(INITIAL).filter(
  (k) => !(DEVICE_ONLY as readonly string[]).includes(k),
) as (keyof PersistedData)[];

/** Pre-fill sets from the last time this exercise was logged, so you know what to beat. */
function seedSets(exerciseId: string, workouts: WorkoutLog[]): SetEntry[] {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const prev = workouts[i].exercises.find((e) => e.exerciseId === exerciseId);
    const done = prev?.sets.filter((s) => s.done);
    if (done?.length) return done.map((s) => ({ id: uid(), weight: s.weight, reps: s.reps, done: false }));
  }
  const ex = getExercise(exerciseId);
  const reps = ex?.group === 'abs' || ex?.group === 'calves' ? 15 : 10;
  return Array.from({ length: 3 }, () => ({ id: uid(), weight: null, reps, done: false }));
}

function mapExercise(state: AppState, exIndex: number, fn: (e: WorkoutExercise) => WorkoutExercise) {
  if (!state.active) return {};
  const exercises = state.active.exercises.map((e, i) => (i === exIndex ? fn(e) : e));
  return { active: { ...state.active, exercises } };
}

function newAchievements(
  state: Pick<AppState, 'achievements' | 'prCount'>,
  workouts: WorkoutLog[],
  streak: number,
): string[] {
  return ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.test({ workouts, streak, prCount: state.prCount })).map(
    (a) => a.id,
  );
}

const streakDays = (s: Pick<AppState, 'restDays' | 'frozenDays'>, workouts: WorkoutLog[]) =>
  activeDayKeys(
    workouts.map((w) => w.startedAt),
    s.restDays,
    s.frozenDays,
  );

/** A token is earned on each 7th streak day, the first time that day becomes active. */
function earnsFreeze(streak: number, tokens: number, firstToday: boolean) {
  return firstToday && streak > 0 && streak % FREEZE.every === 0 && tokens < FREEZE.max;
}

const QUEST_KEEP_MS = 14 * 24 * 60 * 60 * 1000;

/** Award quests that just became complete, dropping old claims so storage stays small. */
function claimQuests(s: AppState, workouts: WorkoutLog[], now: number) {
  const claimed = Object.fromEntries(Object.entries(s.questsClaimed).filter(([, t]) => now - t < QUEST_KEEP_MS));
  const lines: XpLine[] = [];
  const ids: string[] = [];
  for (const q of questStatus(s.profile, workouts, now)) {
    if (!q.done || claimed[q.key]) continue;
    claimed[q.key] = now;
    lines.push({ key: 'xp.quest', vars: { id: q.quest.id }, amount: q.quest.xp });
    ids.push(q.quest.id);
  }
  return { claimed, lines, ids };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...INITIAL,

      completeOnboarding: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p, onboarded: true, createdAt: Date.now() } })),
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setCustomPlan: (key, exerciseIds) =>
        set((s) => {
          const customPlans = { ...s.customPlans };
          if (exerciseIds) customPlans[key] = exerciseIds;
          else delete customPlans[key];
          return { customPlans };
        }),
      setGuest: (guest) => set({ guest }),
      applyCloud: (data) =>
        set((s) => {
          // Photos are files on this phone, so keep local ones for entries that still exist.
          const bodyPhotos = new Map(s.bodyStats.map((b) => [b.id, b.photoUri]));
          const exercisePhotos = new Map(s.customExercises.map((e) => [e.id, e.photoUri]));
          return {
            ...data,
            profile: { ...DEFAULT_PROFILE, ...data.profile, avatarUri: s.profile.avatarUri },
            bodyStats: (data.bodyStats ?? []).map((b) => ({ ...b, photoUri: bodyPhotos.get(b.id) ?? null })),
            customExercises: (data.customExercises ?? []).map((e) => ({ ...e, photoUri: exercisePhotos.get(e.id) ?? null })),
          };
        }),
      markSynced: (ownerId, cloudAt, localAt) =>
        set((s) => ({ syncMeta: { ...s.syncMeta, ownerId, cloudSyncedAt: cloudAt, localSyncedAt: localAt } })),
      saveCustomExercise: (exercise) =>
        set((s) => {
          const exists = s.customExercises.some((e) => e.id === exercise.id);
          return {
            customExercises: exists
              ? s.customExercises.map((e) => (e.id === exercise.id ? exercise : e))
              : [exercise, ...s.customExercises],
          };
        }),
      deleteCustomExercise: (id) =>
        set((s) => ({
          customExercises: s.customExercises.map((e) => (e.id === id ? { ...e, archived: true, photoUri: null } : e)),
          customPlans: Object.fromEntries(Object.entries(s.customPlans).map(([k, ids]) => [k, ids.filter((x) => x !== id)])),
          favorites: s.favorites.filter((f) => f !== id),
        })),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
        })),

      startWorkout: ({ focus, groups, exerciseIds, splitDayIndex = null, fromSuggestion = false }) =>
        set((s) => ({
          active: {
            id: uid(),
            startedAt: Date.now(),
            focus,
            groups,
            splitDayIndex,
            fromSuggestion,
            exercises: exerciseIds.map((id) => ({ exerciseId: id, sets: seedSets(id, s.workouts) })),
          },
        })),

      addExercise: (id) =>
        set((s) => {
          if (!s.active) return {};
          return {
            active: {
              ...s.active,
              exercises: [...s.active.exercises, { exerciseId: id, sets: seedSets(id, s.workouts) }],
            },
          };
        }),

      removeExercise: (index) =>
        set((s) =>
          s.active ? { active: { ...s.active, exercises: s.active.exercises.filter((_, i) => i !== index) } } : {},
        ),

      addSet: (exIndex) =>
        set((s) =>
          mapExercise(s, exIndex, (e) => {
            const last = e.sets[e.sets.length - 1];
            return { ...e, sets: [...e.sets, { id: uid(), weight: last?.weight ?? null, reps: last?.reps ?? 10, done: false }] };
          }),
        ),

      removeSet: (exIndex, setId) =>
        set((s) => mapExercise(s, exIndex, (e) => ({ ...e, sets: e.sets.filter((x) => x.id !== setId) }))),

      updateSet: (exIndex, setId, patch) =>
        set((s) =>
          mapExercise(s, exIndex, (e) => {
            const at = e.sets.findIndex((x) => x.id === setId);
            return {
              ...e,
              sets: e.sets.map((x, i) => {
                if (i === at) return { ...x, ...patch };
                // Typing a weight or reps fills the empty, unticked sets below it, so one entry covers the exercise.
                if (i > at && !x.done) {
                  const fill: Partial<SetEntry> = {};
                  // 0 counts as empty too (sets pre-filled from a bodyweight session).
                  if (patch.weight != null && !x.weight) fill.weight = patch.weight;
                  if (patch.reps != null && !x.reps) fill.reps = patch.reps;
                  return { ...x, ...fill };
                }
                return x;
              }),
            };
          }),
        ),

      completeEnteredSets: () =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: s.active.exercises.map((e) => ({
                    ...e,
                    sets: e.sets.map((x) => (!x.done && (x.weight ?? 0) > 0 && (x.reps ?? 0) > 0 ? { ...x, done: true } : x)),
                  })),
                },
              }
            : {},
        ),

      discardWorkout: () => set({ active: null }),

      finishWorkout: () => {
        get().applyStreakFreezes();
        const s = get();
        const a = s.active;
        if (!a) return null;

        const exercises = a.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
          .filter((e) => e.sets.length > 0);
        if (!exercises.length) {
          set({ active: null });
          return null;
        }

        const now = Date.now();
        const setsDone = exercises.reduce((n, e) => n + e.sets.length, 0);
        const volume = exercises.reduce(
          (v, e) => v + e.sets.reduce((sv, x) => sv + (x.weight ?? 0) * (x.reps ?? 0), 0),
          0,
        );

        // Personal records — the first time you log an exercise sets a baseline, not a PR.
        const prs = { ...s.prs };
        const prNames: string[] = [];
        for (const e of exercises) {
          const ex = getExercise(e.exerciseId);
          const best = e.sets.reduce<PersonalRecord | null>((b, x) => {
            const w = x.weight ?? 0;
            const r = x.reps ?? 0;
            const score = w > 0 ? estimate1RM(w, r) : r;
            if (!b || score > b.e1rm) return { weight: w, reps: r, e1rm: score, date: now };
            return b;
          }, null);
          if (!best || best.e1rm <= 0) continue;
          const prev = prs[e.exerciseId];
          if (!prev) prs[e.exerciseId] = best;
          else if (best.e1rm > prev.e1rm + 0.01) {
            prs[e.exerciseId] = best;
            prNames.push(ex?.name ?? e.exerciseId);
          }
        }

        const firstToday = !s.workouts.some((w) => dayKey(w.startedAt) === dayKey(now)) && !s.restDays.includes(dayKey(now));
        const log: WorkoutLog = {
          id: a.id,
          startedAt: a.startedAt,
          endedAt: now,
          focus: a.focus,
          groups: a.groups,
          splitDayIndex: a.splitDayIndex,
          exercises,
          volume,
          setsDone,
          xp: 0,
          prs: prNames,
          fromPlan: a.fromSuggestion,
        };
        const workouts = [...s.workouts, log];
        const streak = computeStreak(streakDays(s, workouts), s.profile.trainingDays, now);
        const freezeEarned = earnsFreeze(streak.current, s.freezeTokens, firstToday);

        const breakdown: XpLine[] = [];
        const rewardedSets = Math.min(setsDone, XP.maxRewardedSets);
        breakdown.push({ key: 'xp.sets', vars: { n: rewardedSets }, amount: rewardedSets * XP.perSet });
        breakdown.push(
          exercises.length >= 3
            ? { key: 'xp.workout', amount: XP.workoutComplete }
            : { key: 'xp.quick', amount: XP.shortWorkout },
        );
        if (a.fromSuggestion) breakdown.push({ key: 'xp.plan', amount: XP.followedPlan });
        if (prNames.length) breakdown.push({ key: 'xp.prs', vars: { n: prNames.length }, amount: prNames.length * XP.personalRecord });
        if (firstToday && streak.current > 1)
          breakdown.push({ key: 'xp.streak', vars: { n: streak.current }, amount: Math.min(XP.maxStreakBonus, streak.current * XP.perStreakDay) });

        const quests = claimQuests(s, workouts, now);
        breakdown.push(...quests.lines);

        const prCount = s.prCount + prNames.length;
        const unlocked = newAchievements({ achievements: s.achievements, prCount }, workouts, streak.current);
        for (const id of unlocked) {
          const ach = ACHIEVEMENTS.find((x) => x.id === id)!;
          breakdown.push({ key: 'xp.achievement', vars: { id }, amount: ach.xp });
        }

        const gained = breakdown.reduce((n, l) => n + l.amount, 0);
        log.xp = gained;
        const result: WorkoutResult = {
          log,
          breakdown,
          xpBefore: s.xpTotal,
          xpAfter: s.xpTotal + gained,
          newAchievements: unlocked,
          completedQuests: quests.ids,
          freezeEarned,
        };
        set({
          workouts,
          prs,
          prCount,
          questsClaimed: quests.claimed,
          freezeTokens: s.freezeTokens + (freezeEarned ? 1 : 0),
          xpTotal: s.xpTotal + gained,
          achievements: { ...s.achievements, ...Object.fromEntries(unlocked.map((id) => [id, now])) },
          active: null,
          lastResult: result,
        });
        return result;
      },

      logRestDay: () => {
        get().applyStreakFreezes();
        const s = get();
        const today = dayKey();
        if (s.restDays.includes(today)) return 0;
        const firstToday = !s.workouts.some((w) => dayKey(w.startedAt) === today);
        const restDays = [...s.restDays, today];
        const streak = computeStreak(streakDays({ ...s, restDays }, s.workouts), s.profile.trainingDays);
        const freezeEarned = earnsFreeze(streak.current, s.freezeTokens, firstToday);
        const unlocked = newAchievements(s, s.workouts, streak.current);
        const gained = XP.restDay + unlocked.reduce((n, id) => n + (ACHIEVEMENTS.find((a) => a.id === id)?.xp ?? 0), 0);
        set({
          restDays,
          freezeTokens: s.freezeTokens + (freezeEarned ? 1 : 0),
          xpTotal: s.xpTotal + gained,
          achievements: { ...s.achievements, ...Object.fromEntries(unlocked.map((id) => [id, Date.now()])) },
        });
        return gained;
      },

      applyStreakFreezes: () => {
        const s = get();
        if (!s.freezeTokens) return;
        const missed = missedDays(streakDays(s, s.workouts), s.profile.trainingDays);
        if (!missed.length || missed.length > s.freezeTokens) return;
        set({ frozenDays: [...s.frozenDays, ...missed], freezeTokens: s.freezeTokens - missed.length });
      },

      addBodyStat: (entry) =>
        set((s) => ({ bodyStats: [...s.bodyStats, { ...entry, id: uid() }].sort((a, b) => a.date - b.date) })),
      deleteBodyStat: (id) => set((s) => ({ bodyStats: s.bodyStats.filter((b) => b.id !== id) })),

      restoreBackup: (data) =>
        set((s) => ({
          ...INITIAL,
          ...data,
          guest: s.guest,
          syncMeta: { ...s.syncMeta, localChangedAt: Date.now() },
          profile: { ...DEFAULT_PROFILE, ...data.profile, onboarded: true, avatarUri: null },
          // Photos live outside the backup, so restored entries never point at missing files.
          bodyStats: (data.bodyStats ?? []).map((b) => ({ ...b, photoUri: null })),
          customExercises: (data.customExercises ?? []).map((e) => ({ ...e, photoUri: null })),
        })),

      // Keeps login state, and marks the (now empty) data as changed so a signed-in account is reset too.
      resetAll: () =>
        set((s) => ({ ...INITIAL, guest: s.guest, syncMeta: { ...s.syncMeta, localChangedAt: Date.now() } })),
    }),
    {
      name: 'repquest-v1',
      storage: createJSONStorage(() => appStorage),
      partialize: ({ hydrated, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<AppState>,
      // Fill settings added in later versions, which a shallow merge would otherwise drop.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          profile: { ...DEFAULT_PROFILE, ...p.profile, reminder: { ...DEFAULT_PROFILE.reminder, ...p.profile?.reminder } },
          lastResult: null,
        };
      },
    },
  ),
);

// Storage may hydrate synchronously (web) or asynchronously (SQLite on device).
// Keep plain `getExercise` lookups in step with your custom exercises.
registerCustomExercises(useApp.getState().customExercises);
useApp.subscribe((s, prev) => {
  if (s.customExercises !== prev.customExercises) registerCustomExercises(s.customExercises);
  // Note when training data changes so cloud sync knows to upload. Loading saved data at
  // startup isn't a change, so wait until the store has finished hydrating.
  if (s.hydrated && prev.hydrated && BACKUP_KEYS.some((k) => s[k] !== prev[k])) {
    useApp.setState({ syncMeta: { ...s.syncMeta, localChangedAt: Date.now() } });
  }
});

const markHydrated = () => {
  useApp.setState({ hydrated: true });
  useApp.getState().applyStreakFreezes();
};
if (useApp.persist.hasHydrated()) markHydrated();
else useApp.persist.onFinishHydration(markHydrated);


// The app can stay open across midnight — re-check freezes whenever it comes back to the foreground.
RNAppState.addEventListener('change', (status) => {
  if (status === 'active' && useApp.getState().hydrated) useApp.getState().applyStreakFreezes();
});
