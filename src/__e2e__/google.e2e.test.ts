/**
 * End-to-end: POST /auth/google/mobile on a local Saknly-server (scripts/local-api.mjs).
 * A real Google ID token can't be made here, and the local server has no Google client ID, so this
 * checks the contract the app depends on: the route exists, rejects a malformed body before doing
 * anything, and says "not available" (503) rather than failing oddly when Google isn't configured.
 * The account rules behind it are covered by the server's own tests (tests/google-mobile.test.js).
 * Run with `npm run test:e2e`.
 */
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth';
import { api, setApiToken } from '@/api/client';
import { classifyGoogleError } from '@/auth/googleErrors';

beforeEach(() => setApiToken(null));

const statusOf = async (request: Promise<unknown>) => {
  try {
    await request;
  } catch (error) {
    return isAxiosError(error) ? error.response?.status : undefined;
  }
  return 200;
};

describe('POST /auth/google/mobile', () => {
  it('rejects a missing, empty, too short or non-string idToken with 400', async () => {
    expect(await statusOf(api.post('/auth/google/mobile', {}))).toBe(400);
    expect(await statusOf(api.post('/auth/google/mobile', { idToken: '' }))).toBe(400);
    expect(await statusOf(api.post('/auth/google/mobile', { idToken: 'abc' }))).toBe(400);
    expect(await statusOf(api.post('/auth/google/mobile', { idToken: { $ne: null } }))).toBe(400);
  });

  it('answers 503 when the server has no Google client configured, and the app treats it as a plain failure', async () => {
    let error: unknown;
    try {
      await authApi.googleLogin('x'.repeat(40));
    } catch (e) {
      error = e;
    }
    expect(isAxiosError(error) && error.response?.status).toBe(503);
    expect(classifyGoogleError(error)).toBe('other');
  });

  it('does not issue a token for an unconfigured server', async () => {
    const response = await api
      .post('/auth/google/mobile', { idToken: 'x'.repeat(40) })
      .catch((e) => e.response);
    expect(response.data.token).toBeUndefined();
  });
});
