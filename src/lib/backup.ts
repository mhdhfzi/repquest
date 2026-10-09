import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { dayKey } from '@/lib/date';
import { getExercise } from '@/lib/exercises';
import { BACKUP_KEYS, type PersistedData, useApp } from '@/stores/app-store';

const APP_ID = 'repquest';
const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof APP_ID;
  version: number;
  exportedAt: number;
  data: PersistedData;
}

export class BackupError extends Error {}

function snapshot(): PersistedData {
  const s = useApp.getState();
  return Object.fromEntries(BACKUP_KEYS.map((k) => [k, s[k]])) as PersistedData;
}

/** Hand a generated file to the user: share sheet on the phone, a download on web. */
async function deliver(name: string, contents: string, mimeType: string, uti: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new BackupError('share-unavailable');
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: name });
}

export async function exportBackup() {
  const backup: Backup = { app: APP_ID, version: BACKUP_VERSION, exportedAt: Date.now(), data: snapshot() };
  await deliver(`repquest-backup-${dayKey()}.json`, JSON.stringify(backup, null, 2), 'application/json', 'public.json');
}

const csvCell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per completed set — opens in Excel / Google Sheets. */
export async function exportSetsCsv() {
  const rows = [['date', 'time', 'workout', 'exercise', 'set', 'weight_kg', 'reps', 'volume_kg']];
  for (const w of useApp.getState().workouts) {
    const d = new Date(w.startedAt);
    const time = `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
    for (const e of w.exercises) {
      const name = getExercise(e.exerciseId)?.name ?? e.exerciseId;
      e.sets.forEach((s, i) => {
        const vol = (s.weight ?? 0) * (s.reps ?? 0);
        rows.push([dayKey(w.startedAt), time, w.focus, name, String(i + 1), String(s.weight ?? ''), String(s.reps ?? ''), String(vol)]);
      });
    }
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  await deliver(`repquest-sets-${dayKey()}.csv`, csv, 'text/csv', 'public.comma-separated-values-text');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Check a parsed file is a RepQuest backup and keep only known fields. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('invalid');
  }
  if (!isRecord(raw) || raw.app !== APP_ID || !isRecord(raw.data)) throw new BackupError('invalid');
  const d = raw.data;
  if (!Array.isArray(d.workouts) || typeof d.xpTotal !== 'number' || !isRecord(d.profile)) throw new BackupError('invalid');

  const fallback = snapshot();
  const data = Object.fromEntries(
    BACKUP_KEYS.map((k) => {
      const v = d[k];
      // Only take a field when its shape matches what the app stores.
      const ok = v !== undefined && Array.isArray(v) === Array.isArray(fallback[k]) && typeof v === typeof fallback[k];
      return [k, ok ? v : k === 'profile' ? fallback.profile : emptyLike(fallback[k])];
    }),
  ) as PersistedData;
  return { app: APP_ID, version: Number(raw.version) || 1, exportedAt: Number(raw.exportedAt) || 0, data };
}

function emptyLike(v: unknown) {
  if (Array.isArray(v)) return [];
  if (typeof v === 'number') return 0;
  if (isRecord(v)) return {};
  return v;
}

/** Let the user choose a backup file. Returns null if they cancel. */
export async function pickBackup(): Promise<Backup | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const uri = res.assets[0].uri;
  const text = Platform.OS === 'web' ? await (await fetch(uri)).text() : await new File(uri).text();
  return parseBackup(text);
}
