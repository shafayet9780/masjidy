/** API URLs, limits — use EXPO_PUBLIC_* from env */

export const NEARBY_MOSQUES_DEFAULT_RADIUS_KM = 10;
export const NEARBY_MOSQUES_DEFAULT_LIMIT = 20;
export const NEARBY_MOSQUES_MAX_RADIUS_KM = 50;
export const NEARBY_MOSQUES_MAX_LIMIT = 50;

export const LOCATION_STORAGE_KEY = 'masjidy-last-location';

export const LOCAL_FOLLOW_IDS_KEY = 'masjidy-local-follow-ids';

/** Server + client cap (FR-006). */
export const MAX_FOLLOWS = 50;

export const CONFIG_PLACEHOLDER = {
  bootstrapMaxMosques: 5,
} as const;

export interface CityPreset {
  /** i18n key under mosques.city.* */
  labelKey: string;
  lat: number;
  lng: number;
}

/** Manual city fallback when GPS denied (FR-002). Labels via i18n. */
export const CITY_PRESETS: readonly CityPreset[] = [
  { labelKey: 'mosques.city.dhaka', lat: 23.8103, lng: 90.4125 },
  { labelKey: 'mosques.city.london', lat: 51.5074, lng: -0.1278 },
  { labelKey: 'mosques.city.newYork', lat: 40.7128, lng: -74.006 },
  { labelKey: 'mosques.city.riyadh', lat: 24.7136, lng: 46.6753 },
  { labelKey: 'mosques.city.dubai', lat: 25.2048, lng: 55.2708 },
  { labelKey: 'mosques.city.karachi', lat: 24.8607, lng: 67.0011 },
  { labelKey: 'mosques.city.istanbul', lat: 41.0082, lng: 28.9784 },
  { labelKey: 'mosques.city.kualaLumpur', lat: 3.139, lng: 101.6869 },
] as const;
