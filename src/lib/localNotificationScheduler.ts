import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { i18n } from '@/i18n';
import { prayerTranslationKey } from '@/lib/formatters';
import type { JamatTime, PrayerType } from '@/types/mosque';
import type { NotificationLeadMinutes } from '@/types/user';

const LOCAL_NOTIFICATION_REGISTRY_KEY = 'masjidy-local-notification-registry';
const MAX_LOCAL_NOTIFICATIONS_IOS = 64;

type LocalNotificationKind = 'jamat' | 'prayer';

interface LocalNotificationRegistryEntry {
  logicalId: string;
  scheduledId: string;
  kind: LocalNotificationKind;
  mosqueId: string | null;
}

export interface JamatNotificationInput {
  mosqueId: string;
  mosqueName: string;
  prayer: PrayerType;
  jamatTimeUtc: Date;
  leadMinutes: NotificationLeadMinutes;
}

export interface PrayerNotificationInput {
  prayer: PrayerType;
  prayerTimeUtc: Date;
  leadMinutes: NotificationLeadMinutes;
}

export interface JamatScheduleMosqueInput {
  id: string;
  name: string;
  jamatTimes: JamatTime[];
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseRegistry(rawValue: string | null): LocalNotificationRegistryEntry[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is LocalNotificationRegistryEntry => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      const record = entry as Record<string, unknown>;
      return (
        typeof record.logicalId === 'string' &&
        typeof record.scheduledId === 'string' &&
        (record.kind === 'jamat' || record.kind === 'prayer') &&
        (record.mosqueId === null || typeof record.mosqueId === 'string')
      );
    });
  } catch {
    return [];
  }
}

async function readRegistry(): Promise<LocalNotificationRegistryEntry[]> {
  try {
    const rawValue = await AsyncStorage.getItem(LOCAL_NOTIFICATION_REGISTRY_KEY);
    return parseRegistry(rawValue);
  } catch {
    return [];
  }
}

async function writeRegistry(entries: LocalNotificationRegistryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_NOTIFICATION_REGISTRY_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures; notification delivery still works.
  }
}

async function upsertRegistryEntry(nextEntry: LocalNotificationRegistryEntry): Promise<void> {
  const current = await readRegistry();
  const next = current.filter((entry) => entry.logicalId !== nextEntry.logicalId);
  next.push(nextEntry);
  await writeRegistry(next);
}

async function removeRegistryEntry(logicalId: string): Promise<void> {
  const current = await readRegistry();
  const next = current.filter((entry) => entry.logicalId !== logicalId);
  await writeRegistry(next);
}

async function lookupRegistryEntry(logicalId: string): Promise<LocalNotificationRegistryEntry | null> {
  const current = await readRegistry();
  return current.find((entry) => entry.logicalId === logicalId) ?? null;
}

function normalizeMosqueId(mosqueId: string): string {
  return mosqueId.trim().slice(0, 8);
}

function parseTimetzToDate(effectiveDate: string, timetz: string): Date | null {
  const isoLike = `${effectiveDate}T${timetz.trim()}`;
  const parsed = new Date(isoLike);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function subtractLeadMinutes(source: Date, leadMinutes: NotificationLeadMinutes): Date {
  return new Date(source.getTime() - leadMinutes * 60_000);
}

async function hasIosBudget(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length < MAX_LOCAL_NOTIFICATIONS_IOS;
}

async function scheduleRequest(input: {
  logicalId: string;
  kind: LocalNotificationKind;
  mosqueId: string | null;
  title: string;
  body: string;
  triggerAt: Date;
  data: Record<string, string>;
}): Promise<string> {
  if (input.triggerAt.getTime() <= Date.now()) {
    return input.logicalId;
  }

  if (!(await hasIosBudget())) {
    return input.logicalId;
  }

  const existing = await lookupRegistryEntry(input.logicalId);
  if (existing) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing.scheduledId);
    } catch {
      // Ignore stale scheduled identifiers.
    }
  }

  const scheduledId = await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      sound: 'default',
      data: input.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.triggerAt,
    },
  });

  await upsertRegistryEntry({
    logicalId: input.logicalId,
    scheduledId,
    kind: input.kind,
    mosqueId: input.mosqueId,
  });

  return input.logicalId;
}

export function buildNotificationId(type: LocalNotificationKind, ...parts: string[]): string {
  return [type, ...parts.map((part) => part.trim())].join(':');
}

export async function scheduleJamatReminder(input: JamatNotificationInput): Promise<string> {
  const logicalId = buildNotificationId(
    'jamat',
    normalizeMosqueId(input.mosqueId),
    input.prayer,
    toDateKey(input.jamatTimeUtc),
  );

  const body = i18n.t('notification.jamatReminder.body', {
    prayer: i18n.t(prayerTranslationKey(input.prayer)),
    minutes: input.leadMinutes,
  });

  await scheduleRequest({
    logicalId,
    kind: 'jamat',
    mosqueId: input.mosqueId,
    title: i18n.t('notification.jamatReminder.title', {
      mosqueName: input.mosqueName,
    }),
    body,
    triggerAt: subtractLeadMinutes(input.jamatTimeUtc, input.leadMinutes),
    data: {
      type: 'jamat_reminder',
      logical_id: logicalId,
      mosque_id: input.mosqueId,
      prayer: input.prayer,
    },
  });

  return logicalId;
}

export async function schedulePrayerTimeReminders(
  prayers: PrayerNotificationInput[],
): Promise<number> {
  let scheduledCount = 0;

  for (const prayer of prayers) {
    const logicalId = buildNotificationId('prayer', prayer.prayer, toDateKey(prayer.prayerTimeUtc));
    const body = i18n.t('notification.prayerReminder.body', {
      prayer: i18n.t(prayerTranslationKey(prayer.prayer)),
      minutes: prayer.leadMinutes,
    });

    const before = await lookupRegistryEntry(logicalId);
    await scheduleRequest({
      logicalId,
      kind: 'prayer',
      mosqueId: null,
      title: i18n.t('notification.prayerReminder.title'),
      body,
      triggerAt: subtractLeadMinutes(prayer.prayerTimeUtc, prayer.leadMinutes),
      data: {
        type: 'prayer_reminder',
        logical_id: logicalId,
        prayer: prayer.prayer,
      },
    });

    const after = await lookupRegistryEntry(logicalId);
    if (!before && after) {
      scheduledCount += 1;
    }
  }

  return scheduledCount;
}

export async function cancelNotification(identifier: string): Promise<void> {
  const entry = await lookupRegistryEntry(identifier);
  if (!entry) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(entry.scheduledId);
  } catch {
    // Ignore missing or already-fired notifications.
  }

  await removeRegistryEntry(identifier);
}

export async function cancelForMosque(mosqueId: string): Promise<void> {
  const current = await readRegistry();
  const targetEntries = current.filter((entry) => entry.kind === 'jamat' && entry.mosqueId === mosqueId);

  for (const entry of targetEntries) {
    try {
      await Notifications.cancelScheduledNotificationAsync(entry.scheduledId);
    } catch {
      // Ignore stale scheduled identifiers.
    }
  }

  await writeRegistry(
    current.filter((entry) => !(entry.kind === 'jamat' && entry.mosqueId === mosqueId)),
  );
}

export async function cancelAllLocal(): Promise<void> {
  const current = await readRegistry();

  for (const entry of current) {
    try {
      await Notifications.cancelScheduledNotificationAsync(entry.scheduledId);
    } catch {
      // Ignore stale scheduled identifiers.
    }
  }

  await writeRegistry([]);
}

export async function scheduleForFollowedMosques(
  mosques: JamatScheduleMosqueInput[],
  leadMinutes: NotificationLeadMinutes,
): Promise<number> {
  let scheduledCount = 0;

  for (const mosque of mosques) {
    for (const jamatTime of mosque.jamatTimes) {
      const jamatTimeUtc = parseTimetzToDate(jamatTime.effective_date, jamatTime.time);
      if (!jamatTimeUtc) {
        continue;
      }

      const before = await lookupRegistryEntry(
        buildNotificationId('jamat', normalizeMosqueId(mosque.id), jamatTime.prayer, toDateKey(jamatTimeUtc)),
      );

      await scheduleJamatReminder({
        mosqueId: mosque.id,
        mosqueName: mosque.name,
        prayer: jamatTime.prayer,
        jamatTimeUtc,
        leadMinutes,
      });

      const after = await lookupRegistryEntry(
        buildNotificationId('jamat', normalizeMosqueId(mosque.id), jamatTime.prayer, toDateKey(jamatTimeUtc)),
      );

      if (!before && after) {
        scheduledCount += 1;
      }
    }
  }

  return scheduledCount;
}

export async function rescheduleAll(
  mosques: JamatScheduleMosqueInput[],
  leadMinutes: NotificationLeadMinutes,
): Promise<number> {
  await cancelAllLocal();
  return scheduleForFollowedMosques(mosques, leadMinutes);
}
