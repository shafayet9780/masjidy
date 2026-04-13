import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { isPrayerType, type PrayerType } from './prayerRange.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Normalize TIMETZ fragment (e.g. `16:30:00+06`) to ISO offset suffix `16:30:00+06:00`. */
function timetzToIsoTimeWithOffset(timetz: string): string | null {
  const raw = timetz.trim();
  if (!raw) return null;
  const part = raw.includes('T') ? (raw.split('T')[1] ?? raw) : raw;
  const m = part.match(/^(\d{1,2}):(\d{2}):(\d{2})([+-]\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = String(Number(m[1])).padStart(2, '0');
  const min = String(Number(m[2])).padStart(2, '0');
  const s = String(Number(m[3])).padStart(2, '0');
  const off = m[5] != null ? `${m[4]}:${m[5]}` : `${m[4]}:00`;
  return `${h}:${min}:${s}${off}`;
}

/** Instant for posted jamat on the user's calendar `localDate` (YYYY-MM-DD). */
function jamatInstantOnLocalDate(localDate: string, timetz: string): Date | null {
  const wall = timetzToIsoTimeWithOffset(timetz);
  if (!wall) return null;
  const d = new Date(`${localDate}T${wall}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function utcDayBounds(): { start: string; end: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const start = `${y}-${m}-${d}T00:00:00.000Z`;
  const endDate = new Date(Date.UTC(y, now.getUTCMonth(), now.getUTCDate() + 1));
  const y2 = endDate.getUTCFullYear();
  const m2 = String(endDate.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(endDate.getUTCDate()).padStart(2, '0');
  const end = `${y2}-${m2}-${d2}T00:00:00.000Z`;
  return { start, end };
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
  const lat = typeof body.latitude === 'number' ? body.latitude : Number(body.latitude);
  const lng = typeof body.longitude === 'number' ? body.longitude : Number(body.longitude);
  const prayerRaw = typeof body.prayer === 'string' ? body.prayer.trim() : '';
  const startedAtRaw = typeof body.started_at === 'string' ? body.started_at.trim() : undefined;
  const localDateRaw =
    typeof body.local_date === 'string' ? body.local_date.trim() : new Date().toISOString().slice(0, 10);

  if (!UUID_REGEX.test(mosqueId)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'mosque_id must be a valid UUID' }, 400);
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'latitude and longitude are required' }, 400);
  }

  if (!DATE_REGEX.test(localDateRaw)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'local_date must be YYYY-MM-DD' }, 400);
  }

  const { data: inside300, error: geoErr } = await admin.rpc('mosque_within_meters', {
    p_mosque_id: mosqueId,
    p_lng: lng,
    p_lat: lat,
    p_meters: 300,
  });

  if (geoErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Geofence check failed' }, 500);
  }

  if (inside300 !== true) {
    return jsonResponse(
      {
        error: 'OUTSIDE_GEOFENCE',
        message: 'You appear to be too far from this mosque to check in',
      },
      400,
    );
  }

  const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const { data: velHit, error: velErr } = await admin
    .from('check_ins')
    .select('id')
    .eq('user_id', userId)
    .gte('arrived_at', twentyMinAgo)
    .neq('mosque_id', mosqueId)
    .limit(1);

  if (velErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Velocity check failed' }, 500);
  }

  if (velHit && velHit.length > 0) {
    return jsonResponse(
      {
        error: 'VELOCITY_LIMIT',
        message: 'You checked in recently elsewhere — please wait',
      },
      400,
    );
  }

  const { data: jamatRows, error: jamatErr } = await admin
    .from('jamat_times')
    .select('prayer,time,effective_date,created_at')
    .eq('mosque_id', mosqueId)
    .eq('status', 'live');

  if (jamatErr || !jamatRows?.length) {
    return jsonResponse(
      {
        error: 'OUTSIDE_WINDOW',
        message: 'Check-in window for this prayer has closed',
      },
      400,
    );
  }

  const nowMs = Date.now();
  const windowBeforeMs = 30 * 60 * 1000;
  const windowAfterMs = 15 * 60 * 1000;

  let resolvedPrayer: PrayerType | null = null;
  let resolvedJamat: Date | null = null;

  if (prayerRaw && isPrayerType(prayerRaw)) {
    const rows = jamatRows.filter((r) => r.prayer === prayerRaw);
    const best = rows.sort(
      (a, b) => String(b.effective_date).localeCompare(String(a.effective_date)),
    )[0];
    if (!best) {
      return jsonResponse(
        {
          error: 'OUTSIDE_WINDOW',
          message: 'Check-in window for this prayer has closed',
        },
        400,
      );
    }
    const j = jamatInstantOnLocalDate(localDateRaw, String(best.time));
    if (!j) {
      return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not parse jamat time' }, 500);
    }
    if (nowMs < j.getTime() - windowBeforeMs || nowMs > j.getTime() + windowAfterMs) {
      return jsonResponse(
        {
          error: 'OUTSIDE_WINDOW',
          message: 'Check-in window for this prayer has closed',
        },
        400,
      );
    }
    resolvedPrayer = prayerRaw;
    resolvedJamat = j;
  } else {
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const row of jamatRows) {
      if (!isPrayerType(String(row.prayer))) continue;
      const j = jamatInstantOnLocalDate(localDateRaw, String(row.time));
      if (!j) continue;
      if (nowMs < j.getTime() - windowBeforeMs || nowMs > j.getTime() + windowAfterMs) {
        continue;
      }
      const delta = Math.abs(nowMs - j.getTime());
      if (delta < bestDelta) {
        bestDelta = delta;
        resolvedPrayer = row.prayer as PrayerType;
        resolvedJamat = j;
      }
    }
    if (!resolvedPrayer || !resolvedJamat) {
      return jsonResponse(
        {
          error: 'OUTSIDE_WINDOW',
          message: 'Check-in window for this prayer has closed',
        },
        400,
      );
    }
  }

  let startedAt: string | null = null;
  let deltaMinutes: number | null = null;
  if (startedAtRaw) {
    const s = new Date(startedAtRaw);
    if (Number.isNaN(s.getTime())) {
      return jsonResponse({ error: 'INVALID_PARAMS', message: 'started_at must be a valid ISO timestamp' }, 400);
    }
    startedAt = s.toISOString();
    if (resolvedJamat) {
      deltaMinutes = Math.round(((s.getTime() - resolvedJamat.getTime()) / 60000) * 10) / 10;
    }
  }

  const { start: dayStart, end: dayEnd } = utcDayBounds();

  const insertPayload = {
    user_id: userId,
    mosque_id: mosqueId,
    prayer: resolvedPrayer,
    arrived_at: new Date().toISOString(),
    started_at: startedAt,
    delta_minutes: deltaMinutes,
    geofence_validated: true,
  };

  const { data: inserted, error: insErr } = await admin
    .from('check_ins')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insErr || !inserted) {
    if (insErr?.code === '23505') {
      return jsonResponse(
        {
          error: 'DUPLICATE',
          message: "You've already checked in for this prayer today",
        },
        409,
      );
    }
    return jsonResponse(
      { error: 'INSERT_FAILED', message: 'Could not save check-in' },
      500,
    );
  }

  const { count, error: cntErr } = await admin
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId)
    .eq('prayer', resolvedPrayer)
    .gte('arrived_at', dayStart)
    .lt('arrived_at', dayEnd);

  if (cntErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not compute live count' }, 500);
  }

  return jsonResponse(
    {
      id: inserted.id,
      live_count: count ?? 0,
    },
    201,
  );
});
