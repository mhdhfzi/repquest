import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BodyMap, Legend } from '@/components/body-map';
import { BarChart, LineChart, type Datum } from '@/components/charts';
import { Icon, I } from '@/components/ui/icon';
import { Card, Chip, ProgressBar, SectionHeader, StatTile } from '@/components/ui/primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Appear, Screen } from '@/components/ui/screen';
import { Txt } from '@/components/ui/text';
import { MUSCLE_GROUPS } from '@/constants/muscles';
import { C, S } from '@/constants/theme';
import { useT, type TFn, type TKey } from '@/i18n';
import { focusLabel, muscleLabel } from '@/i18n/labels';
import { addDays, dayKey, formatDayMonth, formatKg, formatShortDate, startOfWeek } from '@/lib/date';
import { getExercise, groupsWorked } from '@/lib/exercises';
import { activeDayKeys, computeStreak, estimate1RM } from '@/lib/progression';
import { computeRecovery, recoveryIntensity } from '@/lib/recovery';
import { useApp } from '@/stores/app-store';
import type { MuscleGroupId, PersonalRecord, WorkoutLog } from '@/types';

type Metric = 'volume' | 'sets' | 'workouts';
const METRICS: { id: Metric; label: TKey; format: (t: TFn, n: number) => string }[] = [
  { id: 'volume', label: 'progress.metricVolume', format: (_, n) => formatKg(n) },
  { id: 'sets', label: 'progress.metricSets', format: (t, n) => t('common.sets', { n: Math.round(n) }) },
  { id: 'workouts', label: 'progress.metricWorkouts', format: (t, n) => t('common.workouts', { n: Math.round(n) }) },
];
const TREND_WEEKS = 8;

function weeklyTrend(t: TFn, workouts: WorkoutLog[], metric: Metric): Datum[] {
  const first = addDays(startOfWeek(), -7 * (TREND_WEEKS - 1));
  return Array.from({ length: TREND_WEEKS }, (_, i) => {
    const from = addDays(first, i * 7);
    const to = addDays(from, 7);
    const ws = workouts.filter((w) => w.startedAt >= from && w.startedAt < to);
    const value = metric === 'volume' ? ws.reduce((n, w) => n + w.volume, 0) : metric === 'sets' ? ws.reduce((n, w) => n + w.setsDone, 0) : ws.length;
    return {
      label: formatDayMonth(from),
      detail: i === TREND_WEEKS - 1 ? t('progress.thisWeek') : t('progress.weekOf', { d: formatDayMonth(from) }),
      value,
    };
  });
}

/** Best set per session for one exercise: estimated 1RM when weighted, otherwise top reps. */
function strengthSeries(workouts: WorkoutLog[], exerciseId: string): { data: Datum[]; weighted: boolean } {
  const sessions = workouts
    .map((w) => ({ w, e: w.exercises.find((x) => x.exerciseId === exerciseId) }))
    .filter((x) => x.e?.sets.length);
  const weighted = sessions.some(({ e }) => e!.sets.some((s) => (s.weight ?? 0) > 0));
  const data = sessions.map(({ w, e }) => {
    const value = Math.max(...e!.sets.map((s) => (weighted ? estimate1RM(s.weight ?? 0, s.reps ?? 0) : (s.reps ?? 0))));
    return { label: formatDayMonth(w.startedAt), detail: formatShortDate(w.startedAt), value: Math.round(value * 10) / 10 };
  });
  return { data, weighted };
}

const prLine = (t: TFn, pr: PersonalRecord) => (pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : t('common.reps', { n: pr.reps }));

const RECOVERY_COLORS = [C.danger, C.flame, C.accent];

export default function Progress() {
  const { t, lang } = useT();
  const workouts = useApp((s) => s.workouts);
  const restDays = useApp((s) => s.restDays);
  const frozenDays = useApp((s) => s.frozenDays);
  const trainingDays = useApp((s) => s.profile.trainingDays);
  const prCount = useApp((s) => s.prCount);
  const prs = useApp((s) => s.prs);
  const bodyStats = useApp((s) => s.bodyStats);
  const lastBody = bodyStats[bodyStats.length - 1];
  const lastWeight = [...bodyStats].reverse().find((b) => b.weightKg !== null);
  const [metric, setMetric] = useState<Metric>('volume');
  const [pickedExercise, setPickedExercise] = useState<string | null>(null);

  const recovery = useMemo(() => computeRecovery(workouts), [workouts]);
  const streak = computeStreak(activeDayKeys(workouts.map((w) => w.startedAt), restDays, frozenDays), trainingDays);
  const weekStart = startOfWeek();
  const thisWeek = workouts.filter((w) => w.startedAt >= weekStart);
  const totalVolume = workouts.reduce((n, w) => n + w.volume, 0);

  const weeklySets = useMemo(() => {
    const out = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.id, 0])) as Record<MuscleGroupId, number>;
    for (const w of thisWeek)
      for (const e of w.exercises) {
        const ex = getExercise(e.exerciseId);
        if (!ex) continue;
        for (const [g, weight] of Object.entries(groupsWorked(ex)) as [MuscleGroupId, number][]) out[g] += e.sets.length * weight;
      }
    return out;
  }, [thisWeek]);
  const maxSets = Math.max(10, ...Object.values(weeklySets));

  const recoveryData = MUSCLE_GROUPS.flatMap((g) =>
    g.slugs.map((slug) => ({ slug, intensity: recoveryIntensity(recovery[g.id]) })),
  );

  const metricDef = METRICS.find((m) => m.id === metric)!;
  // `lang` re-runs this so chart labels switch language too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const trend = useMemo(() => weeklyTrend(t, workouts, metric), [workouts, metric, lang]);

  // Most-logged exercises first; these are the ones worth charting.
  const topExercises = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of workouts) for (const e of w.exercises) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  }, [workouts]);
  const exerciseId = pickedExercise && topExercises.includes(pickedExercise) ? pickedExercise : topExercises[0];
  const strength = useMemo(() => (exerciseId ? strengthSeries(workouts, exerciseId) : null), [workouts, exerciseId]);

  const recentPrs = Object.entries(prs)
    .sort((a, b) => b[1].date - a[1].date)
    .slice(0, 8);

  const workoutDays = new Set(workouts.map((w) => dayKey(w.startedAt)));
  const restSet = new Set(restDays);
  const calStart = addDays(weekStart, -7 * 4);

  return (
    <Screen subtitle={t('progress.caption')} title={t('progress.title')}>
      <Appear>
        <View style={styles.row}>
          <StatTile label={t('progress.workouts')} value={String(workouts.length)} sub={t('progress.thisWeekCount', { n: thisWeek.length })} icon={I.dumbbell} />
          <StatTile
            label={t('progress.bestStreak')}
            value={t('common.days', { n: streak.best })}
            sub={t('progress.current', { n: streak.current })}
            icon={I.flame}
            tint={C.flame}
          />
        </View>
      </Appear>
      <Appear index={1}>
        <View style={[styles.row, styles.rowGap]}>
          <StatTile label={t('progress.volume')} value={formatKg(totalVolume)} sub={t('progress.allTime')} icon={I.scale} tint={C.info} />
          <StatTile label={t('progress.prs')} value={String(prCount)} sub={t('progress.prsSub')} icon={I.trophy} tint={C.flame} />
        </View>
      </Appear>

      <SectionHeader title={t('progress.body')} />
      <Appear index={2}>
        <PressableScale onPress={() => router.push('/body')} scaleTo={0.98} accessibilityRole="button">
          <Card style={styles.bodyCard}>
            <View style={styles.bodyIcon}>
              <Icon name={I.ruler} size={18} color={C.info} />
            </View>
            <View style={styles.flex}>
              {lastWeight ? (
                <>
                  <Txt variant="number">{lastWeight.weightKg} kg</Txt>
                  <Txt variant="caption">{t('body.latest', { d: formatShortDate(lastBody.date) })}</Txt>
                </>
              ) : (
                <Txt variant="caption">{lastBody ? t('body.latest', { d: formatShortDate(lastBody.date) }) : t('body.empty')}</Txt>
              )}
            </View>
            <Txt variant="caption" color={C.accent} style={styles.bold}>
              {lastBody ? t('body.open') : t('body.log')}
            </Txt>
            <Icon name={I.chevronRight} size={14} color={C.textFaint} />
          </Card>
        </PressableScale>
      </Appear>

      <SectionHeader title={t('progress.recovery')} />
      <Appear index={2}>
        <Card>
          <View style={styles.map}>
            <BodyMap data={recoveryData} colors={RECOVERY_COLORS} scale={0.6} />
          </View>
          <Legend
            items={[
              { color: C.danger, label: t('progress.fatigued') },
              { color: C.flame, label: t('progress.recovering') },
              { color: C.accent, label: t('progress.ready') },
            ]}
          />
        </Card>
      </Appear>

      <SectionHeader title={t('progress.balance')} />
      <Appear index={3}>
        <Card style={styles.bars}>
          {MUSCLE_GROUPS.map((g, i) => {
            const sets = Math.round(weeklySets[g.id]);
            return (
              <View key={g.id} style={styles.barRow}>
                <Txt variant="caption" color={C.text} style={styles.barLabel}>
                  {muscleLabel(t, g.id)}
                </Txt>
                <View style={styles.flex}>
                  <ProgressBar progress={sets / maxSets} height={6} delay={i * 40} color={sets === 0 ? C.border : C.accent} />
                </View>
                <Txt variant="caption" style={styles.barVal} color={sets === 0 ? C.textFaint : C.text}>
                  {sets === 0 ? '—' : t('common.sets', { n: sets })}
                </Txt>
              </View>
            );
          })}
          <Txt variant="caption" style={styles.note}>
            {t('progress.balanceNote')}
          </Txt>
        </Card>
      </Appear>

      <SectionHeader title={t('progress.trend')} />
      <Appear index={4}>
        <Card style={styles.chartCard}>
          <View style={styles.chips}>
            {METRICS.map((m) => (
              <Chip key={m.id} label={t(m.label)} selected={metric === m.id} onPress={() => setMetric(m.id)} />
            ))}
          </View>
          <BarChart key={`${metric}-${lang}`} data={trend} format={(n) => metricDef.format(t, n)} />
        </Card>
      </Appear>

      <SectionHeader title={t('progress.strength')} />
      <Appear index={5}>
        {strength && exerciseId ? (
          <Card style={styles.chartCard}>
            <View style={styles.chips}>
              {topExercises.map((id) => (
                <Chip key={id} label={getExercise(id)?.name ?? id} selected={id === exerciseId} onPress={() => setPickedExercise(id)} />
              ))}
            </View>
            <LineChart
              key={exerciseId}
              data={strength.data}
              format={(n) => (strength.weighted ? `${n} kg` : t('common.reps', { n: Math.round(n) }))}
            />
            <Txt variant="caption">
              {strength.weighted ? t('progress.e1rmNote') : t('progress.repsNote')}
            </Txt>
          </Card>
        ) : (
          <Card style={styles.empty}>
            <Icon name={I.chart} size={22} color={C.textMuted} />
            <Txt variant="caption" center>
              {t('progress.strengthEmpty')}
            </Txt>
          </Card>
        )}
      </Appear>

      {recentPrs.length ? (
        <>
          <SectionHeader title={t('progress.prList')} />
          <Card style={styles.prs}>
            {recentPrs.map(([id, pr], i) => (
              <View key={id} style={[styles.prRow, i > 0 && styles.prDivider]}>
                <Icon name={I.trophy} size={14} color={C.flame} />
                <View style={styles.flex}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {getExercise(id)?.name ?? id}
                  </Txt>
                  <Txt variant="caption">{formatShortDate(pr.date)}</Txt>
                </View>
                <View style={styles.prVal}>
                  <Txt variant="bodyStrong">{prLine(t, pr)}</Txt>
                  {pr.weight > 0 && pr.reps > 1 ? <Txt variant="caption">{t('progress.e1rm', { n: Math.round(pr.e1rm) })}</Txt> : null}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('progress.calendar')} />
      <Appear index={4}>
        <Card style={styles.cal}>
          <View style={styles.calRow}>
            {t('progress.weekdays').split(',').map((l, i) => (
              <Txt key={i} variant="caption" style={styles.calHead}>
                {l}
              </Txt>
            ))}
          </View>
          {Array.from({ length: 5 }, (_, w) => (
            <View key={w} style={styles.calRow}>
              {Array.from({ length: 7 }, (_, d) => {
                const t = addDays(calStart, w * 7 + d);
                const k = dayKey(t);
                const future = t > Date.now();
                const bg = workoutDays.has(k) ? C.accent : restSet.has(k) ? 'rgba(124,199,255,0.35)' : future ? 'transparent' : C.surfaceRaised;
                return <View key={k} style={[styles.cell, { backgroundColor: bg }, k === dayKey() && styles.cellToday]} />;
              })}
            </View>
          ))}
          <Legend
            items={[
              { color: C.accent, label: t('progress.legendWorkout') },
              { color: 'rgba(124,199,255,0.5)', label: t('progress.legendRest') },
            ]}
          />
        </Card>
      </Appear>

      <SectionHeader title={t('progress.history')} />
      {workouts.length === 0 ? (
        <Card style={styles.empty}>
          <Icon name={I.calendar} size={22} color={C.textMuted} />
          <Txt variant="caption" center>
            {t('progress.historyEmpty')}
          </Txt>
        </Card>
      ) : (
        <View style={styles.history}>
          {[...workouts]
            .reverse()
            .slice(0, 12)
            .map((w, i) => (
              <Appear key={w.id} index={i}>
                <Card style={styles.histRow}>
                  <View style={styles.flex}>
                    <Txt variant="bodyStrong">{focusLabel(t, w.focus)}</Txt>
                    <Txt variant="caption">
                      {formatShortDate(w.startedAt)} · {t('common.sets', { n: w.setsDone })} · {formatKg(w.volume)}
                    </Txt>
                  </View>
                  <Txt variant="bodyStrong" color={C.accent}>
                    +{w.xp} XP
                  </Txt>
                </Card>
              </Appear>
            ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: S.md },
  rowGap: { marginTop: S.md },
  map: { alignItems: 'center', paddingVertical: S.sm },
  flex: { flex: 1 },
  bars: { gap: S.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  barLabel: { width: 82, fontWeight: '600' },
  barVal: { width: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
  note: { marginTop: S.xs },
  chartCard: { gap: S.lg },
  bodyCard: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  bodyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(124,199,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  bold: { fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  prs: { paddingVertical: S.sm },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.md },
  prDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  prVal: { alignItems: 'flex-end' },
  cal: { gap: 6 },
  calRow: { flexDirection: 'row', gap: 6 },
  calHead: { flex: 1, textAlign: 'center' },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 6 },
  cellToday: { borderWidth: 1.5, borderColor: C.text },
  empty: { alignItems: 'center', gap: S.sm, paddingVertical: S.xl },
  history: { gap: S.sm },
  histRow: { flexDirection: 'row', alignItems: 'center', padding: S.md },
});
