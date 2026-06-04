// Supabase Edge Function — Shoutcast metadata CORS proxy + server-side album art
// Deploy: supabase functions deploy meta-proxy  (or via MCP / dashboard)

const STREAM_TARGETS: Record<string, string> = {
  mun103: 'http://cdn-th2.livestreaming.in.th:8730/stats?json=1',
  xtra88: 'http://cdn-th2.livestreaming.in.th:8795/stats?json=1',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Parse Shoutcast "Song - Artist" → { title, artist } */
function parseMeta(raw: string): { title: string; artist: string | null } {
  const idx = raw.indexOf(' - ');
  if (idx > 0) return { title: raw.slice(0, idx).trim(), artist: raw.slice(idx + 3).trim() };
  return { title: raw.trim(), artist: null };
}

/** Look up album art on iTunes (server-side — no browser CORS limits) */
async function fetchArtwork(title: string, artist: string | null): Promise<string | null> {
  const q = [artist, title].filter(Boolean).join(' ').trim();
  if (!q) return null;
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'MUNforward-MetaProxy/1.0' } });
    const j = await res.json();
    const raw = j?.results?.[0]?.artworkUrl100 as string | undefined;
    return raw ? raw.replace('100x100bb', '500x500bb') : null;
  } catch {
    return null;
  }
}

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
    const res = await fetch(target, { headers: { 'User-Agent': 'MUNforward-MetaProxy/1.0' } });
    const json = await res.json();

    // Resolve album art server-side so mobile clients don't have to fetch iTunes
    const rawTitle: string | null =
      json.songtitle || json.streams?.[0]?.songtitle || json.title || null;

    let artUrl: string | null = null;
    let parsed: { title: string; artist: string | null } | null = null;
    if (rawTitle && rawTitle.trim()) {
      parsed = parseMeta(rawTitle);
      artUrl = await fetchArtwork(parsed.title, parsed.artist);
    }

    return new Response(JSON.stringify({ ...json, artUrl, parsed }), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'upstream fetch failed' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
