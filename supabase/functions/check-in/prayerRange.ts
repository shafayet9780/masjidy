/** FR-004 / FR-008 — keep in sync with src/constants/prayers.ts */

export type PrayerType =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'jumuah';

export function isPrayerType(value: string): value is PrayerType {
  return value === 'fajr' ||
    value === 'dhuhr' ||
    value === 'asr' ||
    value === 'maghrib' ||
    value === 'isha' ||
    value === 'jumuah';
}
