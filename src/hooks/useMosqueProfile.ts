import { useCallback, useEffect, useRef, useState } from 'react';

import { PRAYER_ORDER } from '@/constants/prayers';
import { parseFacilities } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import type { JamatTime, Mosque, PrayerType, SubmissionStatus } from '@/types/mosque';

type MosqueRow = Database['public']['Tables']['mosques']['Row'];
type JamatTimeRow = Database['public']['Tables']['jamat_times']['Row'];

function mapMosqueRow(row: MosqueRow): Mosque {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    location: row.location as Mosque['location'],
    contact_phone: row.contact_phone,
    photo_url: row.photo_url,
    madhab: row.madhab,
    khutbah_language: row.khutbah_language,
    facilities: parseFacilities(row.facilities),
    verified_admin_id: row.verified_admin_id,
    last_confirmed_at: row.last_confirmed_at,
    confirmation_count: row.confirmation_count ?? 0,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
}

function mapJamatRow(row: JamatTimeRow): JamatTime {
  return {
    id: row.id,
    mosque_id: row.mosque_id,
    prayer: row.prayer as PrayerType,
    time: row.time,
    effective_date: row.effective_date,
    submitted_by: row.submitted_by,
    trust_score: row.trust_score,
    status: row.status as SubmissionStatus,
    note: row.note,
    last_verified_at: row.last_verified_at,
    created_at: row.created_at ?? '',
  };
}

/** One live row per prayer: highest trust_score; tie-break by latest created_at. */
function dedupeAndOrderJamatTimes(rows: JamatTime[]): JamatTime[] {
  const byPrayer = new Map<PrayerType, JamatTime>();
  for (const j of rows) {
    const existing = byPrayer.get(j.prayer);
    if (!existing) {
      byPrayer.set(j.prayer, j);
      continue;
    }
    if (j.trust_score > existing.trust_score) {
      byPrayer.set(j.prayer, j);
      continue;
    }
    if (j.trust_score === existing.trust_score) {
      const jCreated = Date.parse(j.created_at);
      const eCreated = Date.parse(existing.created_at);
      if (jCreated > eCreated) {
        byPrayer.set(j.prayer, j);
      }
    }
  }
  return PRAYER_ORDER.map((p) => byPrayer.get(p)).filter((x): x is JamatTime => x != null);
}

export interface UseMosqueProfileResult {
  mosque: Mosque | null;
  jamatTimes: JamatTime[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMosqueProfile(mosqueId: string): UseMosqueProfileResult {
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [jamatTimes, setJamatTimes] = useState<JamatTime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const runFetch = useCallback(async () => {
    const id = mosqueId.trim();
    if (!id) {
      setMosque(null);
      setJamatTimes([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const myId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const [mosqueRes, jamatRes] = await Promise.all([
        supabase.from('mosques').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('jamat_times')
          .select('*')
          .eq('mosque_id', id)
          .eq('status', 'live'),
      ]);

      if (fetchIdRef.current !== myId) {
        return;
      }

      if (mosqueRes.error) {
        setMosque(null);
        setJamatTimes([]);
        setError(mosqueRes.error.message);
        return;
      }

      if (!mosqueRes.data) {
        setMosque(null);
        setJamatTimes([]);
        setError('NOT_FOUND');
        return;
      }

      if (jamatRes.error) {
        setMosque(null);
        setJamatTimes([]);
        setError(jamatRes.error.message);
        return;
      }

      const mappedMosque = mapMosqueRow(mosqueRes.data as MosqueRow);
      const mappedJamat = (jamatRes.data ?? []).map((r) => mapJamatRow(r as JamatTimeRow));
      setMosque(mappedMosque);
      setJamatTimes(dedupeAndOrderJamatTimes(mappedJamat));
      setError(null);
    } catch (e) {
      if (fetchIdRef.current !== myId) {
        return;
      }
      setMosque(null);
      setJamatTimes([]);
      setError(e instanceof Error ? e.message : 'UNKNOWN_ERROR');
    } finally {
      if (fetchIdRef.current === myId) {
        setIsLoading(false);
      }
    }
  }, [mosqueId]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const refetch = useCallback(async () => {
    await runFetch();
  }, [runFetch]);

  return {
    mosque,
    jamatTimes,
    isLoading,
    error,
    refetch,
  };
}
