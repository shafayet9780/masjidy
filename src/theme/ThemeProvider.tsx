import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

interface ThemeContextValue {
  /** Placeholder until themes.ts is wired */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ThemeContextValue>(() => ({ ready: true }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}
