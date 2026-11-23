import { AxiosError } from 'axios';

import { classifyGoogleError, GoogleNoTokenError, GooglePlayServicesError } from './googleErrors';

const httpError = (status: number) =>
  new AxiosError('failed', undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: {},
  });

describe('classifyGoogleError', () => {
  it('recognises missing Google Play services', () => {
    expect(classifyGoogleError(new GooglePlayServicesError())).toBe('playServices');
  });

  it('treats a missing ID token as a failure', () => {
    expect(classifyGoogleError(new GoogleNoTokenError())).toBe('failed');
  });

  it('says to use the password when the server answers 409', () => {
    expect(classifyGoogleError(httpError(409))).toBe('emailRegistered');
  });

  it('treats a refused token or account (401, 403) as a failure', () => {
    expect(classifyGoogleError(httpError(401))).toBe('failed');
    expect(classifyGoogleError(httpError(403))).toBe('failed');
  });

  it('recognises no answer at all as a network problem', () => {
    expect(classifyGoogleError(new AxiosError('Network Error'))).toBe('network');
  });

  it('leaves anything else (a 400, a 503, a surprise) to the generic message', () => {
    expect(classifyGoogleError(httpError(400))).toBe('other');
    expect(classifyGoogleError(httpError(503))).toBe('other');
    expect(classifyGoogleError(new Error('boom'))).toBe('other');
  });
});
