const base64Url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/** An unsigned JWT that expires `expiresInMs` from `now`. jwt-decode only reads the payload. */
export const makeToken = (expiresInMs: number, now = Date.now(), extra: object = {}) =>
  [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({ id: 'u1', role: 'user', exp: Math.floor((now + expiresInMs) / 1000), ...extra }),
    'signature',
  ].join('.');

export const HOUR = 60 * 60 * 1000;
