// Supabase Edge Function — Shoutcast metadata CORS proxy
// Deploy: supabase functions deploy meta-proxy

const STREAM_TARGETS: Record<string, string> = {
  mun103: 'https://cdn-th2.livestreaming.in.th/shoutcast/8730/stats?json=1',
  xtra88: 'https://cdn-th2.livestreaming.in.th/shoutcast/8795/stats?json=1',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const station = url.searchParams.get('station') ?? '';
  const target = STREAM_TARGETS[station];

  if (!target) {
    return new Response(JSON.stringify({ error: 'unknown station' }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'MUNforward-MetaProxy/1.0' },
    });
    const json = await res.json();
    return new Response(JSON.stringify(json), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'upstream fetch failed' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
