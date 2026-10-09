import { DAILY_QUEST_COUNT, DAILY_QUESTS, WEEKLY_QUESTS, type Quest } from '@/constants/quests';
import { dayKey, startOfWeek } from '@/lib/date';
import { seeded } from '@/lib/suggestion';
import type { Profile, WorkoutLog } from '@/types';

export interface QuestStatus {
  quest: Quest;
  /** Unique per quest per period, e.g. "2026-10-09:sets_15" — used to award XP only once. */
  key: string;
  progress: number;
  done: boolean;
}

/** Today's quests: 3 daily ones plus 1 weekly one, stable for the whole day / week. */
export function activeQuests(profile: Profile, now = Date.now()): { quest: Quest; key: string }[] {
  const day = dayKey(now);
  const week = dayKey(startOfWeek(now));

  const rand = seeded(`quests:${day}`);
  const daily = DAILY_QUESTS.filter((q) => q.available?.(profile) ?? true)
    .map((q) => ({ q, r: rand() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, DAILY_QUEST_COUNT)
    .map(({ q }) => q);

  const weekly = WEEKLY_QUESTS[Math.floor(seeded(`quests:${week}`)() * WEEKLY_QUESTS.length)];

  return [...daily.map((quest) => ({ quest, key: `${day}:${quest.id}` })), { quest: weekly, key: `${week}:${weekly.id}` }];
}

export function questStatus(profile: Profile, workouts: WorkoutLog[], now = Date.now()): QuestStatus[] {
  const today = dayKey(now);
  const weekStart = startOfWeek(now);
  const todays = workouts.filter((w) => dayKey(w.startedAt) === today);
  const weeks = workouts.filter((w) => w.startedAt >= weekStart);

  return activeQuests(profile, now).map(({ quest, key }) => {
    const raw = quest.progress({ workouts: quest.scope === 'day' ? todays : weeks, profile });
    const progress = Math.min(quest.target, Math.round(raw));
    return { quest, key, progress, done: progress >= quest.target };
  });
}
