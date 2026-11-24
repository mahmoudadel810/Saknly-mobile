// Web preview only. expo-secure-store has no web implementation, so the browser build keeps the token in sessionStorage.
// Android and iOS keep using tokenStorage.ts (Keychain / Keystore).
const TOKEN_KEY = 'saknly.token';

export const tokenStorage = {
  get: async () => globalThis.sessionStorage?.getItem(TOKEN_KEY) ?? null,
  set: async (token: string) => globalThis.sessionStorage?.setItem(TOKEN_KEY, token),
  clear: async () => globalThis.sessionStorage?.removeItem(TOKEN_KEY),
};
