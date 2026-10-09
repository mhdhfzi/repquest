import { useEffect } from 'react';

import { useT } from '@/i18n';
import { activeDayKeys, computeStreak } from '@/lib/progression';
import { syncStreakWarning, syncTrainingReminders } from '@/lib/reminders';
import { useApp } from '@/stores/app-store';

/** Keeps scheduled notifications in step with settings, language and logged activity. */
export function useReminderSync() {
  const { t, lang } = useT();
  const reminder = useApp((s) => s.profile.reminder);
  const workouts = useApp((s) => s.workouts);
  const restDays = useApp((s) => s.restDays);
  const frozenDays = useApp((s) => s.frozenDays);
  const trainingDays = useApp((s) => s.profile.trainingDays);

  useEffect(() => {
    syncTrainingReminders(reminder, t).catch(() => {});
    // `t` changes identity every render; `lang` is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder, lang]);

  const streak = computeStreak(activeDayKeys(workouts.map((w) => w.startedAt), restDays, frozenDays), trainingDays);
  useEffect(() => {
    syncStreakWarning(reminder.streakWarning, streak.current, streak.activeToday, trainingDays, t).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder.streakWarning, streak.current, streak.activeToday, trainingDays, lang]);
}
