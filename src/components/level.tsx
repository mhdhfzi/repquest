import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Icon, I } from '@/components/ui/icon';
import { Card, ProgressBar } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { C, F, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { titleLabel } from '@/i18n/labels';
import { levelInfo } from '@/lib/progression';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Circular progress ring with content in the middle. */
export function Ring({
  progress,
  size = 64,
  stroke = 5,
  color = C.accent,
  track = C.surfaceRaised,
  children,
  duration = 900,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  duration?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, progress)), { duration, easing: Easing.out(Easing.cubic) }));
  }, [progress, p, duration]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={props}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

/** Level ring. With a photo, the photo fills the ring and the level sits in a pill below it. */
export function LevelBadge({ xp, size = 52, avatarUri }: { xp: number; size?: number; avatarUri?: string | null }) {
  const info = levelInfo(xp);
  const inner = size - 12;
  return (
    <View>
      <Ring progress={info.progress} size={size} stroke={4}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} contentFit="cover" transition={200} />
        ) : (
          <Txt style={[styles.badgeNum, { fontSize: size * 0.34 }]}>{info.level}</Txt>
        )}
      </Ring>
      {avatarUri ? (
        <View style={[styles.levelPill, { minWidth: size * 0.42, height: Math.max(16, size * 0.28), borderRadius: size }]}>
          <Txt style={[styles.levelPillText, { fontSize: Math.max(10, size * 0.17) }]}>{info.level}</Txt>
        </View>
      ) : null}
    </View>
  );
}

export function XpCard({ xp }: { xp: number }) {
  const { t } = useT();
  const info = levelInfo(xp);
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <LevelBadge xp={xp} />
        <View style={styles.flex}>
          <Txt variant="label">{t('common.level', { n: info.level })}</Txt>
          <Txt variant="title">{titleLabel(t, info.title)}</Txt>
        </View>
        <View style={styles.xpPill}>
          <Icon name={I.bolt} size={12} color={C.accent} />
          <Txt variant="caption" color={C.accent} style={styles.bold}>
            {t('common.xp', { n: xp.toLocaleString() })}
          </Txt>
        </View>
      </View>
      <ProgressBar progress={info.progress} />
      <View style={styles.bottom}>
        <Txt variant="caption">
          {info.current.toLocaleString()} / {info.needed.toLocaleString()} XP
        </Txt>
        <Txt variant="caption">
          {info.nextTitle ? t('level.atLv', { title: titleLabel(t, info.nextTitle.name), n: info.nextTitle.level }) : t('level.max')}
        </Txt>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  ringSvg: { transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center' },
  badgeNum: { fontFamily: F.display, fontWeight: '800', color: C.text, fontVariant: ['tabular-nums'] },
  levelPill: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    borderWidth: 2,
    borderColor: C.bg,
  },
  levelPillText: { fontFamily: F.display, fontWeight: '800', color: C.onAccent, fontVariant: ['tabular-nums'] },
  card: { gap: S.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  flex: { flex: 1 },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accentSoft,
    alignSelf: 'flex-start',
  },
  bold: { fontWeight: '700' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between' },
});
