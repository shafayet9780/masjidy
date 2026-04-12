/** Prayer names, order, validation ranges — PROJECT_SPEC FR-004 */

import type { PrayerType } from '@/types/mosque';

export const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah'] as const;

/** Wall-clock ranges (24h HH:MM) for plausible jamat times — FR-004 */
export const PRAYER_RANGES: Record<
  PrayerType,
  { readonly min: string; readonly max: string }
> = {
  fajr: { min: '03:00', max: '07:30' },
  dhuhr: { min: '11:30', max: '14:30' },
  asr: { min: '14:00', max: '18:30' },
  maghrib: { min: '17:00', max: '21:00' },
  isha: { min: '18:00', max: '23:59' },
  jumuah: { min: '11:30', max: '14:30' },
} as const;

/** Server + client submission limits */
export const SUBMISSION_LIMITS = {
  maxNoteLength: 120,
  maxSubmissionsPerDay: 5,
  velocityWindowMinutes: 60,
  velocityDistinctMosqueThreshold: 3,
  duplicateContentLookbackDays: 7,
} as const;
