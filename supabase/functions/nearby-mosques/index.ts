import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function localTimeStringFromOffsetMinutes(tzOffsetMin: number): string {
  const d = new Date();
  const utcSec = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
  let localSec = utcSec + tzOffsetMin * 60;
  localSec = ((localSec % 86400) + 86400) % 86400;
  const hh = Math.floor(localSec / 3600);
  const mm = Math.floor((localSec % 3600) / 60);
  const ss = localSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const x = Number(value);
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(
      { error: 'SERVER_MISCONFIGURED', message: 'Missing Supabase environment' },
      500,
    );
  }

  let lat: number | null = null;
  let lng: number | null = null;
  let radius_km = 10;
  let limit = 20;
  let tz_offset_min = 0;

  try {
    if (req.method === 'POST') {
      const body = (await req.json()) as Record<string, unknown>;
      lat = parseNumber(body.lat);
      lng = parseNumber(body.lng);
      if (body.radius_km != null) radius_km = clampInt(parseNumber(body.radius_km) ?? 10, 1, 50);
      if (body.limit != null) limit = clampInt(parseNumber(body.limit) ?? 20, 1, 50);
      if (body.tz_offset_min != null) {
        const o = parseNumber(body.tz_offset_min);
        if (o != null) tz_offset_min = clampInt(o, -840, 840);
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      lat = parseNumber(url.searchParams.get('lat'));
      lng = parseNumber(url.searchParams.get('lng'));
      const r = parseNumber(url.searchParams.get('radius_km'));
      const l = parseNumber(url.searchParams.get('limit'));
      const tz = parseNumber(url.searchParams.get('tz_offset_min'));
      if (r != null) radius_km = clampInt(r, 1, 50);
      if (l != null) limit = clampInt(l, 1, 50);
      if (tz != null) tz_offset_min = clampInt(tz, -840, 840);
    } else {
      return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Use GET or POST' }, 405);
    }
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse request' }, 400);
  }

  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return jsonResponse(
      { error: 'INVALID_PARAMS', message: 'lat and lng must be valid WGS84 coordinates' },
      400,
    );
  }

  const authHeader = req.headers.get('Authorization') ?? `Bearer ${supabaseAnonKey}`;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const p_current_local_time = localTimeStringFromOffsetMinutes(tz_offset_min);

  const { data, error } = await supabase.rpc('nearby_mosques_with_next_prayer', {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radius_km,
    p_limit: limit,
    p_current_local_time,
  });

  if (error) {
    return jsonResponse(
      { error: 'RPC_FAILED', message: error.message },
      500,
    );
  }

  const rows = Array.isArray(data) ? data : [];
  const mosques = rows.map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name,
    distance_km: row.distance_km,
    next_prayer: row.next_prayer ?? null,
    next_jamat_time: row.next_jamat_time ?? null,
    next_trust_score: row.next_trust_score ?? null,
    facilities: row.facilities ?? {},
    is_tomorrow: Boolean(row.is_tomorrow),
  }));

  return jsonResponse({ mosques });
});
