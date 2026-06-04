// MUNforward Radio — station data
export const BAND = { min: 87.5, max: 108.0, step: 0.25 };

// Supabase project URL (fallback hardcoded for Vercel where .env may not be set)
const SUPABASE = import.meta.env.VITE_SUPABASE_URL || 'https://bdsghzhldccguesbabpm.supabase.co';
const META = (station) => `${SUPABASE}/functions/v1/meta-proxy?station=${station}`;

// Stations that are pinned to the top of Favorites and can't be removed
export const PINNED_IDS = ['mun103', 'xtra88'];

// Cloudflare Worker stream proxy — set VITE_STREAM_PROXY after deploying the worker
// e.g. https://radio-proxy.<you>.workers.dev   (used only for http:// streams on https)
const STREAM_PROXY = import.meta.env.VITE_STREAM_PROXY || '';
export const HAS_STREAM_PROXY = !!STREAM_PROXY;

/**
 * Resolve a stream URL for playback.
 * Browsers block http:// media on an https:// page (mixed content), so http
 * streams are routed through the Cloudflare Worker proxy when one is configured.
 */
export function resolveStream(url) {
  if (!url) return url;
  const u = url.trim();
  const isHttp = /^http:\/\//i.test(u);
  const pageHttps = typeof location !== 'undefined' && location.protocol === 'https:';
  if (isHttp && pageHttps && STREAM_PROXY) {
    return `${STREAM_PROXY.replace(/\/$/, '')}/?url=${encodeURIComponent(u)}`;
  }
  return u;
}

/** True when this URL would be blocked as mixed content and we have no proxy. */
export function isBlockedHttp(url) {
  if (!url) return false;
  const isHttp = /^http:\/\//i.test(url.trim());
  const pageHttps = typeof location !== 'undefined' && location.protocol === 'https:';
  return isHttp && pageHttps && !STREAM_PROXY;
}

export const STATIONS = [
  {
    id: 'mun103',
    name: 'MUNforward FM103',
    freq: 103.00,
    genre: 'เพลงไทย',
    tagline: 'เพลงไทยเพราะ ๆ ตลอด 24 ชั่วโมง',
    stream: 'https://cdn-th2.livestreaming.in.th/shoutcast/8730',
    meta: META('mun103'),
    logo: '/logos/munforward.png',
    theme: { sky: ['#3a1d3d', '#c23a1e'], sun: '#f4a33a', glow: '#f4762a', water: '#e0691f', palm: true }
  },
  {
    id: 'xtra88',
    name: 'MUNforward Xtra FM88',
    freq: 88.00,
    genre: 'เพลงสากล',
    tagline: 'รวมเพลงสากลฮิตติดชาร์ต',
    stream: 'https://cdn-th2.livestreaming.in.th/shoutcast/8795',
    meta: META('xtra88'),
    logo: '/logos/munforward-xtra.png',
    theme: { sky: ['#1b1140', '#7a1f6b'], sun: '#ff5db1', glow: '#c33ce0', water: '#9b2fd6', city: true }
  },
  {
    id: 'flex1045',
    name: 'FLEX FM104.5',
    freq: 104.50,
    genre: 'เพลย์ลิสต์',
    tagline: 'เพลย์ลิสต์เพลงฮิตทุกแนว',
    theme: { sky: ['#06303a', '#0a7d7a'], sun: '#36e0c8', glow: '#19b39c', water: '#13a08f' }
  },
  {
    id: 'green1065',
    name: 'GREEN WAVE FM106.5',
    freq: 106.50,
    genre: 'อีซี่ ลิสนิ่ง',
    tagline: 'เพลงเพราะ สบาย ๆ คลายเครียด',
    theme: { sky: ['#0c3520', '#3f8f3a'], sun: '#bfe24a', glow: '#6cbf3f', water: '#56a83a' }
  },
  {
    id: 'met107',
    name: 'MET FM107',
    freq: 107.00,
    genre: 'เพลงสากล',
    tagline: 'เพลงสากลยอดนิยม',
    theme: { sky: ['#0a1230', '#26408f'], sun: '#6aa6ff', glow: '#3f6fe0', water: '#3a5cc4', city: true }
  },
  {
    id: 'cool93',
    name: 'COOL FM93',
    freq: 93.00,
    genre: 'เพลงรัก',
    tagline: 'เพลงรักฟังสบายทั้งวัน',
    theme: { sky: ['#3a1228', '#d4506b'], sun: '#ffd0a0', glow: '#ff8aa0', water: '#f2839a' }
  }
];
