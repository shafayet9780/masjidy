import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Receiver } from 'npm:@upstash/qstash';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upstash-signature',
};

interface DeliveryPayload {
  job_id: string;
  user_id: string;
  mosque_id: string;
  mosque_name: string;
  prayer: string;
  jamat_time: string;
  lead_minutes: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function formatPrayer(prayer: string): string {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}

function parseRetryCount(req: Request): number {
  const raw = req.headers.get('Upstash-Retried');
  const parsed = raw == null ? 0 : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function verifyQStashSignature(req: Request, rawBody: string): Promise<boolean> {
  const currentSigningKey = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY');
  const nextSigningKey = Deno.env.get('QSTASH_NEXT_SIGNING_KEY');
  const signature = req.headers.get('Upstash-Signature');

  if (!currentSigningKey || !nextSigningKey || !signature) {
    return false;
  }

  const receiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });

  try {
    await receiver.verify({
      body: rawBody,
      signature,
    });
    return true;
  } catch {
    return false;
  }
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
    return jsonResponse(
      { error: 'SERVER_MISCONFIGURED', message: 'Missing Supabase environment' },
      500,
    );
  }

  const rawBody = await req.text();
  if (!(await verifyQStashSignature(req, rawBody))) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid QStash signature' }, 401);
  }

  let body: DeliveryPayload;
  try {
    body = JSON.parse(rawBody) as DeliveryPayload;
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse JSON body' }, 400);
  }

  if (
    !body.job_id ||
    !body.user_id ||
    !body.mosque_id ||
    !body.mosque_name ||
    !body.prayer ||
    typeof body.lead_minutes !== 'number'
  ) {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Incomplete delivery payload' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const retryCount = parseRetryCount(req);
  const attempts = retryCount + 1;

  const [{ data: jobRow, error: jobError }, { data: userRow, error: userError }] = await Promise.all([
    admin
      .from('notification_jobs')
      .select('id, attempts')
      .eq('id', body.job_id)
      .maybeSingle(),
    admin
      .from('users')
      .select('expo_push_token')
      .eq('id', body.user_id)
      .maybeSingle(),
  ]);

  if (jobError || !jobRow) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Notification job not found' }, 404);
  }

  if (userError) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not load recipient token' }, 500);
  }

  const expoPushToken = userRow?.expo_push_token;
  if (!expoPushToken) {
    await admin
      .from('notification_jobs')
      .update({
        attempts,
        status: 'failed',
        last_error: 'NO_TOKEN',
      })
      .eq('id', body.job_id);

    return jsonResponse({ ok: true, skipped: true, reason: 'NO_TOKEN' });
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      title: body.mosque_name,
      body: `${formatPrayer(body.prayer)} in ${body.lead_minutes} minutes`,
      data: {
        mosque_id: body.mosque_id,
        prayer: body.prayer,
        type: 'jamat_reminder',
      },
      sound: 'default',
      priority: 'high',
    }),
  });

  let parsedResponse: unknown = null;
  try {
    parsedResponse = await response.json();
  } catch {
    parsedResponse = null;
  }

  const ticket =
    parsedResponse &&
    typeof parsedResponse === 'object' &&
    'data' in parsedResponse &&
    Array.isArray(parsedResponse.data) &&
    parsedResponse.data.length > 0
      ? parsedResponse.data[0]
      : parsedResponse &&
          typeof parsedResponse === 'object' &&
          'data' in parsedResponse &&
          parsedResponse.data &&
          typeof parsedResponse.data === 'object'
        ? parsedResponse.data
        : null;

  const ticketStatus =
    ticket && typeof ticket === 'object' && 'status' in ticket && typeof ticket.status === 'string'
      ? ticket.status
      : null;
  const ticketError =
    ticket &&
    typeof ticket === 'object' &&
    'details' in ticket &&
    ticket.details &&
    typeof ticket.details === 'object' &&
    'error' in ticket.details &&
    typeof ticket.details.error === 'string'
      ? ticket.details.error
      : null;

  if (response.ok && ticketStatus === 'ok') {
    await admin
      .from('notification_jobs')
      .update({
        attempts,
        status: 'delivered',
        last_error: null,
      })
      .eq('id', body.job_id);

    return jsonResponse({ ok: true });
  }

  if (ticketError === 'DeviceNotRegistered') {
    await Promise.all([
      admin
        .from('users')
        .update({ expo_push_token: null })
        .eq('id', body.user_id),
      admin
        .from('notification_jobs')
        .update({
          attempts,
          status: 'failed',
          last_error: ticketError,
        })
        .eq('id', body.job_id),
    ]);

    return jsonResponse({ ok: true, skipped: true, reason: ticketError });
  }

  const lastError =
    ticketError ??
    (response.ok ? 'EXPO_PUSH_REJECTED' : `EXPO_PUSH_HTTP_${response.status}`);

  await admin
    .from('notification_jobs')
    .update({
      attempts,
      status: retryCount >= 3 ? 'failed' : 'queued',
      last_error: lastError,
    })
    .eq('id', body.job_id);

  return jsonResponse({ error: 'DELIVERY_FAILED', message: lastError }, 500);
});
