/**
 * Supabase-generated database types.
 * Regenerate: npx tsx scripts/generate-types.ts [--local]
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      check_ins: {
        Row: {
          arrived_at: string;
          created_at: string;
          delta_minutes: number | null;
          geofence_validated: boolean;
          id: string;
          mosque_id: string;
          prayer: Database['public']['Enums']['prayer_type'];
          started_at: string | null;
          user_id: string;
        };
        Insert: {
          arrived_at?: string;
          created_at?: string;
          delta_minutes?: number | null;
          geofence_validated?: boolean;
          id?: string;
          mosque_id: string;
          prayer: Database['public']['Enums']['prayer_type'];
          started_at?: string | null;
          user_id: string;
        };
        Update: {
          arrived_at?: string;
          created_at?: string;
          delta_minutes?: number | null;
          geofence_validated?: boolean;
          id?: string;
          mosque_id?: string;
          prayer?: Database['public']['Enums']['prayer_type'];
          started_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'check_ins_mosque_id_fkey';
            columns: ['mosque_id'];
            isOneToOne: false;
            referencedRelation: 'mosques';
            referencedColumns: ['id'];
          },
        ];
      };
      contributor_log: {
        Row: {
          accepted: boolean | null;
          action_type: Database['public']['Enums']['action_type'];
          created_at: string;
          id: string;
          mosque_id: string | null;
          user_id: string;
        };
        Insert: {
          accepted?: boolean | null;
          action_type: Database['public']['Enums']['action_type'];
          created_at?: string;
          id?: string;
          mosque_id?: string | null;
          user_id: string;
        };
        Update: {
          accepted?: boolean | null;
          action_type?: Database['public']['Enums']['action_type'];
          created_at?: string;
          id?: string;
          mosque_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contributor_log_mosque_id_fkey';
            columns: ['mosque_id'];
            isOneToOne: false;
            referencedRelation: 'mosques';
            referencedColumns: ['id'];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          mosque_id: string;
          notification_prefs: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          mosque_id: string;
          notification_prefs?: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          mosque_id?: string;
          notification_prefs?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_mosque_id_fkey';
            columns: ['mosque_id'];
            isOneToOne: false;
            referencedRelation: 'mosques';
            referencedColumns: ['id'];
          },
        ];
      };
      jamat_times: {
        Row: {
          created_at: string;
          effective_date: string;
          id: string;
          last_verified_at: string | null;
          mosque_id: string;
          note: string | null;
          prayer: Database['public']['Enums']['prayer_type'];
          status: Database['public']['Enums']['submission_status'];
          submitted_by: string;
          time: string;
          trust_score: number;
        };
        Insert: {
          created_at?: string;
          effective_date?: string;
          id?: string;
          last_verified_at?: string | null;
          mosque_id: string;
          note?: string | null;
          prayer: Database['public']['Enums']['prayer_type'];
          status?: Database['public']['Enums']['submission_status'];
          submitted_by: string;
          time: string;
          trust_score?: number;
        };
        Update: {
          created_at?: string;
          effective_date?: string;
          id?: string;
          last_verified_at?: string | null;
          mosque_id?: string;
          note?: string | null;
          prayer?: Database['public']['Enums']['prayer_type'];
          status?: Database['public']['Enums']['submission_status'];
          submitted_by?: string;
          time?: string;
          trust_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'jamat_times_mosque_id_fkey';
            columns: ['mosque_id'];
            isOneToOne: false;
            referencedRelation: 'mosques';
            referencedColumns: ['id'];
          },
        ];
      };
      moderation_log: {
        Row: {
          created_at: string;
          id: string;
          reason: string | null;
          rule_triggered: string;
          submission_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          rule_triggered: string;
          submission_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          rule_triggered?: string;
          submission_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'moderation_log_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: false;
            referencedRelation: 'jamat_times';
            referencedColumns: ['id'];
          },
        ];
      };
      mosque_confirmations: {
        Row: {
          confirmed_at: string;
          id: string;
          mosque_id: string;
          user_id: string;
        };
        Insert: {
          confirmed_at?: string;
          id?: string;
          mosque_id: string;
          user_id: string;
        };
        Update: {
          confirmed_at?: string;
          id?: string;
          mosque_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mosque_confirmations_mosque_id_fkey';
            columns: ['mosque_id'];
            isOneToOne: false;
            referencedRelation: 'mosques';
            referencedColumns: ['id'];
          },
        ];
      };
      mosques: {
        Row: {
          address: string;
          confirmation_count: number | null;
          contact_phone: string | null;
          created_at: string | null;
          facilities: Json;
          id: string;
          khutbah_language: string | null;
          last_confirmed_at: string | null;
          location: unknown;
          madhab: string | null;
          name: string;
          photo_url: string | null;
          updated_at: string | null;
          verified_admin_id: string | null;
        };
        Insert: {
          address: string;
          confirmation_count?: number | null;
          contact_phone?: string | null;
          created_at?: string | null;
          facilities?: Json;
          id?: string;
          khutbah_language?: string | null;
          last_confirmed_at?: string | null;
          location: unknown;
          madhab?: string | null;
          name: string;
          photo_url?: string | null;
          updated_at?: string | null;
          verified_admin_id?: string | null;
        };
        Update: {
          address?: string;
          confirmation_count?: number | null;
          contact_phone?: string | null;
          created_at?: string | null;
          facilities?: Json;
          id?: string;
          khutbah_language?: string | null;
          last_confirmed_at?: string | null;
          location?: unknown;
          madhab?: string | null;
          name?: string;
          photo_url?: string | null;
          updated_at?: string | null;
          verified_admin_id?: string | null;
        };
        Relationships: [];
      };
      notification_jobs: {
        Row: {
          attempts: number | null;
          created_at: string | null;
          date: string;
          id: string;
          last_error: string | null;
          mosque_id: string;
          prayer: Database['public']['Enums']['prayer_type'];
          qstash_message_id: string | null;
          scheduled_for: string;
          status: Database['public']['Enums']['notification_job_status'];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attempts?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          last_error?: string | null;
          mosque_id: string;
          prayer: Database['public']['Enums']['prayer_type'];
          qstash_message_id?: string | null;
          scheduled_for: string;
          status?: Database['public']['Enums']['notification_job_status'];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attempts?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          last_error?: string | null;
          mosque_id?: string;
          prayer?: Database['public']['Enums']['prayer_type'];
          qstash_message_id?: string | null;
          scheduled_for?: string;
          status?: Database['public']['Enums']['notification_job_status'];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_jobs_mosque_id_fkey';
            columns: ['mosque_id'];
            isOneToOne: false;
            referencedRelation: 'mosques';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          apns_token: string | null;
          created_at: string | null;
          display_name: string;
          fcm_token: string | null;
          id: string;
          language: string | null;
          notification_lead_minutes: number | null;
          prayer_calc_method: string | null;
          tier: Database['public']['Enums']['contributor_tier'];
          tier_last_active_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          apns_token?: string | null;
          created_at?: string | null;
          display_name: string;
          fcm_token?: string | null;
          id: string;
          language?: string | null;
          notification_lead_minutes?: number | null;
          prayer_calc_method?: string | null;
          tier?: Database['public']['Enums']['contributor_tier'];
          tier_last_active_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          apns_token?: string | null;
          created_at?: string | null;
          display_name?: string;
          fcm_token?: string | null;
          id?: string;
          language?: string | null;
          notification_lead_minutes?: number | null;
          prayer_calc_method?: string | null;
          tier?: Database['public']['Enums']['contributor_tier'];
          tier_last_active_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      action_type:
        | 'submission'
        | 'checkin'
        | 'endorsement'
        | 'confirmation'
        | 'seasonal_prompt';
      contributor_tier: 'new_user' | 'regular' | 'trusted' | 'mosque_admin';
      notification_job_status: 'queued' | 'delivered' | 'failed';
      prayer_type: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jumuah';
      submission_status: 'pending' | 'live' | 'rejected';
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
