import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useCallback } from 'react';

import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { Database } from '@/types/database';
import {
  type NotificationLeadMinutes,
  prayerCalcMethod,
  type PrayerCalcMethod,
  type User,
} from '@/types/user';

type UserRow = Database['public']['Tables']['users']['Row'];
type SupportedLanguage = 'en' | 'ar' | 'bn' | 'ur';

export interface AuthActionResult {
  success: boolean;
  errorKey?: string;
}

export interface VerifyOtpInput {
  email?: string;
  phone?: string;
  token: string;
  type: 'email' | 'sms';
}

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let googleConfigured = false;

function configureGoogleSignIn() {
  if (googleConfigured || !GOOGLE_WEB_CLIENT_ID) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  googleConfigured = true;
}

function toUser(row: UserRow): User {
  const timestamp = new Date().toISOString();

  return {
    id: row.id,
    display_name: row.display_name,
    tier: row.tier,
    tier_last_active_at: row.tier_last_active_at ?? row.created_at ?? timestamp,
    language: row.language ?? 'en',
    prayer_calc_method: (row.prayer_calc_method ?? prayerCalcMethod.mwl) as PrayerCalcMethod,
    notification_lead_minutes: (row.notification_lead_minutes ?? 15) as NotificationLeadMinutes,
    fcm_token: row.fcm_token,
    apns_token: row.apns_token,
    created_at: row.created_at ?? timestamp,
    updated_at: row.updated_at ?? row.created_at ?? timestamp,
  };
}

function getAuthErrorKey(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'auth.error.generic';
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  const message =
    'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';

  if (code === statusCodes.SIGN_IN_CANCELLED || message.includes('cancel')) {
    return 'auth.error.cancelled';
  }

  if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'auth.error.googlePlayServices';
  }

  if (message.includes('email')) {
    return 'auth.error.invalidEmail';
  }

  if (message.includes('phone')) {
    return 'auth.error.invalidPhone';
  }

  if (message.includes('token') || message.includes('otp')) {
    return 'auth.error.otpFailed';
  }

  if (message.includes('rate limit') || message.includes('security purposes')) {
    return 'auth.error.rateLimited';
  }

  if (message.includes('provider is not enabled') || message.includes('provider disabled')) {
    return 'auth.error.providerUnavailable';
  }

  return 'auth.error.generic';
}

function resolveDisplayName(nextSession: Session): string {
  const storedDisplayName = usePreferencesStore.getState().displayName?.trim();

  if (storedDisplayName) {
    return storedDisplayName;
  }

  const fullName =
    typeof nextSession.user.user_metadata?.full_name === 'string'
      ? nextSession.user.user_metadata.full_name.trim()
      : '';

  if (fullName) {
    return fullName;
  }

  if (nextSession.user.email) {
    return nextSession.user.email.split('@')[0] || 'Masjidy User';
  }

  if (nextSession.user.phone) {
    const lastDigits = nextSession.user.phone.slice(-4);
    return `User ${lastDigits}`;
  }

  return 'Masjidy User';
}

function syncProfileToLocalPreferences(profile: User) {
  const preferencesState = usePreferencesStore.getState();

  preferencesState.setDisplayName(profile.display_name);
  preferencesState.setLanguage(profile.language as SupportedLanguage);
  preferencesState.setPrayerCalcMethod(profile.prayer_calc_method);
}

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const hydrated = useAuthStore((state) => state.hydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const setLoading = useAuthStore((state) => state.setLoading);
  const reset = useAuthStore((state) => state.reset);

  const fetchProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? toUser(data) : null;
    },
    [],
  );

  const createProfile = useCallback(
    async (nextSession: Session): Promise<User> => {
      const preferencesState = usePreferencesStore.getState();

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: nextSession.user.id,
          display_name: resolveDisplayName(nextSession),
          language: preferencesState.language,
          prayer_calc_method: preferencesState.prayerCalcMethod,
        })
        .select('*')
        .single();

      if (error) {
        const existingProfile = await fetchProfile(nextSession.user.id).catch(() => null);

        if (existingProfile) {
          syncProfileToLocalPreferences(existingProfile);
          return existingProfile;
        }

        throw error;
      }

      const nextProfile = toUser(data);
      syncProfileToLocalPreferences(nextProfile);
      return nextProfile;
    },
    [fetchProfile],
  );

  const syncLocalPrefsToProfile = useCallback(
    async (nextSession: Session): Promise<User | null> => {
      const existingProfile = await fetchProfile(nextSession.user.id);

      if (existingProfile) {
        syncProfileToLocalPreferences(existingProfile);
        return existingProfile;
      }

      return createProfile(nextSession);
    },
    [createProfile, fetchProfile],
  );

  const syncSessionState = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        return;
      }

      const nextProfile = await syncLocalPrefsToProfile(nextSession);
      setProfile(nextProfile);
    },
    [setProfile, setSession, syncLocalPrefsToProfile],
  );

  const initAuth = useCallback(() => {
    let isActive = true;

    setLoading(true);

    void (async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!isActive) {
          return;
        }

        await syncSessionState(currentSession);
      } catch {
        if (!isActive) {
          return;
        }

        setSession(null);
        setProfile(null);
      } finally {
        if (isActive) {
          setHydrated(true);
          setLoading(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) {
        return;
      }

      setLoading(true);

      void (async () => {
        try {
          await syncSessionState(nextSession);
        } catch {
          if (!isActive) {
            return;
          }

          setSession(nextSession);
          setProfile(null);
        } finally {
          if (isActive) {
            setHydrated(true);
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [setHydrated, setLoading, setProfile, setSession, syncSessionState]);

  const signInWithEmailOtp = useCallback(async (email: string): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    if (error) {
      return {
        success: false,
        errorKey: getAuthErrorKey(error),
      };
    }

    return { success: true };
  }, []);

  const signInWithPhoneOtp = useCallback(async (phone: string): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });

    if (error) {
      return {
        success: false,
        errorKey: getAuthErrorKey(error),
      };
    }

    return { success: true };
  }, []);

  const verifyOtp = useCallback(async (input: VerifyOtpInput): Promise<AuthActionResult> => {
    const { email, phone, token, type } = input;
    const params =
      type === 'email'
        ? {
            email: email ?? '',
            token,
            type,
          }
        : {
            phone: phone ?? '',
            token,
            type,
          };
    const { error } = await supabase.auth.verifyOtp(params);

    if (error) {
      return {
        success: false,
        errorKey: getAuthErrorKey(error),
      };
    }

    return { success: true };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      return {
        success: false,
        errorKey: 'auth.error.googleNotConfigured',
      };
    }

    try {
      configureGoogleSignIn();

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();

      if (response.type !== 'success') {
        return {
          success: false,
          errorKey: 'auth.error.cancelled',
        };
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        return {
          success: false,
          errorKey: 'auth.error.googleNotConfigured',
        };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return {
          success: false,
          errorKey: getAuthErrorKey(error),
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorKey: getAuthErrorKey(error),
      };
    }
  }, []);

  const signInWithApple = useCallback(async (): Promise<AuthActionResult> => {
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        errorKey: 'auth.error.providerUnavailable',
      };
    }

    const isAppleAvailable = await AppleAuthentication.isAvailableAsync();

    if (!isAppleAvailable) {
      return {
        success: false,
        errorKey: 'auth.error.providerUnavailable',
      };
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return {
          success: false,
          errorKey: 'auth.error.providerUnavailable',
        };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        return {
          success: false,
          errorKey: getAuthErrorKey(error),
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorKey: getAuthErrorKey(error),
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        errorKey: getAuthErrorKey(error),
      };
    }

    if (googleConfigured) {
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore Google native sign-out failures and clear app state anyway.
      }
    }

    reset();

    return { success: true };
  }, [reset]);

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    hydrated,
    isAuthenticated: Boolean(session),
    initAuth,
    fetchProfile,
    createProfile,
    syncLocalPrefsToProfile,
    signInWithEmailOtp,
    signInWithPhoneOtp,
    verifyOtp,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
}
