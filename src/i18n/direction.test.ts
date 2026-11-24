import * as SecureStore from 'expo-secure-store';

import { setAppLanguage } from './direction';
import i18n from './index';
import { readChoice } from './preference';

jest.mock('expo', () => ({ reloadAppAsync: jest.fn(async () => undefined) }));
// The phone is set to English.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

afterAll(() => i18n.changeLanguage('ar'));

describe('the language choice', () => {
  it('follows the device until one is picked, and can go back to it', async () => {
    expect(readChoice()).toBe('device');

    await setAppLanguage('ar');
    expect(readChoice()).toBe('ar');
    expect(i18n.language).toBe('ar');

    // back to the phone's language: English here, and the choice is no longer pinned
    await setAppLanguage('device');
    expect(readChoice()).toBe('device');
    expect(i18n.language).toBe('en');
    expect(SecureStore.getItem('saknly.language')).toBe('device');
  });
});
