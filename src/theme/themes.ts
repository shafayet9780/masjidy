/** Four visual themes × light/dark maps — implement per DESIGN_SYSTEM.md §3 */

export const THEME_NAMES = ['emerald', 'desert', 'midnight', 'ocean'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];
