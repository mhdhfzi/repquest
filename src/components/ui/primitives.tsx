import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';

export function Card({ children, style, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  return <View style={[styles.card, raised && styles.cardRaised, style]}>{children}</View>;
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  style,
  disabled,
  small,
}: {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  small?: boolean;
}) {
  const fg = kind === 'primary' ? C.onAccent : kind === 'danger' ? C.danger : C.text;
  return (
    <PressableScale
      haptic
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.button, small && styles.buttonSmall, styles[kind], disabled && styles.disabled, style]}>
      {icon ? <Icon name={icon} size={small ? 15 : 18} color={fg} /> : null}
      <Txt variant="bodyStrong" color={fg} style={small ? styles.smallText : undefined}>
        {title}
      </Txt>
    </PressableScale>
  );
}

export function IconButton({
  icon,
  onPress,
  color = C.text,
  label,
  size = 40,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  label: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[styles.iconButton, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Icon name={icon} size={size * 0.45} color={color} />
    </PressableScale>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <PressableScale
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipOn]}>
      {icon ? <Icon name={icon} size={13} color={selected ? C.onAccent : C.textMuted} /> : null}
      <Txt variant="caption" style={styles.chipText} color={selected ? C.onAccent : C.text}>
        {label}
      </Txt>
    </PressableScale>
  );
}

export function Tag({ label, color = C.textMuted, bg = C.surfaceRaised }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Txt variant="caption" color={color} style={styles.tagText}>
        {label}
      </Txt>
    </View>
  );
}

/** Smoothly animating horizontal bar. */
export function ProgressBar({
  progress,
  color = C.accent,
  height = 8,
  track = C.surfaceRaised,
  delay = 0,
}: {
  progress: number;
  color?: string;
  height?: number;
  track?: string;
  delay?: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => {
      p.set(withTiming(Math.max(0, Math.min(1, progress)), { duration: 700, easing: Easing.out(Easing.cubic) }));
    }, delay);
    return () => clearTimeout(id);
  }, [progress, delay, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: track }]}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, fill]} />
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Txt variant="label">{title}</Txt>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={8}>
          <Txt variant="caption" color={C.accent}>
            {action}
          </Txt>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function StatTile({ label, value, sub, icon, tint = C.accent }: { label: string; value: string; sub?: string; icon?: IconName; tint?: string }) {
  return (
    <Card style={styles.stat}>
      <View style={styles.statTop}>
        {icon ? <Icon name={icon} size={14} color={tint} /> : null}
        <Txt variant="label">{label}</Txt>
      </View>
      <Txt variant="number">{value}</Txt>
      {sub ? <Txt variant="caption">{sub}</Txt> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: S.lg,
  },
  cardRaised: { backgroundColor: C.surfaceRaised },
  button: {
    height: 52,
    borderRadius: R.md,
    paddingHorizontal: S.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
  },
  buttonSmall: { height: 38, paddingHorizontal: S.md, borderRadius: R.sm },
  smallText: { fontSize: 14 },
  primary: { backgroundColor: C.accent },
  secondary: { backgroundColor: C.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: C.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: C.dangerSoft },
  disabled: { opacity: 0.4 },
  iconButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceRaised },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontWeight: '600' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 12, fontWeight: '600' },
  track: { width: '100%', overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: S.xxl,
    marginBottom: S.md,
  },
  stat: { flex: 1, gap: 4, padding: S.md },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
