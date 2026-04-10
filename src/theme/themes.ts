/**
 * Masjidy color themes — exact hex from DESIGN_SYSTEM.md §3, stored as NativeWind RGB triplets.
 */

export const THEME_NAMES = ['emerald', 'desert', 'midnight', 'ocean'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export type ColorMode = 'light' | 'dark' | 'system';
export type ResolvedColorMode = 'light' | 'dark';

/** CSS custom property names for Masjidy semantic palette (11 per theme × mode). */
export type MasjidySemanticVar =
  | '--color-primary'
  | '--color-primary-soft'
  | '--color-accent'
  | '--color-accent-soft'
  | '--color-surface'
  | '--color-surface-elevated'
  | '--color-surface-muted'
  | '--color-text-primary'
  | '--color-text-secondary'
  | '--color-text-tertiary'
  | '--color-border';

/** Shared status vars (Emerald Oasis values for all themes — DESIGN_SYSTEM.md §3.6). */
export type SharedStatusVar =
  | '--color-success'
  | '--color-warning'
  | '--color-danger'
  | '--color-info';

export type MasjidySemanticMap = Record<MasjidySemanticVar, string>;
export type SharedStatusMap = Record<SharedStatusVar, string>;

/** Resolved hex colors for useTheme() (no leading # in values — use # in helper). */
export interface ThemeColors {
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const SHARED_STATUS_COLORS: Record<ResolvedColorMode, SharedStatusMap> = {
  light: {
    '--color-success': '22 163 74',
    '--color-warning': '217 119 6',
    '--color-danger': '220 38 38',
    '--color-info': '37 99 235',
  },
  dark: {
    '--color-success': '74 222 128',
    '--color-warning': '251 191 36',
    '--color-danger': '248 113 113',
    '--color-info': '96 165 250',
  },
};

export const THEMES: Record<ThemeName, Record<ResolvedColorMode, MasjidySemanticMap>> = {
  emerald: {
    light: {
      '--color-primary': '27 107 74',
      '--color-primary-soft': '232 245 238',
      '--color-accent': '201 150 59',
      '--color-accent-soft': '255 248 236',
      '--color-surface': '255 255 255',
      '--color-surface-elevated': '247 250 248',
      '--color-surface-muted': '239 243 240',
      '--color-text-primary': '26 46 35',
      '--color-text-secondary': '90 122 102',
      '--color-text-tertiary': '141 166 154',
      '--color-border': '212 226 218',
    },
    dark: {
      '--color-primary': '46 204 113',
      '--color-primary-soft': '26 58 42',
      '--color-accent': '240 192 96',
      '--color-accent-soft': '42 36 24',
      '--color-surface': '18 26 20',
      '--color-surface-elevated': '26 42 30',
      '--color-surface-muted': '14 21 16',
      '--color-text-primary': '232 245 238',
      '--color-text-secondary': '143 175 160',
      '--color-text-tertiary': '90 122 102',
      '--color-border': '42 62 48',
    },
  },
  desert: {
    light: {
      '--color-primary': '15 118 110',
      '--color-primary-soft': '230 247 245',
      '--color-accent': '184 134 11',
      '--color-accent-soft': '253 246 227',
      '--color-surface': '254 252 248',
      '--color-surface-elevated': '249 245 238',
      '--color-surface-muted': '240 235 225',
      '--color-text-primary': '44 36 24',
      '--color-text-secondary': '107 93 79',
      '--color-text-tertiary': '154 141 127',
      '--color-border': '221 213 200',
    },
    dark: {
      '--color-primary': '45 212 191',
      '--color-primary-soft': '21 46 43',
      '--color-accent': '218 165 32',
      '--color-accent-soft': '42 34 16',
      '--color-surface': '20 18 16',
      '--color-surface-elevated': '30 26 21',
      '--color-surface-muted': '15 13 10',
      '--color-text-primary': '240 235 225',
      '--color-text-secondary': '168 152 136',
      '--color-text-tertiary': '107 93 79',
      '--color-border': '46 40 32',
    },
  },
  midnight: {
    light: {
      '--color-primary': '30 58 95',
      '--color-primary-soft': '232 239 247',
      '--color-accent': '201 150 59',
      '--color-accent-soft': '255 248 236',
      '--color-surface': '255 255 255',
      '--color-surface-elevated': '240 244 248',
      '--color-surface-muted': '224 232 240',
      '--color-text-primary': '15 28 46',
      '--color-text-secondary': '74 97 128',
      '--color-text-tertiary': '122 144 168',
      '--color-border': '200 212 224',
    },
    dark: {
      '--color-primary': '91 155 213',
      '--color-primary-soft': '20 32 46',
      '--color-accent': '240 192 96',
      '--color-accent-soft': '30 26 16',
      '--color-surface': '10 14 20',
      '--color-surface-elevated': '20 28 40',
      '--color-surface-muted': '8 12 16',
      '--color-text-primary': '224 232 240',
      '--color-text-secondary': '138 160 184',
      '--color-text-tertiary': '74 97 128',
      '--color-border': '30 46 64',
    },
  },
  ocean: {
    light: {
      '--color-primary': '37 99 235',
      '--color-primary-soft': '235 242 255',
      '--color-accent': '124 58 237',
      '--color-accent-soft': '243 238 255',
      '--color-surface': '255 255 255',
      '--color-surface-elevated': '245 247 250',
      '--color-surface-muted': '232 236 240',
      '--color-text-primary': '17 24 39',
      '--color-text-secondary': '75 85 99',
      '--color-text-tertiary': '156 163 175',
      '--color-border': '209 213 219',
    },
    dark: {
      '--color-primary': '96 165 250',
      '--color-primary-soft': '20 30 48',
      '--color-accent': '167 139 250',
      '--color-accent-soft': '26 20 40',
      '--color-surface': '15 17 23',
      '--color-surface-elevated': '24 27 34',
      '--color-surface-muted': '10 12 16',
      '--color-text-primary': '240 242 245',
      '--color-text-secondary': '156 163 175',
      '--color-text-tertiary': '75 85 99',
      '--color-border': '42 46 56',
    },
  },
};

/** Convert space-separated RGB triplet to #RRGGBB for programmatic use (e.g. icons). */
export function rgbTripletToHex(triplet: string): string {
  const parts = triplet.trim().split(/\s+/).map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return '#000000';
  }
  const [r, g, b] = parts;
  const toHex = (x: number) => x.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function buildThemeColors(
  theme: ThemeName,
  mode: ResolvedColorMode,
): ThemeColors {
  const semantic = THEMES[theme][mode];
  const status = SHARED_STATUS_COLORS[mode];
  return {
    primary: rgbTripletToHex(semantic['--color-primary']),
    primarySoft: rgbTripletToHex(semantic['--color-primary-soft']),
    accent: rgbTripletToHex(semantic['--color-accent']),
    accentSoft: rgbTripletToHex(semantic['--color-accent-soft']),
    surface: rgbTripletToHex(semantic['--color-surface']),
    surfaceElevated: rgbTripletToHex(semantic['--color-surface-elevated']),
    surfaceMuted: rgbTripletToHex(semantic['--color-surface-muted']),
    textPrimary: rgbTripletToHex(semantic['--color-text-primary']),
    textSecondary: rgbTripletToHex(semantic['--color-text-secondary']),
    textTertiary: rgbTripletToHex(semantic['--color-text-tertiary']),
    border: rgbTripletToHex(semantic['--color-border']),
    success: rgbTripletToHex(status['--color-success']),
    warning: rgbTripletToHex(status['--color-warning']),
    danger: rgbTripletToHex(status['--color-danger']),
    info: rgbTripletToHex(status['--color-info']),
  };
}
