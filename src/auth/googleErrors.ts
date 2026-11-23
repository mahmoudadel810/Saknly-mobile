// Google sign-in failures, sorted into what to tell the user. Free of React Native and the native
// Google module so it can be tested in Node; src/auth/google.ts throws these.
import { isAxiosError } from 'axios';

import { isNetworkError } from '@/api/client';

/** Google Play services are missing or out of date on the phone (Android). */
export class GooglePlayServicesError extends Error {
  constructor() {
    super('Google Play services are not available');
    this.name = 'GooglePlayServicesError';
  }
}

/** Google signed the user in but gave no ID token, so there is nothing to send the server. */
export class GoogleNoTokenError extends Error {
  constructor() {
    super('Google returned no ID token');
    this.name = 'GoogleNoTokenError';
  }
}

export type GoogleFailure = 'playServices' | 'emailRegistered' | 'failed' | 'network' | 'other';

/**
 * What to say after a failed Google sign-in. The server answers 409 when the email belongs to a
 * password account, and 401 or 403 when the token or the account is refused.
 */
export const classifyGoogleError = (error: unknown): GoogleFailure => {
  if (error instanceof GooglePlayServicesError) return 'playServices';
  if (error instanceof GoogleNoTokenError) return 'failed';
  if (isNetworkError(error)) return 'network';
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 409) return 'emailRegistered';
    if (status === 401 || status === 403) return 'failed';
  }
  return 'other';
};
