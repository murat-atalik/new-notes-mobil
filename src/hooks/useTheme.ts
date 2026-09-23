import { Appearance } from 'react-native';
import { create } from 'zustand';

import { localStorage } from '../lib/storage';
import { tw } from '../lib/tw';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'smart_family_list_theme';

type ThemeState = {
  themeMode: ThemeMode;
  resolved: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  loadTheme: () => void;
};

const resolve = (mode: ThemeMode): 'light' | 'dark' =>
  mode === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : mode;

const themeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',
  resolved: 'light',
  setThemeMode: (mode) => {
    const resolved = resolve(mode);
    tw.setColorScheme(resolved);
    localStorage.setItem(STORAGE_KEY, mode);
    set({ themeMode: mode, resolved });
  },
  toggleTheme: () => get().setThemeMode(get().resolved === 'dark' ? 'light' : 'dark'),
  loadTheme: () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const mode: ThemeMode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    const resolved = resolve(mode);
    tw.setColorScheme(resolved);
    set({ themeMode: mode, resolved });
  },
}));

// Follow the OS appearance while in "system" mode.
Appearance.addChangeListener(() => {
  const { themeMode } = themeStore.getState();
  if (themeMode !== 'system') return;
  const resolved = resolve('system');
  tw.setColorScheme(resolved);
  themeStore.setState({ resolved });
});

export const loadTheme = () => themeStore.getState().loadTheme();

export const useTheme = () => {
  const { themeMode, resolved, setThemeMode, toggleTheme } = themeStore();
  return {
    themeMode,
    resolvedTheme: resolved,
    isDark: resolved === 'dark',
    setThemeMode,
    toggleTheme,
  };
};
