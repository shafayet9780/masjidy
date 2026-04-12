import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

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

type ContributorTier = 'new_user' | 'regular' | 'trusted' | 'mosque_admin';

const TIER_ORDER: Record<ContributorTier, number> = {
  new_user: 0,
  regular: 1,
  trusted: 2,
  mosque_admin: 3,
};

function tierFromCount(n: number): ContributorTier {
  if (n >= 20) return 'trusted';
  if (n >= 5) return 'regular';
  return 'new_user';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST' }, 405);
  }

  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
  const headerSecret = req.headers.get('x-internal-secret');
  if (!internalSecret || headerSecret !== internalSecret) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid internal secret' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'SERVER_MISCONFIGURED', message: 'Missing Supabase environment' }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse JSON' }, 400);
  }

  const userId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
  if (!userId) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'user_id required' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profErr } = await admin
    .from('users')
    .select('tier')
    .eq('id', userId)
    .maybeSingle();

  if (profErr || !profile) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'User profile not found' }, 404);
  }

  const currentTier = profile.tier as ContributorTier;
  if (currentTier === 'mosque_admin') {
    await admin
      .from('users')
      .update({ tier_last_active_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', userId);
    return jsonResponse({ tier: currentTier, upgraded: false });
  }

  const { count, error: cntErr } = await admin
    .from('jamat_times')
    .select('*', { count: 'exact', head: true })
    .eq('submitted_by', userId)
    .in('status', ['live', 'pending']);

  if (cntErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not count submissions' }, 500);
  }

  const targetTier = tierFromCount(count ?? 0);
  let nextTier = currentTier;
  if (TIER_ORDER[targetTier] > TIER_ORDER[currentTier]) {
    nextTier = targetTier;
  }
  const upgraded = nextTier !== currentTier;

  await admin
    .from('users')
    .update({
      tier: nextTier,
      tier_last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return jsonResponse({ tier: nextTier, upgraded });
});
