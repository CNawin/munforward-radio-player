/**
 * MUNforward Radio — Cloudflare Worker stream proxy
 * ---------------------------------------------------
 * Lets the HTTPS web app play http:// Shoutcast/Icecast streams.
 * Browsers block "mixed content" (http media on an https page); this worker
 * fetches the http stream server-side and relays it back over HTTPS.
 *
 * Usage from the app:  https://<worker>.workers.dev/?url=<stream-url>
 *
 * Security: only the hosts in ALLOWED_HOSTS can be proxied, so the worker
 * can't be abused as an open proxy. Add new stream hosts here as needed.
 */

const ALLOWED_HOSTS = [
  'cdn-th2.livestreaming.in.th', // MUNforward FM103 / Xtra FM88
  '103.253.135.4',               // COOLfahrenheit (example)
  // 'another-stream-host.com',
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const target = new URL(request.url).searchParams.get('url');
    if (!target) {
      return new Response('missing ?url', { status: 400, headers: CORS });
    }

    let t;
    try {
      t = new URL(target);
    } catch {
      return new Response('bad url', { status: 400, headers: CORS });
    }

    if (!ALLOWED_HOSTS.includes(t.hostname)) {
      return new Response('host not allowed', { status: 403, headers: CORS });
    }

    // Fetch the upstream stream and relay its body (streaming passthrough)
    const upstream = await fetch(t.toString(), {
      headers: { 'User-Agent': 'MUNforward-RadioProxy/1.0' },
    });

    const headers = new Headers(CORS);
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'audio/mpeg');
    headers.set('Cache-Control', 'no-cache, no-store');

    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
