import '@/lib/local-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False until `.env.local` has the project URL and publishable key. */
export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || 'https://not-configured.supabase.co', key || 'not-configured', {
  auth: {
    // Undefined during static web rendering; Supabase then keeps the session in memory.
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Google sign-in returns a one-time code to the app, which is swapped for a session (PKCE).
    flowType: 'pkce',
  },
});

// Only refresh tokens while the app is in the foreground.
if (Platform.OS !== 'web' && supabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
