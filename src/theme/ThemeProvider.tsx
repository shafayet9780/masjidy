import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars, useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useDeviceColorScheme, View } from 'react-native';

import {
  gluestackNumberedScaleDark,
  gluestackNumberedScaleLight,
} from '@/theme/gluestack.config';

import {
  buildThemeColors,
  SHARED_STATUS_COLORS,
  THEMES,
  THEME_NAMES,
  type ColorMode,
  type ResolvedColorMode,
  type ThemeColors,
  type ThemeName,
} from '@/theme/themes';

const STORAGE_THEME = '@masjidy/theme';
const STORAGE_COLOR_MODE = '@masjidy/colorMode';

const DEFAULT_THEME: ThemeName = 'emerald';
const DEFAULT_COLOR_MODE: ColorMode = 'system';

function isThemeName(value: string): value is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(value);
}

function isColorMode(value: string): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function resolveColorMode(colorMode: ColorMode, deviceScheme: string | null | undefined): ResolvedColorMode {
  if (colorMode !== 'system') {
    return colorMode;
  }
  return deviceScheme === 'dark' ? 'dark' : 'light';
}

export interface ThemeContextValue {
  theme: ThemeName;
  colorMode: ColorMode;
  resolvedColorMode: ResolvedColorMode;
  setTheme: (next: ThemeName) => void;
  setColorMode: (next: ColorMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [colorMode, setColorModeState] = useState<ColorMode>(DEFAULT_COLOR_MODE);

  useEffect(() => {
    void (async () => {
      try {
        const [storedTheme, storedMode] = await Promise.all([
          AsyncStorage.getItem(STORAGE_THEME),
          AsyncStorage.getItem(STORAGE_COLOR_MODE),
        ]);
        if (storedTheme && isThemeName(storedTheme)) {
          setThemeState(storedTheme);
        }
        if (storedMode && isColorMode(storedMode)) {
          setColorModeState(storedMode);
        }
      } catch {
        /* ignore corrupt storage */
      }
    })();
  }, []);

  const resolvedColorMode = useMemo(
    () => resolveColorMode(colorMode, deviceScheme),
    [colorMode, deviceScheme],
  );

  useEffect(() => {
    setColorScheme(resolvedColorMode);
  }, [resolvedColorMode, setColorScheme]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    void AsyncStorage.setItem(STORAGE_THEME, next);
  }, []);

  const setColorMode = useCallback((next: ColorMode) => {
    setColorModeState(next);
    void AsyncStorage.setItem(STORAGE_COLOR_MODE, next);
  }, []);

  const variableStyle = useMemo(() => {
    const gluestack =
      resolvedColorMode === 'dark' ? gluestackNumberedScaleDark : gluestackNumberedScaleLight;
    const merged: Record<string, string> = {
      ...gluestack,
      ...SHARED_STATUS_COLORS[resolvedColorMode],
      ...THEMES[theme][resolvedColorMode],
    };
    return vars(merged);
  }, [resolvedColorMode, theme]);

  const colors = useMemo(
    () => buildThemeColors(theme, resolvedColorMode),
    [theme, resolvedColorMode],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorMode,
      resolvedColorMode,
      setTheme,
      setColorMode,
      colors,
    }),
    [theme, colorMode, resolvedColorMode, setTheme, setColorMode, colors],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[variableStyle, { flex: 1, height: '100%', width: '100%' }]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}
