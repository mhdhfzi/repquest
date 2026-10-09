import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { BodyMap } from '@/components/body-map';
import { ExerciseThumb } from '@/components/exercise-media';
import { LevelBadge, XpCard } from '@/components/level';
import { QuestCard } from '@/components/quest-card';
import { StreakWeek } from '@/components/streak-week';
import { Icon, I } from '@/components/ui/icon';
import { Button, Card, Chip, IconButton, ProgressBar, Tag } from '@/components/ui/primitives';
import { PressableScale, tap } from '@/components/ui/pressable-scale';
import { Appear, Screen } from '@/components/ui/screen';
import { Txt } from '@/components/ui/text';
import { XP } from '@/constants/progression';
import { SPLIT_BY_ID } from '@/constants/splits';
import { C, R, S } from '@/constants/theme';
import { useT, type TFn } from '@/i18n';
import { focusLabel, muscleLabel, reasonText } from '@/i18n/labels';
import { dayKey, formatTime, greeting } from '@/lib/date';
import { bodyDataForGroups, getExercise } from '@/lib/exercises';
import { confirm } from '@/lib/confirm';
import { activeDayKeys, computeStreak } from '@/lib/progression';
import { buildExerciseList, suggestToday } from '@/lib/suggestion';
import { planKey, useApp } from '@/stores/app-store';

export default function Today() {
  const { t } = useT();
  const profile = useApp((s) => s.profile);
  const workouts = useApp((s) => s.workouts);
  const restDays = useApp((s) => s.restDays);
  const frozenDays = useApp((s) => s.frozenDays);
  const freezeTokens = useApp((s) => s.freezeTokens);
  const trainingDays = profile.trainingDays;
  const xpTotal = useApp((s) => s.xpTotal);
  const active = useApp((s) => s.active);
  const startWorkout = useApp((s) => s.startWorkout);
  const logRestDay = useApp((s) => s.logRestDay);
  const customPlans = useApp((s) => s.customPlans);
  const setCustomPlan = useApp((s) => s.setCustomPlan);

  const [override, setOverride] = useState<number | null>(null);
  const [trainAnyway, setTrainAnyway] = useState(false);
  const [editing, setEditing] = useState(false);

  const suggestion = useMemo(() => suggestToday(profile, workouts, restDays), [profile, workouts, restDays]);
  const split = SPLIT_BY_ID[profile.splitId];

  // A pick made under a previous split can point past the end of the current one.
  const pick = override !== null && override < split.days.length ? override : null;
  const dayIndex = pick ?? suggestion.day.index;
  const day = split.days[dayIndex];
  const suggestedIds = useMemo(
    () =>
      pick === null
        ? suggestion.exerciseIds
        : buildExerciseList(day.groups, profile, workouts, `${dayKey()}:${profile.splitId}:${pick}`),
    [pick, suggestion.exerciseIds, day.groups, profile, workouts],
  );

  // What the card lists: the running workout, else your saved list for this day, else the suggestion.
  const key = planKey(profile.splitId, dayIndex);
  const custom = customPlans[key];
  const exerciseIds = active ? active.exercises.map((e) => e.exerciseId) : (custom ?? suggestedIds);
  const isEditing = editing && !active;

  const removeExercise = (id: string) => setCustomPlan(key, exerciseIds.filter((x) => x !== id));
  const openPicker = (replace?: string) => {
    // Save the current list first, so the picker edits what you see.
    if (!custom) setCustomPlan(key, exerciseIds);
    router.push({ pathname: '/workout/add', params: replace ? { plan: key, replace } : { plan: key } });
  };
  const restToday = () =>
    confirm(t('today.restTitle'), t('today.restBody', { xp: XP.restDay }), t('today.restConfirm'), () => {
      tap();
      logRestDay();
      // Show the "Rest day logged" card rather than the plan you were looking at.
      setTrainAnyway(false);
      setOverride(null);
      setEditing(false);
    }, false);

  const resetPlan = () => {
    setCustomPlan(key, null);
    setEditing(false);
  };

  const workoutDays = useMemo(() => new Set(workouts.map((w) => dayKey(w.startedAt))), [workouts]);
  const restSet = useMemo(() => new Set(restDays), [restDays]);
  const frozenSet = useMemo(() => new Set(frozenDays), [frozenDays]);
  const streak = computeStreak(activeDayKeys(workouts.map((w) => w.startedAt), restDays, frozenDays), trainingDays);
  const todaysLog = suggestion.kind === 'done' ? workouts.filter((w) => dayKey(w.startedAt) === dayKey()) : [];

  const start = () => {
    if (!active) {
      startWorkout({
        focus: day.label,
        groups: day.groups,
        exerciseIds,
        splitDayIndex: dayIndex,
        fromSuggestion: pick === null || pick === suggestion.day.index,
      });
    }
    router.push('/workout/active');
  };

  const showPlan = suggestion.kind === 'train' || trainAnyway || pick !== null;

  return (
    <Screen
      subtitle={t(greeting())}
      title={profile.name || t('common.athlete')}
      right={
        <PressableScale onPress={() => router.navigate('/profile')} accessibilityLabel={t('today.yourLevel')}>
          <LevelBadge xp={xpTotal} size={48} avatarUri={profile.avatarUri} />
        </PressableScale>
      }>
      {active ? (
        <Appear>
          <PressableScale onPress={() => router.push('/workout/active')} style={styles.resume}>
            <View style={styles.pulse} />
            <View style={styles.flex}>
              <Txt variant="bodyStrong" color={C.onAccent}>
                {t('today.inProgress', { focus: focusLabel(t, active.focus) })}
              </Txt>
              <Txt variant="caption" color={C.onAccent}>
                {t('today.startedResume', { time: formatTime(active.startedAt) })}
              </Txt>
            </View>
            <Icon name={I.chevronRight} size={16} color={C.onAccent} />
          </PressableScale>
        </Appear>
      ) : null}

      <Appear index={1}>
        <Card style={styles.hero}>
          {suggestion.kind === 'done' ? (
            <DoneState
              t={t}
              xp={todaysLog.reduce((n, w) => n + w.xp, 0)}
              sets={todaysLog.reduce((n, w) => n + w.setsDone, 0)}
              focus={focusLabel(t, todaysLog[0]?.focus ?? day.label)}
            />
          ) : suggestion.kind === 'rested' && !trainAnyway ? (
            <RestState t={t} rested reason={reasonText(t, suggestion.reason)} onTrain={() => setTrainAnyway(true)} />
          ) : !showPlan ? (
            <RestState
              t={t}
              reason={reasonText(t, suggestion.reason)}
              onRest={() => {
                tap();
                logRestDay();
              }}
              onTrain={() => setTrainAnyway(true)}
            />
          ) : (
            <Animated.View layout={LinearTransition.springify().damping(20)} style={styles.plan}>
              <View style={styles.planHead}>
                <View style={styles.flex}>
                  <Txt variant="label" color={C.accent}>
                    {pick === null ? t('today.focus') : t('today.yourPick')}
                  </Txt>
                  <Animated.View key={day.label} entering={FadeIn.duration(300)}>
                    <Txt variant="display">{focusLabel(t, day.label)}</Txt>
                  </Animated.View>
                </View>
                <View style={styles.readiness}>
                  <Txt variant="label">{t('today.ready')}</Txt>
                  <Txt variant="number" color={C.accent}>
                    {Math.round(suggestion.readiness * 100)}%
                  </Txt>
                </View>
              </View>

              <View style={styles.tags}>
                {day.groups.map((g) => (
                  <Tag key={g} label={muscleLabel(t, g)} />
                ))}
              </View>

              <Animated.View key={`map-${dayIndex}`} entering={FadeIn.duration(400)} style={styles.map}>
                <BodyMap data={bodyDataForGroups(day.groups)} scale={0.48} labels={false} />
              </Animated.View>

              {pick === null ? <Txt variant="caption">{reasonText(t, suggestion.reason)}</Txt> : null}

              <View style={styles.exList}>
                <View style={styles.listHead}>
                  <Txt variant="label">
                    {active ? t('today.currentWorkout') : custom ? t('today.custom') : t('today.exercises')}
                  </Txt>
                  {!active ? (
                    <PressableScale haptic onPress={() => setEditing((e) => !e)} hitSlop={10} accessibilityRole="button">
                      <Txt variant="caption" color={C.accent} style={styles.bold}>
                        {isEditing ? t('today.editDone') : t('today.edit')}
                      </Txt>
                    </PressableScale>
                  ) : null}
                </View>

                {exerciseIds.map((id, i) => {
                  const ex = getExercise(id);
                  if (!ex) return null;
                  return (
                    <Animated.View
                      key={`${dayIndex}-${id}`}
                      entering={FadeInDown.delay(i * 40).duration(300)}
                      exiting={FadeOut.duration(150)}
                      layout={LinearTransition.springify().damping(20)}>
                      <PressableScale
                        onPress={() => (isEditing ? openPicker(id) : router.push(`/exercise/${id}`))}
                        style={styles.exRow}
                        scaleTo={0.98}
                        accessibilityLabel={isEditing ? t('today.swapA11y', { name: ex.name }) : ex.name}>
                        <ExerciseThumb id={id} size={40} />
                        <Txt variant="body" numberOfLines={1} style={styles.flex}>
                          {ex.name}
                        </Txt>
                        {isEditing ? (
                          <>
                            <Icon name={I.swap} size={16} color={C.textMuted} />
                            <IconButton
                              icon={I.minus}
                              label={t('today.removeA11y', { name: ex.name })}
                              size={30}
                              color={C.danger}
                              style={styles.remove}
                              onPress={() => removeExercise(id)}
                            />
                          </>
                        ) : (
                          <Txt variant="caption">{t('common.sets', { n: 3 })}</Txt>
                        )}
                      </PressableScale>
                    </Animated.View>
                  );
                })}

                {!exerciseIds.length ? <Txt variant="caption">{t('today.emptyPlan')}</Txt> : null}

                {isEditing ? (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.editTools}>
                    <Txt variant="caption" color={C.textFaint}>
                      {t('today.editHint', { day: focusLabel(t, day.label) })}
                    </Txt>
                    <View style={styles.editRow}>
                      <Button title={t('today.addExercise')} kind="secondary" small icon={I.plus} style={styles.flex} onPress={() => openPicker()} />
                      {custom ? <Button title={t('today.resetPlan')} kind="ghost" small onPress={resetPlan} /> : null}
                    </View>
                  </Animated.View>
                ) : null}
              </View>

              <Button
                title={active ? t('today.resume') : t('today.start')}
                icon={I.play}
                onPress={start}
                disabled={!active && !exerciseIds.length}
              />

              <View>
                <Txt variant="caption" style={styles.switchLabel}>
                  {t('today.switchFocus')}
                </Txt>
                <View style={styles.chips}>
                  {split.days.map((d, i) => (
                    <Chip key={d.label} label={focusLabel(t, d.label)} selected={i === dayIndex} onPress={() => setOverride(i === suggestion.day.index ? null : i)} />
                  ))}
                </View>
              </View>

              {!active ? <Button title={t('today.restToday')} kind="ghost" small icon={I.bed} onPress={restToday} /> : null}
            </Animated.View>
          )}
        </Card>
      </Appear>

      <View style={styles.stack}>
        <Appear index={2}>
          <XpCard xp={xpTotal} />
        </Appear>
        <Appear index={3}>
          <StreakWeek
            streak={streak.current}
            workoutDays={workoutDays}
            restDays={restSet}
            frozenDays={frozenSet}
            freezeTokens={freezeTokens}
            trainingDays={trainingDays}
          />
        </Appear>
        <Appear index={4}>
          <QuestCard />
        </Appear>
      </View>
    </Screen>
  );
}

function RestState({
  t,
  reason,
  onRest,
  onTrain,
  rested,
}: {
  t: TFn;
  reason: string;
  onRest?: () => void;
  onTrain: () => void;
  rested?: boolean;
}) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconBubble, { backgroundColor: 'rgba(124,199,255,0.12)' }]}>
        <Icon name={I.bed} size={26} color={C.info} />
      </View>
      <Txt variant="title" center>
        {rested ? t('today.restLogged') : t('today.recoveryDay')}
      </Txt>
      <Txt variant="caption" center style={styles.reason}>
        {reason}
      </Txt>
      <View style={styles.btnRow}>
        {onRest ? <Button title={t('today.logRest', { xp: XP.restDay })} onPress={onRest} style={styles.flex} /> : null}
        <Button title={t('today.trainAnyway')} kind="secondary" onPress={onTrain} style={onRest ? undefined : styles.flex} />
      </View>
    </View>
  );
}

function DoneState({ t, xp, sets, focus }: { t: TFn; xp: number; sets: number; focus: string }) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconBubble, { backgroundColor: C.accentSoft }]}>
        <Icon name={I.check} size={26} color={C.accent} />
      </View>
      <Txt variant="title" center>
        {t('today.doneTitle', { focus })}
      </Txt>
      <Txt variant="caption" center>
        {t('today.doneBody', { sets, xp })}
      </Txt>
      <View style={styles.doneBar}>
        <ProgressBar progress={1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: S.md, marginTop: S.md },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.lg,
    borderRadius: R.lg,
    backgroundColor: C.accent,
    marginBottom: S.md,
  },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.onAccent },
  hero: { padding: S.xl },
  plan: { gap: S.lg },
  planHead: { flexDirection: 'row', alignItems: 'flex-start' },
  readiness: { alignItems: 'flex-end' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -S.sm },
  map: { alignItems: 'center', paddingVertical: S.sm },
  exList: { gap: S.sm },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 2 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bold: { fontWeight: '700' },
  remove: { backgroundColor: C.dangerSoft },
  editTools: { gap: S.sm, marginTop: S.xs },
  editRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  switchLabel: { marginBottom: S.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  center: { alignItems: 'center', gap: S.md, paddingVertical: S.md },
  iconBubble: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  reason: { maxWidth: 300 },
  btnRow: { flexDirection: 'row', gap: S.sm, alignSelf: 'stretch', marginTop: S.sm },
  doneBar: { alignSelf: 'stretch', marginTop: S.sm },
});
