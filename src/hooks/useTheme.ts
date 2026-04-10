import { useThemeContext, type ThemeContextValue } from '@/theme/ThemeProvider';

/** Typed theme API for screens and components (same shape as ThemeContext). */
export function useTheme(): ThemeContextValue {
  return useThemeContext();
}
