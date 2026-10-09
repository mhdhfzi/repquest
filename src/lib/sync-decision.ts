/** Bookkeeping kept on the phone (mirrors `SyncMeta` in the app store). */
export interface SyncState {
  ownerId?: string;
  cloudSyncedAt?: number;
  localSyncedAt?: number;
  localChangedAt?: number;
}

export type SyncAction = 'push' | 'pull' | 'conflict' | 'none';

/**
 * What to do when syncing `userId`'s data:
 * - no copy in the cloud yet → upload this phone's data
 * - this phone was last synced with someone else (or never) → download if the phone is empty, else ask
 * - otherwise compare: only the cloud changed → download; only the phone changed → upload;
 *   both changed since the last sync → ask which to keep.
 */
export function decideSync(p: { userId: string; cloudUpdatedAt: number | null; meta: SyncState; localEmpty: boolean }): SyncAction {
  const { userId, cloudUpdatedAt, meta, localEmpty } = p;
  if (cloudUpdatedAt === null) return 'push';
  if (meta.ownerId !== userId) return localEmpty ? 'pull' : 'conflict';

  const cloudChanged = cloudUpdatedAt > (meta.cloudSyncedAt ?? 0);
  const localChanged = (meta.localChangedAt ?? 0) > (meta.localSyncedAt ?? 0);
  if (cloudChanged && localChanged) return 'conflict';
  if (cloudChanged) return 'pull';
  if (localChanged) return 'push';
  return 'none';
}
