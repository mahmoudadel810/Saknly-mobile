/**
 * End-to-end: the app's own auth code against a real Saknly-server.
 * Start the isolated server first (in-memory DB, fake inbox), then run:
 *   node scripts/local-api.mjs          # terminal 1
 *   npm run test:e2e                    # terminal 2
 */
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth';
import { api, setApiToken } from '@/api/client';
import { endSession, restoreSession, startSession } from '@/auth/session';
import { tokenStorage } from '@/auth/tokenStorage';

const INBOX = process.env.E2E_INBOX_URL || 'http://127.0.0.1:5056/mail';

const decodeQuotedPrintable = (raw: string) =>
  raw
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

const readInbox = async (): Promise<string[]> => {
  const mails: { raw: string }[] = await (await fetch(INBOX)).json();
  return mails.map((m) => decodeQuotedPrintable(m.raw));
};

const waitForMail = async (to: string, match: RegExp): Promise<RegExpMatchArray> => {
  for (let i = 0; i < 50; i++) {
    for (const mail of (await readInbox()).reverse()) {
      const found = mail.includes(to) && mail.match(match);
      if (found) return found;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`no email to ${to} matching ${match}`);
};

const status = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);

const email = `e2e.${Date.now()}@saknly.local`;
const password = 'Mobile1!';
const newPassword = 'Changed2@';

beforeAll(async () => {
  await fetch(INBOX, { method: 'DELETE' });
  await tokenStorage.clear();
});

describe('auth flow against a local Saknly-server', () => {
  it('registers and sends the confirmation email', async () => {
    const res = await authApi.register({
      userName: 'e2e_user',
      email,
      phone: '01012345678',
      address: 'Cairo',
      password,
      confirmPassword: password,
    });
    expect(res.success).toBe(true);
    expect(res.emailSent).toBe(true);
    await waitForMail(email, /\/confirm-email\/([\w.-]+)/);
  });

  it('refuses login until the email is confirmed (403 → app offers resend)', async () => {
    const error = await startSession(email, password).catch((e) => e);
    expect(status(error)).toBe(403);
    expect(await tokenStorage.get()).toBeNull();
    expect((await authApi.resendConfirmation(email)).success).toBe(true);
  });

  it('confirms through the emailed link (what the web page does)', async () => {
    const [, token] = await waitForMail(email, /\/confirm-email\/([\w.-]+)/);
    const { data } = await api.get(`/auth/confirm-email/${token}`);
    expect(data.success).toBe(true);
  });

  let sessionToken = '';

  it('logs in, stores the token and loads the full user', async () => {
    const session = await startSession(email, password);
    sessionToken = session.token;
    expect(session.user).toMatchObject({ email, phone: '01012345678', role: 'user' });
    expect(await tokenStorage.get()).toBe(session.token);
  });

  it('restores the session after an app restart', async () => {
    const session = await restoreSession();
    expect(session?.token).toBe(sessionToken);
    expect(session?.user).toMatchObject({ email });
  });

  it('sends the Saknly__ header on protected requests', async () => {
    setApiToken(sessionToken);
    const { status: code } = await api.get('/properties/myProperties');
    expect(code).toBe(200);
  });

  it('refreshes the token', async () => {
    // Different jti/iat, same user. Wait a second so iat differs from the login token.
    await new Promise((r) => setTimeout(r, 1100));
    const res = await authApi.refreshToken(sessionToken);
    expect(res.token).not.toBe(sessionToken);
    expect(res.user.email).toBe(email);
    sessionToken = res.token;
    await tokenStorage.set(sessionToken);
  });

  it('logs out on the server, which revokes the token', async () => {
    await endSession(sessionToken);
    setApiToken(null);
    expect(await tokenStorage.get()).toBeNull();
    expect(status(await authApi.getMe(sessionToken).catch((e) => e))).toBe(401);
  });

  it('resets the password with the emailed code', async () => {
    await fetch(INBOX, { method: 'DELETE' });
    expect((await authApi.forgotPassword(email)).success).toBe(true);
    const [, code] = await waitForMail(email, /letter-spacing: 5px[^>]*>\s*([\w-]{6})\s*</);

    const res = await authApi.resetPassword({
      email,
      code,
      newPassword,
      confirmNewPassword: newPassword,
    });
    expect(res.success).toBe(true);

    expect(status(await startSession(email, password).catch((e) => e))).toBe(400);
    const session = await startSession(email, newPassword);
    expect(session.user).toMatchObject({ email });
    await endSession(session.token);
  });
});
