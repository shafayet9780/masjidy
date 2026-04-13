import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { cancelAllLocal } from '@/lib/localNotificationScheduler';
import {
  clearRegisteredPushToken,
  registerPushToken,
  transitionToLocalPush,
  transitionToRemotePush,
} from '@/services/notifications';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useFollowStore } from '@/store/followStore';
import { usePreferencesStore } from '@/store/preferencesStore';

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

function mapPermissionStatus(result: Notifications.NotificationPermissionsStatus): NotificationPermissionStatus {
  if (result.granted) {
    return 'granted';
  }

  if (result.canAskAgain === false || result.status === 'denied') {
    return 'denied';
  }

  return 'undetermined';
}

function resolveProjectId(): string | null {
  const easProjectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra &&
    typeof Constants.expoConfig.extra === 'object' &&
    'eas' in Constants.expoConfig.extra &&
    Constants.expoConfig.extra.eas &&
    typeof Constants.expoConfig.extra.eas === 'object' &&
    'projectId' in Constants.expoConfig.extra.eas &&
    typeof Constants.expoConfig.extra.eas.projectId === 'string'
      ? Constants.expoConfig.extra.eas.projectId
      : null);

  return easProjectId ?? null;
}

export interface UseNotificationsResult {
  permissionStatus: NotificationPermissionStatus;
  expoPushToken: string | null;
  latestNotification: Notifications.Notification | null;
  requestPermission: () => Promise<boolean>;
  initialize: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const appHydrated = useAppStore((state) => state.hydrated);
  const jamatNotificationsEnabled = useAppStore((state) => state.jamatNotificationsEnabled);
  const followHydrated = useFollowStore((state) => state.hydrated);
  const onboardingCompleted = usePreferencesStore((state) => state.onboardingCompleted);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [latestNotification, setLatestNotification] = useState<Notifications.Notification | null>(null);
  const initializeInFlight = useRef(false);

  const isAuthenticated = Boolean(session);

  const ensureAndroidChannel = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    await Notifications.setNotificationChannelAsync('jamat-reminders', {
      name: 'Jamat reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 200, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    const existingStatus = mapPermissionStatus(existing);
    if (existingStatus === 'granted') {
      setPermissionStatus('granted');
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    const nextStatus = mapPermissionStatus(requested);
    setPermissionStatus(nextStatus);
    return nextStatus === 'granted';
  }, [ensureAndroidChannel]);

  const registerCurrentPushToken = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      return null;
    }

    const projectId = resolveProjectId();
    if (!projectId) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await registerPushToken(token.data, platform);
    setExpoPushToken(token.data);
    return token.data;
  }, []);

  const initialize = useCallback(async () => {
    if (
      initializeInFlight.current ||
      !onboardingCompleted ||
      !authHydrated ||
      !appHydrated ||
      !followHydrated
    ) {
      return;
    }

    initializeInFlight.current = true;

    try {
      if (!jamatNotificationsEnabled) {
        await cancelAllLocal();
        if (isAuthenticated) {
          await clearRegisteredPushToken();
        }
        return;
      }

      const granted = await requestPermission();
      if (!granted) {
        return;
      }

      if (isAuthenticated) {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const token = await registerCurrentPushToken();
        if (token) {
          await transitionToRemotePush(token, platform);
        }
        return;
      }

      await transitionToLocalPush();
    } finally {
      initializeInFlight.current = false;
    }
  }, [
    appHydrated,
    authHydrated,
    followHydrated,
    isAuthenticated,
    jamatNotificationsEnabled,
    onboardingCompleted,
    registerCurrentPushToken,
    requestPermission,
  ]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      setLatestNotification(notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data.mosque_id === 'string' && data.mosque_id.length > 0) {
        router.push(`/mosque/${data.mosque_id}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data;
      if (data && typeof data.mosque_id === 'string' && data.mosque_id.length > 0) {
        router.push(`/mosque/${data.mosque_id}`);
      }
    });
  }, [router]);

  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(async (token) => {
      if (!isAuthenticated) {
        return;
      }

      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      setExpoPushToken(token.data);
      await registerPushToken(token.data, platform);
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void initialize();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initialize]);

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((result) => {
      setPermissionStatus(mapPermissionStatus(result));
    });
  }, []);

  return {
    permissionStatus,
    expoPushToken,
    latestNotification,
    requestPermission,
    initialize,
  };
}
