/**
 * Layout tokens and semantic color aliases — DESIGN_SYSTEM.md §3.6, §5.
 */

/** Spacing scale (px). Base 4px — maps to Tailwind spacing when documented in DESIGN_SYSTEM. */
export const SPACING = {
  'space-0': 0,
  'space-1': 4,
  'space-2': 8,
  'space-3': 12,
  'space-4': 16,
  'space-5': 20,
  'space-6': 24,
  'space-8': 32,
  'space-10': 40,
  'space-12': 48,
} as const;

/** Border radius (px). */
export const BORDER_RADIUS = {
  'radius-sm': 6,
  'radius-md': 12,
  'radius-lg': 16,
  'radius-xl': 24,
  'radius-full': 9999,
} as const;

/** Semantic names → underlying Masjidy token (for docs / future ThemePicker). */
export const SEMANTIC_TOKEN_MAP = {
  'badge-verified': 'success',
  'badge-community': 'warning',
  'badge-unverified': 'text-tertiary',
  'badge-stale': 'danger',
  'prayer-active': 'primary',
  'prayer-passed': 'text-tertiary',
  'checkin-live': 'success',
} as const;

export type SemanticTokenName = keyof typeof SEMANTIC_TOKEN_MAP;
export type SemanticTokenTarget = (typeof SEMANTIC_TOKEN_MAP)[SemanticTokenName];
