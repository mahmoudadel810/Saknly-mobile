import MockAdapter from 'axios-mock-adapter';

import {
  api,
  getErrorMessage,
  isNetworkError,
  setApiToken,
  setUnauthorizedHandler,
} from './client';

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  setApiToken(null);
  setUnauthorizedHandler(null);
});

describe('api client', () => {
  it('uses the configured base URL', () => {
    expect(api.defaults.baseURL).toBe('https://saknly-server-9air.vercel.app/api/saknly/v1');
  });

  it('sends Authorization: Saknly__<token> when signed in', async () => {
    setApiToken('abc.def.ghi');
    mock.onGet('/properties/myProperties').reply((config) => [200, config.headers?.Authorization]);
    const { data } = await api.get('/properties/myProperties');
    expect(data).toBe('Saknly__abc.def.ghi');
  });

  it('sends no Authorization header when signed out', async () => {
    mock
      .onGet('/properties/featured')
      .reply((config) => [200, config.headers?.Authorization ?? null]);
    const { data } = await api.get('/properties/featured');
    expect(data).toBeNull();
  });

  it('reports a 401 from a protected route as a lost session', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    mock.onGet('/users/me/wishlist').reply(401, { success: false, message: 'expired' });
    await expect(api.get('/users/me/wishlist')).rejects.toBeTruthy();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('leaves a 401 from an auth route to its caller', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    mock.onPost('/auth/refresh-token').reply(401, { success: false, message: 'Invalid token' });
    await expect(api.post('/auth/refresh-token')).rejects.toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('error helpers', () => {
  it("returns the server's message without the validation prefix", async () => {
    mock.onPost('/auth/register').reply(400, {
      success: false,
      message: 'Validation failed: please enter a valid format',
    });
    const error = await api.post('/auth/register', {}).catch((e) => e);
    expect(getErrorMessage(error, 'fallback')).toBe('please enter a valid format');
    expect(isNetworkError(error)).toBe(false);
  });

  it('falls back when there is no server message', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('detects a request that got no answer', async () => {
    mock.onGet('/properties/featured').networkError();
    const error = await api.get('/properties/featured').catch((e) => e);
    expect(isNetworkError(error)).toBe(true);
  });
});
