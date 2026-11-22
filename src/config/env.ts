const DEFAULT_API_URL = 'https://saknly-server-9air.vercel.app/api/saknly/v1';
const DEFAULT_TOKEN_PREFIX = 'Saknly__';

type RawEnv = { apiUrl?: string; tokenPrefix?: string };

export const trimTrailingSlash = (url: string) => url.trim().replace(/\/+$/, '');

export const readEnv = ({ apiUrl, tokenPrefix }: RawEnv) => ({
  apiUrl: trimTrailingSlash(apiUrl || DEFAULT_API_URL),
  tokenPrefix: tokenPrefix || DEFAULT_TOKEN_PREFIX,
});

// EXPO_PUBLIC_* values are inlined at build time, so each one must be read as a literal process.env.X.
export const env = readEnv({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  tokenPrefix: process.env.EXPO_PUBLIC_TOKEN_PREFIX,
});
