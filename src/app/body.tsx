import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineChart } from '@/components/charts';
import { PhotoViewer } from '@/components/photo-viewer';
import { Icon, I } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Button, Card, IconButton, SectionHeader } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { formatDayMonth, formatShortDate } from '@/lib/date';
import { deletePhoto, pickProgressPhoto } from '@/lib/photos';
import { useApp } from '@/stores/app-store';
import type { BodyStat } from '@/types';

type Field = 'weightKg' | 'waistCm' | 'chestCm' | 'armCm';
const FIELDS: { key: Field; label: 'body.weight' | 'body.waist' | 'body.chest' | 'body.arm'; unit: 'body.kg' | 'body.cm' }[] = [
  { key: 'weightKg', label: 'body.weight', unit: 'body.kg' },
  { key: 'waistCm', label: 'body.waist', unit: 'body.cm' },
  { key: 'chestCm', label: 'body.chest', unit: 'body.cm' },
  { key: 'armCm', label: 'body.arm', unit: 'body.cm' },
];

const parse = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() === '' || Number.isNaN(n) || n <= 0 ? null : Math.round(n * 10) / 10;
};

export default function BodyStats() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const stats = useApp((s) => s.bodyStats);
  const addBodyStat = useApp((s) => s.addBodyStat);
  const deleteBodyStat = useApp((s) => s.deleteBodyStat);

  const [values, setValues] = useState<Record<Field, string>>({ weightKg: '', waistCm: '', chestCm: '', armCm: '' });
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  const last = stats[stats.length - 1];
  const weights = stats.filter((s) => s.weightKg !== null);
  const photos = [...stats].reverse().filter((s) => s.photoUri);

  const addPhoto = async (source: 'camera' | 'library') => {
    const res = await pickProgressPhoto(source);
    if (!res) return;
    if ('denied' in res) {
      if (Platform.OS === 'web') globalThis.alert?.(t('body.cameraDenied'));
      else Alert.alert(t('body.photo'), t('body.cameraDenied'));
      return;
    }
    if (photo) deletePhoto(photo);
    setPhoto(res.uri);
    setError(null);
  };

  const save = () => {
    const parsed = Object.fromEntries(FIELDS.map((f) => [f.key, parse(values[f.key])])) as Record<Field, number | null>;
    if (!photo && FIELDS.every((f) => parsed[f.key] === null)) {
      setError(t('body.needValue'));
      return;
    }
    addBodyStat({ date: Date.now(), ...parsed, photoUri: photo });
    setValues({ weightKg: '', waistCm: '', chestCm: '', armCm: '' });
    setPhoto(null);
    setError(null);
  };

  const remove = (entry: BodyStat) =>
    confirm(t('body.deleteTitle'), t('body.deleteBody'), t('common.delete'), () => {
      deletePhoto(entry.photoUri);
      deleteBodyStat(entry.id);
    });

  return (
    <>
      <Stack.Screen options={{ title: t('body.title') }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + S.xxl }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Card style={styles.form}>
            <Txt variant="label">{t('body.log')}</Txt>
            <View style={styles.grid}>
              {FIELDS.map((f) => (
                <View key={f.key} style={styles.field}>
                  <Txt variant="caption">{t(f.label)}</Txt>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={values[f.key]}
                      onChangeText={(v) => setValues((cur) => ({ ...cur, [f.key]: v.replace(/[^0-9.,]/g, '') }))}
                      placeholder={last?.[f.key] ? String(last[f.key]) : '—'}
                      placeholderTextColor={C.textFaint}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      maxLength={6}
                      accessibilityLabel={`${t(f.label)} (${t(f.unit)})`}
                    />
                    <Txt variant="caption">{t(f.unit)}</Txt>
                  </View>
                </View>
              ))}
            </View>

            {photo ? (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.preview}>
                <Image source={{ uri: photo }} style={styles.previewImg} contentFit="cover" />
                <IconButton
                  icon={I.close}
                  label={t('body.removePhoto')}
                  size={32}
                  style={styles.previewClose}
                  onPress={() => {
                    deletePhoto(photo);
                    setPhoto(null);
                  }}
                />
              </Animated.View>
            ) : (
              <View style={styles.photoRow}>
                {Platform.OS !== 'web' ? (
                  <Button title={t('body.takePhoto')} kind="secondary" small icon={I.camera} style={styles.flex} onPress={() => addPhoto('camera')} />
                ) : null}
                <Button title={t('body.pickPhoto')} kind="secondary" small icon={I.photo} style={styles.flex} onPress={() => addPhoto('library')} />
              </View>
            )}
            <Txt variant="caption" color={C.textFaint}>
              {t('body.photoLocal')}
            </Txt>
            {error ? (
              <Txt variant="caption" color={C.danger}>
                {error}
              </Txt>
            ) : null}
            <Button title={t('body.saveEntry')} icon={I.check} onPress={save} />
          </Card>
        </Animated.View>

        {weights.length ? (
          <>
            <SectionHeader title={t('body.weightTrend')} />
            <Card>
              <LineChart
                key={weights.length}
                data={weights.map((s) => ({ label: formatDayMonth(s.date), detail: formatShortDate(s.date), value: s.weightKg! }))}
                format={(n) => `${n} kg`}
              />
            </Card>
          </>
        ) : null}

        {photos.length ? (
          <>
            <SectionHeader title={t('body.photos')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.photos}>
              {photos.map((s, i) => (
                <PressableScale
                  key={s.id}
                  onPress={() => setViewing(i)}
                  style={styles.thumbWrap}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${t('body.viewPhoto')}, ${formatShortDate(s.date)}`}>
                  <Image source={{ uri: s.photoUri! }} style={styles.thumb} contentFit="cover" transition={200} />
                  <Txt variant="caption" center>
                    {formatDayMonth(s.date)}
                  </Txt>
                </PressableScale>
              ))}
            </ScrollView>
          </>
        ) : null}

        {stats.length ? (
          <>
            <SectionHeader title={t('body.history')} />
            <Card style={styles.history}>
              {[...stats].reverse().map((s, i) => (
                <Animated.View key={s.id} layout={LinearTransition} exiting={FadeOut} style={[styles.histRow, i > 0 && styles.divider]}>
                  {s.photoUri ? (
                    <PressableScale
                      onPress={() => setViewing(photos.findIndex((p) => p.id === s.id))}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={t('body.viewPhoto')}>
                      <Image source={{ uri: s.photoUri }} style={styles.histThumb} contentFit="cover" />
                    </PressableScale>
                  ) : (
                    <View style={[styles.histThumb, styles.noThumb]}>
                      <Icon name={I.scale} size={14} color={C.textFaint} />
                    </View>
                  )}
                  <View style={styles.flex}>
                    <Txt variant="bodyStrong">{s.weightKg !== null ? `${s.weightKg} kg` : '—'}</Txt>
                    <Txt variant="caption" numberOfLines={1}>
                      {[
                        formatShortDate(s.date),
                        ...FIELDS.slice(1)
                          .filter((f) => s[f.key] !== null)
                          .map((f) => `${t(f.label)} ${s[f.key]}`),
                      ].join(' · ')}
                    </Txt>
                  </View>
                  <IconButton icon={I.trash} label={t('common.delete')} size={32} color={C.textMuted} style={styles.trash} onPress={() => remove(s)} />
                </Animated.View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
      {viewing !== null ? <PhotoViewer key={viewing} entries={photos} startIndex={viewing} onClose={() => setViewing(null)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.page, paddingTop: S.sm },
  flex: { flex: 1 },
  form: { gap: S.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -S.xs },
  field: { width: '50%', padding: S.xs, gap: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    height: 44,
    paddingHorizontal: S.md,
    borderRadius: R.sm,
    backgroundColor: C.surfaceRaised,
  },
  input: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'], height: '100%' },
  photoRow: { flexDirection: 'row', gap: S.sm },
  preview: { alignSelf: 'flex-start' },
  previewImg: { width: 120, height: 160, borderRadius: R.md, backgroundColor: C.surfaceRaised },
  previewClose: { position: 'absolute', top: 6, right: 6, backgroundColor: C.overlay },
  bleed: { marginHorizontal: -S.page },
  photos: { gap: S.sm, paddingHorizontal: S.page },
  thumbWrap: { gap: 4 },
  thumb: { width: 108, height: 144, borderRadius: R.md, backgroundColor: C.surfaceRaised },
  history: { paddingVertical: S.xs },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  histThumb: { width: 36, height: 48, borderRadius: 8 },
  noThumb: { backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  trash: { backgroundColor: 'transparent' },
});
