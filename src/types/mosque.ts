/** Domain types for mosques, jamat times, follows — align with PROJECT_SPEC §5 */

export const prayerType = {
  fajr: 'fajr',
  dhuhr: 'dhuhr',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'isha',
  jumuah: 'jumuah',
} as const;

export type PrayerType = (typeof prayerType)[keyof typeof prayerType];

export const submissionStatus = {
  pending: 'pending',
  live: 'live',
  rejected: 'rejected',
} as const;

export type SubmissionStatus = (typeof submissionStatus)[keyof typeof submissionStatus];

/** GeoJSON-style point for app use; DB stores GEOGRAPHY(POINT, 4326). */
export interface MosqueLocationPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface MosqueFacilities {
  wudu?: boolean;
  parking?: boolean;
  womens_section?: boolean;
  wheelchair?: boolean;
  children_friendly?: boolean;
  [key: string]: boolean | undefined;
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  /** PostGIS geography — often GeoJSON from PostgREST */
  location: MosqueLocationPoint | unknown;
  contact_phone: string | null;
  photo_url: string | null;
  madhab: string | null;
  khutbah_language: string | null;
  facilities: MosqueFacilities;
  verified_admin_id: string | null;
  last_confirmed_at: string | null;
  confirmation_count: number;
  created_at: string;
  updated_at: string;
}

export interface JamatTime {
  id: string;
  mosque_id: string;
  prayer: PrayerType;
  /** ISO time with offset, e.g. 05:15:00+06 */
  time: string;
  effective_date: string;
  submitted_by: string;
  trust_score: number;
  status: SubmissionStatus;
  note: string | null;
  last_verified_at: string | null;
  created_at: string;
}

export interface MosqueConfirmation {
  id: string;
  user_id: string;
  mosque_id: string;
  confirmed_at: string;
}

export interface Follow {
  user_id: string;
  mosque_id: string;
  notification_prefs: Record<string, unknown>;
  created_at: string;
}
