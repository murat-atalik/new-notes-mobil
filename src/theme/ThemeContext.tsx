import React, { createContext, useContext, useMemo } from 'react';

import { colors } from '../constants/colors';

type Theme = typeof colors;

const ThemeContext = createContext<Theme>(colors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useMemo(() => colors, []);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
