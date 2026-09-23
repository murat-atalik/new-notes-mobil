import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppList, Item, PersistedState, User } from '../types';

// The only place that touches AsyncStorage. Changing the stored shape requires a new key or a migration.
const KEY = 'smart-family-list-mobile-v1';
const LIST_TYPES = ['SHOPPING', 'TODO', 'NOTE'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isUser = (value: unknown): value is User =>
  isObject(value) && typeof value.name === 'string' && typeof value.username === 'string';
const isItem = (value: unknown): value is Item =>
  isObject(value) && typeof value.id === 'string' && typeof value.title === 'string';
const isList = (value: unknown): value is AppList =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.type === 'string' &&
  LIST_TYPES.includes(value.type) &&
  Array.isArray(value.items) &&
  value.items.every(isItem);

/** Returns the saved state, or null when nothing is saved or the saved data is corrupt/unreadable. */
export async function loadState(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (
      !isObject(data) ||
      !isUser(data.user) ||
      !Array.isArray(data.lists) ||
      !data.lists.every(isList)
    )
      return null;
    return { user: data.user, lists: data.lists, dark: Boolean(data.dark) };
  } catch (error) {
    if (__DEV__) console.warn('loadState failed', error);
    return null;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    if (__DEV__) console.warn('saveState failed', error);
  }
}
