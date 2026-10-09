import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuthLayout, Field, FormMessage, GoogleButton, Headline, OrDivider, PrimaryButton, SwitchRow } from '@/components/auth-ui';
import { I } from '@/components/ui/icon';
import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { authErrorText, isEmail, signInWithGoogle, signUp } from '@/lib/auth';
import { useApp } from '@/stores/app-store';

export default function SignUp() {
  const { t } = useT();
  const updateProfile = useApp((s) => s.updateProfile);
  const profileName = useApp((s) => s.profile.name);
  const [name, setName] = useState(profileName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [googleBusy, setGoogleBusy] = useState(false);
  const google = async () => {
    setGoogleBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(authErrorText(t, e));
    } finally {
      setGoogleBusy(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) return setError(t('auth.needName'));
    if (!isEmail(email)) return setError(t('auth.badEmail'));
    if (password.length < 8) return setError(t('auth.badPassword'));
    setBusy(true);
    setError(null);
    try {
      const needsCode = await signUp(email.trim(), password, name.trim());
      // Fill the profile name now so onboarding can skip asking for it.
      if (!profileName) updateProfile({ name: name.trim() });
      if (needsCode) router.push({ pathname: '/verify', params: { email: email.trim(), type: 'signup' } });
    } catch (e) {
      setError(authErrorText(t, e));
    } finally {
      setBusy(false);
    }
  };

  const clear = () => setError(null);

  return (
    <AuthLayout back>
      <Headline lines={[t('auth.signupTitle1'), t('auth.signupTitle2')]} />
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Txt variant="body" color={C.textMuted}>
          {t('auth.signupSub')}
        </Txt>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.form}>
        <Field
          icon={I.profile}
          value={name}
          onChangeText={(v) => {
            setName(v);
            clear();
          }}
          placeholder={t('auth.name')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={24}
          accessibilityLabel={t('auth.name')}
        />
        <Field
          icon={I.mail}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clear();
          }}
          placeholder={t('auth.email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          accessibilityLabel={t('auth.email')}
        />
        <View style={styles.passwordWrap}>
          <Field
            icon={I.lock}
            secure
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              clear();
            }}
            placeholder={t('auth.password')}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            accessibilityLabel={t('auth.password')}
          />
          <Txt variant="caption" color={C.textFaint} style={styles.hint}>
            {t('auth.passwordHint')}
          </Txt>
        </View>
        <FormMessage text={error} />
        <PrimaryButton title={t('auth.create')} onPress={submit} busy={busy} />
        <OrDivider />
        <GoogleButton onPress={google} busy={googleBusy} />
        <SwitchRow prompt={t('auth.haveAccount')} action={t('auth.login')} onPress={() => router.back()} />
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: S.md, marginTop: S.md },
  passwordWrap: { gap: 6 },
  hint: { paddingLeft: S.lg },
});
