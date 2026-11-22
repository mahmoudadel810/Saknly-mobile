import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';
import { HOUR, makeToken } from '@/test/jwt';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);
const user = { _id: 'u1', userName: 'mona', email: 'mona@example.com', role: 'user' };
const me = {
  success: true,
  message: 'User found',
  data: { user: { ...user, phone: '01012345678' } },
};

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
});

// The real route tree from src/app, with the real AuthProvider and route guards.
const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });

describe('route guards', () => {
  it('sends a signed-out user from /profile to home', async () => {
    await renderApp('/profile');
    expect(await screen.findByText('Welcome to Saknly')).toBeTruthy();
    expect(screen).toHavePathname('/');
  });

  it('restores a stored session and opens /profile', async () => {
    await tokenStorage.set(makeToken(20 * HOUR));
    mock.onGet('/auth/getMe').reply(200, me);

    await renderApp('/profile');
    expect(await screen.findByText('mona@example.com')).toBeTruthy();
    expect(screen.getByText('01012345678')).toBeTruthy();
    expect(screen).toHavePathname('/profile');
  });

  it('signs in on /login, lands on home and can no longer open /login', async () => {
    mock.onPost('/auth/login').reply(200, {
      success: true,
      message: 'Login successful',
      token: makeToken(24 * HOUR),
      user,
    });
    mock.onGet('/auth/getMe').reply(200, me);

    await renderApp('/login');
    await fireEvent.changeText(await screen.findByLabelText('Email'), 'mona@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Secret1!');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Hi, mona')).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.queryByLabelText('Password')).toBeNull();
  });
});
