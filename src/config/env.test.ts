import { readEnv } from './env';

describe('readEnv', () => {
  it('falls back to the deployed API and the Saknly__ prefix', () => {
    expect(readEnv({})).toEqual({
      apiUrl: 'https://saknly-server-9air.vercel.app/api/saknly/v1',
      tokenPrefix: 'Saknly__',
    });
  });

  it('uses the configured values and drops a trailing slash', () => {
    expect(
      readEnv({ apiUrl: 'http://10.0.2.2:5000/api/saknly/v1/', tokenPrefix: 'Custom__' }),
    ).toEqual({ apiUrl: 'http://10.0.2.2:5000/api/saknly/v1', tokenPrefix: 'Custom__' });
  });
});
