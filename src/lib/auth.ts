import type { AuthError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { TFn } from '@/i18n';
import { supabase } from '@/lib/supabase';

/**
 * Account actions. Sign-up and password reset use the 6-digit code from the email
 * (not a link), so they work inside Expo Go without deep links.
 */

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Returns true when the account still needs its email code before you're signed in. */
export async function signUp(email: string, password: string, name: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw error;
  return !data.session;
}

export async function verifyCode(email: string, token: string, type: 'signup' | 'recovery') {
  const { error } = await supabase.auth.verifyOtp({ email, token, type });
  if (error) throw error;
}

export async function resendSignupCode(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function sendResetCode(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function setNewPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

// On web, the Google pop-up closes itself and hands the result back to the opener.
WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google in an in-app browser. Returns false if you closed it.
 * The return address must be allowed in Supabase → Authentication → URL Configuration.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const { queryParams } = Linking.parse(result.url);
  const failure = queryParams?.error_description ?? queryParams?.error;
  if (failure) throw new Error(String(failure));
  const code = queryParams?.code;
  if (typeof code !== 'string') throw new Error('No sign-in code returned');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Friendly, translated text for the errors people actually hit. */
export function authErrorText(t: TFn, e: unknown): string {
  const err = e as Partial<AuthError> | undefined;
  const code = err?.code ?? '';
  const msg = err?.message ?? String(e);
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return t('auth.errInvalid');
  if (code === 'email_not_confirmed' || /not confirmed/i.test(msg)) return t('auth.errUnconfirmed');
  if (code === 'user_already_exists' || /already registered/i.test(msg)) return t('auth.errExists');
  if (code === 'weak_password' || /password should be/i.test(msg)) return t('auth.errWeak');
  if (code === 'otp_expired' || /expired|invalid.*(otp|token)/i.test(msg)) return t('auth.errCode');
  if (code === 'over_email_send_rate_limit' || /rate limit|too many/i.test(msg)) return t('auth.errRate');
  if (/provider is not enabled|unsupported provider/i.test(msg)) return t('auth.errGoogleOff');
  if (/network|fetch/i.test(msg)) return t('auth.errNetwork');
  return t('auth.errGeneric', { msg });
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
