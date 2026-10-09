import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseThumb } from '@/components/exercise-media';
import { RestTimer } from '@/components/rest-timer';
import { Icon, I } from '@/components/ui/icon';
import { Button, IconButton, ProgressBar } from '@/components/ui/primitives';
import { PressableScale, tap } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { useT, type TFn } from '@/i18n';
import { focusLabel } from '@/i18n/labels';
import { formatDuration } from '@/lib/date';
import { getExercise, isBodyweight } from '@/lib/exercises';
import { overloadHint } from '@/lib/overload';
import { useApp } from '@/stores/app-store';
import type { SetEntry, WorkoutLog } from '@/types';

// expo-keep-awake throws on web when the screen unmounts before the wake lock is granted.
const useScreenAwake = Platform.OS === 'web' ? () => {} : useKeepAwake;

export default function ActiveWorkout() {
  useScreenAwake();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const active = useApp((s) => s.active);
  const workouts = useApp((s) => s.workouts);
  const restSeconds = useApp((s) => s.profile.restSeconds);
  const { addSet, removeSet, updateSet, removeExercise, discardWorkout, finishWorkout } = useApp.getState();

  const [now, setNow] = useState(() => Date.now());
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!active && !finishing.current) router.back();
  }, [active]);

  const totals = useMemo(() => {
    const all = active?.exercises.flatMap((e) => e.sets) ?? [];
    return { done: all.filter((s) => s.done).length, total: all.length };
  }, [active]);

  if (!active) return <View style={styles.root} />;

  const finish = () => {
    if (totals.done === 0) {
      confirm(t('active.noSetsTitle'), t('active.noSetsBody'), t('active.discard'), () => {
        discardWorkout();
      });
      return;
    }
    finishing.current = true;
    const result = finishWorkout();
    if (result) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/workout/summary');
    }
  };

  const close = () =>
    confirm(t('active.discardTitle'), t('active.discardBody'), t('active.discard'), () => discardWorkout());

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + S.sm }]}>
        <IconButton icon={I.close} label={t('active.discardA11y')} size={36} onPress={close} />
        <View style={styles.headCenter}>
          <Txt variant="heading">{focusLabel(t, active.focus)}</Txt>
          <Txt variant="caption" style={styles.mono}>
            {formatDuration(now - active.startedAt)}
          </Txt>
        </View>
        <Button title={t('active.finish')} small onPress={finish} />
      </View>
      <View style={styles.progressWrap}>
        <View style={styles.flex}>
          <ProgressBar progress={totals.total ? totals.done / totals.total : 0} height={4} />
        </View>
        <Txt variant="caption" style={styles.progressText}>
          {t('active.progress', { done: totals.done, total: totals.total })}
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (rest ? 180 : 60) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets>
        {active.exercises.map((we, exIndex) => {
          const ex = getExercise(we.exerciseId);
          if (!ex) return null;
          const prev = previousSets(workouts, we.exerciseId);
          const hint = overloadHint(prev, ex, t);
          return (
            <Animated.View
              key={`${we.exerciseId}-${exIndex}`}
              entering={FadeInDown.delay(exIndex * 50).duration(350)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.springify().damping(20)}
              style={styles.card}>
              <View style={styles.exHead}>
                <PressableScale onPress={() => router.push(`/exercise/${ex.id}`)} style={styles.exTitle} scaleTo={0.98}>
                  <ExerciseThumb id={ex.id} size={44} />
                  <View style={styles.flex}>
                    <Txt variant="bodyStrong" numberOfLines={1}>
                      {ex.name}
                    </Txt>
                    <Txt variant="caption" numberOfLines={2} color={hint ? C.accent : undefined}>
                      {hint ?? (isBodyweight(ex) ? t('active.firstBodyweight') : t('active.firstWeighted'))}
                    </Txt>
                  </View>
                </PressableScale>
                <IconButton
                  icon={I.trash}
                  label={t('active.removeExercise')}
                  size={32}
                  color={C.textMuted}
                  style={styles.trash}
                  onPress={() => confirm(t('active.removeTitle'), ex.name, t('active.remove'), () => removeExercise(exIndex))}
                />
              </View>

              <View style={styles.colHead}>
                <Txt variant="label" style={styles.colSet}>{t('active.colSet')}</Txt>
                <Txt variant="label" style={styles.colPrev}>{t('active.colPrev')}</Txt>
                <Txt variant="label" style={styles.colIn}>{t('active.colKg')}</Txt>
                <Txt variant="label" style={styles.colIn}>{t('active.colReps')}</Txt>
                <View style={styles.colCheck} />
              </View>

              {we.sets.map((set, i) => (
                <SetRow
                  key={set.id}
                  t={t}
                  index={i}
                  set={set}
                  prev={prev[i]}
                  bodyweight={isBodyweight(ex)}
                  onChange={(patch) => updateSet(exIndex, set.id, patch)}
                  onRemove={() => removeSet(exIndex, set.id)}
                  onToggle={() => {
                    const done = !set.done;
                    updateSet(exIndex, set.id, {
                      done,
                      reps: set.reps ?? prev[i]?.reps ?? null,
                      weight: set.weight ?? prev[i]?.weight ?? null,
                    });
                    if (done) setRest({ endsAt: Date.now() + restSeconds * 1000, total: restSeconds });
                  }}
                />
              ))}

              <PressableScale haptic onPress={() => addSet(exIndex)} style={styles.addSet}>
                <Icon name={I.plus} size={14} color={C.textMuted} />
                <Txt variant="caption" style={styles.bold}>
                  {t('active.addSet')}
                </Txt>
              </PressableScale>
            </Animated.View>
          );
        })}

        <Button title={t('active.addExercise')} kind="secondary" icon={I.plus} onPress={() => router.push('/workout/add')} />
        <Txt variant="caption" center style={styles.hint}>
          {t('active.hint')}
        </Txt>
      </ScrollView>

      {rest ? (
        <RestTimer
          endsAt={rest.endsAt}
          total={rest.total}
          bottomInset={insets.bottom}
          onAdjust={(d) =>
            setRest((r) => (r ? { endsAt: Math.max(Date.now(), r.endsAt + d * 1000), total: Math.max(15, r.total + d) } : r))
          }
          onDone={() => setRest(null)}
        />
      ) : null}
    </View>
  );
}

function previousSets(workouts: WorkoutLog[], exerciseId: string): SetEntry[] {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const e = workouts[i].exercises.find((x) => x.exerciseId === exerciseId);
    if (e) return e.sets;
  }
  return [];
}

function SetRow({
  t,
  index,
  set,
  prev,
  onChange,
  onToggle,
  onRemove,
  bodyweight,
}: {
  t: TFn;
  index: number;
  set: SetEntry;
  prev?: SetEntry;
  bodyweight?: boolean;
  onChange: (p: Partial<SetEntry>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const done = useSharedValue(set.done ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    done.set(withTiming(set.done ? 1 : 0, { duration: 250 }));
    if (set.done) pop.set(withSequence(withSpring(1.25, { damping: 8 }), withSpring(1, { damping: 12 })));
  }, [set.done, done, pop]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.value, [0, 1], ['rgba(0,0,0,0)', C.accentSoft]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.value, [0, 1], [C.surfaceRaised, C.accent]),
    transform: [{ scale: pop.value }],
  }));

  return (
    <Animated.View style={[styles.setRow, rowStyle]} layout={LinearTransition.duration(200)} exiting={FadeOut.duration(150)}>
      <PressableScale
        onLongPress={() => {
          tap(Haptics.ImpactFeedbackStyle.Medium);
          onRemove();
        }}
        style={styles.colSet}
        accessibilityLabel={t('active.setA11y', { n: index + 1 })}>
        <View style={styles.setNum}>
          <Txt variant="caption" color={C.text} style={styles.bold}>
            {index + 1}
          </Txt>
        </View>
      </PressableScale>
      <Txt variant="caption" style={styles.colPrev} numberOfLines={1}>
        {prev ? (prev.weight ? `${prev.weight} × ${prev.reps}` : t('common.reps', { n: prev.reps ?? 0 })) : '—'}
      </Txt>
      <NumInput
        value={set.weight}
        placeholder={prev?.weight ? String(prev.weight) : bodyweight ? t('active.bw') : '0'}
        decimal
        onChange={(v) => onChange({ weight: v })}
        dim={set.done}
      />
      <NumInput value={set.reps} placeholder={prev?.reps ? String(prev.reps) : '10'} onChange={(v) => onChange({ reps: v })} dim={set.done} />
      <PressableScale
        haptic
        onPress={onToggle}
        style={styles.colCheck}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.done }}
        accessibilityLabel={t('active.completeA11y', { n: index + 1 })}>
        <Animated.View style={[styles.check, checkStyle]}>
          <Icon name={I.check} size={14} color={set.done ? C.onAccent : C.textFaint} />
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

function NumInput({
  value,
  placeholder,
  decimal,
  onChange,
  dim,
}: {
  value: number | null;
  placeholder: string;
  decimal?: boolean;
  onChange: (v: number | null) => void;
  dim?: boolean;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  // Keep the user's in-progress text (e.g. "22.") unless the stored value changed elsewhere.
  const parsed = text === '' ? null : Number(text.replace(',', '.'));
  const shown = parsed === value ? text : value === null ? '' : String(value);

  return (
    <TextInput
      value={shown}
      onChangeText={(t) => {
        const clean = t.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, '');
        setText(clean);
        const n = clean === '' ? null : Number(clean.replace(',', '.'));
        onChange(n === null || Number.isNaN(n) ? null : n);
      }}
      placeholder={placeholder}
      placeholderTextColor={C.textFaint}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      selectTextOnFocus
      style={[styles.input, dim && styles.inputDim]}
      maxLength={6}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.page, paddingBottom: S.md },
  headCenter: { flex: 1, alignItems: 'center' },
  mono: { fontVariant: ['tabular-nums'] },
  progressWrap: { paddingHorizontal: S.page, flexDirection: 'row', alignItems: 'center', gap: S.md },
  progressText: { minWidth: 64, textAlign: 'right', fontVariant: ['tabular-nums'] },
  content: { padding: S.page, paddingTop: S.lg, gap: S.md },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: S.md,
    gap: 4,
  },
  exHead: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  exTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md },
  flex: { flex: 1, gap: 2 },
  trash: { backgroundColor: 'transparent' },
  colHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, marginBottom: 2 },
  colSet: { width: 40 },
  colPrev: { flex: 1 },
  colIn: { width: 64, textAlign: 'center', marginHorizontal: 4 },
  colCheck: { width: 44, alignItems: 'flex-end' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6, borderRadius: R.sm },
  setNum: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  input: {
    width: 64,
    height: 36,
    marginHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.surfaceRaised,
    color: C.text,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  inputDim: { backgroundColor: 'transparent' },
  check: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addSet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, marginTop: 4, borderRadius: R.sm, backgroundColor: C.bg },
  bold: { fontWeight: '700' },
  hint: { color: C.textFaint },
});
