import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BodyMap } from '@/components/body-map';
import { Icon, I } from '@/components/ui/icon';
import { Button, Chip } from '@/components/ui/primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { ALL_EQUIPMENT } from '@/constants/muscles';
import { SPLITS } from '@/constants/splits';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { equipLabel, focusLabel, splitBlurb, splitName } from '@/i18n/labels';
import { bodyDataForGroups } from '@/lib/exercises';
import { useApp } from '@/stores/app-store';
import type { Equipment, SplitId } from '@/types';

const STEPS = 3;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { t, lang } = useT();
  const complete = useApp((s) => s.completeOnboarding);
  const updateProfile = useApp((s) => s.updateProfile);
  const [step, setStep] = useState(0);
  // Pre-filled when you entered your name while creating an account.
  const [name, setName] = useState(() => useApp.getState().profile.name);
  const [splitId, setSplitId] = useState<SplitId>('ppl');
  const [equipment, setEquipment] = useState<Equipment[]>(['bodyweight', 'dumbbell']);

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else complete({ name: name.trim() || t('common.athlete'), splitId, equipment });
  };

  const toggleEquip = (e: Equipment) =>
    setEquipment((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + S.lg }]}>
        <View style={styles.dots}>
          {Array.from({ length: STEPS }, (_, i) => (
            <Animated.View
              key={i}
              layout={LinearTransition.springify().damping(18)}
              style={[styles.dot, i === step && styles.dotOn, i < step && styles.dotDone]}
            />
          ))}
        </View>
        {step > 0 ? (
          <PressableScale onPress={() => setStep(step - 1)} hitSlop={10}>
            <Txt variant="caption">{t('common.back')}</Txt>
          </PressableScale>
        ) : (
          <View style={styles.langs}>
            {(['en', 'ms'] as const).map((l) => (
              <PressableScale
                key={l}
                haptic
                onPress={() => updateProfile({ language: l })}
                hitSlop={6}
                style={[styles.lang, lang === l && styles.langOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: lang === l }}>
                <Txt variant="caption" color={lang === l ? C.onAccent : C.textMuted} style={styles.langText}>
                  {l === 'en' ? 'EN' : 'BM'}
                </Txt>
              </PressableScale>
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <Animated.View key="s0" entering={FadeIn.duration(500)} exiting={FadeOutLeft.duration(200)} style={styles.step}>
            <View style={styles.hero}>
              <BodyMap data={bodyDataForGroups(['chest', 'back', 'quads', 'shoulders', 'abs', 'glutes'])} scale={0.55} labels={false} />
            </View>
            <Txt variant="label" color={C.accent}>
              RepQuest
            </Txt>
            <Txt variant="display">{t('onb.tagline')}</Txt>
            <Txt variant="body" color={C.textMuted}>
              {t('onb.body')}
            </Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('onb.name')}
              placeholderTextColor={C.textFaint}
              style={styles.input}
              returnKeyType="next"
              onSubmitEditing={next}
              autoCapitalize="words"
            />
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="s1" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={styles.step}>
            <Txt variant="title">{t('onb.splitTitle')}</Txt>
            <Txt variant="caption">{t('onb.splitSub')}</Txt>
            <View style={styles.list}>
              {SPLITS.map((s) => {
                const on = s.id === splitId;
                return (
                  <PressableScale
                    key={s.id}
                    haptic
                    onPress={() => setSplitId(s.id)}
                    style={[styles.option, on && styles.optionOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}>
                    <View style={styles.flex}>
                      <Txt variant="heading">{splitName(t, s.id)}</Txt>
                      <Txt variant="caption">{splitBlurb(t, s.id)}</Txt>
                      <View style={styles.dayRow}>
                        {s.days.map((d) => (
                          <View key={d.label} style={styles.dayPill}>
                            <Txt variant="caption" style={styles.dayPillText}>
                              {focusLabel(t, d.label)}
                            </Txt>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>
                      {on ? <Icon name={I.check} size={12} color={C.onAccent} /> : null}
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="s2" entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={styles.step}>
            <Txt variant="title">{t('onb.equipTitle')}</Txt>
            <Txt variant="caption">{t('onb.equipSub')}</Txt>
            <View style={styles.chips}>
              {ALL_EQUIPMENT.map((e) => (
                <Chip
                  key={e}
                  label={equipLabel(t, e)}
                  selected={e === 'bodyweight' || equipment.includes(e)}
                  onPress={e === 'bodyweight' ? undefined : () => toggleEquip(e)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + S.lg }]}>
        <Button title={step === STEPS - 1 ? t('onb.go') : t('onb.continue')} onPress={next} icon={step === STEPS - 1 ? I.bolt : undefined} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.page },
  dots: { flexDirection: 'row', gap: 6 },
  langs: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: R.pill, backgroundColor: C.surface },
  lang: { paddingHorizontal: 10, height: 26, borderRadius: 13, justifyContent: 'center' },
  langOn: { backgroundColor: C.accent },
  langText: { fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  dotOn: { width: 28, backgroundColor: C.accent },
  dotDone: { backgroundColor: C.accentDim },
  body: { padding: S.page, paddingTop: S.xl, flexGrow: 1 },
  step: { gap: S.md },
  hero: { alignItems: 'center', marginBottom: S.lg },
  input: {
    marginTop: S.lg,
    height: 54,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderStrong,
    color: C.text,
    fontSize: 16,
  },
  list: { gap: S.md, marginTop: S.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.lg,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  optionOn: { borderColor: C.accent, backgroundColor: C.accentSoft },
  flex: { flex: 1, gap: 4 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  dayPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: C.surfaceRaised },
  dayPillText: { fontSize: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: C.accent, borderColor: C.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.md },
  footer: { paddingHorizontal: S.page, paddingTop: S.md },
});
