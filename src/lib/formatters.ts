import type { PrayerType } from '@/types/mosque';

/** Split distance for i18n: meters when &lt; 1 km, else km (1 decimal). */
export function formatDistanceParts(km: number): { unit: 'm'; value: number } | { unit: 'km'; value: number } {
  if (!Number.isFinite(km) || km < 0) {
    return { unit: 'm', value: 0 };
  }
  if (km < 1) {
    return { unit: 'm', value: Math.max(0, Math.round(km * 1000)) };
  }
  return { unit: 'km', value: Math.round(km * 10) / 10 };
}

/**
 * Parse Postgres TIMETZ string (e.g. `16:30:00+06`, `05:15:00+06`) and format in the user's locale.
 * Uses a fixed calendar date so only wall-clock matters.
 */
export function formatJamatTime(timetz: string, locale: string): string {
  const trimmed = timetz.trim();
  if (!trimmed) {
    return '';
  }
  const isoLike = trimmed.includes('T') ? trimmed : `2000-01-01T${trimmed}`;
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) {
    return trimmed;
  }
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: undefined,
  }).format(d);
}

/** i18n key for prayer name (use with `t()`). */
export function prayerTranslationKey(prayer: PrayerType): string {
  const map: Record<PrayerType, string> = {
    fajr: 'prayer.fajr',
    dhuhr: 'prayer.dhuhr',
    asr: 'prayer.asr',
    maghrib: 'prayer.maghrib',
    isha: 'prayer.isha',
    jumuah: 'prayer.jumuah',
  };
  return map[prayer];
}
