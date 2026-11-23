import MockAdapter from 'axios-mock-adapter';

import { api } from '@/api/client';
import { HOUR, makeToken } from '@/test/jwt';

import { endSession, restoreSession, startGoogleSession, startSession } from './session';
import { tokenStorage } from './tokenStorage';

const mock = new MockAdapter(api);
const user = { _id: 'u1', userName: 'mona', email: 'mona@example.com', role: 'user' };
const meResponse = {
  success: true,
  message: 'User found',
  data: { user: { ...user, phone: '01012345678' } },
};

beforeEach(async () => {
  mock.reset();
  await tokenStorage.clear();
});

describe('restoreSession', () => {
  it('returns null when nothing is stored', async () => {
    expect(await restoreSession()).toBeNull();
  });

  it('drops an expired token without calling the server', async () => {
    await tokenStorage.set(makeToken(-HOUR));
    expect(await restoreSession()).toBeNull();
    expect(await tokenStorage.get()).toBeNull();
    expect(mock.history.get.length + mock.history.post.length).toBe(0);
  });

  it('keeps a fresh token and loads the user', async () => {
    const token = makeToken(20 * HOUR);
    await tokenStorage.set(token);
    mock.onGet('/auth/getMe').reply(200, meResponse);

    const session = await restoreSession();
    expect(session?.token).toBe(token);
    expect(session?.user).toMatchObject({ userName: 'mona', phone: '01012345678' });
    expect(mock.history.post).toHaveLength(0);
    expect(mock.history.get[0].headers?.Authorization).toBe(`Saknly__${token}`);
  });

  it('refreshes a token close to expiry and stores the new one', async () => {
    const old = makeToken(2 * HOUR);
    const fresh = makeToken(24 * HOUR);
    await tokenStorage.set(old);
    mock
      .onPost('/auth/refresh-token')
      .reply(200, { success: true, message: 'ok', token: fresh, user });
    mock.onGet('/auth/getMe').reply(200, meResponse);

    const session = await restoreSession();
    expect(mock.history.post[0].headers?.Authorization).toBe(`Saknly__${old}`);
    expect(session?.token).toBe(fresh);
    expect(await tokenStorage.get()).toBe(fresh);
  });

  it('signs out when the server rejects the refresh', async () => {
    await tokenStorage.set(makeToken(2 * HOUR));
    mock.onPost('/auth/refresh-token').reply(401, { success: false, message: 'Session has ended' });
    expect(await restoreSession()).toBeNull();
    expect(await tokenStorage.get()).toBeNull();
  });

  it('signs out when getMe rejects the token (logged out on another device)', async () => {
    await tokenStorage.set(makeToken(20 * HOUR));
    mock.onGet('/auth/getMe').reply(401, { success: false, message: 'revoked' });
    expect(await restoreSession()).toBeNull();
    expect(await tokenStorage.get()).toBeNull();
  });

  it('stays signed in while offline', async () => {
    const token = makeToken(20 * HOUR);
    await tokenStorage.set(token);
    mock.onGet('/auth/getMe').networkError();
    expect(await restoreSession()).toEqual({ token, user: null });
    expect(await tokenStorage.get()).toBe(token);
  });
});

describe('startSession', () => {
  it('logs in, stores the token and loads the full user', async () => {
    const token = makeToken(24 * HOUR);
    mock
      .onPost('/auth/login')
      .reply(200, { success: true, message: 'Login successful', token, user });
    mock.onGet('/auth/getMe').reply(200, meResponse);

    const session = await startSession('mona@example.com', 'Secret1!');
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      email: 'mona@example.com',
      password: 'Secret1!',
    });
    expect(session.user).toMatchObject({ phone: '01012345678' });
    expect(await tokenStorage.get()).toBe(token);
  });

  it('stores nothing when the email is not confirmed', async () => {
    mock.onPost('/auth/login').reply(403, { success: false, message: 'not confirmed' });
    await expect(startSession('mona@example.com', 'Secret1!')).rejects.toBeTruthy();
    expect(await tokenStorage.get()).toBeNull();
  });
});

describe('startGoogleSession', () => {
  it('sends the ID token, stores the token the server issues and loads the full user', async () => {
    const token = makeToken(20 * HOUR);
    mock.onPost('/auth/google/mobile').reply(200, { success: true, message: 'ok', token, user });
    mock.onGet('/auth/getMe').reply(200, meResponse);

    const session = await startGoogleSession('google-id-token');

    expect(JSON.parse(mock.history.post[0].data)).toEqual({ idToken: 'google-id-token' });
    expect(session).toEqual({ token, user: meResponse.data.user });
    expect(await tokenStorage.get()).toBe(token);
  });

  it('keeps the short user when getMe cannot be reached', async () => {
    const token = makeToken(20 * HOUR);
    mock.onPost('/auth/google/mobile').reply(200, { success: true, message: 'ok', token, user });
    mock.onGet('/auth/getMe').networkError();

    expect(await startGoogleSession('t')).toEqual({ token, user });
  });

  it('stores nothing when the server refuses the token', async () => {
    mock.onPost('/auth/google/mobile').reply(401, { success: false, message: 'no' });

    await expect(startGoogleSession('bad')).rejects.toMatchObject({ response: { status: 401 } });
    expect(await tokenStorage.get()).toBeNull();
  });
});

describe('endSession', () => {
  it('logs out on the server and clears the device', async () => {
    const token = makeToken(20 * HOUR);
    await tokenStorage.set(token);
    mock.onPost('/auth/logout').reply(200, { success: true, message: 'Logged out successfully' });
    await endSession(token);
    expect(mock.history.post[0].headers?.Authorization).toBe(`Saknly__${token}`);
    expect(await tokenStorage.get()).toBeNull();
  });

  it('clears the device even when the server call fails', async () => {
    const token = makeToken(20 * HOUR);
    await tokenStorage.set(token);
    mock.onPost('/auth/logout').networkError();
    await endSession(token);
    expect(await tokenStorage.get()).toBeNull();
  });
});
