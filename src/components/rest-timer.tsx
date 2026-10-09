import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Ring } from '@/components/level';
import { Button } from '@/components/ui/primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { formatDuration } from '@/lib/date';

/** Bottom sheet countdown shown after each completed set. */
export function RestTimer({ endsAt, total, onAdjust, onDone, bottomInset }: {
  endsAt: number;
  total: number;
  onAdjust: (deltaSeconds: number) => void;
  onDone: () => void;
  bottomInset: number;
}) {
  const { t } = useT();
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, endsAt - now);

  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [left, onDone]);

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20)}
      exiting={SlideOutDown.duration(220)}
      style={[styles.sheet, { paddingBottom: bottomInset + S.lg }]}>
      <Ring progress={left / (total * 1000)} size={72} stroke={6} duration={300}>
        <Txt variant="caption" color={C.text} style={styles.time}>
          {formatDuration(left)}
        </Txt>
      </Ring>
      <View style={styles.flex}>
        <Txt variant="label">{t('rest.label')}</Txt>
        <Txt variant="heading">{left === 0 ? t('rest.go') : t('rest.breathe')}</Txt>
        <View style={styles.adjust}>
          <PressableScale haptic onPress={() => onAdjust(-15)} style={styles.adjBtn}>
            <Txt variant="caption" color={C.text} style={styles.bold}>
              −15s
            </Txt>
          </PressableScale>
          <PressableScale haptic onPress={() => onAdjust(15)} style={styles.adjBtn}>
            <Txt variant="caption" color={C.text} style={styles.bold}>
              +15s
            </Txt>
          </PressableScale>
        </View>
      </View>
      <Button title={t('rest.skip')} kind="secondary" small onPress={onDone} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.lg,
    paddingTop: S.lg,
    paddingHorizontal: S.page,
    backgroundColor: C.surfaceRaised,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderStrong,
  },
  flex: { flex: 1, gap: 2 },
  time: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  adjust: { flexDirection: 'row', gap: S.sm, marginTop: 6 },
  adjBtn: { paddingHorizontal: 10, height: 28, borderRadius: 8, backgroundColor: C.surface, justifyContent: 'center' },
  bold: { fontWeight: '700' },
});
