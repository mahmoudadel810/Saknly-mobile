// Web preview only: expo-secure-store has no web implementation.
export type Language = 'ar' | 'en';

const KEY = 'saknly.language';

export const readLanguage = (): Language | null => {
  const value = globalThis.localStorage?.getItem(KEY);
  return value === 'ar' || value === 'en' ? value : null;
};

export const saveLanguage = (language: Language): void => {
  globalThis.localStorage?.setItem(KEY, language);
};
