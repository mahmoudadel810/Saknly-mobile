// Web preview only: expo-secure-store has no web implementation.
export type Language = 'ar' | 'en';
export type LanguageChoice = Language | 'device';

const KEY = 'saknly.language';

export const readLanguage = (): Language | null => {
  const value = globalThis.localStorage?.getItem(KEY);
  return value === 'ar' || value === 'en' ? value : null;
};

export const readChoice = (): LanguageChoice => readLanguage() ?? 'device';

export const saveChoice = (choice: LanguageChoice): void => {
  if (choice === 'device') globalThis.localStorage?.removeItem(KEY);
  else globalThis.localStorage?.setItem(KEY, choice);
};
