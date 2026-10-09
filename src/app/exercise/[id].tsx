import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BodyMap, Legend, PRIMARY_SECONDARY } from '@/components/body-map';
import { ExercisePreview } from '@/components/exercise-media';
import { Icon, I } from '@/components/ui/icon';
import { Button, Card, Tag } from '@/components/ui/primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { GROUP_BY_ID } from '@/constants/muscles';
import { C, S } from '@/constants/theme';
import { formatShortDate } from '@/lib/date';
import { useT } from '@/i18n';
import { equipLabel, muscleLabel, sourceMuscleLabel, tagLabel } from '@/i18n/labels';
import { bodyDataForExercise, getExercise } from '@/lib/exercises';
import { useApp } from '@/stores/app-store';

export default function ExerciseDetail() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const ex = getExercise(id);
  const favorite = useApp((s) => s.favorites.includes(id));
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const active = useApp((s) => s.active);
  const pr = useApp((s) => s.prs[id]);
  const workouts = useApp((s) => s.workouts);
  const startWorkout = useApp((s) => s.startWorkout);
  const addExercise = useApp((s) => s.addExercise);
  // Re-render when your custom exercises change (e.g. after editing this one).
  useApp((s) => s.customExercises);

  if (!ex) {
    return (
      <View style={styles.missing}>
        <Txt variant="heading">{t('exercise.notFound')}</Txt>
      </View>
    );
  }

  const lastLog = [...workouts].reverse().find((w) => w.exercises.some((e) => e.exerciseId === id));
  const lastSets = lastLog?.exercises.find((e) => e.exerciseId === id)?.sets ?? [];
  const inActive = active?.exercises.some((e) => e.exerciseId === id);
  const muscles = ex.primary.map((m) => sourceMuscleLabel(t, m));
  const secondary = ex.secondary.map((m) => sourceMuscleLabel(t, m));

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              {ex.custom ? (
                <PressableScale
                  haptic
                  onPress={() => router.push({ pathname: '/exercise/edit', params: { id } })}
                  hitSlop={10}
                  accessibilityLabel={t('custom.edit')}>
                  <Icon name={I.pencil} size={20} color={C.text} />
                </PressableScale>
              ) : null}
              <PressableScale haptic onPress={() => toggleFavorite(id)} hitSlop={10} accessibilityLabel={favorite ? t('exercise.favRemove') : t('exercise.favAdd')}>
                <Animated.View key={String(favorite)} entering={ZoomIn.springify()}>
                  <Icon name={favorite ? I.starFill : I.star} size={22} color={favorite ? C.flame : C.text} />
                </Animated.View>
              </PressableScale>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + S.xxl }]}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <ExercisePreview id={id} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.titleBlock}>
          <Txt variant="label" color={C.accent}>
            {muscleLabel(t, ex.group)}
          </Txt>
          <Txt variant="title">{ex.name}</Txt>
          <View style={styles.tags}>
            <Tag label={equipLabel(t, ex.equipment)} />
            <Tag label={tagLabel(t, 'level', ex.level)} />
            <Tag label={tagLabel(t, 'mechanic', ex.mechanic)} />
            {ex.custom ? <Tag label={t('library.custom')} color={C.accent} bg={C.accentSoft} /> : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Card>
            <Txt variant="label">{t('exercise.muscles')}</Txt>
            <View style={styles.map}>
              <BodyMap data={bodyDataForExercise(ex)} scale={0.6} />
            </View>
            <Legend
              items={[
                { color: PRIMARY_SECONDARY[1], label: muscles.join(', ') },
                ...(secondary.length ? [{ color: PRIMARY_SECONDARY[0], label: secondary.slice(0, 3).join(', ') }] : []),
              ]}
            />
          </Card>
        </Animated.View>

        {pr || lastLog ? (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.statsRow}>
            {pr ? (
              <Card style={styles.statCard}>
                <View style={styles.statHead}>
                  <Icon name={I.trophy} size={14} color={C.flame} />
                  <Txt variant="label">{t('exercise.best')}</Txt>
                </View>
                <Txt variant="number">{pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : t('common.reps', { n: pr.reps })}</Txt>
                <Txt variant="caption">{formatShortDate(pr.date)}</Txt>
              </Card>
            ) : null}
            {lastLog ? (
              <Card style={styles.statCard}>
                <View style={styles.statHead}>
                  <Icon name={I.calendar} size={14} color={C.info} />
                  <Txt variant="label">{t('exercise.lastTime')}</Txt>
                </View>
                <Txt variant="number">{t('common.sets', { n: lastSets.length })}</Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {lastSets.map((s) => (s.weight ? `${s.weight}×${s.reps}` : `${s.reps}`)).join(' · ')}
                </Txt>
              </Card>
            ) : null}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.steps}>
          <Txt variant="label">{t('exercise.howTo')}</Txt>
          {!ex.instructions.length ? <Txt variant="caption">{t('custom.noSteps')}</Txt> : null}
          {ex.instructions.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Txt variant="caption" color={C.accent} style={styles.stepNumText}>
                  {i + 1}
                </Txt>
              </View>
              <Txt variant="body" style={styles.stepText}>
                {step}
              </Txt>
            </View>
          ))}
        </Animated.View>

        {active ? (
          <Button
            title={inActive ? t('exercise.inWorkout') : t('exercise.addToWorkout')}
            icon={inActive ? I.check : I.plus}
            disabled={inActive}
            onPress={() => {
              addExercise(id);
              router.back();
            }}
          />
        ) : (
          <Button
            title={t('exercise.startWith')}
            icon={I.play}
            onPress={() => {
              startWorkout({ focus: GROUP_BY_ID[ex.group].label, groups: [ex.group], exerciseIds: [id] });
              router.push('/workout/active');
            }}
          />
        )}
        {ex.custom ? null : (
          <Txt variant="caption" center style={styles.credit}>
            {t('exercise.credit')}
          </Txt>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.page, paddingTop: S.sm, gap: S.xl },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: S.lg },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  titleBlock: { gap: S.xs },
  tags: { flexDirection: 'row', gap: 6, marginTop: S.sm },
  map: { alignItems: 'center', paddingVertical: S.md },
  statsRow: { flexDirection: 'row', gap: S.md },
  statCard: { flex: 1, gap: 4, padding: S.md },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  steps: { gap: S.md },
  step: { flexDirection: 'row', gap: S.md },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  stepNumText: { fontWeight: '800' },
  stepText: { flex: 1, color: '#D3D6DC' },
  credit: { color: C.textFaint, marginTop: -S.sm },
});

