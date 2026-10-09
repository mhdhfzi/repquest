import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { I } from '@/components/ui/icon';
import { Button, Chip, IconButton } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { ALL_EQUIPMENT, MUSCLE_GROUPS } from '@/constants/muscles';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { equipLabel, muscleLabel } from '@/i18n/labels';
import { confirm, notify } from '@/lib/confirm';
import { uid } from '@/lib/date';
import { allExercises, getExercise, GROUP_TO_SOURCE } from '@/lib/exercises';
import { deletePhoto, pickExercisePhoto, type PhotoSource } from '@/lib/photos';
import { useApp } from '@/stores/app-store';
import type { Equipment, Exercise, MuscleGroupId } from '@/types';

/** Create a custom exercise, or edit one when opened with `?id=`. */
export default function EditExercise() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getExercise(id) : undefined;
  const saveCustomExercise = useApp((s) => s.saveCustomExercise);
  const deleteCustomExercise = useApp((s) => s.deleteCustomExercise);

  const [name, setName] = useState(existing?.name ?? '');
  const [group, setGroup] = useState<MuscleGroupId | null>(existing?.group ?? null);
  const [secondary, setSecondary] = useState<MuscleGroupId[]>(() =>
    existing ? MUSCLE_GROUPS.filter((g) => g.id !== existing.group && GROUP_TO_SOURCE[g.id].some((m) => existing.secondary.includes(m))).map((g) => g.id) : [],
  );
  const [equipment, setEquipment] = useState<Equipment>((existing?.equipment as Equipment) ?? 'bodyweight');
  const [mechanic, setMechanic] = useState<'compound' | 'isolation'>(existing?.mechanic === 'isolation' ? 'isolation' : 'compound');
  const [steps, setSteps] = useState(existing?.instructions.join('\n') ?? '');
  const [photo, setPhoto] = useState<string | null>(existing?.photoUri ?? null);
  const [error, setError] = useState<string | null>(null);

  const addPhoto = async (source: PhotoSource) => {
    const res = await pickExercisePhoto(source);
    if (!res) return;
    if ('denied' in res) return notify(t('custom.photo'), t('body.cameraDenied'));
    // Only delete a photo we picked in this session — the saved one stays until you save.
    if (photo && photo !== existing?.photoUri) deletePhoto(photo);
    setPhoto(res.uri);
  };

  const removePhoto = () => {
    if (photo && photo !== existing?.photoUri) deletePhoto(photo);
    setPhoto(null);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed || !group) return setError(t('custom.needName'));
    const clash = allExercises().find((e) => e.id !== existing?.id && e.name.toLowerCase() === trimmed.toLowerCase());
    if (clash) return setError(t('custom.duplicate', { name: clash.name }));

    const exercise: Exercise = {
      id: existing?.id ?? `custom-${uid()}`,
      name: trimmed,
      group,
      primary: GROUP_TO_SOURCE[group],
      secondary: secondary.filter((g) => g !== group).flatMap((g) => GROUP_TO_SOURCE[g]),
      equipment,
      level: 'beginner',
      mechanic,
      instructions: steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      custom: true,
      photoUri: photo,
    };
    if (existing?.photoUri && existing.photoUri !== photo) deletePhoto(existing.photoUri);
    saveCustomExercise(exercise);
    router.back();
  };

  const remove = () =>
    existing &&
    confirm(t('custom.deleteTitle'), t('custom.deleteBody'), t('common.delete'), () => {
      deletePhoto(existing.photoUri ?? null);
      if (photo !== existing.photoUri) deletePhoto(photo);
      deleteCustomExercise(existing.id);
      // Leave both this form and the (now hidden) exercise's detail page.
      router.dismissTo('/library');
    });

  const toggleSecondary = (g: MuscleGroupId) =>
    setSecondary((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  return (
    <>
      <Stack.Screen options={{ title: existing ? t('custom.titleEdit') : t('custom.titleNew') }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + S.xxl }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Field label={t('custom.name')}>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            placeholder={t('custom.namePlaceholder')}
            placeholderTextColor={C.textFaint}
            style={styles.input}
            maxLength={60}
            autoCapitalize="words"
            autoFocus={!existing}
          />
        </Field>

        <Field label={t('custom.mainMuscle')}>
          <View style={styles.chips}>
            {MUSCLE_GROUPS.map((g) => (
              <Chip
                key={g.id}
                label={muscleLabel(t, g.id)}
                selected={group === g.id}
                onPress={() => {
                  setGroup(g.id);
                  setSecondary((cur) => cur.filter((x) => x !== g.id));
                  setError(null);
                }}
              />
            ))}
          </View>
        </Field>

        <Field label={t('custom.alsoWorks')}>
          <View style={styles.chips}>
            {MUSCLE_GROUPS.filter((g) => g.id !== group).map((g) => (
              <Chip key={g.id} label={muscleLabel(t, g.id)} selected={secondary.includes(g.id)} onPress={() => toggleSecondary(g.id)} />
            ))}
          </View>
        </Field>

        <Field label={t('custom.equipment')}>
          <View style={styles.chips}>
            {ALL_EQUIPMENT.map((e) => (
              <Chip key={e} label={equipLabel(t, e)} selected={equipment === e} onPress={() => setEquipment(e)} />
            ))}
          </View>
        </Field>

        <Field label={t('custom.type')}>
          <View style={styles.chips}>
            {(['compound', 'isolation'] as const).map((m) => (
              <Chip key={m} label={t(`mechanic.${m}`)} selected={mechanic === m} onPress={() => setMechanic(m)} />
            ))}
          </View>
        </Field>

        <Field label={t('custom.steps')}>
          <TextInput
            value={steps}
            onChangeText={setSteps}
            placeholder={t('custom.stepsPlaceholder')}
            placeholderTextColor={C.textFaint}
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Field label={t('custom.photo')}>
          {photo ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.preview}>
              <Image source={{ uri: photo }} style={styles.previewImg} contentFit="cover" />
              <IconButton icon={I.close} label={t('body.removePhoto')} size={32} style={styles.previewClose} onPress={removePhoto} />
            </Animated.View>
          ) : (
            <View style={styles.photoRow}>
              {Platform.OS !== 'web' ? (
                <Button title={t('body.takePhoto')} kind="secondary" small icon={I.camera} style={styles.flex} onPress={() => addPhoto('camera')} />
              ) : null}
              <Button title={t('body.pickPhoto')} kind="secondary" small icon={I.photo} style={styles.flex} onPress={() => addPhoto('library')} />
            </View>
          )}
        </Field>

        {error ? (
          <Txt variant="caption" color={C.danger}>
            {error}
          </Txt>
        ) : null}
        <Button title={t('custom.save')} icon={I.check} onPress={save} />
        {existing ? <Button title={t('custom.delete')} kind="danger" icon={I.trash} onPress={remove} /> : null}
      </ScrollView>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Txt variant="label">{label}</Txt>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.page, paddingTop: S.sm, gap: S.xl },
  flex: { flex: 1 },
  field: { gap: S.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  input: {
    minHeight: 48,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderStrong,
    color: C.text,
    fontSize: 16,
  },
  multiline: { minHeight: 120, paddingTop: S.md, paddingBottom: S.md, lineHeight: 22 },
  photoRow: { flexDirection: 'row', gap: S.sm },
  preview: { alignSelf: 'flex-start' },
  previewImg: { width: 200, height: 150, borderRadius: R.md, backgroundColor: C.surfaceRaised },
  previewClose: { position: 'absolute', top: 6, right: 6, backgroundColor: C.overlay },
});
