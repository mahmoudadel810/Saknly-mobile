// The native Google module is missing in Expo Go. An app with Google switched off must never load it,
// so it starts there; this guards the lazy `require` in google.ts against being turned back into an import.
const mockNativeLoaded = jest.fn();
const mockGoogleSignin = {
  configure: jest.fn(),
  signOut: jest.fn(async () => null as null),
};
jest.mock('@react-native-google-signin/google-signin', () => {
  mockNativeLoaded();
  return {
    GoogleSignin: mockGoogleSignin,
    statusCodes: {},
    isErrorWithCode: () => false,
    isCancelledResponse: () => false,
  };
});

/** A fresh copy of the module (and of env, which it reads) with the given web client ID. */
const loadGoogle = (googleWebClientId: string) => {
  let google!: typeof import('./google');
  // `require` is the point here: a fresh module registry per call, which `import` can't give.
  /* eslint-disable @typescript-eslint/no-require-imports */
  jest.isolateModules(() => {
    const { env } = require('@/config/env') as typeof import('@/config/env');
    env.googleWebClientId = googleWebClientId;
    google = require('./google');
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  return google;
};

beforeEach(() => {
  mockNativeLoaded.mockClear();
  mockGoogleSignin.configure.mockClear();
  mockGoogleSignin.signOut.mockReset();
  mockGoogleSignin.signOut.mockResolvedValue(null);
});

describe('google sign-in module', () => {
  it('does not load the native module when importing, or when Google is not configured', async () => {
    const google = loadGoogle('');

    expect(google.isGoogleSignInEnabled()).toBe(false);
    await google.clearGoogleAccount();

    expect(mockNativeLoaded).not.toHaveBeenCalled();
  });

  it('loads it only when Google is configured and used, and configures the web client once', async () => {
    const google = loadGoogle('web.apps.googleusercontent.com');
    expect(mockNativeLoaded).not.toHaveBeenCalled();

    expect(google.isGoogleSignInEnabled()).toBe(true);
    await google.clearGoogleAccount();
    await google.clearGoogleAccount();

    expect(mockNativeLoaded).toHaveBeenCalledTimes(1);
    expect(mockGoogleSignin.configure).toHaveBeenCalledTimes(1);
    expect(mockGoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'web.apps.googleusercontent.com',
    });
    expect(mockGoogleSignin.signOut).toHaveBeenCalledTimes(2);
  });

  it('never throws from clearGoogleAccount, even when Google fails', async () => {
    const google = loadGoogle('web.apps.googleusercontent.com');
    mockGoogleSignin.signOut.mockRejectedValueOnce(new Error('no network'));

    await expect(google.clearGoogleAccount()).resolves.toBeUndefined();
  });
});
