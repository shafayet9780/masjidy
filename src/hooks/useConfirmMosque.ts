import { useCallback, useEffect, useState } from 'react';

import { ApiError, confirmMosque, type ConfirmMosqueResult } from '@/services/api';
import { supabase } from '@/services/supabase';

import { useAuth } from '@/hooks/useAuth';
import type { Coordinates } from '@/hooks/useLocation';

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export interface UseConfirmMosqueOptions {
  mosqueId: string;
}

export interface UseConfirmMosqueResult {
  confirmMosqueAtLocation: (location: Coordinates) => Promise<ConfirmMosqueResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  lastConfirmedAt: string | null;
  isOnCooldown: boolean;
  refreshCooldown: () => Promise<void>;
}

export function useConfirmMosque({ mosqueId }: UseConfirmMosqueOptions): UseConfirmMosqueResult {
  const { session, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConfirmedAt, setLastConfirmedAt] = useState<string | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  const refreshCooldown = useCallback(async () => {
    const id = mosqueId.trim();
    if (!id || !session?.user?.id) {
      setLastConfirmedAt(null);
      setIsOnCooldown(false);
      return;
    }

    const { data, error: qErr } = await supabase
      .from('mosque_confirmations')
      .select('confirmed_at')
      .eq('mosque_id', id)
      .eq('user_id', session.user.id)
      .order('confirmed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (qErr || !data?.confirmed_at) {
      setLastConfirmedAt(null);
      setIsOnCooldown(false);
      return;
    }

    const at = data.confirmed_at;
    setLastConfirmedAt(at);
    const ts = Date.parse(at);
    if (Number.isNaN(ts)) {
      setIsOnCooldown(false);
      return;
    }
    setIsOnCooldown(Date.now() - ts < COOLDOWN_MS);
  }, [mosqueId, session?.user?.id]);

  useEffect(() => {
    void refreshCooldown();
  }, [refreshCooldown]);

  const confirmMosqueAtLocation = useCallback(
    async (location: Coordinates) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await confirmMosque({
          mosque_id: mosqueId.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
        });
        const nowIso = new Date().toISOString();
        setLastConfirmedAt(nowIso);
        setIsOnCooldown(true);
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
    [mosqueId],
  );

  return {
    confirmMosqueAtLocation,
    isLoading,
    error,
    clearError: () => {
      setError(null);
    },
    lastConfirmedAt,
    isOnCooldown: isAuthenticated ? isOnCooldown : false,
    refreshCooldown,
  };
}
