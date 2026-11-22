import { router, usePathname } from 'expo-router';
import { useCallback } from 'react';

// Signing in turns the (auth) guard off, and the router then falls back to its anchor (Home),
// dropping the screen the user came from. The login screen records where to go back to, and
// the root navigator goes there once the session starts.

let pending: string | null = null;

/** Only paths inside the app: "/properties/123", never "//evil.example" or "https://…". */
export const isAppPath = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

export const setReturnTo = (path: string | null) => {
  pending = isAppPath(path) ? path : null;
};

export const takeReturnTo = (): string | null => {
  const path = pending;
  pending = null;
  return path;
};

/** Opens sign-in from a screen the user should come back to afterwards. */
export const useSignInPrompt = () => {
  const pathname = usePathname();
  return useCallback(
    () => router.push({ pathname: '/login', params: { redirect: pathname } }),
    [pathname],
  );
};
