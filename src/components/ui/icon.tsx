import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { C } from '@/constants/theme';

export interface IconName {
  /** SF Symbol name (iOS). */
  ios: string;
  /** Material Symbol name (Android & web). */
  android: string;
}

/** Native icons: SF Symbols on iOS, Material Symbols elsewhere. */
export function Icon({ name, size = 20, color = C.text }: { name: IconName; size?: number; color?: string }) {
  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android } as SymbolViewProps['name']}
      size={size}
      tintColor={color}
      weight="semibold"
    />
  );
}

/** Icon set used across the app, so names stay consistent. */
export const I = {
  home: { ios: 'house', android: 'home' },
  library: { ios: 'square.grid.2x2', android: 'grid_view' },
  progress: { ios: 'chart.bar', android: 'bar_chart' },
  profile: { ios: 'person', android: 'person' },
  search: { ios: 'magnifyingglass', android: 'search' },
  close: { ios: 'xmark', android: 'close' },
  check: { ios: 'checkmark', android: 'check' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  trash: { ios: 'trash', android: 'delete' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  flame: { ios: 'flame.fill', android: 'local_fire_department' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  star: { ios: 'star', android: 'star' },
  starFill: { ios: 'star.fill', android: 'star' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause' },
  timer: { ios: 'timer', android: 'timer' },
  trophy: { ios: 'trophy.fill', android: 'emoji_events' },
  bed: { ios: 'bed.double.fill', android: 'bedtime' },
  dumbbell: { ios: 'dumbbell.fill', android: 'fitness_center' },
  lock: { ios: 'lock.fill', android: 'lock' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  swap: { ios: 'arrow.triangle.2.circlepath', android: 'sync' },
  body: { ios: 'figure.stand', android: 'accessibility_new' },
  list: { ios: 'list.bullet', android: 'list' },
  info: { ios: 'info.circle', android: 'info' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  scale: { ios: 'scalemass', android: 'fitness_center' },
  snowflake: { ios: 'snowflake', android: 'ac_unit' },
  camera: { ios: 'camera', android: 'photo_camera' },
  photo: { ios: 'photo', android: 'image' },
  bell: { ios: 'bell', android: 'notifications' },
  globe: { ios: 'globe', android: 'language' },
  download: { ios: 'square.and.arrow.down', android: 'download' },
  upload: { ios: 'square.and.arrow.up', android: 'upload' },
  table: { ios: 'tablecells', android: 'table_chart' },
  ruler: { ios: 'ruler', android: 'straighten' },
  pencil: { ios: 'pencil', android: 'edit' },
  target: { ios: 'scope', android: 'my_location' },
  chart: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
} satisfies Record<string, IconName>;
