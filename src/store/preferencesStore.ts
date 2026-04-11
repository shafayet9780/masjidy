import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { prayerCalcMethod, type PrayerCalcMethod } from '@/types/user';

export type SupportedLanguage = 'en' | 'ar' | 'bn' | 'ur';

export interface LocalPreferencesState {
  onboardingCompleted: boolean;
  displayName: string | null;
  language: SupportedLanguage;
  prayerCalcMethod: PrayerCalcMethod;
  locationGranted: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDisplayName: (displayName: string | null) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setPrayerCalcMethod: (prayerCalcMethod: PrayerCalcMethod) => void;
  setLocationGranted: (locationGranted: boolean) => void;
  completeOnboarding: (input: {
    displayName: string | null;
    language: SupportedLanguage;
    prayerCalcMethod: PrayerCalcMethod;
    locationGranted: boolean;
  }) => void;
  reset: () => void;
}

interface PersistedPreferences {
  onboardingCompleted: boolean;
  displayName: string | null;
  language: SupportedLanguage;
  prayerCalcMethod: PrayerCalcMethod;
  locationGranted: boolean;
}

const STORAGE_KEY = 'masjidy-preferences';

const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'ar', 'bn', 'ur'];

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Zustand `persist` used to write `{ state, version }`; we now use a flat object. */
function parseStoredPreferences(rawValue: string): Partial<PersistedPreferences> | null {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (record.state && typeof record.state === 'object') {
      return record.state as Partial<PersistedPreferences>;
    }
    return parsed as Partial<PersistedPreferences>;
  } catch {
    return null;
  }
}

const INITIAL_STATE: PersistedPreferences = {
  onboardingCompleted: false,
  displayName: null,
  language: 'en',
  prayerCalcMethod: prayerCalcMethod.karachi,
  locationGranted: false,
};

function getPersistedPreferences(state: LocalPreferencesState): PersistedPreferences {
  return {
    onboardingCompleted: state.onboardingCompleted,
    displayName: state.displayName,
    language: state.language,
    prayerCalcMethod: state.prayerCalcMethod,
    locationGranted: state.locationGranted,
  };
}

async function persistPreferences(state: LocalPreferencesState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistedPreferences(state)));
  } catch {
    // Ignore storage failures and keep in-memory state available.
  }
}

export const usePreferencesStore = create<LocalPreferencesState>((set, get) => ({
  ...INITIAL_STATE,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

      if (rawValue) {
        const parsed = parseStoredPreferences(rawValue);
        if (parsed) {
          const nextLanguage = isSupportedLanguage(parsed.language)
            ? parsed.language
            : INITIAL_STATE.language;
          set({
            onboardingCompleted: parsed.onboardingCompleted ?? INITIAL_STATE.onboardingCompleted,
            displayName: parsed.displayName ?? INITIAL_STATE.displayName,
            language: nextLanguage,
            prayerCalcMethod: parsed.prayerCalcMethod ?? INITIAL_STATE.prayerCalcMethod,
            locationGranted: parsed.locationGranted ?? INITIAL_STATE.locationGranted,
          });
        }
      }
    } catch {
      set(INITIAL_STATE);
    } finally {
      set({ hydrated: true });
    }
  },
  setDisplayName: (displayName) => {
    set({ displayName });
    void persistPreferences(get());
  },
  setLanguage: (language) => {
    set({ language });
    void persistPreferences(get());
  },
  setPrayerCalcMethod: (nextPrayerCalcMethod) => {
    set({ prayerCalcMethod: nextPrayerCalcMethod });
    void persistPreferences(get());
  },
  setLocationGranted: (locationGranted) => {
    set({ locationGranted });
    void persistPreferences(get());
  },
  completeOnboarding: ({ displayName, language, prayerCalcMethod: nextPrayerCalcMethod, locationGranted }) => {
    set({
      onboardingCompleted: true,
      displayName: displayName?.trim() || null,
      language,
      prayerCalcMethod: nextPrayerCalcMethod,
      locationGranted,
    });
    void persistPreferences(get());
  },
  reset: () => {
    set({
      ...INITIAL_STATE,
      hydrated: true,
    });
    void AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
