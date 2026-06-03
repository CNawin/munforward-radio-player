// MUNforward Radio — station data
// Thai FM band: 87.5–108.0 MHz, tuned in 0.25 steps (.00/.25/.50/.75)
export const BAND = { min: 87.5, max: 108.0, step: 0.25 };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

// Retro art themes (CSS-rendered "album art" — sunset/scene per station)
export const STATIONS = [
  {
    id: 'mun103',
    name: 'MUNforward FM103',
    freq: 103.00,
    genre: 'เพลงไทย',
    tagline: 'เพลงไทยเพราะ ๆ ตลอด 24 ชั่วโมง',
    nowSong: 'คนใจง่าย — ปาล์มมี่',
    stream: 'https://cdn-th2.livestreaming.in.th/shoutcast/8730',
    meta: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/meta-proxy?station=mun103` : null,
    logo: '/logos/munforward.png',
    theme: { sky: ['#3a1d3d', '#c23a1e'], sun: '#f4a33a', glow: '#f4762a', water: '#e0691f', palm: true }
  },
  {
    id: 'xtra88',
    name: 'MUNforward Xtra FM88',
    freq: 88.00,
    genre: 'เพลงสากล',
    tagline: 'รวมเพลงสากลฮิตติดชาร์ต',
    nowSong: 'Blinding Lights — The Weeknd',
    stream: 'https://cdn-th2.livestreaming.in.th/shoutcast/8795',
    meta: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/meta-proxy?station=xtra88` : null,
    logo: '/logos/munforward-xtra.png',
    theme: { sky: ['#1b1140', '#7a1f6b'], sun: '#ff5db1', glow: '#c33ce0', water: '#9b2fd6', city: true }
  },
  {
    id: 'flex1045',
    name: 'FLEX FM104.5',
    freq: 104.50,
    genre: 'เพลย์ลิสต์',
    tagline: 'เพลย์ลิสต์เพลงฮิตทุกแนว',
    nowSong: 'ทุกอย่าง — Three Man Down',
    theme: { sky: ['#06303a', '#0a7d7a'], sun: '#36e0c8', glow: '#19b39c', water: '#13a08f' }
  },
  {
    id: 'green1065',
    name: 'GREEN WAVE FM106.5',
    freq: 106.50,
    genre: 'อีซี่ ลิสนิ่ง',
    tagline: 'เพลงเพราะ สบาย ๆ คลายเครียด',
    nowSong: 'รักเธอ — Bodyslam',
    theme: { sky: ['#0c3520', '#3f8f3a'], sun: '#bfe24a', glow: '#6cbf3f', water: '#56a83a' }
  },
  {
    id: 'met107',
    name: 'MET FM107',
    freq: 107.00,
    genre: 'เพลงสากล',
    tagline: 'เพลงสากลยอดนิยม',
    nowSong: 'As It Was — Harry Styles',
    theme: { sky: ['#0a1230', '#26408f'], sun: '#6aa6ff', glow: '#3f6fe0', water: '#3a5cc4', city: true }
  },
  {
    id: 'cool93',
    name: 'COOL FM93',
    freq: 93.00,
    genre: 'เพลงรัก',
    tagline: 'เพลงรักฟังสบายทั้งวัน',
    nowSong: 'เธอทำให้ฉัน — Getsunova',
    theme: { sky: ['#3a1228', '#d4506b'], sun: '#ffd0a0', glow: '#ff8aa0', water: '#f2839a' }
  }
];
