import type { AuthError, Session, User } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SAFE_PROFILE_COLUMNS, type Profile } from '@/lib/types';

type SignInResult = {
  error: AuthError | Error | null;
};

type AuthContextValue = {
  authError: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<SignInResult>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(session: Session | null): Promise<{ profile: Profile | null; error: string | null }> {
  if (!supabase || !session?.user) {
    return { profile: null, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(SAFE_PROFILE_COLUMNS)
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    return { profile: null, error: 'Nao foi possivel carregar seu perfil.' };
  }

  return { profile: (data as Profile | null) ?? null, error: data ? null : 'Perfil nao encontrado.' };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(isSupabaseConfigured);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    setIsProfileLoading(Boolean(nextSession));
    const result = await fetchProfile(nextSession);
    setProfile(result.profile);
    setAuthError(result.error);
    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    void loadProfile(session);
  }, [isSessionLoading, loadProfile, session]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    if (!supabase) {
      return { error: new Error('Configure as variaveis do Supabase antes de entrar.') };
    }

    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError('Email ou senha invalidos.');
    }

    return { error };
  }, []);

  const signOut = useCallback(async (): Promise<SignInResult> => {
    if (!supabase) {
      return { error: new Error('Supabase nao esta configurado.') };
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError('Nao foi possivel sair da conta.');
    }

    return { error };
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authError,
      isConfigured: isSupabaseConfigured,
      isLoading: isSessionLoading || isProfileLoading,
      isProfileLoading,
      profile,
      refreshProfile,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [authError, isProfileLoading, isSessionLoading, profile, refreshProfile, session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
