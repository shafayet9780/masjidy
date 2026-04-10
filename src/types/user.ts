/** Domain types for users and related tables — align with PROJECT_SPEC §5 */

import type { PrayerType } from '@/types/mosque';

export const contributorTier = {
  new_user: 'new_user',
  regular: 'regular',
  trusted: 'trusted',
  mosque_admin: 'mosque_admin',
} as const;

export type ContributorTier = (typeof contributorTier)[keyof typeof contributorTier];

export const prayerCalcMethod = {
  mwl: 'mwl',
  isna: 'isna',
  karachi: 'karachi',
  umm_al_qura: 'umm_al_qura',
} as const;

export type PrayerCalcMethod =
  (typeof prayerCalcMethod)[keyof typeof prayerCalcMethod];

export const notificationLeadMinutes = {
  ten: 10,
  fifteen: 15,
  thirty: 30,
} as const;

export type NotificationLeadMinutes =
  (typeof notificationLeadMinutes)[keyof typeof notificationLeadMinutes];

export const notificationJobStatus = {
  queued: 'queued',
  delivered: 'delivered',
  failed: 'failed',
} as const;

export type NotificationJobStatus =
  (typeof notificationJobStatus)[keyof typeof notificationJobStatus];

export const actionType = {
  submission: 'submission',
  checkin: 'checkin',
  endorsement: 'endorsement',
  confirmation: 'confirmation',
  seasonal_prompt: 'seasonal_prompt',
} as const;

export type ActionType = (typeof actionType)[keyof typeof actionType];

export interface User {
  id: string;
  display_name: string;
  tier: ContributorTier;
  tier_last_active_at: string;
  language: string;
  prayer_calc_method: PrayerCalcMethod;
  notification_lead_minutes: NotificationLeadMinutes;
  fcm_token: string | null;
  apns_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  mosque_id: string;
  prayer: PrayerType;
  arrived_at: string;
  started_at: string | null;
  delta_minutes: number | null;
  geofence_validated: boolean;
  created_at: string;
}

export interface ContributorLogEntry {
  id: string;
  user_id: string;
  action_type: ActionType;
  mosque_id: string | null;
  accepted: boolean | null;
  created_at: string;
}

export interface NotificationJob {
  id: string;
  qstash_message_id: string | null;
  mosque_id: string;
  prayer: PrayerType;
  date: string;
  user_id: string;
  scheduled_for: string;
  status: NotificationJobStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerationLogEntry {
  id: string;
  submission_id: string | null;
  rule_triggered: string;
  reason: string | null;
  created_at: string;
}
