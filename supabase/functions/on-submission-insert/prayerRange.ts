/** FR-004 — keep in sync with src/constants/prayers.ts */

export type PrayerType =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'jumuah';

export const PRAYER_RANGES: Record<PrayerType, { min: string; max: string }> = {
  fajr: { min: '03:00', max: '07:30' },
  dhuhr: { min: '11:30', max: '14:30' },
  asr: { min: '14:00', max: '18:30' },
  maghrib: { min: '17:00', max: '21:00' },
  isha: { min: '18:00', max: '23:59' },
  jumuah: { min: '11:30', max: '14:30' },
};

const TIME_24_REGEX = /^(\d{1,2}):(\d{2})$/;

function parseHhMmToMinutes(hhMm: string): number | null {
  const m = hhMm.trim().match(TIME_24_REGEX);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }
  return h * 60 + min;
}

export function isPrayerType(value: string): value is PrayerType {
  return value === 'fajr' ||
    value === 'dhuhr' ||
    value === 'asr' ||
    value === 'maghrib' ||
    value === 'isha' ||
    value === 'jumuah';
}

export function isTimeInRangeForPrayer(prayer: PrayerType, timeHhMm: string): boolean {
  const minutes = parseHhMmToMinutes(timeHhMm);
  if (minutes == null) return false;
  const lo = parseHhMmToMinutes(PRAYER_RANGES[prayer].min);
  const hi = parseHhMmToMinutes(PRAYER_RANGES[prayer].max);
  if (lo == null || hi == null) return false;
  return minutes >= lo && minutes <= hi;
}

export function timetzToHhMm(timetz: string): string | null {
  const t = timetz.trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min)) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
