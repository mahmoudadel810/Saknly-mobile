import { Platform } from 'react-native';

import { env } from '@/config/env';

import { GoogleNoTokenError, GooglePlayServicesError } from './googleErrors';

/** The button shows only when a web client ID is configured (and not on web, which has no native module). */
export const isGoogleSignInEnabled = (): boolean =>
  Platform.OS !== 'web' && env.googleWebClientId !== '';

// The native module is loaded on first use, not at startup: it is missing in Expo Go, and an app that
// has Google switched off (no client ID) must still start there.
// (A lazy `require`: Jest can't run a dynamic `import()`, and Metro treats both the same.)
const loadNative = () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

let configured = false;
const configure = () => {
  const { GoogleSignin } = loadNative();
  if (configured) return GoogleSignin;
  // The ID token's audience is this web client; the server checks it against its GOOGLE_CLIENT_ID.
  GoogleSignin.configure({ webClientId: env.googleWebClientId });
  configured = true;
  return GoogleSignin;
};

/**
 * Opens Google's account picker and returns the ID token to send to the server, or null when the
 * user backed out (or a sign-in is already open). Throws GooglePlayServicesError or
 * GoogleNoTokenError, or the native error for anything else.
 */
export const getGoogleIdToken = async (): Promise<string | null> => {
  const { isCancelledResponse, isErrorWithCode, statusCodes } = loadNative();
  const GoogleSignin = configure();
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return null;
    const idToken = response.type === 'success' ? response.data.idToken : null;
    if (!idToken) throw new GoogleNoTokenError();
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        return null;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GooglePlayServicesError();
      }
    }
    throw error;
  }
};

/** Forgets the chosen Google account so the next sign-in shows the picker again. Never throws. */
export const clearGoogleAccount = async (): Promise<void> => {
  if (!isGoogleSignInEnabled()) return;
  try {
    await configure().signOut();
  } catch {
    // Nothing to clear, or Google couldn't be reached; the Saknly session is gone either way.
  }
};
