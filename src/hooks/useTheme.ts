import { Appearance } from 'react-native';
import { create } from 'zustand';

import { localStorage } from '../lib/storage';
import { tw } from '../lib/tw';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'smart_family_list_theme';

type ThemeState = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  loadTheme: () => void;
};

const themeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light',
  setThemeMode: (mode) => {
    tw.setColorScheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    set({ themeMode: mode });
  },
  toggleTheme: () => get().setThemeMode(get().themeMode === 'dark' ? 'light' : 'dark'),
  // Called once after storage preload — mirrors the web's first-visit logic.
  loadTheme: () => {
    let saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved !== 'light' && saved !== 'dark') {
      saved = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, saved);
    }
    tw.setColorScheme(saved);
    set({ themeMode: saved });
  },
}));

export const loadTheme = () => themeStore.getState().loadTheme();

export const useTheme = () => {
  const { themeMode, setThemeMode, toggleTheme } = themeStore();
  return {
    themeMode,
    resolvedTheme: themeMode,
    isDark: themeMode === 'dark',
    setThemeMode,
    toggleTheme,
    mounted: true,
  };
};
