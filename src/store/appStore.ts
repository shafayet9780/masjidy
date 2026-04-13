import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { notificationLeadMinutes, type NotificationLeadMinutes } from '@/types/user';

const STORAGE_KEY = 'masjidy-app-settings';

interface PersistedAppState {
  notificationLeadMinutes: NotificationLeadMinutes;
  jamatNotificationsEnabled: boolean;
}

export interface AppState extends PersistedAppState {
  ready: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setReady: (ready: boolean) => void;
  setNotificationLeadMinutes: (minutes: NotificationLeadMinutes) => void;
  setJamatNotificationsEnabled: (enabled: boolean) => void;
}

const INITIAL_STATE: PersistedAppState = {
  notificationLeadMinutes: notificationLeadMinutes.fifteen,
  jamatNotificationsEnabled: true,
};

function parseStoredSettings(rawValue: string): Partial<PersistedAppState> | null {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (record.state && typeof record.state === 'object') {
      return record.state as Partial<PersistedAppState>;
    }
    return record as Partial<PersistedAppState>;
  } catch {
    return null;
  }
}

function getPersistedState(state: AppState): PersistedAppState {
  return {
    notificationLeadMinutes: state.notificationLeadMinutes,
    jamatNotificationsEnabled: state.jamatNotificationsEnabled,
  };
}

async function persistState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistedState(state)));
  } catch {
    // Ignore storage failures and keep in-memory state available.
  }
}

function isNotificationLeadMinutes(value: unknown): value is NotificationLeadMinutes {
  return (
    typeof value === 'number' &&
    (Object.values(notificationLeadMinutes) as NotificationLeadMinutes[]).includes(
      value as NotificationLeadMinutes,
    )
  );
}

export const useAppStore = create<AppState>((set, get) => ({
  ...INITIAL_STATE,
  ready: false,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (rawValue) {
        const parsed = parseStoredSettings(rawValue);
        if (parsed) {
          set({
            notificationLeadMinutes: isNotificationLeadMinutes(parsed.notificationLeadMinutes)
              ? parsed.notificationLeadMinutes
              : INITIAL_STATE.notificationLeadMinutes,
            jamatNotificationsEnabled:
              typeof parsed.jamatNotificationsEnabled === 'boolean'
                ? parsed.jamatNotificationsEnabled
                : INITIAL_STATE.jamatNotificationsEnabled,
          });
        }
      }
    } catch {
      set(INITIAL_STATE);
    } finally {
      set({ hydrated: true });
    }
  },
  setReady: (ready) => set({ ready }),
  setNotificationLeadMinutes: (notificationLeadMinutesValue) => {
    set({ notificationLeadMinutes: notificationLeadMinutesValue });
    void persistState(get());
  },
  setJamatNotificationsEnabled: (jamatNotificationsEnabled) => {
    set({ jamatNotificationsEnabled });
    void persistState(get());
  },
}));
