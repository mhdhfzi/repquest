import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuthLayout, Field, FormMessage, Headline, PrimaryButton } from '@/components/auth-ui';
import { I } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { authErrorText, resendSignupCode, verifyCode } from '@/lib/auth';

/** Enter the code from the sign-up email. Success signs you in, and the app opens. */
export default function Verify() {
  const { t } = useT();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);

  const submit = async () => {
    if (code.length < 6) return;
    setBusy(true);
    setMessage(null);
    try {
      await verifyCode(email, code, 'signup');
    } catch (e) {
      setMessage({ text: authErrorText(t, e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await resendSignupCode(email);
      setMessage({ text: t('auth.resent'), tone: 'success' });
    } catch (e) {
      setMessage({ text: authErrorText(t, e), tone: 'error' });
    }
  };

  return (
    <AuthLayout back>
      <Headline lines={[t('auth.verifyTitle1'), t('auth.verifyTitle2')]} />
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Txt variant="body" color={C.textMuted}>
          {t('auth.verifyBody', { email })}
        </Txt>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.form}>
        <Field
          icon={I.code}
          value={code}
          onChangeText={(v) => {
            setCode(v.replace(/\D/g, ''));
            setMessage(null);
          }}
          placeholder={t('auth.code')}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={10}
          autoFocus
          onSubmitEditing={submit}
          accessibilityLabel={t('auth.code')}
        />
        <FormMessage text={message?.text ?? null} tone={message?.tone} />
        <PrimaryButton title={t('auth.verify')} onPress={submit} busy={busy} disabled={code.length < 6} />
        <PressableScale onPress={resend} hitSlop={8} style={styles.resend} accessibilityRole="button">
          <Txt variant="caption" color={C.accent} style={styles.bold}>
            {t('auth.resend')}
          </Txt>
        </PressableScale>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: S.md, marginTop: S.md },
  resend: { alignSelf: 'center' },
  bold: { fontWeight: '700' },
});
