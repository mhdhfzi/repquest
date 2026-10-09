import { useEffect } from 'react';
import { AppState } from 'react-native';

import { runSync } from '@/lib/sync';
import { useApp } from '@/stores/app-store';
import { useAuth } from '@/stores/auth-store';

const CHANGE_DELAY_MS = 4000;

/**
 * Keeps the signed-in account's cloud copy current: on sign-in, whenever the app
 * returns to the foreground, and a few seconds after training data changes.
 */
export function useCloudSync() {
  const userId = useAuth((s) => s.session?.user.id);
  const changedAt = useApp((s) => s.syncMeta.localChangedAt);

  useEffect(() => {
    if (!userId) return;
    void runSync(userId);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runSync(userId);
    });
    return () => sub.remove();
  }, [userId]);

  useEffect(() => {
    if (!userId || !changedAt) return;
    // Wait for a quiet moment so a burst of edits (e.g. ticking sets) uploads once.
    const timer = setTimeout(() => void runSync(userId), CHANGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [userId, changedAt]);

  // Fill an empty profile name from the account (name given at sign-up, or the Google profile).
  const meta = useAuth((s) => s.session?.user.user_metadata);
  useEffect(() => {
    const name = (meta?.name ?? meta?.full_name ?? '') as string;
    const { profile, updateProfile } = useApp.getState();
    if (name && !profile.name) updateProfile({ name: name.split(' ').slice(0, 2).join(' ') });
  }, [meta]);
}
