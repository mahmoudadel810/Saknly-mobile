// Plain Node has no native modules: report an Arabic device, the app's default language.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'ar' }] }));
