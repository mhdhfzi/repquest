import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Icon, I } from '@/components/ui/icon';
import { Card } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { FREEZE } from '@/constants/progression';
import { C, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { addDays, dayKey, startOfWeek } from '@/lib/date';


export function StreakWeek({
  streak,
  workoutDays,
  restDays,
  frozenDays,
  freezeTokens,
  trainingDays,
}: {
  streak: number;
  workoutDays: Set<string>;
  restDays: Set<string>;
  frozenDays: Set<string>;
  freezeTokens: number;
  /** Monday = 0 … Sunday = 6; other days are drawn as scheduled rest. */
  trainingDays: number[];
}) {
  const { t } = useT();
  const letters = t('progress.weekdays').split(',');
  const monday = startOfWeek();
  const today = dayKey();
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flame}>
          <Icon name={I.flame} size={18} color={streak > 0 ? C.flame : C.textFaint} />
        </View>
        <View style={styles.flex}>
          <Txt variant="heading">{t('streak.days', { n: streak })}</Txt>
          <Txt variant="caption">{streak > 0 ? t('streak.keep') : t('streak.start')}</Txt>
        </View>
        <View
          style={[styles.freeze, !freezeTokens && styles.freezeEmpty]}
          accessible
          accessibilityLabel={t('streak.freezeA11y', { n: freezeTokens, every: FREEZE.every })}>
          <Icon name={I.snowflake} size={12} color={freezeTokens ? C.info : C.textFaint} />
          <Txt variant="caption" color={freezeTokens ? C.info : C.textFaint} style={styles.bold}>
            {freezeTokens}/{FREEZE.max}
          </Txt>
        </View>
      </View>
      <View style={styles.week}>
        {letters.map((l, i) => {
          const k = dayKey(addDays(monday, i));
          const trained = workoutDays.has(k);
          const rested = restDays.has(k);
          const frozen = frozenDays.has(k);
          const isToday = k === today;
          return (
            <View key={k} style={styles.day}>
              <Txt variant="caption" color={isToday ? C.text : C.textFaint} style={styles.letter}>
                {l}
              </Txt>
              <View style={[styles.dot, !trainingDays.includes(i) && styles.restDay, isToday && styles.today]}>
                {trained ? (
                  <Animated.View entering={ZoomIn.delay(i * 40).springify()} style={[styles.fill, { backgroundColor: C.accent }]}>
                    <Icon name={I.check} size={12} color={C.onAccent} />
                  </Animated.View>
                ) : rested ? (
                  <Animated.View entering={ZoomIn.delay(i * 40).springify()} style={[styles.fill, { backgroundColor: C.surfaceRaised }]}>
                    <Icon name={I.bed} size={11} color={C.info} />
                  </Animated.View>
                ) : frozen ? (
                  <Animated.View entering={ZoomIn.delay(i * 40).springify()} style={[styles.fill, styles.frozen]}>
                    <Icon name={I.snowflake} size={12} color={C.info} />
                  </Animated.View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: S.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  flame: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.flameSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  letter: { fontWeight: '600' },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: C.borderStrong },
  restDay: { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(124,199,255,0.45)' },
  freeze: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: 'rgba(124,199,255,0.12)' },
  freezeEmpty: { backgroundColor: C.surfaceRaised },
  bold: { fontWeight: '700' },
  frozen: { backgroundColor: 'rgba(124,199,255,0.12)', borderWidth: 1, borderColor: 'rgba(124,199,255,0.4)' },
  fill: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
