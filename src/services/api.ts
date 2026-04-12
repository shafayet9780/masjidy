/** Edge Function HTTP client — implement per PROJECT_SPEC §7 */

import {
  NEARBY_MOSQUES_DEFAULT_LIMIT,
  NEARBY_MOSQUES_DEFAULT_RADIUS_KM,
  NEARBY_MOSQUES_MAX_LIMIT,
  NEARBY_MOSQUES_MAX_RADIUS_KM,
} from '@/constants/config';
import { supabase } from '@/services/supabase';
import type { MosqueFacilities, NearbyMosque, PrayerType, SubmissionStatus } from '@/types/mosque';

export interface ApiErrorShape {
  code: string;
  message: string;
}

export class ApiError extends Error implements ApiErrorShape {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

interface NearbyMosquesResponse {
  mosques?: NearbyMosque[];
  error?: string;
  message?: string;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function parseFacilities(raw: unknown): MosqueFacilities {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const out: MosqueFacilities = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

function mapNearbyRow(row: Record<string, unknown>): NearbyMosque {
  return {
    id: String(row.id),
    name: String(row.name),
    distance_km: Number(row.distance_km),
    next_prayer: (row.next_prayer as NearbyMosque['next_prayer']) ?? null,
    next_jamat_time: row.next_jamat_time != null ? String(row.next_jamat_time) : null,
    next_trust_score: row.next_trust_score != null ? Number(row.next_trust_score) : null,
    facilities: parseFacilities(row.facilities),
    is_tomorrow: Boolean(row.is_tomorrow),
  };
}

/**
 * Nearby mosques via Edge Function (PostGIS RPC). Uses device timezone offset for next-prayer wall clock.
 */
export async function fetchNearbyMosques(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}): Promise<NearbyMosque[]> {
  const radius_km = clampInt(
    params.radiusKm ?? NEARBY_MOSQUES_DEFAULT_RADIUS_KM,
    1,
    NEARBY_MOSQUES_MAX_RADIUS_KM,
  );
  const limit = clampInt(params.limit ?? NEARBY_MOSQUES_DEFAULT_LIMIT, 1, NEARBY_MOSQUES_MAX_LIMIT);
  const tz_offset_min = -new Date().getTimezoneOffset();

  const { data, error } = await supabase.functions.invoke<NearbyMosquesResponse>('nearby-mosques', {
    body: {
      lat: params.lat,
      lng: params.lng,
      radius_km,
      limit,
      tz_offset_min,
    },
  });

  if (error) {
    throw new ApiError('NETWORK_ERROR', error.message);
  }

  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    throw new ApiError(data.error, typeof data.message === 'string' ? data.message : data.error);
  }

  const rawList = data?.mosques;
  if (!Array.isArray(rawList)) {
    throw new ApiError('INVALID_RESPONSE', 'Invalid nearby mosques response');
  }

  return rawList.map((row) => mapNearbyRow(row as unknown as Record<string, unknown>));
}

export interface SubmitTimeInput {
  mosque_id: string;
  prayer: PrayerType;
  /** 24h HH:MM */
  time: string;
  effective_date?: string;
  note?: string | null;
  /** Device timezone offset in minutes (Date.getTimezoneOffset() inverted) */
  tz_offset_min?: number;
}

export interface SubmitTimeResult {
  id: string;
  status: SubmissionStatus;
  trust_score: number;
}

interface SubmitTimeResponse {
  id?: string;
  status?: SubmissionStatus;
  trust_score?: number;
  error?: string;
  message?: string;
}

/**
 * Submit jamat time via Edge Function (FR-004).
 */
export async function submitTime(input: SubmitTimeInput): Promise<SubmitTimeResult> {
  const { data, error } = await supabase.functions.invoke<SubmitTimeResponse>('submit-time', {
    body: {
      mosque_id: input.mosque_id,
      prayer: input.prayer,
      time: input.time,
      effective_date: input.effective_date,
      note: input.note ?? undefined,
      tz_offset_min: input.tz_offset_min ?? -new Date().getTimezoneOffset(),
    },
  });

  if (error) {
    throw new ApiError('NETWORK_ERROR', error.message);
  }

  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    throw new ApiError(data.error, typeof data.message === 'string' ? data.message : data.error);
  }

  if (
    !data ||
    typeof data.id !== 'string' ||
    typeof data.status !== 'string' ||
    typeof data.trust_score !== 'number'
  ) {
    throw new ApiError('INVALID_RESPONSE', 'Invalid submit-time response');
  }

  return {
    id: data.id,
    status: data.status as SubmissionStatus,
    trust_score: data.trust_score,
  };
}
