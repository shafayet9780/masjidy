import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface NotificationCandidate {
  userId: string;
  leadMinutes: number;
  scheduledFor: string;
}

interface WebhookPayload {
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
  type?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function buildLabel(mosqueId: string, prayer: string, effectiveDate: string): string {
  return `${mosqueId}:${prayer}:${effectiveDate}`;
}

function buildDedupKey(mosqueId: string, prayer: string, effectiveDate: string, userId: string): string {
  return `${mosqueId}:${prayer}:${effectiveDate}:${userId}`;
}

function scheduleDateFromTimetz(effectiveDate: string, timetz: string): Date | null {
  const parsed = new Date(`${effectiveDate}T${timetz}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function delaySecondsFrom(now: number, scheduledFor: Date): number {
  return Math.max(0, Math.floor((scheduledFor.getTime() - now) / 1000));
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

function extractRecord(payload: WebhookPayload | Record<string, unknown>): Record<string, unknown> | null {
  if ('record' in payload && payload.record && typeof payload.record === 'object') {
    return payload.record;
  }

  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
}

async function cancelQueuedMessages(qstashToken: string, label: string): Promise<void> {
  const url = new URL('https://qstash.upstash.io/v2/messages');
  url.searchParams.set('label', label);

  await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${qstashToken}`,
    },
  }).catch(() => {
    // Non-fatal: queued DB rows are still deleted below.
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
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const qstashToken = Deno.env.get('QSTASH_TOKEN');

  if (!supabaseUrl || !serviceRoleKey || !qstashToken) {
    return jsonResponse(
      { error: 'SERVER_MISCONFIGURED', message: 'Missing environment configuration' },
      500,
    );
  }

  if (!(await verifyCaller(req))) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid webhook secret' }, 401);
  }

  let payload: WebhookPayload | Record<string, unknown>;
  try {
    payload = (await req.json()) as WebhookPayload | Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Could not parse JSON body' }, 400);
  }

  const record = extractRecord(payload);
  if (!record) {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Missing record payload' }, 400);
  }

  const jamatId = typeof record.id === 'string' ? record.id : '';
  const mosqueId = typeof record.mosque_id === 'string' ? record.mosque_id : '';
  const prayer = typeof record.prayer === 'string' ? record.prayer : '';
  const effectiveDate = typeof record.effective_date === 'string' ? record.effective_date : '';
  const timetz = typeof record.time === 'string' ? record.time : '';
  const status = typeof record.status === 'string' ? record.status : '';

  if (!jamatId || !mosqueId || !prayer || !effectiveDate || !timetz) {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Incomplete jamat_time record' }, 400);
  }

  if (status !== 'live') {
    return jsonResponse({ ok: true, skipped: true, reason: 'STATUS_NOT_LIVE' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const label = buildLabel(mosqueId, prayer, effectiveDate);

  await cancelQueuedMessages(qstashToken, label);

  const { error: deleteQueuedError } = await admin
    .from('notification_jobs')
    .delete()
    .eq('mosque_id', mosqueId)
    .eq('prayer', prayer)
    .eq('date', effectiveDate)
    .eq('status', 'queued');

  if (deleteQueuedError) {
    return jsonResponse(
      { error: 'SERVER_ERROR', message: 'Could not clear queued notification jobs' },
      500,
    );
  }

  const [{ data: mosqueRow, error: mosqueError }, { data: followsRows, error: followsError }] = await Promise.all([
    admin.from('mosques').select('name').eq('id', mosqueId).maybeSingle(),
    admin.from('follows').select('user_id').eq('mosque_id', mosqueId),
  ]);

  if (mosqueError || !mosqueRow) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Mosque not found' }, 404);
  }

  if (followsError) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not load followers' }, 500);
  }

  const followerIds = (followsRows ?? [])
    .map((row) => row.user_id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (followerIds.length === 0) {
    return jsonResponse({ ok: true, enqueued: 0 });
  }

  const { data: userRows, error: usersError } = await admin
    .from('users')
    .select('id, notification_lead_minutes, expo_push_token')
    .in('id', followerIds);

  if (usersError) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not load user notification settings' }, 500);
  }

  const jamatDate = scheduleDateFromTimetz(effectiveDate, timetz);
  if (!jamatDate) {
    return jsonResponse({ error: 'INVALID_BODY', message: 'Invalid jamat time' }, 400);
  }

  const nowMs = Date.now();
  const candidates: NotificationCandidate[] = (userRows ?? [])
    .filter((row) => typeof row.expo_push_token === 'string' && row.expo_push_token.length > 0)
    .map((row) => {
      const leadMinutes =
        typeof row.notification_lead_minutes === 'number' ? row.notification_lead_minutes : 15;
      const scheduledFor = new Date(jamatDate.getTime() - leadMinutes * 60_000);
      return {
        userId: row.id,
        leadMinutes,
        scheduledFor: scheduledFor.toISOString(),
      };
    })
    .filter((row) => new Date(row.scheduledFor).getTime() > nowMs);

  if (candidates.length === 0) {
    return jsonResponse({ ok: true, enqueued: 0 });
  }

  const { data: insertedJobs, error: insertJobsError } = await admin
    .from('notification_jobs')
    .insert(
      candidates.map((candidate) => ({
        mosque_id: mosqueId,
        prayer,
        date: effectiveDate,
        user_id: candidate.userId,
        scheduled_for: candidate.scheduledFor,
        status: 'queued',
      })),
    )
    .select('id, user_id, scheduled_for');

  if (insertJobsError || !insertedJobs) {
    return jsonResponse({ error: 'SERVER_ERROR', message: 'Could not create notification jobs' }, 500);
  }

  const jobsByUserId = new Map(
    insertedJobs.map((job) => [
      job.user_id,
      {
        id: job.id,
        scheduled_for: job.scheduled_for,
      },
    ]),
  );

  let enqueuedCount = 0;
  const chunks = chunk(candidates, 50);

  for (const batch of chunks) {
    await Promise.all(
      batch.map(async (candidate) => {
        const job = jobsByUserId.get(candidate.userId);
        if (!job) {
          return;
        }

        const scheduledFor = new Date(candidate.scheduledFor);
        const delaySeconds = delaySecondsFrom(nowMs, scheduledFor);
        const body = {
          job_id: job.id,
          user_id: candidate.userId,
          mosque_id: mosqueId,
          mosque_name: mosqueRow.name,
          prayer,
          jamat_time: timetz,
          lead_minutes: candidate.leadMinutes,
        };

        try {
          const destination = encodeURIComponent(
            `${supabaseUrl}/functions/v1/deliver-notification`,
          );
          const response = await fetch(
            `https://qstash.upstash.io/v2/publish/${destination}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${qstashToken}`,
                'Content-Type': 'application/json',
                'Upstash-Delay': `${delaySeconds}s`,
                'Upstash-Label': label,
                'Upstash-Deduplication-Id': buildDedupKey(
                  mosqueId,
                  prayer,
                  effectiveDate,
                  candidate.userId,
                ),
                'Upstash-Retries': '3',
              },
              body: JSON.stringify(body),
            },
          );

          if (!response.ok) {
            throw new Error(`QSTASH_${response.status}`);
          }

          const payload = (await response.json()) as { messageId?: string };
          const qstashMessageId =
            typeof payload.messageId === 'string'
              ? payload.messageId
              : null;

          const { error: updateError } = await admin
            .from('notification_jobs')
            .update({ qstash_message_id: qstashMessageId })
            .eq('id', job.id);

          if (updateError) {
            throw new Error('JOB_UPDATE_FAILED');
          }

          enqueuedCount += 1;
        } catch (error) {
          await admin
            .from('notification_jobs')
            .update({
              status: 'failed',
              last_error: error instanceof Error ? error.message : 'QSTASH_PUBLISH_FAILED',
            })
            .eq('id', job.id);
        }
      }),
    );
  }

  return jsonResponse({ ok: true, enqueued: enqueuedCount });
});
