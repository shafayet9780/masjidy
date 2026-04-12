import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * FR-016 7-day warning before tier demotion (SQL decay/demotion runs separately via pg_cron).
 * Push delivery can be wired to FCM/APNs via deliver-notification when that pipeline is ready.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST or GET' }, 405);
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  const header = req.headers.get('x-cron-secret');
  if (!cronSecret || header !== cronSecret) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid cron secret' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'SERVER_MISCONFIGURED', message: 'Missing Supabase environment' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const since53 = new Date(Date.now() - 53 * 86400000).toISOString();
  const since60 = new Date(Date.now() - 60 * 86400000).toISOString();

  const { data: candidates, error: qErr } = await admin
    .from('users')
    .select('id,tier,tier_last_active_at')
    .in('tier', ['regular', 'trusted'])
    .lt('tier_last_active_at', since53)
    .gte('tier_last_active_at', since60);

  if (qErr) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Query failed' }, 500);
  }

  let warned = 0;

  for (const u of candidates ?? []) {
    const userId = u.id as string;
    const { data: recentPrompt } = await admin
      .from('contributor_log')
      .select('id')
      .eq('user_id', userId)
      .eq('action_type', 'seasonal_prompt')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .limit(1);

    if (recentPrompt && recentPrompt.length > 0) {
      continue;
    }

    await admin.from('contributor_log').insert({
      user_id: userId,
      action_type: 'seasonal_prompt',
      mosque_id: null,
      accepted: null,
    });

    warned += 1;
  }

  return jsonResponse({ warned, message: 'Logged tier warning prompts; attach push via deliver-notification when ready' });
});
