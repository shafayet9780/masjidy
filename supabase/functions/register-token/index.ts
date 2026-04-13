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
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid or expired session' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse JSON body' }, 400);
  }

  const platform = typeof body.platform === 'string' ? body.platform.trim() : '';
  const tokenValue = typeof body.token === 'string' ? body.token.trim() : '';

  if (platform !== 'ios' && platform !== 'android') {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'platform must be ios or android' }, 400);
  }

  if (!tokenValue) {
    return jsonResponse({ error: 'INVALID_PARAMS', message: 'token is required' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin
    .from('users')
    .update({
      expo_push_token: tokenValue,
    })
    .eq('id', user.id);

  if (error) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not update device token' }, 500);
  }

  return jsonResponse({ ok: true });
});
