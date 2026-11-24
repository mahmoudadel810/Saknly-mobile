import * as SecureStore from 'expo-secure-store';

export type Language = 'ar' | 'en';
/** A language, or "follow the phone's language" (re-read on every start). */
export type LanguageChoice = Language | 'device';

const KEY = 'saknly.language';

const isLanguage = (value: unknown): value is Language => value === 'ar' || value === 'en';

/** The language the user picked in the app, or null to follow the device. Read synchronously:
 *  i18n starts before the first render, so the first frame is already in the right language. */
export const readLanguage = (): Language | null => {
  try {
    const value = SecureStore.getItem(KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
};

export const readChoice = (): LanguageChoice => readLanguage() ?? 'device';

/** Saves the choice; "device" is stored as is (SecureStore has no synchronous delete). */
export const saveChoice = (choice: LanguageChoice): void => {
  try {
    SecureStore.setItem(KEY, choice);
  } catch {
    // Not saved: the app follows the device language again on the next start.
  }
};
