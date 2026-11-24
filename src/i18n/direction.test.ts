import { renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

import { setAppLanguage, useFollowDeviceLanguage } from './direction';
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

  it('picks up a change of the phone language when the app comes back', async () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as never;
    });
    await setAppLanguage('device');
    await i18n.changeLanguage('ar'); // the phone was Arabic; it is English now
    await renderHook(() => useFollowDeviceLanguage());
    listeners.forEach((listener) => listener('active'));
    await waitFor(() => expect(i18n.language).toBe('en'));
  });
});
