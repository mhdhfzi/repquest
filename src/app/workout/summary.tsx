import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Celebration } from '@/components/celebration';
import { Ring } from '@/components/level';
import { Icon, I } from '@/components/ui/icon';
import { Button, Card, ProgressBar, StatTile } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { ACHIEVEMENTS, FREEZE } from '@/constants/progression';
import { C, F, R, S } from '@/constants/theme';
import { useT, type TKey } from '@/i18n';
import { focusLabel, titleLabel } from '@/i18n/labels';
import { formatDuration, formatKg } from '@/lib/date';
import { levelInfo } from '@/lib/progression';
import { useApp } from '@/stores/app-store';

function useCountUp(target: number, delay = 500, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now() + delay;
    const step = () => {
      const t = Math.min(1, Math.max(0, (Date.now() - start) / duration));
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration]);
  return v;
}

export default function Summary() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const result = useApp((s) => s.lastResult);
  const gained = result ? result.xpAfter - result.xpBefore : 0;
  const shown = useCountUp(gained);

  if (!result) {
    return (
      <View style={[styles.root, styles.centerFill]}>
        <Button title={t('summary.back')} onPress={() => router.back()} />
      </View>
    );
  }

  const before = levelInfo(result.xpBefore);
  const after = levelInfo(result.xpAfter);
  const leveledUp = after.level > before.level;
  const newTitle = after.title !== before.title;
  const { log } = result;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + S.xxl, paddingBottom: insets.bottom + 120 }]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.checkWrap}>
          <Ring progress={1} size={92} stroke={6} duration={800}>
            <Icon name={I.check} size={38} color={C.accent} />
          </Ring>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.titleBlock}>
          <Txt variant="label" color={C.accent} center>
            {t('summary.complete')}
          </Txt>
          <Txt variant="display" center>
            {focusLabel(t, log.focus)}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.stats}>
          <StatTile label={t('summary.time')} value={formatDuration(log.endedAt - log.startedAt)} icon={I.timer} tint={C.info} />
          <StatTile label={t('summary.sets')} value={String(log.setsDone)} icon={I.check} />
          <StatTile label={t('summary.volume')} value={formatKg(log.volume)} icon={I.scale} tint={C.flame} />
        </Animated.View>

        {leveledUp ? (
          <Animated.View entering={ZoomIn.delay(1300).springify().damping(10)} style={styles.levelUp}>
            <Icon name={I.sparkles} size={20} color={C.onAccent} />
            <View style={styles.flex}>
              <Txt variant="heading" color={C.onAccent}>
                {t('summary.levelUp', { n: after.level })}
              </Txt>
              {newTitle ? (
                <Txt variant="caption" color={C.onAccent}>
                  {t('summary.newTitle', { title: titleLabel(t, after.title) })}
                </Txt>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Card style={styles.xpCard}>
            <View style={styles.xpTop}>
              <View>
                <Txt variant="label">{t('summary.xpEarned')}</Txt>
                <Txt style={styles.xpBig}>+{shown}</Txt>
              </View>
              <View style={styles.levelCol}>
                <Txt variant="label">{t('common.level', { n: after.level })}</Txt>
                <Txt variant="caption">{titleLabel(t, after.title)}</Txt>
              </View>
            </View>
            <ProgressBar progress={after.progress} delay={600} height={10} />
            <Txt variant="caption">
              {t('summary.toNext', { cur: after.current, need: after.needed, next: after.level + 1 })}
            </Txt>
            <View style={styles.lines}>
              {result.breakdown.map((l, i) => (
                <Animated.View key={i} entering={FadeIn.delay(700 + i * 120).duration(300)} style={styles.line}>
                  <Txt variant="body" color={C.textMuted} style={styles.flex}>
                    {t(l.key, l.vars)}
                  </Txt>
                  <Txt variant="bodyStrong" color={C.accent}>
                    +{l.amount}
                  </Txt>
                </Animated.View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {log.prs.length ? (
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <Card style={styles.list}>
              <View style={styles.listHead}>
                <Icon name={I.trophy} size={16} color={C.flame} />
                <Txt variant="label">{t('summary.prs')}</Txt>
              </View>
              {log.prs.map((name) => (
                <Txt key={name} variant="bodyStrong">
                  {name}
                </Txt>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        {result.freezeEarned ? (
          <Animated.View entering={ZoomIn.delay(800).springify()}>
            <Card style={styles.ach}>
              <View style={[styles.achIcon, styles.freezeIcon]}>
                <Icon name={I.snowflake} size={22} color={C.info} />
              </View>
              <View style={styles.flex}>
                <Txt variant="label" color={C.info}>
                  {t('summary.freeze')}
                </Txt>
                <Txt variant="heading">{t('summary.freezeTitle', { n: FREEZE.every })}</Txt>
                <Txt variant="caption">{t('summary.freezeBody')}</Txt>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {result.newAchievements.map((id, i) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          if (!a) return null;
          return (
            <Animated.View key={id} entering={ZoomIn.delay(900 + i * 150).springify()}>
              <Card style={styles.ach}>
                <View style={styles.achIcon}>
                  <Icon name={a.icon} size={22} color={C.flame} />
                </View>
                <View style={styles.flex}>
                  <Txt variant="label" color={C.flame}>
                    {t('summary.achievement')}
                  </Txt>
                  <Txt variant="heading">{t(`ach.${a.id}.name` as TKey)}</Txt>
                  <Txt variant="caption">{t(`ach.${a.id}.desc` as TKey)}</Txt>
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Animated.View entering={FadeIn.delay(600)} style={[styles.footer, { paddingBottom: insets.bottom + S.lg }]}>
        <Button title={t('common.done')} onPress={() => router.back()} />
      </Animated.View>

      {leveledUp || result.newAchievements.length ? <Celebration delay={leveledUp ? 1300 : 900} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centerFill: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: S.page, gap: S.lg },
  checkWrap: { alignItems: 'center' },
  titleBlock: { gap: 2, marginBottom: S.sm },
  stats: { flexDirection: 'row', gap: S.sm },
  flex: { flex: 1 },
  levelUp: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.lg, borderRadius: R.lg, backgroundColor: C.accent },
  xpCard: { gap: S.md },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  xpBig: { fontFamily: F.display, fontSize: 44, lineHeight: 50, fontWeight: '800', color: C.accent, fontVariant: ['tabular-nums'] },
  levelCol: { alignItems: 'flex-end' },
  lines: { gap: S.sm, marginTop: S.sm, paddingTop: S.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  list: { gap: S.sm },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ach: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  achIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.flameSoft, alignItems: 'center', justifyContent: 'center' },
  freezeIcon: { backgroundColor: 'rgba(124,199,255,0.12)' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: S.page, paddingTop: S.md, backgroundColor: C.bg },
});
