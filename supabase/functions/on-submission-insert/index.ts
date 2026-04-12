import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  isPrayerType,
  isTimeInRangeForPrayer,
  timetzToHhMm,
  type PrayerType,
} from './prayerRange.ts';
import { calculateTrustScore, isContributorTier, type ContributorTier } from './trustScore.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function utcDateKeyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

async function verifyCaller(req: Request): Promise<boolean> {
  const webhookSecret = Deno.env.get('DATABASE_WEBHOOK_SECRET');
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const headerInternal = req.headers.get('x-internal-secret');
  if (webhookSecret && token === webhookSecret) return true;
  if (internalSecret && headerInternal === internalSecret) return true;
  return false;
}

function extractRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;
  if (o.record && typeof o.record === 'object' && !Array.isArray(o.record)) {
    return o.record as Record<string, unknown>;
  }
  if (typeof o.id === 'string' && typeof o.mosque_id === 'string') {
    return o;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'SERVER_MISCONFIGURED', message: 'Missing Supabase environment' }, 500);
  }

  if (!(await verifyCaller(req))) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid webhook secret' }, 401);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse JSON' }, 400);
  }

  const record = extractRecord(payload);
  if (!record || typeof record.id !== 'string') {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Missing record' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: row, error: rowErr } = await admin
    .from('jamat_times')
    .select('*')
    .eq('id', record.id as string)
    .maybeSingle();

  if (rowErr || !row) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Submission not found' }, 404);
  }

  const submissionId = row.id as string;
  const mosqueId = row.mosque_id as string;
  const prayer = row.prayer as string;
  const submittedBy = row.submitted_by as string;
  const createdAt = row.created_at as string;
  const timeVal = row.time as string;

  if (!isPrayerType(prayer)) {
    await admin.from('jamat_times').update({ status: 'rejected' }).eq('id', submissionId);
    await admin.from('moderation_log').insert({
      submission_id: submissionId,
      rule_triggered: 'TIME_RANGE',
      reason: 'Invalid prayer enum',
    });
    return jsonResponse({ ok: true, status: 'rejected' });
  }
  const prayerTyped = prayer as PrayerType;

  const hhmm = timetzToHhMm(timeVal);
  let rejected = false;
  let ruleTriggered = '';

  if (!hhmm || !isTimeInRangeForPrayer(prayerTyped, hhmm)) {
    rejected = true;
    ruleTriggered = 'TIME_RANGE';
  }

  if (!rejected) {
    const windowStart = new Date(new Date(createdAt).getTime() - 60 * 60 * 1000).toISOString();
    const { data: velRows, error: velErr } = await admin
      .from('jamat_times')
      .select('mosque_id')
      .eq('submitted_by', submittedBy)
      .gte('created_at', windowStart);

    if (!velErr && velRows) {
      const distinct = new Set(velRows.map((r) => r.mosque_id as string));
      if (distinct.size >= 3) {
        rejected = true;
        ruleTriggered = 'RULE_VELOCITY';
      }
    }
  }

  let forcePending = false;

  if (!rejected) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: dups, error: dupErr } = await admin
      .from('jamat_times')
      .select('id,time')
      .eq('mosque_id', mosqueId)
      .eq('prayer', prayer)
      .gte('created_at', sevenDaysAgo)
      .neq('id', submissionId);

    if (!dupErr && dups?.some((d) => String(d.time) === String(timeVal))) {
      const { data: mosque, error: mErr } = await admin
        .from('mosques')
        .select('verified_admin_id')
        .eq('id', mosqueId)
        .maybeSingle();

      const adminId = mosque?.verified_admin_id as string | null | undefined;
      let adminHasLive = false;
      if (!mErr && adminId) {
        const { data: adminJamat } = await admin
          .from('jamat_times')
          .select('id')
          .eq('mosque_id', mosqueId)
          .eq('prayer', prayer)
          .eq('status', 'live')
          .eq('submitted_by', adminId)
          .limit(1);
        adminHasLive = (adminJamat?.length ?? 0) > 0;
      }

      if (adminHasLive) {
        forcePending = true;
      } else {
        rejected = true;
        ruleTriggered = 'DUPLICATE_CONTENT';
      }
    }
  }

  if (!rejected && !forcePending) {
    const day = utcDateKeyFromIso(createdAt);
    const dayEnd = new Date(`${day}T00:00:00.000Z`);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const { count, error: cErr } = await admin
      .from('jamat_times')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', submittedBy)
      .gte('created_at', `${day}T00:00:00.000Z`)
      .lt('created_at', dayEnd.toISOString());

    if (!cErr && (count ?? 0) > 5) {
      rejected = true;
      ruleTriggered = 'FREQUENCY_CAP';
    }
  }

  if (rejected) {
    await admin.from('jamat_times').update({ status: 'rejected' }).eq('id', submissionId);
    await admin.from('moderation_log').insert({
      submission_id: submissionId,
      rule_triggered: ruleTriggered,
      reason: 'Moderation rule failed',
    });
    await admin.from('contributor_log').insert({
      user_id: submittedBy,
      action_type: 'submission',
      mosque_id: mosqueId,
      accepted: false,
    });
    return jsonResponse({ ok: true, status: 'rejected' });
  }

  if (forcePending) {
    await admin.from('jamat_times').update({ status: 'pending' }).eq('id', submissionId);
  }

  const { data: mosqueFull } = await admin
    .from('mosques')
    .select('confirmation_count')
    .eq('id', mosqueId)
    .maybeSingle();

  const rawConf = Number(mosqueFull?.confirmation_count ?? 0);
  const confirmationBoostCount = Math.min(Math.max(rawConf, 0), 5);

  const checkSince = new Date(Date.now() - 30 * 86400000).toISOString();
  const { count: checkinCount } = await admin
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId)
    .eq('prayer', prayer)
    .eq('geofence_validated', true)
    .gte('arrived_at', checkSince);

  const checkins = checkinCount ?? 0;

  const { data: competing } = await admin
    .from('jamat_times')
    .select('id,submitted_by,time,status')
    .eq('mosque_id', mosqueId)
    .eq('prayer', prayer)
    .in('status', ['live', 'pending']);

  const submitterIds = [...new Set((competing ?? []).map((r) => r.submitted_by as string))];
  const tierMap = new Map<string, ContributorTier>();

  if (submitterIds.length) {
    const { data: usersRows } = await admin.from('users').select('id,tier').in('id', submitterIds);
    for (const u of usersRows ?? []) {
      const t = u.tier as string;
      tierMap.set(u.id as string, isContributorTier(t) ? t : 'new_user');
    }
  }

  const rows = competing ?? [];

  for (const r of rows) {
    const id = r.id as string;
    const selfTime = String(r.time);
    const selfTier = tierMap.get(r.submitted_by as string) ?? 'new_user';

    let hasConflict = false;
    for (const o of rows) {
      if (o.id === r.id) continue;
      const otherTier = tierMap.get(o.submitted_by as string) ?? 'new_user';
      if (String(o.time) === selfTime) continue;
      if (selfTier === 'mosque_admin' || otherTier === 'mosque_admin') continue;
      if (selfTier === otherTier) {
        hasConflict = true;
        break;
      }
    }

    const score = calculateTrustScore({
      tier: selfTier,
      checkinCount: checkins,
      confirmationCount: confirmationBoostCount,
      hasConflict,
    });

    await admin.from('jamat_times').update({ trust_score: score }).eq('id', id);
  }

  const { data: finalRow } = await admin
    .from('jamat_times')
    .select('status')
    .eq('id', submissionId)
    .single();

  if (finalRow?.status === 'live') {
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? '';
    await fetch(`${supabaseUrl}/functions/v1/update-contributor-tier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ user_id: submittedBy }),
    }).catch(() => {
      /* non-fatal */
    });
  }

  return jsonResponse({ ok: true, status: finalRow?.status ?? 'unknown' });
});
