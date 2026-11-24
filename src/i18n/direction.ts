import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';

import i18n from './index';
import { type Language, saveLanguage } from './preference';

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

/** Switches the app language; reloads the app when the layout direction has to flip. */
export const setAppLanguage = async (language: Language): Promise<void> => {
  saveLanguage(language);
  await i18n.changeLanguage(language);
  if (applyDirection(language)) await reloadAppAsync('language changed');
};

let checked = false;

/**
 * On start, lines the direction up with the language (a first start, or a device language
 * change while the app was closed). Reloads at most once per start: if the direction still
 * doesn't match after that, the app carries on rather than reloading in a loop.
 */
export const syncDirectionOnStart = (): void => {
  if (checked) return;
  checked = true;
  if (applyDirection(i18n.language)) {
    reloadAppAsync('layout direction').catch(() => {
      // A reload failure leaves the old direction until the next start; the text is still right.
    });
  }
};
