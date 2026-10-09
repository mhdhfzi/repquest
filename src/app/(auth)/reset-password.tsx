import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuthLayout, Field, FormMessage, Headline, PrimaryButton } from '@/components/auth-ui';
import { I } from '@/components/ui/icon';
import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { authErrorText, isEmail, sendResetCode, setNewPassword, verifyCode } from '@/lib/auth';
import { useAuth } from '@/stores/auth-store';

/** Two steps: email → code + new password. Verifying the code signs you in, then the password is saved. */
export default function ResetPassword() {
  const { t } = useT();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!isEmail(email)) return setError(t('auth.badEmail'));
    setBusy(true);
    setError(null);
    try {
      await sendResetCode(email.trim());
      setStep('code');
    } catch (e) {
      setError(authErrorText(t, e));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (code.length < 6) return setError(t('auth.errCode'));
    if (password.length < 8) return setError(t('auth.badPassword'));
    setBusy(true);
    setError(null);
    // The code signs you in; stay here until the new password is saved too.
    useAuth.setState({ hold: true });
    try {
      await verifyCode(email.trim(), code, 'recovery');
      await setNewPassword(password);
    } catch (e) {
      setError(authErrorText(t, e));
    } finally {
      setBusy(false);
      useAuth.setState({ hold: false });
    }
  };

  return (
    <AuthLayout back>
      <Headline lines={[t('auth.resetTitle1'), t('auth.resetTitle2')]} />
      <Animated.View key={step} entering={FadeInDown.duration(400)} style={styles.form}>
        <Txt variant="body" color={C.textMuted}>
          {step === 'email' ? t('auth.resetBody') : t('auth.resetCodeBody', { email: email.trim() })}
        </Txt>
        {step === 'email' ? (
          <Field
            icon={I.mail}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
            placeholder={t('auth.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={send}
            accessibilityLabel={t('auth.email')}
          />
        ) : (
          <>
            <Field
              icon={I.code}
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder={t('auth.code')}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={10}
              autoFocus
              accessibilityLabel={t('auth.code')}
            />
            <Field
              icon={I.lock}
              secure
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              placeholder={t('auth.newPassword')}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={save}
              accessibilityLabel={t('auth.newPassword')}
            />
          </>
        )}
        <FormMessage text={error} />
        {step === 'email' ? (
          <PrimaryButton title={t('auth.sendCode')} onPress={send} busy={busy} />
        ) : (
          <PrimaryButton title={t('auth.savePassword')} onPress={save} busy={busy} />
        )}
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: S.md, marginTop: S.sm },
});
