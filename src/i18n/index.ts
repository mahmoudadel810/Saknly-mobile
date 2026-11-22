import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { ar } from './ar';
import { en } from './en';

export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;

// Arabic first: English only when the device's preferred language is English.
const deviceLanguage = getLocales()[0]?.languageCode;
const language = deviceLanguage === 'en' ? 'en' : 'ar';

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: language,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

export default i18n;
