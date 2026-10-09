import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase, supabaseConfigured } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  /** True once the saved session (if any) has been read. */
  ready: boolean;
  /** Keeps you on the auth screens while a multi-step flow (password reset) finishes. */
  hold: boolean;
}

export const useAuth = create<AuthState>(() => ({ session: null, ready: !supabaseConfigured, hold: false }));

if (supabaseConfigured) {
  supabase.auth
    .getSession()
    .then(({ data }) => useAuth.setState({ session: data.session, ready: true }))
    .catch(() => useAuth.setState({ ready: true }));
  supabase.auth.onAuthStateChange((_event, session) => useAuth.setState({ session, ready: true }));
}
