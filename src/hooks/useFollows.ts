import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MAX_FOLLOWS } from '@/constants/config';
import type { Coordinates } from '@/hooks/useLocation';
import { cancelLocalForMosque, scheduleLocalForMosque } from '@/services/notifications';
import { parseFacilities } from '@/services/api';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { useFollowStore } from '@/store/followStore';
import type { NearbyMosque } from '@/types/mosque';

/** Same wall-clock basis as `nearby-mosques` Edge Function for `p_current_local_time`. */
function deviceLocalWallClockTimeString(): string {
  const tzOffsetMin = -new Date().getTimezoneOffset();
  const d = new Date();
  const utcSec = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
  let localSec = utcSec + tzOffsetMin * 60;
  localSec = ((localSec % 86400) + 86400) % 86400;
  const hh = Math.floor(localSec / 3600);
  const mm = Math.floor((localSec % 3600) / 60);
  const ss = localSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function mapRpcRowToNearbyMosque(row: Record<string, unknown>): NearbyMosque {
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

export interface UseFollowsOptions {
  coordinates?: Coordinates | null;
  /**
   * When true, loads `followedMosques` via RPC (My Mosques tab only).
   * Default false so list screens with many `FollowButton`s do not each run the query.
   */
  loadFollowedMosqueRows?: boolean;
}

export interface UseFollowsResult {
  followedIds: string[];
  isFollowing: (mosqueId: string) => boolean;
  followMosque: (mosqueId: string) => Promise<void>;
  unfollowMosque: (mosqueId: string) => Promise<void>;
  followedMosques: NearbyMosque[];
  followedMosquesLoading: boolean;
  followedMosquesError: string | null;
  refreshFollowedMosques: () => Promise<void>;
  syncFollows: () => Promise<void>;
}

export function useFollows(options?: UseFollowsOptions): UseFollowsResult {
  const coordinates = options?.coordinates ?? null;
  const loadFollowedMosqueRows = options?.loadFollowedMosqueRows === true;
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? null;

  const followedIds = useFollowStore((s) => s.followedIds);
  const followHydrated = useFollowStore((s) => s.hydrated);
  const hydrate = useFollowStore((s) => s.hydrate);
  const addId = useFollowStore((s) => s.addId);
  const removeId = useFollowStore((s) => s.removeId);
  const setIds = useFollowStore((s) => s.setIds);

  const [followedMosques, setFollowedMosques] = useState<NearbyMosque[]>([]);
  const [followedMosquesLoading, setFollowedMosquesLoading] = useState(false);
  const [followedMosquesError, setFollowedMosquesError] = useState<string | null>(null);

  const syncingRef = useRef(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const isFollowing = useCallback(
    (mosqueId: string) => {
      const t = mosqueId.trim();
      if (!t) {
        return false;
      }
      return followedIds.includes(t);
    },
    [followedIds],
  );

  const syncFollows = useCallback(async () => {
    if (!userId) {
      return;
    }
    if (syncingRef.current) {
      return;
    }
    syncingRef.current = true;
    try {
      const localIds = useFollowStore.getState().followedIds;
      if (localIds.length > 0) {
        const rows = localIds.map((mosque_id) => ({
          user_id: userId,
          mosque_id,
        }));
        const { error: upsertError } = await supabase.from('follows').upsert(rows, {
          onConflict: 'user_id,mosque_id',
          ignoreDuplicates: true,
        });
        if (upsertError) {
          // Non-fatal: still try to load server state
        }
      }

      const { data, error } = await supabase.from('follows').select('mosque_id').eq('user_id', userId);

      if (error) {
        return;
      }

      const serverIds = (data ?? [])
        .map((r) => r.mosque_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      setIds(serverIds);
    } finally {
      syncingRef.current = false;
    }
  }, [setIds, userId]);

  useEffect(() => {
    if (!followHydrated || !userId) {
      return;
    }
    void syncFollows();
  }, [followHydrated, userId, syncFollows]);

  const refreshFollowedMosques = useCallback(async () => {
    const ids = useFollowStore.getState().followedIds;
    if (ids.length === 0) {
      setFollowedMosques([]);
      setFollowedMosquesError(null);
      return;
    }

    if (!coordinates) {
      setFollowedMosques([]);
      setFollowedMosquesError(null);
      return;
    }

    setFollowedMosquesLoading(true);
    setFollowedMosquesError(null);

    const p_current_local_time = deviceLocalWallClockTimeString();

    const { data, error } = await supabase.rpc('followed_mosques_with_next_prayer', {
      p_mosque_ids: ids,
      p_lat: coordinates.latitude,
      p_lng: coordinates.longitude,
      p_current_local_time,
    });

    if (error) {
      setFollowedMosques([]);
      setFollowedMosquesError(error.message ?? 'RPC_FAILED');
      setFollowedMosquesLoading(false);
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    setFollowedMosques(rows.map((row) => mapRpcRowToNearbyMosque(row as Record<string, unknown>)));
    setFollowedMosquesLoading(false);
  }, [coordinates]);

  const followedIdsKey = useMemo(() => followedIds.join(','), [followedIds]);

  useEffect(() => {
    if (!loadFollowedMosqueRows) {
      return;
    }
    void refreshFollowedMosques();
  }, [
    loadFollowedMosqueRows,
    followedIdsKey,
    coordinates?.latitude,
    coordinates?.longitude,
    refreshFollowedMosques,
  ]);

  const followMosque = useCallback(
    async (mosqueId: string) => {
      const id = mosqueId.trim();
      if (!id) {
        return;
      }

      const store = useFollowStore.getState();
      if (store.followedIds.includes(id)) {
        return;
      }
      if (store.followedIds.length >= MAX_FOLLOWS) {
        return;
      }

      const previous = [...store.followedIds];
      addId(id);

      if (!userId) {
        await scheduleLocalForMosque(id).catch(() => {
          // Non-fatal: local notifications are best-effort for anonymous users.
        });
        return;
      }

      const { error } = await supabase.from('follows').insert({
        user_id: userId,
        mosque_id: id,
      });

      if (error) {
        setIds(previous);
      }
    },
    [addId, setIds, userId],
  );

  const unfollowMosque = useCallback(
    async (mosqueId: string) => {
      const id = mosqueId.trim();
      if (!id) {
        return;
      }

      const store = useFollowStore.getState();
      if (!store.followedIds.includes(id)) {
        return;
      }

      const previous = [...store.followedIds];
      removeId(id);

      if (!userId) {
        await cancelLocalForMosque(id).catch(() => {
          // Non-fatal: local notifications are best-effort for anonymous users.
        });
        return;
      }

      const { error } = await supabase.from('follows').delete().eq('user_id', userId).eq('mosque_id', id);

      if (error) {
        setIds(previous);
      }
    },
    [removeId, setIds, userId],
  );

  return {
    followedIds,
    isFollowing,
    followMosque,
    unfollowMosque,
    followedMosques,
    followedMosquesLoading,
    followedMosquesError,
    refreshFollowedMosques,
    syncFollows,
  };
}
