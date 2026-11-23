import { GoogleSignin } from '@react-native-google-signin/google-signin';
import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import { env } from '@/config/env';
import i18n from '@/i18n';
import { listing } from '@/test/fixtures';
import { HOUR, makeToken } from '@/test/jwt';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);
const signInMock = jest.mocked(GoogleSignin.signIn);
const googleSignOut = jest.mocked(GoogleSignin.signOut);
const user = { _id: 'u1', userName: 'sara', email: 'sara@example.com', role: 'user' };
const flat = listing('p1', 'Sunny flat');
const picked = { type: 'success', data: { idToken: 'google-id-token', user: {} } } as never;

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
  signInMock.mockReset();
  googleSignOut.mockClear();
  jest.replaceProperty(env, 'googleWebClientId', 'web-client.apps.googleusercontent.com');
  mock.onGet('/properties/featured').reply(200, { success: true, data: [flat] });
  mock.onGet('/agencies/featured').reply(200, { success: true, data: [] });
  mock.onGet('/testimonial').reply(200, { success: true, data: [] });
  mock.onGet('/properties/propertyDetails/p1').reply(200, { success: true, data: flat });
  mock.onGet('/properties/similar/p1').reply(200, { success: true, data: [] });
  mock.onGet('/property-comments/p1').reply(200, { success: true, data: [] });
  mock.onGet('/users/me/wishlist').reply(200, { success: true, data: [] });
  mock.onGet('/properties/myProperties').reply(200, { success: true, data: [] });
});
afterEach(() => jest.restoreAllMocks());

const serverAccepts = () => {
  mock
    .onPost('/auth/google/mobile')
    .reply(200, { success: true, message: 'ok', token: makeToken(20 * HOUR), user });
  mock.onGet('/auth/getMe').reply(200, { success: true, message: 'ok', data: { user } });
};
const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });
const googleButton = () => screen.findByRole('button', { name: 'Continue with Google' });
const posted = () => mock.history.post.filter((r) => r.url === '/auth/google/mobile');

describe('Continue with Google', () => {
  it('is not shown until a web client ID is configured', async () => {
    jest.replaceProperty(env, 'googleWebClientId', '');
    await renderApp('/login');
    await screen.findByLabelText('Email');
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
    expect(screen.queryByText('or')).toBeNull();
  });

  it('is shown on the sign-in and register screens when configured', async () => {
    await renderApp('/login');
    expect(await googleButton()).toBeTruthy();
    await fireEvent.press(screen.getByText('Create account'));
    expect(await googleButton()).toBeTruthy();
  });

  it('signs in with the ID token and lands on Home as that user', async () => {
    signInMock.mockResolvedValue(picked);
    serverAccepts();
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    expect(await screen.findByText('Hi, sara')).toBeTruthy();
    expect(JSON.parse(posted()[0].data)).toEqual({ idToken: 'google-id-token' });
    expect(await tokenStorage.get()).not.toBeNull();
  });

  it('asks Google for an ID token for the configured web client', async () => {
    signInMock.mockResolvedValue(picked);
    serverAccepts();
    await renderApp('/login');
    await fireEvent.press(await googleButton());
    await screen.findByText('Hi, sara');

    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'web-client.apps.googleusercontent.com',
    });
  });

  it('does nothing, quietly, when the user closes the account picker', async () => {
    signInMock.mockResolvedValue({ type: 'cancelled', data: null } as never);
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    expect(posted()).toHaveLength(0);
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.queryByText(/Couldn't sign in with Google/)).toBeNull();
  });

  it('treats the native cancel error the same way', async () => {
    signInMock.mockRejectedValue({ code: 'SIGN_IN_CANCELLED' });
    await renderApp('/login');
    await fireEvent.press(await googleButton());

    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    expect(posted()).toHaveLength(0);
    expect(screen.queryByText(/Couldn't sign in with Google/)).toBeNull();
  });

  it('says to use the password when the email belongs to a password account', async () => {
    signInMock.mockResolvedValue(picked);
    mock.onPost('/auth/google/mobile').reply(409, { success: false, message: 'registered' });
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    expect(
      await screen.findByText(
        'This email is registered with a password. Sign in with your email and password instead.',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(await tokenStorage.get()).toBeNull();
  });

  it('forgets the picked account after a refusal, so the next tap can choose another', async () => {
    signInMock.mockResolvedValue(picked);
    mock.onPost('/auth/google/mobile').reply(409, { success: false, message: 'registered' });
    await renderApp('/login');

    await fireEvent.press(await googleButton());
    await screen.findByText(/registered with a password/);

    expect(googleSignOut).toHaveBeenCalledTimes(1);
  });

  it('keeps the picked account after a successful sign-in', async () => {
    signInMock.mockResolvedValue(picked);
    serverAccepts();
    await renderApp('/login');

    await fireEvent.press(await googleButton());
    await screen.findByText('Hi, sara');

    expect(googleSignOut).not.toHaveBeenCalled();
  });

  it('has nothing to forget when the user closed the picker', async () => {
    signInMock.mockResolvedValue({ type: 'cancelled', data: null } as never);
    await renderApp('/login');

    await fireEvent.press(await googleButton());
    await waitFor(() => expect(signInMock).toHaveBeenCalled());

    expect(googleSignOut).not.toHaveBeenCalled();
  });

  it('shows a generic message when the server refuses the token', async () => {
    signInMock.mockResolvedValue(picked);
    mock
      .onPost('/auth/google/mobile')
      .reply(401, { success: false, message: 'Google sign-in failed.' });
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    expect(await screen.findByText("Couldn't sign in with Google. Please try again.")).toBeTruthy();
  });

  it('explains a missing connection', async () => {
    signInMock.mockResolvedValue(picked);
    mock.onPost('/auth/google/mobile').networkError();
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    expect(
      await screen.findByText("Couldn't reach the server. Check your connection and try again."),
    ).toBeTruthy();
  });

  it('explains missing Google Play services', async () => {
    signInMock.mockRejectedValue({ code: 'PLAY_SERVICES_NOT_AVAILABLE' });
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    expect(
      await screen.findByText('Google Play services are missing or need an update on this phone.'),
    ).toBeTruthy();
    expect(posted()).toHaveLength(0);
  });

  it('does not call the server when Google returns no ID token', async () => {
    signInMock.mockResolvedValue({ type: 'success', data: { idToken: null, user: {} } } as never);
    await renderApp('/login');

    await fireEvent.press(await googleButton());

    expect(await screen.findByText("Couldn't sign in with Google. Please try again.")).toBeTruthy();
    expect(posted()).toHaveLength(0);
  });

  it('clears an earlier error when a new attempt starts', async () => {
    signInMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(picked);
    serverAccepts();
    await renderApp('/login');

    await fireEvent.press(await googleButton());
    await screen.findByText("Couldn't sign in with Google. Please try again.");
    await fireEvent.press(await googleButton());

    expect(await screen.findByText('Hi, sara')).toBeTruthy();
    expect(screen.queryByText("Couldn't sign in with Google. Please try again.")).toBeNull();
  });

  it('returns to the screen that asked for sign-in', async () => {
    signInMock.mockResolvedValue(picked);
    serverAccepts();
    await renderApp('/properties/p1');
    await fireEvent.press(await screen.findByRole('button', { name: 'Sign in to comment' }));

    await fireEvent.press(await googleButton());

    expect(await screen.findByLabelText('Write a comment')).toBeTruthy();
    expect(screen).toHavePathname('/properties/p1');
  });

  it('forgets the Google account on sign out so the next sign-in shows the picker', async () => {
    await tokenStorage.set(makeToken(20 * HOUR));
    mock.onGet('/auth/getMe').reply(200, { success: true, message: 'ok', data: { user } });
    mock.onPost('/auth/logout').reply(200, { success: true, message: 'ok' });
    await renderApp('/account');

    await fireEvent.press(await screen.findByRole('button', { name: 'Sign out' }));
    await screen.findByText('Sign in to Saknly');

    expect(googleSignOut).toHaveBeenCalledTimes(1);
  });

  it('leaves Google alone on sign out when it is not configured', async () => {
    jest.replaceProperty(env, 'googleWebClientId', '');
    await tokenStorage.set(makeToken(20 * HOUR));
    mock.onGet('/auth/getMe').reply(200, { success: true, message: 'ok', data: { user } });
    mock.onPost('/auth/logout').reply(200, { success: true, message: 'ok' });
    await renderApp('/account');

    await fireEvent.press(await screen.findByRole('button', { name: 'Sign out' }));
    await screen.findByText('Sign in to Saknly');

    expect(googleSignOut).not.toHaveBeenCalled();
  });
});
