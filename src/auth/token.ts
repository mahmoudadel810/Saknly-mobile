import { jwtDecode } from 'jwt-decode';

/** Refresh when less than this much time is left. Tokens last 1 day by default. */
export const REFRESH_WINDOW_MS = 6 * 60 * 60 * 1000;
/** Treat a token as expired slightly early, so a request doesn't race its expiry. */
const EXPIRY_SKEW_MS = 60 * 1000;

/** The token's expiry time in ms, or null when it can't be read. */
export const getTokenExpiry = (token: string): number | null => {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string, now = Date.now()): boolean => {
  const expiry = getTokenExpiry(token);
  return expiry === null || expiry - EXPIRY_SKEW_MS <= now;
};

export const shouldRefreshToken = (token: string, now = Date.now()): boolean => {
  const expiry = getTokenExpiry(token);
  return expiry !== null && !isTokenExpired(token, now) && expiry - now < REFRESH_WINDOW_MS;
};
