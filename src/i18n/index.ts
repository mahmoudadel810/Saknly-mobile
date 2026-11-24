import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { ar } from './ar';
import { en } from './en';
import { type Language, readLanguage } from './preference';

export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;

/** Arabic first: English only when the device's preferred language is English. */
export const deviceLanguage = (): Language =>
  getLocales()[0]?.languageCode === 'en' ? 'en' : 'ar';

// The user's choice in the app wins; without one, the device's language.
const language: Language = readLanguage() ?? deviceLanguage();

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: language,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

export default i18n;
