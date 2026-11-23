const DEFAULT_API_URL = 'https://saknly-server-9air.vercel.app/api/saknly/v1';
const DEFAULT_TOKEN_PREFIX = 'Saknly__';

type RawEnv = { apiUrl?: string; tokenPrefix?: string; googleWebClientId?: string };

export const trimTrailingSlash = (url: string) => url.trim().replace(/\/+$/, '');

export const readEnv = ({ apiUrl, tokenPrefix, googleWebClientId }: RawEnv) => ({
  apiUrl: trimTrailingSlash(apiUrl || DEFAULT_API_URL),
  tokenPrefix: tokenPrefix || DEFAULT_TOKEN_PREFIX,
  // Empty hides the "Continue with Google" button. It is the *web* OAuth client's ID (not secret),
  // the same one the server's GOOGLE_CLIENT_ID holds: the server checks the ID token against it.
  googleWebClientId: (googleWebClientId || '').trim(),
});

// EXPO_PUBLIC_* values are inlined at build time, so each one must be read as a literal process.env.X.
export const env = readEnv({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  tokenPrefix: process.env.EXPO_PUBLIC_TOKEN_PREFIX,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});
