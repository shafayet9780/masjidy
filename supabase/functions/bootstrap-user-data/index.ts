Deno.serve((_req) =>
  new Response(JSON.stringify({ ok: false, message: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  }),
);
