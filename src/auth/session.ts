import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth';
import type { SessionUser, User } from '@/api/types';

import { isTokenExpired, shouldRefreshToken } from './token';
import { tokenStorage } from './tokenStorage';

export interface Session {
  token: string;
  /** The full user from getMe, or the short login user when getMe couldn't be reached. */
  user: User | SessionUser | null;
}

const isUnauthorized = (error: unknown) =>
  isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);

/**
 * Swaps the token for a fresh one when it is close to expiry. Returns the token to keep using.
 * A rejected refresh (401) ends the session; a network failure keeps the current token.
 */
export const refreshIfNeeded = async (token: string): Promise<string | null> => {
  if (isTokenExpired(token)) return null;
  if (!shouldRefreshToken(token)) return token;
  try {
    const { token: fresh } = await authApi.refreshToken(token);
    await tokenStorage.set(fresh);
    return fresh;
  } catch (error) {
    return isUnauthorized(error) ? null : token;
  }
};

/** Loads the stored session on app start. Returns null when the user must sign in again. */
export const restoreSession = async (): Promise<Session | null> => {
  const stored = await tokenStorage.get();
  if (!stored) return null;

  const token = await refreshIfNeeded(stored);
  if (!token) {
    await tokenStorage.clear();
    return null;
  }

  try {
    return { token, user: await authApi.getMe(token) };
  } catch (error) {
    if (isUnauthorized(error)) {
      await tokenStorage.clear();
      return null;
    }
    // Offline or server down: stay signed in; AuthProvider loads the user on the next foreground.
    return { token, user: null };
  }
};

export const startSession = async (email: string, password: string): Promise<Session> => {
  const { token, user } = await authApi.login({ email, password });
  await tokenStorage.set(token);
  try {
    return { token, user: await authApi.getMe(token) };
  } catch {
    return { token, user };
  }
};

/** Ends the session on the server (best effort) and always clears it on the device. */
export const endSession = async (token: string | null): Promise<void> => {
  try {
    if (token && !isTokenExpired(token)) await authApi.logout(token);
  } catch {
    // The token is dropped locally either way.
  } finally {
    await tokenStorage.clear();
  }
};
