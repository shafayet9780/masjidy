import { PRAYER_ORDER } from '@/constants/prayers';
import {
  cancelAllLocal,
  cancelForMosque,
  rescheduleAll,
  scheduleForFollowedMosques,
  type JamatScheduleMosqueInput,
} from '@/lib/localNotificationScheduler';
import { supabase } from '@/services/supabase';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useFollowStore } from '@/store/followStore';
import type { Database } from '@/types/database';
import type { JamatTime, PrayerType } from '@/types/mosque';
import type { NotificationLeadMinutes } from '@/types/user';

type MosqueRow = Database['public']['Tables']['mosques']['Row'];
type JamatTimeRow = Database['public']['Tables']['jamat_times']['Row'];

export class NotificationServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'NotificationServiceError';
    this.code = code;
  }
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
    status: row.status as JamatTime['status'],
    note: row.note,
    last_verified_at: row.last_verified_at,
    created_at: row.created_at ?? '',
  };
}

function dedupeAndOrderJamatTimes(rows: JamatTime[]): JamatTime[] {
  const byPrayer = new Map<PrayerType, JamatTime>();

  for (const jamatTime of rows) {
    const existing = byPrayer.get(jamatTime.prayer);
    if (!existing) {
      byPrayer.set(jamatTime.prayer, jamatTime);
      continue;
    }

    if (jamatTime.trust_score > existing.trust_score) {
      byPrayer.set(jamatTime.prayer, jamatTime);
      continue;
    }

    if (jamatTime.trust_score === existing.trust_score) {
      const nextCreatedAt = Date.parse(jamatTime.created_at);
      const existingCreatedAt = Date.parse(existing.created_at);
      if (nextCreatedAt > existingCreatedAt) {
        byPrayer.set(jamatTime.prayer, jamatTime);
      }
    }
  }

  return PRAYER_ORDER.map((prayer) => byPrayer.get(prayer)).filter((row): row is JamatTime => row != null);
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowDateKey(): string {
  const nextDay = new Date();
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

async function fetchNotificationMosques(mosqueIds: string[]): Promise<JamatScheduleMosqueInput[]> {
  if (mosqueIds.length === 0) {
    return [];
  }

  const [mosquesResponse, jamatResponse] = await Promise.all([
    supabase.from('mosques').select('id,name').in('id', mosqueIds),
    supabase
      .from('jamat_times')
      .select('*')
      .in('mosque_id', mosqueIds)
      .eq('status', 'live')
      .in('effective_date', [todayDateKey(), tomorrowDateKey()]),
  ]);

  if (mosquesResponse.error) {
    throw new NotificationServiceError('MOSQUE_FETCH_FAILED', mosquesResponse.error.message);
  }

  if (jamatResponse.error) {
    throw new NotificationServiceError('JAMAT_FETCH_FAILED', jamatResponse.error.message);
  }

  const mosqueMap = new Map(
    (mosquesResponse.data ?? []).map((row: Pick<MosqueRow, 'id' | 'name'>) => [row.id, row.name]),
  );
  const jamatByMosque = new Map<string, JamatTime[]>();

  for (const row of jamatResponse.data ?? []) {
    const mapped = mapJamatRow(row as JamatTimeRow);
    const current = jamatByMosque.get(mapped.mosque_id) ?? [];
    current.push(mapped);
    jamatByMosque.set(mapped.mosque_id, current);
  }

  return mosqueIds
    .map((mosqueId) => {
      const name = mosqueMap.get(mosqueId);
      if (!name) {
        return null;
      }

      return {
        id: mosqueId,
        name,
        jamatTimes: dedupeAndOrderJamatTimes(jamatByMosque.get(mosqueId) ?? []),
      };
    })
    .filter((row): row is JamatScheduleMosqueInput => row != null);
}

export async function registerPushToken(token: string, platform: 'android' | 'ios'): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string; message?: string }>(
    'register-token',
    {
      body: { platform, token },
    },
  );

  if (error) {
    throw new NotificationServiceError('NETWORK_ERROR', error.message);
  }

  if (data?.error) {
    throw new NotificationServiceError(data.error, data.message ?? data.error);
  }
}

export async function clearRegisteredPushToken(): Promise<void> {
  const session = useAuthStore.getState().session;
  const userId = session?.user?.id;
  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: null })
    .eq('id', userId);

  if (error) {
    throw new NotificationServiceError('TOKEN_CLEAR_FAILED', error.message);
  }

  const currentProfile = useAuthStore.getState().profile;
  if (currentProfile) {
    useAuthStore.getState().setProfile({
      ...currentProfile,
      expo_push_token: null,
    });
  }
}

export async function scheduleLocalJamatNotifications(): Promise<number> {
  const appState = useAppStore.getState();
  if (!appState.jamatNotificationsEnabled) {
    await cancelAllLocal();
    return 0;
  }

  const followedIds = useFollowStore.getState().followedIds;
  if (followedIds.length === 0) {
    await cancelAllLocal();
    return 0;
  }

  const mosques = await fetchNotificationMosques(followedIds);
  return rescheduleAll(mosques, appState.notificationLeadMinutes);
}

export async function scheduleLocalForMosque(mosqueId: string): Promise<number> {
  const appState = useAppStore.getState();
  if (!appState.jamatNotificationsEnabled) {
    return 0;
  }

  const mosques = await fetchNotificationMosques([mosqueId]);
  return scheduleForFollowedMosques(mosques, appState.notificationLeadMinutes);
}

export async function cancelLocalForMosque(mosqueId: string): Promise<void> {
  await cancelForMosque(mosqueId);
}

export async function rescheduleLocalNotifications(): Promise<number> {
  const appState = useAppStore.getState();
  const followedIds = useFollowStore.getState().followedIds;
  const mosques = await fetchNotificationMosques(followedIds);
  return rescheduleAll(mosques, appState.notificationLeadMinutes);
}

export async function updateNotificationLeadMinutes(
  minutes: NotificationLeadMinutes,
): Promise<void> {
  useAppStore.getState().setNotificationLeadMinutes(minutes);

  const session = useAuthStore.getState().session;
  const profile = useAuthStore.getState().profile;
  if (!session?.user?.id) {
    return;
  }

  const { error } = await supabase
    .from('users')
    .update({ notification_lead_minutes: minutes })
    .eq('id', session.user.id);

  if (error) {
    throw new NotificationServiceError('LEAD_MINUTES_UPDATE_FAILED', error.message);
  }

  if (profile) {
    useAuthStore.getState().setProfile({
      ...profile,
      notification_lead_minutes: minutes,
    });
  }
}

export async function updateJamatNotificationsEnabled(enabled: boolean): Promise<void> {
  useAppStore.getState().setJamatNotificationsEnabled(enabled);

  if (!enabled) {
    await cancelAllLocal();
    if (useAuthStore.getState().session?.user?.id) {
      await clearRegisteredPushToken();
    }
  }
}

export async function transitionToRemotePush(
  expoPushToken: string,
  platform: 'android' | 'ios',
): Promise<void> {
  if (!useAppStore.getState().jamatNotificationsEnabled) {
    await cancelAllLocal();
    await clearRegisteredPushToken();
    return;
  }

  await cancelAllLocal();
  await registerPushToken(expoPushToken, platform);
}

export async function transitionToLocalPush(): Promise<void> {
  if (!useAppStore.getState().jamatNotificationsEnabled) {
    await cancelAllLocal();
    return;
  }

  await scheduleLocalJamatNotifications();
}
