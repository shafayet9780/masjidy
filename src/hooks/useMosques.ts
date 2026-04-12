import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Coordinates } from '@/hooks/useLocation';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiError, fetchNearbyMosques } from '@/services/api';
import type { NearbyMosque } from '@/types/mosque';

const SEARCH_DEBOUNCE_MS = 150;

export interface UseMosquesOptions {
  /** Effective search center: GPS or city override from the screen. */
  coordinates: Coordinates | null;
}

export interface UseMosquesResult {
  mosques: NearbyMosque[];
  filteredMosques: NearbyMosque[];
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
}

export function useMosques(options: UseMosquesOptions): UseMosquesResult {
  const { coordinates } = options;
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  const fetchIdRef = useRef(0);
  const coordinatesRef = useRef(coordinates);
  coordinatesRef.current = coordinates;

  const runFetch = useCallback(async (source: 'effect' | 'manual') => {
    const c = coordinatesRef.current;
    if (!c) {
      setMosques([]);
      setError(null);
      setErrorCode(null);
      if (source === 'effect') {
        setLoading(false);
      }
      return;
    }

    const myId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const data = await fetchNearbyMosques({
        lat: c.latitude,
        lng: c.longitude,
      });
      if (fetchIdRef.current !== myId) {
        return;
      }
      setMosques(data);
    } catch (e) {
      if (fetchIdRef.current !== myId) {
        return;
      }
      if (e instanceof ApiError) {
        setErrorCode(e.code);
        setError(e.message);
      } else {
        setErrorCode('UNKNOWN');
        setError(e instanceof Error ? e.message : 'UNKNOWN_ERROR');
      }
      setMosques([]);
    } finally {
      if (fetchIdRef.current === myId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!coordinates) {
      setMosques([]);
      setError(null);
      setErrorCode(null);
      setLoading(false);
      return;
    }
    void runFetch('effect');
  }, [coordinates?.latitude, coordinates?.longitude, coordinates, runFetch]);

  const refetch = useCallback(async () => {
    await runFetch('manual');
  }, [runFetch]);

  const filteredMosques = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      return mosques;
    }
    return mosques.filter((m) => m.name.toLowerCase().includes(q));
  }, [mosques, debouncedQuery]);

  return {
    mosques,
    filteredMosques,
    loading,
    error,
    errorCode,
    searchQuery,
    setSearchQuery,
    refetch,
  };
}
