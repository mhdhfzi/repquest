import { Alert, Platform } from 'react-native';
import { create } from 'zustand';

import { tNow } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { decideSync } from '@/lib/sync-decision';
import { BACKUP_KEYS, type PersistedData, useApp } from '@/stores/app-store';

const TABLE = 'user_data';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'no-table';

interface SyncUi {
  status: SyncStatus;
  /** Phone time of the last successful sync this session. */
  lastSyncedAt: number | null;
}

/** Live sync status for the Profile screen. */
export const useSyncStatus = create<SyncUi>(() => ({ status: 'idle', lastSyncedAt: null }));

let running = false;
let again = false;
let conflictOpen = false;

/** Training data to upload. Photo paths are dropped: the files only exist on this phone. */
function snapshot(): PersistedData {
  const s = useApp.getState();
  const data = Object.fromEntries(BACKUP_KEYS.map((k) => [k, s[k]])) as PersistedData;
  return {
    ...data,
    profile: { ...data.profile, avatarUri: null },
    bodyStats: data.bodyStats.map((b) => ({ ...b, photoUri: null })),
    customExercises: data.customExercises.map((e) => ({ ...e, photoUri: null })),
  };
}

function localIsEmpty(): boolean {
  const s = useApp.getState();
  return !s.workouts.length && !s.xpTotal && !s.bodyStats.length && !s.customExercises.length && !s.restDays.length;
}

async function push(userId: string) {
  const capturedAt = Date.now();
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: snapshot() }, { onConflict: 'user_id' })
    .select('updated_at')
    .single();
  if (error) throw error;
  useApp.getState().markSynced(userId, Date.parse(data.updated_at), capturedAt);
}

function pull(userId: string, data: PersistedData, cloudAt: number) {
  useApp.getState().applyCloud(data);
  // Applying the download counts as a local change; mark it synced right after.
  useApp.getState().markSynced(userId, cloudAt, Date.now());
}

/** Ask which copy to keep when both changed. Resolves to the chosen side, or null if dismissed. */
function askWhichToKeep(): Promise<'cloud' | 'local' | null> {
  const title = tNow('sync.conflictTitle');
  const body = tNow('sync.conflictBody');
  if (Platform.OS === 'web') {
    const useCloud = globalThis.confirm?.(`${title}\n\n${body}\n\nOK = ${tNow('sync.useCloud')} · Cancel = ${tNow('sync.useLocal')}`);
    return Promise.resolve(useCloud ? 'cloud' : 'local');
  }
  return new Promise((resolve) =>
    Alert.alert(title, body, [
      { text: tNow('sync.useCloud'), onPress: () => resolve('cloud') },
      { text: tNow('sync.useLocal'), onPress: () => resolve('local') },
    ], { cancelable: true, onDismiss: () => resolve(null) }),
  );
}

/**
 * Bring this phone and the account's cloud copy in line. Safe to call often:
 * calls made while a sync runs are folded into one follow-up run.
 */
export async function runSync(userId: string): Promise<void> {
  if (running) {
    again = true;
    return;
  }
  if (conflictOpen) return;
  running = true;
  useSyncStatus.setState({ status: 'syncing' });
  try {
    const { data: row, error } = await supabase.from(TABLE).select('data, updated_at').eq('user_id', userId).maybeSingle();
    if (error) throw error;

    const cloudAt = row ? Date.parse(row.updated_at) : null;
    const action = decideSync({ userId, cloudUpdatedAt: cloudAt, meta: useApp.getState().syncMeta, localEmpty: localIsEmpty() });

    if (action === 'push') await push(userId);
    else if (action === 'pull' && row) pull(userId, row.data as PersistedData, cloudAt!);
    else if (action === 'conflict' && row) {
      conflictOpen = true;
      const choice = await askWhichToKeep();
      conflictOpen = false;
      if (choice === 'cloud') pull(userId, row.data as PersistedData, cloudAt!);
      else if (choice === 'local') await push(userId);
      else {
        useSyncStatus.setState({ status: 'idle' });
        return;
      }
    }
    useSyncStatus.setState({ status: 'idle', lastSyncedAt: Date.now() });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    // PGRST205 / 42P01: the table hasn't been created in Supabase yet.
    const missing = err?.code === 'PGRST205' || err?.code === '42P01' || /user_data/.test(err?.message ?? '');
    useSyncStatus.setState({ status: missing ? 'no-table' : 'error' });
  } finally {
    running = false;
    if (again) {
      again = false;
      void runSync(userId);
    }
  }
}
