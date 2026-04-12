import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LOCATION_STORAGE_KEY } from '@/constants/config';
import { usePreferencesStore } from '@/store/preferencesStore';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PersistedCoords {
  latitude: number;
  longitude: number;
  updatedAt: string;
}

const LOCATION_TIMEOUT_MS = 10_000;

function parsePersisted(raw: string): Coordinates | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    const lat = typeof o.latitude === 'number' ? o.latitude : Number(o.latitude);
    const lng = typeof o.longitude === 'number' ? o.longitude : Number(o.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

async function readCachedCoords(): Promise<Coordinates | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return parsePersisted(raw);
  } catch {
    return null;
  }
}

async function writeCachedCoords(coords: Coordinates): Promise<void> {
  try {
    const payload: PersistedCoords = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // non-fatal
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(label)), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

export interface UseLocationResult {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  permissionStatus: LocationPermissionStatus;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const setLocationGranted = usePreferencesStore((s) => s.setLocationGranted);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('undetermined');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const resolvePosition = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const result = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        LOCATION_TIMEOUT_MS,
        'LOCATION_TIMEOUT',
      );
      const next = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
      await writeCachedCoords(next);
      return next;
    } catch {
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) {
        const next = {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        };
        await writeCachedCoords(next);
        return next;
      }
      const cached = await readCachedCoords();
      return cached;
    }
  }, []);

  const hydrateFromCacheIfDenied = useCallback(async () => {
    const cached = await readCachedCoords();
    if (mounted.current) {
      setCoords(cached);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (!mounted.current) return;

      if (perm.status === Location.PermissionStatus.GRANTED) {
        setPermissionStatus('granted');
        setLocationGranted(true);
        const next = await resolvePosition();
        if (mounted.current) {
          setCoords(next);
        }
        return;
      }

      if (perm.status === Location.PermissionStatus.DENIED) {
        setPermissionStatus('denied');
        setLocationGranted(false);
        await hydrateFromCacheIfDenied();
        return;
      }

      setPermissionStatus('undetermined');
      setLocationGranted(false);
      setCoords(null);
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'LOCATION_ERROR');
        await hydrateFromCacheIfDenied();
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [hydrateFromCacheIfDenied, resolvePosition, setLocationGranted]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;

      if (result.status === Location.PermissionStatus.GRANTED) {
        setPermissionStatus('granted');
        setLocationGranted(true);
        const next = await resolvePosition();
        if (mounted.current) {
          setCoords(next);
        }
      } else {
        setPermissionStatus('denied');
        setLocationGranted(false);
        await hydrateFromCacheIfDenied();
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'LOCATION_ERROR');
        setPermissionStatus('denied');
        setLocationGranted(false);
        await hydrateFromCacheIfDenied();
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [hydrateFromCacheIfDenied, resolvePosition, setLocationGranted]);

  const refresh = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await resolvePosition();
      if (mounted.current) {
        setCoords(next);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'LOCATION_ERROR');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [permissionStatus, resolvePosition]);

  return {
    coords,
    loading,
    error,
    permissionStatus,
    requestPermission,
    refresh,
  };
}
