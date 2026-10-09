export const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date key, e.g. "2026-10-09". */
export function dayKey(t: number | Date = Date.now()): string {
  const d = new Date(t);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(t: number = Date.now()): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(t: number = Date.now()): number {
  const d = new Date(startOfDay(t));
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.getTime();
}

/** Day of the week with Monday = 0 … Sunday = 6. */
export function weekdayIndex(t: number = Date.now()): number {
  return (new Date(t).getDay() + 6) % 7;
}

/** Short weekday name for a Monday-based index, e.g. 0 → "Mon" / "Isn". */
export function weekdayShort(index: number): string {
  // 2024-01-01 was a Monday.
  return new Date(2024, 0, 1 + index).toLocaleDateString(dateLocale, { weekday: 'short' });
}

/** Full weekday name for a Monday-based index, e.g. 5 → "Saturday" / "Sabtu". */
export function weekdayLong(index: number): string {
  return new Date(2024, 0, 1 + index).toLocaleDateString(dateLocale, { weekday: 'long' });
}

export function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

let dateLocale: string | undefined;

/** Set by the i18n layer so dates follow the app language, not only the device. */
export function setDateLocale(locale: string | undefined) {
  dateLocale = locale;
}

export function greeting(t: number = Date.now()) {
  const h = new Date(t).getHours();
  if (h < 5) return 'greet.late' as const;
  if (h < 12) return 'greet.morning' as const;
  if (h < 18) return 'greet.afternoon' as const;
  return 'greet.evening' as const;
}

export function formatTime(t: number): string {
  return new Date(t).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' });
}

export function formatDayMonth(t: number): string {
  return new Date(t).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`;
  return `${m}:${`${s}`.padStart(2, '0')}`;
}

export function formatShortDate(t: number): string {
  return new Date(t).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatKg(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}t`;
  return `${Math.round(n)} kg`;
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
