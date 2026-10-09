import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { TFn } from '@/i18n';
import { addDays, startOfDay } from '@/lib/date';
import { isScheduledRest } from '@/lib/progression';
import type { ReminderSettings } from '@/types';

const CHANNEL = 'reminders';
const TRAIN_PREFIX = 'train-';
const STREAK_ID = 'streak-warning';
const STREAK_HOUR = 20;
const STREAK_MINUTE = 30;

export const remindersSupported = Platform.OS !== 'web';

/** Show reminders even while the app is open. Call once at startup. */
export function configureNotifications() {
  if (!remindersSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Ask for permission (only when the user turns reminders on). Returns whether we may notify. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  await ensureChannel(); // Android 13+ only shows the prompt once a channel exists.
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return asked.granted;
}

async function cancelWhere(match: (id: string) => boolean) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled.filter((n) => match(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Weekly reminders on the chosen days. Replaces whatever was scheduled before. */
export async function syncTrainingReminders(r: ReminderSettings, t: TFn) {
  if (!remindersSupported) return;
  await cancelWhere((id) => id.startsWith(TRAIN_PREFIX));
  if (!r.enabled || !r.days.length) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannel();

  for (const day of r.days) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${TRAIN_PREFIX}${day}`,
      content: { title: t('notif.trainTitle'), body: t('notif.trainBody') },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        // App days are Monday = 0; the trigger wants Sunday = 1 … Saturday = 7.
        weekday: ((day + 1) % 7) + 1,
        hour: r.hour,
        minute: r.minute,
        channelId: CHANNEL,
      },
    });
  }
}

/**
 * One evening warning for the next day the streak could break: today if nothing is logged yet,
 * otherwise tomorrow. Rescheduled whenever activity changes.
 */
export async function syncStreakWarning(
  enabled: boolean,
  streak: number,
  activeToday: boolean,
  trainingDays: number[],
  t: TFn,
) {
  if (!remindersSupported) return;
  await cancelWhere((id) => id === STREAK_ID);
  if (!enabled || streak < 1) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const day = activeToday ? addDays(startOfDay(), 1) : startOfDay();
  // Your streak can't break on a scheduled rest day, so there's nothing to warn about.
  if (isScheduledRest(trainingDays, day)) return;
  const at = new Date(day);
  at.setHours(STREAK_HOUR, STREAK_MINUTE, 0, 0);
  if (at.getTime() <= Date.now()) return;

  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_ID,
    content: { title: t('notif.streakTitle', { n: streak }), body: t('notif.streakBody') },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
  });
}
