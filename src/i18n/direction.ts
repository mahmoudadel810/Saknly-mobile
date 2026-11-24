import { reloadAppAsync } from 'expo';
import * as SecureStore from 'expo-secure-store';
import { I18nManager, Platform } from 'react-native';

import i18n, { deviceLanguage } from './index';
import { type LanguageChoice, saveChoice } from './preference';

/**
 * Sets the native layout direction for a language. React Native reads it once at start, so it
 * only shows after a reload; returns true when the running app is laid out the other way.
 * The expo-localization plugin no longer sets RTL on every launch (no `supportsRTL` in app.json),
 * so these calls are the only source of the direction and persist across starts.
 */
export const applyDirection = (language: string): boolean => {
  if (Platform.OS === 'web') return false;
  const rtl = language === 'ar';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return I18nManager.isRTL !== rtl;
};

/**
 * The direction a reload was last started for. Kept on disk, since a reload wipes module memory:
 * if the layout still disagrees after reloading for it, the app carries on instead of looping.
 */
const RELOAD_KEY = 'saknly.directionReload';

const readReloadMark = () => {
  try {
    return SecureStore.getItem(RELOAD_KEY);
  } catch {
    return null;
  }
};

const writeReloadMark = (direction: string) => {
  try {
    SecureStore.setItem(RELOAD_KEY, direction);
  } catch {
    // Without the mark a mismatch may reload once more on the next start; never more.
  }
};

const directionOf = (language: string) => (language === 'ar' ? 'rtl' : 'ltr');

const reload = (language: string, reason: string) => {
  writeReloadMark(directionOf(language));
  reloadAppAsync(reason).catch(() => {
    // The direction is saved, so the next start is laid out right; the text already is.
  });
};

/** Switches the app language; reloads the app when the layout direction has to flip. */
export const setAppLanguage = async (choice: LanguageChoice): Promise<void> => {
  saveChoice(choice);
  const language = choice === 'device' ? deviceLanguage() : choice;
  await i18n.changeLanguage(language);
  if (applyDirection(language)) reload(language, 'language changed');
};

/**
 * On start, lines the direction up with the language (a first start, or a device language
 * change while the app was closed). Reloads at most once per direction: if the layout still
 * doesn't match after that reload, the app carries on rather than reloading in a loop.
 */
export const syncDirectionOnStart = (): void => {
  if (!applyDirection(i18n.language)) {
    if (readReloadMark() !== null) SecureStore.deleteItemAsync(RELOAD_KEY).catch(() => {});
    return;
  }
  if (readReloadMark() === directionOf(i18n.language)) return;
  reload(i18n.language, 'layout direction');
};
