import { HOUR, makeToken } from '@/test/jwt';

import { getTokenExpiry, isTokenExpired, shouldRefreshToken } from './token';

const now = Date.UTC(2026, 10, 22, 12);

describe('token expiry', () => {
  it('reads the exp claim', () => {
    expect(getTokenExpiry(makeToken(24 * HOUR, now))).toBe(now + 24 * HOUR);
  });

  it('treats an unreadable token as expired', () => {
    expect(getTokenExpiry('not-a-jwt')).toBeNull();
    expect(isTokenExpired('not-a-jwt', now)).toBe(true);
  });

  it('keeps a fresh token without refreshing it', () => {
    const token = makeToken(20 * HOUR, now);
    expect(isTokenExpired(token, now)).toBe(false);
    expect(shouldRefreshToken(token, now)).toBe(false);
  });

  it('refreshes a token with less than 6 hours left', () => {
    expect(shouldRefreshToken(makeToken(5 * HOUR, now), now)).toBe(true);
  });

  it('never refreshes an expired token (the server would refuse it)', () => {
    const token = makeToken(-HOUR, now);
    expect(isTokenExpired(token, now)).toBe(true);
    expect(shouldRefreshToken(token, now)).toBe(false);
  });

  it('counts the last minute before expiry as expired', () => {
    expect(isTokenExpired(makeToken(30 * 1000, now), now)).toBe(true);
  });
});
