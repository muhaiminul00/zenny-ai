import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Admin Provisioning Bootstrap: role + must_change_password now live here
// (single source of truth), read via dashboard_get_my_flags() in one
// call. Previously App.tsx and AdminProvision.tsx each fetched role
// separately via dashboard_get_my_role() — consolidated so the
// must_change_password route-guard (T8) and every role check share one
// fetch and one refresh path.
export type DashboardRole = 'admin' | 'super_admin' | 'client_user';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  clientSchemaName: string | null;
  role: DashboardRole | null;
  mustChangePassword: boolean;
  flagsLoading: boolean;
  refreshFlags: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<DashboardRole | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(true);

  // Codex adversarial review: refreshFlags() had no stale-response guard.
  // If session A's flags request resolves after session B has already
  // signed in (same tab, quick account switch), the OLDER response could
  // land last and apply A's role/mustChangePassword to B's UI. currentUserIdRef
  // always holds the latest known user id; a response is only applied if
  // it's still current when the promise resolves.
  const currentUserIdRef = useRef<string | null>(null);

  const refreshFlags = useCallback(() => {
    const userIdAtCallTime = currentUserIdRef.current;
    setFlagsLoading(true);
    supabase.rpc('dashboard_get_my_flags').then(({ data, error }) => {
      if (currentUserIdRef.current !== userIdAtCallTime) {
        // The session changed while this request was in flight -- a
        // fresher refreshFlags() call (triggered by that change) owns
        // applying the result now. Drop this stale response.
        return;
      }
      if (error || !data) {
        // No dashboard_users mapping, or not authenticated -- least-
        // privilege default. Never surfaces admin/super_admin content.
        setRole(null);
        setMustChangePassword(false);
      } else {
        setRole((data as { role: DashboardRole }).role);
        setMustChangePassword((data as { must_change_password: boolean }).must_change_password === true);
      }
      setFlagsLoading(false);
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      currentUserIdRef.current = data.session?.user?.id ?? null;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      currentUserIdRef.current = newSession?.user?.id ?? null;
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      refreshFlags();
    } else {
      setRole(null);
      setMustChangePassword(false);
      setFlagsLoading(false);
    }
  }, [session, refreshFlags]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clientSchemaName =
    (session?.user?.app_metadata?.client_schema_name as string | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{ session, loading, clientSchemaName, role, mustChangePassword, flagsLoading, refreshFlags, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
