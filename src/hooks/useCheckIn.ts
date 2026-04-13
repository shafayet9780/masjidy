import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, checkIn, type CheckInResult } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { PrayerType } from '@/types/mosque';

import { useAuth } from '@/hooks/useAuth';
import type { Coordinates } from '@/hooks/useLocation';

function utcDayStartEnd(): { start: string; end: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0)).toISOString();
  return { start, end };
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface UseCheckInOptions {
  mosqueId: string;
  prayer: PrayerType | null;
}

export interface UseCheckInResult {
  checkIn: (location: Coordinates, startedAt?: string) => Promise<CheckInResult>;
  liveCount: number;
  isCheckedIn: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refetch: () => Promise<void>;
}

export function useCheckIn({ mosqueId, prayer }: UseCheckInOptions): UseCheckInResult {
  const { session } = useAuth();
  const [liveCount, setLiveCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCountAndSelf = useCallback(async () => {
    if (!mosqueId.trim() || !prayer) {
      return;
    }
    const { start, end } = utcDayStartEnd();
    const countRes = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId.trim())
      .eq('prayer', prayer)
      .gte('arrived_at', start)
      .lt('arrived_at', end);

    if (typeof countRes.count === 'number') {
      setLiveCount(countRes.count);
    }

    const uid = session?.user?.id;
    if (uid) {
      const selfRes = await supabase
        .from('check_ins')
        .select('id')
        .eq('mosque_id', mosqueId.trim())
        .eq('prayer', prayer)
        .eq('user_id', uid)
        .gte('arrived_at', start)
        .lt('arrived_at', end)
        .limit(1)
        .maybeSingle();
      setIsCheckedIn(selfRes.data != null);
    } else {
      setIsCheckedIn(false);
    }
  }, [mosqueId, prayer, session?.user?.id]);

  useEffect(() => {
    if (!mosqueId.trim() || !prayer) {
      setLiveCount(0);
      setIsCheckedIn(false);
      return;
    }
    void fetchCountAndSelf();
  }, [mosqueId, prayer, fetchCountAndSelf]);

  useEffect(() => {
    if (!mosqueId.trim() || !prayer) {
      return;
    }

    const { start } = utcDayStartEnd();
    const dayKey = start.slice(0, 10);
    const channel = supabase
      .channel(`checkin:${mosqueId}:${prayer}:${dayKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
          filter: `mosque_id=eq.${mosqueId.trim()}`,
        },
        (payload) => {
          const row = payload.new as { prayer?: string; arrived_at?: string; user_id?: string };
          if (row.prayer !== prayer) {
            return;
          }
          const arrived = row.arrived_at ? Date.parse(row.arrived_at) : Number.NaN;
          if (Number.isNaN(arrived)) {
            return;
          }
          const bounds = utcDayStartEnd();
          if (arrived < Date.parse(bounds.start) || arrived >= Date.parse(bounds.end)) {
            return;
          }
          setLiveCount((c) => c + 1);
          if (session?.user?.id && row.user_id === session.user.id) {
            setIsCheckedIn(true);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeOk(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeOk(false);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [mosqueId, prayer, session?.user?.id]);

  useEffect(() => {
    if (!mosqueId.trim() || !prayer) {
      return;
    }
    if (realtimeOk) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(() => {
      void fetchCountAndSelf();
    }, 60_000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [mosqueId, prayer, realtimeOk, fetchCountAndSelf]);

  const performCheckIn = useCallback(
    async (location: Coordinates, startedAt?: string) => {
      if (!prayer) {
        throw new Error('NO_PRAYER');
      }
      setError(null);
      setIsLoading(true);
      try {
        const local_date = formatLocalYmd(new Date());
        const result = await checkIn({
          mosque_id: mosqueId.trim(),
          prayer,
          latitude: location.latitude,
          longitude: location.longitude,
          started_at: startedAt,
          local_date,
        });
        setLiveCount(result.live_count);
        setIsCheckedIn(true);
        return result;
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.code);
        } else {
          setError('UNKNOWN');
        }
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [mosqueId, prayer],
  );

  return {
    checkIn: performCheckIn,
    liveCount,
    isCheckedIn,
    isLoading,
    error,
    clearError: () => {
      setError(null);
    },
    refetch: fetchCountAndSelf,
  };
}
