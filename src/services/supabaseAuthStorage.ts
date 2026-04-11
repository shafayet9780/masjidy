import { Platform } from 'react-native';

/**
 * expo-secure-store is not available on web or in Node (Expo Router SSR).
 * Use localStorage in the browser; SecureStore only on native after lazy require.
 */
const webAuthStorage = {
  getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') {
      return Promise.resolve(null);
    }
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota / private mode */
    }
    return Promise.resolve();
  },
  removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return Promise.resolve();
  },
};

function createNativeAuthStorage() {
  // Lazy require so web bundles never invoke SecureStore native bindings.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
}

/** SecureStore only on real device targets; web and Node (SSR) use `webAuthStorage`. */
const useSecureStore = Platform.OS === 'ios' || Platform.OS === 'android';

export const supabaseAuthStorage = useSecureStore ? createNativeAuthStorage() : webAuthStorage;
