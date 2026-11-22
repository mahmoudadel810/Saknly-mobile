import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'saknly.token';

// Keychain (iOS) / Keystore-backed storage (Android). Never AsyncStorage for the token.
export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};
