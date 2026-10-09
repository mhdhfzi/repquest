import { Platform } from 'react-native';

/**
 * RepQuest uses a single dark palette — easier on the eyes in the gym and
 * keeps the visual language consistent. Lime is the only accent; everything
 * else is neutral so highlighted muscles and XP stand out.
 */
export const C = {
  bg: '#0B0C0F',
  surface: '#14161B',
  surfaceRaised: '#1B1E24',
  border: '#24282F',
  borderStrong: '#323741',

  text: '#F3F4F6',
  textMuted: '#8D93A0',
  textFaint: '#5B616C',

  accent: '#C6F35E',
  accentDim: '#5C7230',
  accentSoft: 'rgba(198, 243, 94, 0.12)',
  onAccent: '#0B0C0F',

  flame: '#FFAE42',
  flameSoft: 'rgba(255, 174, 66, 0.14)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.12)',
  info: '#7CC7FF',

  bodyBase: '#262A32',
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  page: 20,
} as const;

export const R = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const F = {
  display: Platform.select({
    ios: 'ui-rounded',
    web: 'ui-rounded, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({ ios: 'ui-monospace', web: 'ui-monospace, Menlo, monospace', default: 'monospace' }),
};

/** Spring config shared by press feedback and entrances, so motion feels uniform. */
export const SPRING = { damping: 18, stiffness: 220, mass: 0.9 } as const;
