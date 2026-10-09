import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, I, type IconName } from '@/components/ui/icon';
import { Button } from '@/components/ui/primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, F, R, S } from '@/constants/theme';
import { useT } from '@/i18n';

/** Scaffold for the sign-in screens: safe areas, keyboard handling, optional back button. */
export function AuthLayout({ children, back }: { children: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + S.lg, paddingBottom: insets.bottom + S.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {back ? (
          <PressableScale haptic onPress={() => router.back()} hitSlop={10} style={styles.back} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <Icon name={I.chevronLeft} size={18} color={C.text} />
          </PressableScale>
        ) : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Big poster headline. The last line is lime, like "LIFT. LOG. LEVEL UP." */
export function Headline({ lines, accentLast = true, delay = 0 }: { lines: string[]; accentLast?: boolean; delay?: number }) {
  return (
    <View accessibilityRole="header">
      {lines.map((line, i) => (
        <Animated.View key={i} entering={FadeInDown.delay(delay + i * 90).duration(450).springify().damping(16)}>
          <Txt style={[styles.headline, accentLast && i === lines.length - 1 && styles.accent]}>{line}</Txt>
        </Animated.View>
      ))}
    </View>
  );
}

/** Pill-shaped input with a leading icon; password fields get a show/hide toggle. */
export function Field({ icon, secure, ...rest }: TextInputProps & { icon: IconName; secure?: boolean }) {
  const { t } = useT();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, focused && styles.fieldFocused]}>
      <Icon name={icon} size={16} color={focused ? C.accent : C.textMuted} />
      <TextInput
        {...rest}
        secureTextEntry={secure && hidden}
        placeholderTextColor={C.textFaint}
        style={styles.input}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
      {secure ? (
        <PressableScale
          onPress={() => setHidden((h) => !h)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}>
          <Icon name={hidden ? I.eye : I.eyeOff} size={16} color={C.textMuted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Lime pill button, full width. */
export function PrimaryButton({ title, onPress, busy, disabled }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  return <Button title={busy ? '…' : title} onPress={onPress} disabled={disabled || busy} style={styles.pill} />;
}

export function FormMessage({ text, tone = 'error' }: { text: string | null; tone?: 'error' | 'info' | 'success' }) {
  if (!text) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.message, tone !== 'error' && styles.messageInfo]}>
      <Icon name={tone === 'success' ? I.check : I.info} size={14} color={tone === 'error' ? C.danger : C.accent} />
      <Txt variant="caption" color={tone === 'error' ? C.danger : C.accent} style={styles.flex}>
        {text}
      </Txt>
    </Animated.View>
  );
}

/** "New here?  Create account" style row. */
export function SwitchRow({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.switchRow}>
      <Txt variant="caption">{prompt}</Txt>
      <PressableScale onPress={onPress} hitSlop={8} accessibilityRole="link">
        <Txt variant="caption" color={C.accent} style={styles.bold}>
          {action}
        </Txt>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1, paddingHorizontal: S.page, gap: S.lg },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.sm,
  },
  headline: { fontFamily: F.poster, fontSize: 64, lineHeight: 62, color: C.text, letterSpacing: 1 },
  accent: { color: C.accent },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    height: 54,
    paddingHorizontal: S.lg,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  fieldFocused: { borderColor: C.accentDim },
  input: { flex: 1, height: '100%', color: C.text, fontSize: 16 },
  pill: { borderRadius: R.pill, height: 56 },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: C.dangerSoft,
  },
  messageInfo: { backgroundColor: C.accentSoft },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
});
