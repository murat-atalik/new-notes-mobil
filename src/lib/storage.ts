import AsyncStorage from '@react-native-async-storage/async-storage';

// Synchronous, localStorage-compatible facade over AsyncStorage.
// `preloadStorage()` must resolve before the store reads persisted state.
const cache = new Map<string, string>();

export const PERSISTED_KEYS = [
  'akilli_liste_app_state_v8_clean',
  'better_auth_session_user_v8_clean',
  'smart_family_list_theme',
  'smart_family_active_hub',
];

export async function preloadStorage(): Promise<void> {
  try {
    const entries = await AsyncStorage.multiGet(PERSISTED_KEYS);
    for (const [key, value] of entries) {
      if (value != null) cache.set(key, value);
    }
  } catch (error) {
    console.warn('Storage preload failed', error);
  }
}

export const localStorage = {
  getItem(key: string): string | null {
    return cache.has(key) ? (cache.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch((error) => console.warn('Storage write failed', error));
  },
  removeItem(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch((error) => console.warn('Storage remove failed', error));
  },
};
