/** Per-prayer plausible ranges — FR-004 */

import { PRAYER_RANGES } from '@/constants/prayers';
import type { PrayerType } from '@/types/mosque';

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

export function getTimeRangeForPrayer(prayer: PrayerType): { min: string; max: string } {
  return { min: PRAYER_RANGES[prayer].min, max: PRAYER_RANGES[prayer].max };
}

/**
 * Returns true if `timeStr` is valid 24h HH:MM and falls within FR-004 range for `prayer`.
 */
export function isTimeInRange(prayer: PrayerType, timeStr: string): boolean {
  const minutes = parseHhMmToMinutes(timeStr);
  if (minutes == null) return false;
  const lo = parseHhMmToMinutes(PRAYER_RANGES[prayer].min);
  const hi = parseHhMmToMinutes(PRAYER_RANGES[prayer].max);
  if (lo == null || hi == null) return false;
  return minutes >= lo && minutes <= hi;
}

export interface ValidateSubmissionTimeResult {
  valid: boolean;
  errorKey?: 'error.TIME_OUT_OF_RANGE' | 'submit.error.timeFormat';
}

/**
 * Validates a 24h `HH:MM` string against FR-004 ranges.
 */
export function validateSubmissionTime(
  prayer: PrayerType,
  timeStr: string,
): ValidateSubmissionTimeResult {
  const trimmed = timeStr.trim();
  if (!TIME_24_REGEX.test(trimmed)) {
    return { valid: false, errorKey: 'submit.error.timeFormat' };
  }
  if (!isTimeInRange(prayer, trimmed)) {
    return { valid: false, errorKey: 'error.TIME_OUT_OF_RANGE' };
  }
  return { valid: true };
}

/**
 * Normalizes user-facing 12h input to 24h `HH:MM` for API / storage.
 */
export function to24HourFrom12Hour(params: {
  hour12: number;
  minute: number;
  isPm: boolean;
}): string {
  let h: number;
  if (params.hour12 === 12) {
    h = params.isPm ? 12 : 0;
  } else {
    h = params.isPm ? params.hour12 + 12 : params.hour12;
  }
  const hh = String(h).padStart(2, '0');
  const mm = String(params.minute).padStart(2, '0');
  return `${hh}:${mm}`;
}
