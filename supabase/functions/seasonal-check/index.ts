// Phase 1.5 — implement per PROJECT_SPEC §9
Deno.serve((_req) =>
  new Response(JSON.stringify({ ok: false, message: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  }),
);
