import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';

import { isPrayerType, isTimeInRangeForPrayer, type PrayerType } from './prayerRange.ts';
import { BASE_SCORE, isContributorTier, type ContributorTier } from './trustBase.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^(\d{1,2}):(\d{2})$/;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normalizeTimeHhMm(raw: string): string | null {
  const m = raw.trim().match(TIME_REGEX);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function toTimetzString(hhMm: string, tzOffsetMin: number): string {
  const sign = tzOffsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(tzOffsetMin);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  const off = `${sign}${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`;
  return `${hhMm}:00${off}`;
}

async function incrementDailySubmissionCount(
  redis: Redis | null,
  userId: string,
  dateKey: string,
): Promise<{ count: number; usedRedis: boolean }> {
  const key = `rate:${userId}:submissions:${dateKey}`;
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86400);
    }
    return { count, usedRedis: true };
  }
  return { count: -1, usedRedis: false };
}

async function decrementRedisKey(redis: Redis | null, userId: string, dateKey: string): Promise<void> {
  if (!redis) return;
  const key = `rate:${userId}:submissions:${dateKey}`;
  await redis.decr(key);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(
      { error: 'SERVER_MISCONFIGURED', message: 'Missing Supabase environment' },
      500,
    );
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Missing authorization' }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid or expired session' }, 401);
  }

  const userId = user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse JSON body' }, 400);
  }

  const mosqueId = typeof body.mosque_id === 'string' ? body.mosque_id.trim() : '';
  const prayerRaw = typeof body.prayer === 'string' ? body.prayer.trim() : '';
  const timeRaw = typeof body.time === 'string' ? body.time : '';
  const effectiveDateRaw =
    typeof body.effective_date === 'string' ? body.effective_date.trim() : utcDateKey(new Date());
  const noteRaw = typeof body.note === 'string' ? body.note : undefined;
  const tzOffsetMin =
    typeof body.tz_offset_min === 'number' && Number.isFinite(body.tz_offset_min)
      ? Math.min(840, Math.max(-840, Math.floor(body.tz_offset_min)))
      : 0;

  if (!UUID_REGEX.test(mosqueId)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'mosque_id must be a valid UUID' }, 400);
  }

  if (!isPrayerType(prayerRaw)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'Invalid prayer value' }, 400);
  }
  const prayer = prayerRaw as PrayerType;

  const timeNorm = normalizeTimeHhMm(timeRaw);
  if (!timeNorm) {
    return jsonResponse(
      { error: 'TIME_OUT_OF_RANGE', message: 'Time must be HH:MM (24-hour)' },
      400,
    );
  }

  if (!isTimeInRangeForPrayer(prayer, timeNorm)) {
    return jsonResponse(
      {
        error: 'TIME_OUT_OF_RANGE',
        message: 'This time seems unusual for this prayer',
      },
      400,
    );
  }

  if (!DATE_REGEX.test(effectiveDateRaw)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'effective_date must be YYYY-MM-DD' }, 400);
  }

  if (noteRaw != null && noteRaw.length > 120) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'Note must be 120 characters or fewer' }, 400);
  }

  const { data: mosqueRow, error: mosqueErr } = await admin
    .from('mosques')
    .select('id')
    .eq('id', mosqueId)
    .maybeSingle();

  if (mosqueErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not verify mosque' }, 500);
  }
  if (!mosqueRow) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Mosque not found' }, 404);
  }

  const now = new Date();

  const dupDay = utcDateKey(now);
  const dupDayEnd = new Date(`${dupDay}T00:00:00.000Z`);
  dupDayEnd.setUTCDate(dupDayEnd.getUTCDate() + 1);
  const dupDayEndStr = dupDayEnd.toISOString();

  const { data: dupRows, error: dupErr } = await admin
    .from('jamat_times')
    .select('id')
    .eq('submitted_by', userId)
    .eq('mosque_id', mosqueId)
    .eq('prayer', prayer)
    .gte('created_at', `${dupDay}T00:00:00.000Z`)
    .lt('created_at', dupDayEndStr)
    .limit(1);

  if (dupErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Duplicate check failed' }, 500);
  }
  if (dupRows && dupRows.length > 0) {
    return jsonResponse(
      { error: 'DUPLICATE', message: "You've already submitted for this prayer today" },
      409,
    );
  }

  const dateKey = utcDateKey(now);

  const restUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') ?? Deno.env.get('UPSTASH_REDIS_URL');
  const restToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? Deno.env.get('UPSTASH_REDIS_TOKEN');
  const redis =
    restUrl && restToken ? new Redis({ url: restUrl, token: restToken }) : null;

  const freq = await incrementDailySubmissionCount(redis, userId, dateKey);
  let submissionCount = freq.count;

  if (!freq.usedRedis) {
    const start = `${dateKey}T00:00:00.000Z`;
    const end = `${dateKey}T23:59:59.999Z`;
    const { count, error: cntErr } = await admin
      .from('jamat_times')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', userId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (cntErr) {
      return jsonResponse({ error: 'SERVER_ERROR', message: 'Frequency check failed' }, 500);
    }
    submissionCount = (count ?? 0) + 1;
  }

  if (submissionCount > 5) {
    if (freq.usedRedis) {
      await decrementRedisKey(redis, userId, dateKey);
    }
    return jsonResponse(
      { error: 'FREQUENCY_CAP', message: 'Maximum 5 submissions per day reached' },
      429,
    );
  }

  const windowStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { data: velRows, error: velErr } = await admin
    .from('jamat_times')
    .select('mosque_id')
    .eq('submitted_by', userId)
    .gte('created_at', windowStart);

  if (velErr) {
    if (freq.usedRedis) await decrementRedisKey(redis, userId, dateKey);
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Velocity check failed' }, 500);
  }

  const distinct = new Set((velRows ?? []).map((r) => r.mosque_id as string));
  distinct.add(mosqueId);
  if (distinct.size >= 3) {
    if (freq.usedRedis) await decrementRedisKey(redis, userId, dateKey);
    return jsonResponse(
      { error: 'RULE_VELOCITY', message: "You've submitted for too many mosques recently" },
      422,
    );
  }

  const { data: profile, error: profErr } = await admin
    .from('users')
    .select('tier')
    .eq('id', userId)
    .maybeSingle();

  if (profErr) {
    if (freq.usedRedis) await decrementRedisKey(redis, userId, dateKey);
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not load profile' }, 500);
  }

  let tier: ContributorTier = 'new_user';
  if (profile?.tier && isContributorTier(profile.tier)) {
    tier = profile.tier;
  }

  const status = tier === 'new_user' ? 'pending' : 'live';
  const trustScore = BASE_SCORE[tier] ?? BASE_SCORE.new_user;
  const timetz = toTimetzString(timeNorm, tzOffsetMin);

  const { data: inserted, error: insErr } = await admin
    .from('jamat_times')
    .insert({
      mosque_id: mosqueId,
      prayer,
      time: timetz,
      effective_date: effectiveDateRaw,
      submitted_by: userId,
      trust_score: trustScore,
      status,
      note: noteRaw?.trim() ? noteRaw.trim() : null,
      last_verified_at: now.toISOString(),
    })
    .select('id,status,trust_score')
    .single();

  if (insErr || !inserted) {
    if (freq.usedRedis) await decrementRedisKey(redis, userId, dateKey);
    const code = insErr?.code === '23505' ? 'DUPLICATE' : 'INSERT_FAILED';
    const statusCode = insErr?.code === '23505' ? 409 : 500;
    return jsonResponse(
      {
        error: code,
        message:
          insErr?.code === '23505'
            ? "You've already submitted for this prayer today"
            : 'Could not save submission',
      },
      statusCode,
    );
  }

  await admin.from('contributor_log').insert({
    user_id: userId,
    action_type: 'submission',
    mosque_id: mosqueId,
    accepted: true,
  });

  return jsonResponse(
    {
      id: inserted.id,
      status: inserted.status,
      trust_score: inserted.trust_score,
    },
    201,
  );
});
