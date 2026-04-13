import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

  if (!UUID_REGEX.test(mosqueId)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'mosque_id must be a valid UUID' }, 400);
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'latitude and longitude are required' }, 400);
  }

  const { data: inside500, error: geoErr } = await admin.rpc('mosque_within_meters', {
    p_mosque_id: mosqueId,
    p_lng: lng,
    p_lat: lat,
    p_meters: 500,
  });

  if (geoErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Geofence check failed' }, 500);
  }

  if (inside500 !== true) {
    return jsonResponse(
      {
        error: 'OUTSIDE_GEOFENCE',
        message: 'You need to be near the mosque',
      },
      400,
    );
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error: coolErr } = await admin
    .from('mosque_confirmations')
    .select('id')
    .eq('user_id', userId)
    .eq('mosque_id', mosqueId)
    .gte('confirmed_at', thirtyDaysAgo)
    .limit(1);

  if (coolErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Cooldown check failed' }, 500);
  }

  if (recent && recent.length > 0) {
    return jsonResponse(
      {
        error: 'COOLDOWN',
        message: "You've already confirmed this mosque recently",
      },
      409,
    );
  }

  const { error: insErr } = await admin.from('mosque_confirmations').insert({
    user_id: userId,
    mosque_id: mosqueId,
  });

  if (insErr) {
    if (insErr.code === '23505') {
      return jsonResponse(
        {
          error: 'COOLDOWN',
          message: "You've already confirmed this mosque recently",
        },
        409,
      );
    }
    return jsonResponse({ error: 'INSERT_FAILED', message: 'Could not save confirmation' }, 500);
  }

  const { data: newCount, error: incErr } = await admin.rpc('increment_mosque_confirmation_count', {
    p_mosque_id: mosqueId,
  });

  if (incErr || newCount == null || typeof newCount !== 'number') {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not update mosque' }, 500);
  }

  return jsonResponse(
    {
      confirmation_count: newCount,
    },
    201,
  );
});
