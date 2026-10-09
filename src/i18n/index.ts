import { getLocales, useLocales } from 'expo-localization';

import { en, type TKey } from '@/i18n/en';
import { ms } from '@/i18n/ms';
import type { Entry, Lang, LangPref, LooseT, Vars } from '@/i18n/types';
import { setDateLocale } from '@/lib/date';
import { useApp } from '@/stores/app-store';

export type { Lang, LangPref, TKey };
export type TFn = (key: TKey, vars?: Vars) => string;

const DICTS: Record<Lang, Record<string, Entry>> = { en, ms };

export function hasKey(key: string): key is TKey {
  return key in en;
}

/** Explicit choice wins; otherwise follow the device (Malay → BM, anything else → English). */
export function resolveLang(pref: LangPref | undefined, deviceCode: string | null | undefined): Lang {
  if (pref === 'en' || pref === 'ms') return pref;
  return deviceCode === 'ms' ? 'ms' : 'en';
}

function lookup(lang: Lang, key: string, vars?: Vars): string {
  const entry = DICTS[lang][key] ?? DICTS.en[key];
  if (entry === undefined) return key;
  if (typeof entry === 'function') {
    const loose: LooseT = (k, v) => lookup(lang, k, v);
    return entry(vars ?? {}, loose);
  }
  return vars ? entry.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? '')) : entry;
}

export function makeT(lang: Lang): TFn {
  setDateLocale(lang === 'ms' ? 'ms-MY' : undefined);
  return (key, vars) => lookup(lang, key, vars);
}

/** Translator for components; re-renders when the language setting or device locale changes. */
export function useT(): { t: TFn; lang: Lang } {
  const pref = useApp((s) => s.profile.language);
  const [locale] = useLocales();
  const lang = resolveLang(pref, locale?.languageCode);
  return { t: makeT(lang), lang };
}

/** Current language outside React (alerts, notifications, exports). */
export function currentLang(): Lang {
  return resolveLang(useApp.getState().profile.language, getLocales()[0]?.languageCode);
}

export function tNow(key: TKey, vars?: Vars): string {
  return makeT(currentLang())(key, vars);
}
