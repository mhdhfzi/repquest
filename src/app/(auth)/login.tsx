import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AuthLayout, Field, FormMessage, GoogleButton, Headline, OrDivider, PrimaryButton, SwitchRow } from '@/components/auth-ui';
import { INTRO_MS, IntroLift } from '@/components/intro-lift';
import { Icon, I } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, F, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { authErrorText, isEmail, signIn, signInWithGoogle } from '@/lib/auth';
import { supabaseConfigured } from '@/lib/supabase';
import { useApp } from '@/stores/app-store';

// Play the lifting intro once per app launch, not every time you come back to this page.
let introPlayed = false;

export default function Login() {
  const { t } = useT();
  const setGuest = useApp((s) => s.setGuest);
  const [intro, setIntro] = useState(!introPlayed);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishIntro = useCallback(() => {
    introPlayed = true;
    setIntro(false);
  }, []);

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
    if (!isEmail(email)) return setError(t('auth.badEmail'));
    if (!password) return setError(t('auth.badPassword'));
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // The root layout switches to the app as soon as the session arrives.
    } catch (e) {
      const text = authErrorText(t, e);
      setError(text);
      if (text === t('auth.errUnconfirmed')) router.push({ pathname: '/verify', params: { email: email.trim(), type: 'signup' } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthLayout>
        <Animated.View entering={FadeIn.duration(400)} style={styles.brand}>
          <View style={styles.mark}>
            <Icon name={I.dumbbell} size={16} color={C.onAccent} />
          </View>
          <Txt style={styles.brandText}>
            REP<Txt style={[styles.brandText, styles.accent]}>QUEST</Txt>
          </Txt>
        </Animated.View>

        <View style={styles.hero}>
          <Headline lines={[t('auth.headline1'), t('auth.headline2'), t('auth.headline3')]} delay={intro ? INTRO_MS : 0} />
          <Animated.View entering={FadeInDown.delay(intro ? INTRO_MS + 300 : 300).duration(400)}>
            <Txt variant="body" color={C.textMuted} style={styles.subtitle}>
              {t('auth.subtitle')}
            </Txt>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(intro ? INTRO_MS + 400 : 400).duration(450)} style={styles.form}>
          {!supabaseConfigured ? <FormMessage text={t('auth.notConfigured')} tone="info" /> : null}
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
            returnKeyType="next"
            accessibilityLabel={t('auth.email')}
          />
          <Field
            icon={I.lock}
            secure
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            placeholder={t('auth.password')}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            accessibilityLabel={t('auth.password')}
          />
          <PressableScale onPress={() => router.push('/reset-password')} hitSlop={8} style={styles.forgot} accessibilityRole="link">
            <Txt variant="caption" color={C.textMuted}>
              {t('auth.forgot')}
            </Txt>
          </PressableScale>
          <FormMessage text={error} />
          <PrimaryButton title={t('auth.login')} onPress={submit} busy={busy} disabled={!supabaseConfigured} />
          <OrDivider />
          <GoogleButton onPress={google} busy={googleBusy} disabled={!supabaseConfigured} />
          <SwitchRow prompt={t('auth.noAccount')} action={t('auth.create')} onPress={() => router.push('/sign-up')} />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={FadeIn.delay(intro ? INTRO_MS + 600 : 600).duration(400)} style={styles.guest}>
          <PressableScale onPress={() => setGuest(true)} hitSlop={8} accessibilityRole="button">
            <Txt variant="caption" color={C.text} style={styles.guestText}>
              {t('auth.guest')}
            </Txt>
          </PressableScale>
          <Txt variant="caption" color={C.textFaint} center>
            {t('auth.guestNote')}
          </Txt>
        </Animated.View>
      </AuthLayout>

      {intro ? <IntroLift onDone={finishIntro} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  mark: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontFamily: F.poster, fontSize: 26, lineHeight: 30, color: C.text, letterSpacing: 1 },
  accent: { color: C.accent },
  hero: { marginTop: S.xxl, gap: S.md },
  subtitle: { maxWidth: 320 },
  form: { gap: S.md, marginTop: S.lg },
  forgot: { alignSelf: 'flex-end', marginTop: -S.xs },
  spacer: { flex: 1, minHeight: S.xl },
  guest: { alignItems: 'center', gap: 4 },
  guestText: { fontWeight: '600', textDecorationLine: 'underline' },
});
