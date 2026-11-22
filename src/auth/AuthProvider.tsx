import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { authApi } from '@/api/auth';
import { setApiToken, setUnauthorizedHandler } from '@/api/client';

import { endSession, refreshIfNeeded, restoreSession, type Session, startSession } from './session';
import { tokenStorage } from './tokenStorage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: Session['user'];
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Session['user']>(null);
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback((session: Session | null) => {
    tokenRef.current = session?.token ?? null;
    setApiToken(tokenRef.current);
    setUser(session?.user ?? null);
    setStatus(session ? 'signedIn' : 'signedOut');
  }, []);

  const dropSession = useCallback(async () => {
    await tokenStorage.clear();
    applySession(null);
    queryClient.clear();
  }, [applySession, queryClient]);

  useEffect(() => {
    restoreSession().then(applySession, () => applySession(null));
  }, [applySession]);

  // A protected request answered 401: the session ended on the server (expired, logged out elsewhere).
  useEffect(() => {
    setUnauthorizedHandler(() => void dropSession());
    return () => setUnauthorizedHandler(null);
  }, [dropSession]);

  // Back in the foreground: refresh a token close to expiry, drop an expired one.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      const token = tokenRef.current;
      if (state !== 'active' || !token) return;
      const next = await refreshIfNeeded(token);
      if (!next) return dropSession();
      if (next !== token) {
        tokenRef.current = next;
        setApiToken(next);
      }
    });
    return () => subscription.remove();
  }, [dropSession]);

  const signIn = useCallback(
    async (email: string, password: string) => applySession(await startSession(email, password)),
    [applySession],
  );

  const signOut = useCallback(async () => {
    await endSession(tokenRef.current);
    applySession(null);
    queryClient.clear();
  }, [applySession, queryClient]);

  const reloadUser = useCallback(async () => {
    if (tokenRef.current) setUser(await authApi.getMe(tokenRef.current));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, isAdmin: user?.role === 'admin', signIn, signOut, reloadUser }),
    [status, user, signIn, signOut, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
