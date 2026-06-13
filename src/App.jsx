import { useState, useRef, useEffect, useCallback } from 'react';
import { BAND, STATIONS, PINNED_IDS, resolveStream, isBlockedHttp } from './data';
import { Display } from './Display';
import { TuningScale } from './TuningScale';
import { Deck } from './Deck';
import { Favorites } from './Favorites';
import { MenuDrawer } from './MenuDrawer';
import './radio.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const snap = (f) => {
  const v = Math.round((f - BAND.min) / BAND.step) * BAND.step + BAND.min;
  return Math.max(BAND.min, Math.min(BAND.max, Math.round(v * 100) / 100));
};
// Mobile = no Web Audio (reliable background playback + Media Session)
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 430;

// Stations that actually sit on the dial (have a numeric freq)
const onDial = (list) => list.filter(s => typeof s.freq === 'number');
const stationAt = (list, f) => onDial(list).find(s => Math.abs(s.freq - f) < 0.001) || null;

/** Parse Shoutcast "Song - Artist" → { title, artist } */
const parseMeta = (raw) => {
  if (!raw) return null;
  const idx = raw.indexOf(' - ');
  if (idx > 0) return { title: raw.slice(0, idx).trim(), artist: raw.slice(idx + 3).trim() };
  return { title: raw.trim(), artist: null };
};

// ── persistence ───────────────────────────────────────────────────────────────
// favs = ordered array of station ids the user starred (pinned ids excluded)
const loadFavs = () => {
  try { return JSON.parse(localStorage.getItem('mun-favs2') || '[]'); }
  catch { return []; }
};
// userStations = custom stations the user created (persisted)
const loadUserStations = () => {
  try { return JSON.parse(localStorage.getItem('mun-stations') || '[]'); }
  catch { return []; }
};
const loadFreq = () => {
  const v = parseFloat(localStorage.getItem('mun-freq'));
  return isNaN(v) ? 103.00 : v;
};

const CUSTOM_THEME = { sky: ['#241a12', '#5a3a1e'], sun: '#f4b860', glow: '#e08a2e', water: '#c9762a' };

// ── App ───────────────────────────────────────────────────────────────────────
export function App() {
  const [freq, setFreqRaw]        = useState(loadFreq);
  const [playing, setPlaying]     = useState(false);
  const [volume, setVolume]       = useState(1.0);  // full; system controls actual level
  const [favs, setFavs]           = useState(loadFavs);          // ordered id array
  const [userStations, setUserStations] = useState(loadUserStations);
  const [liveMeta, setLiveMeta]   = useState(null);   // { title, artist } | null
  const [menuOpen, setMenuOpen]   = useState(false);
  const [customStation, setCustomStation] = useState(null);
  const [sleepMin, setSleepMin]   = useState(0);
  const [sleepAt, setSleepAt]     = useState(null);
  const [nowTick, setNowTick]     = useState(Date.now());
  const [alarm, setAlarm]         = useState('');
  const [alarmOn, setAlarmOn]     = useState(false);
  const [analyser, setAnalyser]   = useState(null);   // Web Audio AnalyserNode

  const audioRef       = useRef(null);
  const audioCtxRef    = useRef(null);
  const gainRef        = useRef(null);   // GainNode — controls volume on iOS
  const srcConnected   = useRef(false);
  const lastSongKey    = useRef('');     // "title|artist" — prevents art flicker on re-poll
  const phoneRef       = useRef(null);
  const stepRef        = useRef(null);   // stable ref to step() for media-session handlers

  // ── Scale phone to fit viewport — desktop only; mobile uses CSS ──────────
  useEffect(() => {
    const DESIGN_W = 390, DESIGN_H = 844;
    const fit = () => {
      const el = phoneRef.current; if (!el) return;
      if (window.innerWidth <= 430) {
        // CSS @media handles mobile layout — clear any JS overrides
        el.style.transform = '';
        el.style.marginTop = '';
        return;
      }
      // Desktop: shrink phone mockup to fit window
      const s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H, 1);
      el.style.transform = `scale(${s})`;
      el.style.transformOrigin = 'top center';
      el.style.marginTop = `${Math.max(0, (window.innerHeight - DESIGN_H * s) / 2)}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // All known stations = presets + user-created
  const allStations = [...STATIONS, ...userStations];
  const stationById = (id) => allStations.find(s => s.id === id) || null;

  const station = customStation || stationAt(allStations, freq);
  const setFreq = (f) => { setCustomStation(null); setFreqRaw(f); };

  // Favorites shown in the grid: pinned first, then starred (in order)
  const pinnedStations = PINNED_IDS.map(stationById).filter(Boolean);
  const favStations = favs.map(stationById).filter(Boolean).filter(s => !PINNED_IDS.includes(s.id));
  const favoriteList = [...pinnedStations, ...favStations];

  // ── persist ────────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('mun-freq', freq); }, [freq]);
  useEffect(() => { localStorage.setItem('mun-favs2', JSON.stringify(favs)); }, [favs]);
  useEffect(() => { localStorage.setItem('mun-stations', JSON.stringify(userStations)); }, [userStations]);

  // ── Web Audio setup (DESKTOP ONLY — drives the waveform) ──────────────────
  // On mobile we deliberately skip Web Audio: routing the stream through an
  // AudioContext makes iOS suspend playback in the background (CarPlay / screen
  // off → stutter) and hides the track from Now Playing. Plain <audio> is
  // smooth in the background and lets Media Session publish metadata.
  const setupAudio = useCallback(() => {
    if (isMobile()) return;
    if (srcConnected.current) {
      // Already connected — just resume context if suspended
      audioCtxRef.current?.resume();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const an = ctx.createAnalyser();
      an.fftSize = 64;                 // 32 frequency bins → 32 bars (1:1)
      an.smoothingTimeConstant = 0.75; // built-in smoothing before our decay

      const gain = ctx.createGain();
      gain.gain.value = volume;          // apply current volume immediately
      gainRef.current = gain;

      const src = ctx.createMediaElementSource(audio);
      src.connect(an);
      an.connect(gain);                  // analyser → gain → speakers
      gain.connect(ctx.destination);

      ctx.resume();                      // iOS: unlock suspended context within gesture

      setAnalyser(an);
      srcConnected.current = true;
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }, []);

  // ── Audio element control ─────────────────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const url = station?.stream ? resolveStream(station.stream) : null;
    if (!url) { a.pause(); a.removeAttribute('src'); return; }
    if (a.dataset.url !== url) { a.dataset.url = url; a.src = url; }
    if (playing) { a.play().catch(() => {}); } else { a.pause(); }
  }, [station, playing]);

  useEffect(() => {
    // audio.volume works on desktop; GainNode is used for iOS Safari
    if (audioRef.current) audioRef.current.volume = volume;
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  // ── Album art from iTunes Search API ─────────────────────────────────────
  const fetchArtwork = async (artist, title) => {
    const q = [artist, title].filter(Boolean).join(' ').trim();
    if (!q) return null;
    try {
      const r = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=1`,
        { cache: 'no-store' }
      );
      const j = await r.json();
      const raw = j.results?.[0]?.artworkUrl100;
      // Upscale: replace 100x100bb → 500x500bb for sharper display
      return raw ? raw.replace('100x100bb', '500x500bb') : null;
    } catch { return null; }
  };

  // ── Now Playing metadata ───────────────────────────────────────────────────
  useEffect(() => {
    setLiveMeta(null);
    lastSongKey.current = '';
    if (!station?.meta || !playing) return;
    let alive = true;
    const pull = async () => {
      try {
        const r = await fetch(station.meta, { cache: 'no-store' });
        const j = await r.json();
        // Edge Function now resolves album art server-side and returns it here
        const proxyArt = j.artUrl || null;
        const rawArt   = j.songurl || j.streams?.[0]?.songurl || null;
        const raw      = j.songtitle || j.streams?.[0]?.songtitle || j.title || null;
        if (!alive || !raw) return;
        const meta = parseMeta(raw);
        const songKey = `${meta.title}|${meta.artist}`;

        // ── Same song as last poll → keep existing artUrl, no flicker ──
        if (songKey === lastSongKey.current) {
          setLiveMeta(prev => prev ? { ...prev, title: meta.title, artist: meta.artist } : meta);
          return;
        }

        // ── New song ──
        lastSongKey.current = songKey;

        // Prefer server-resolved art (works on iOS), then stream cover.
        const directArt =
          proxyArt ||
          ((rawArt && /\.(jpg|jpeg|png|webp|gif)/i.test(rawArt)) ? rawArt : null);
        setLiveMeta({ ...meta, artUrl: directArt });

        // Fallback: client-side iTunes lookup if the proxy gave nothing
        if (!directArt) {
          fetchArtwork(meta.artist, meta.title).then(artUrl => {
            if (alive && lastSongKey.current === songKey)
              setLiveMeta(prev => prev ? { ...prev, artUrl: artUrl || null } : null);
          });
        }
      } catch { /* CORS / offline */ }
    };
    pull();
    const id = setInterval(pull, 12000);
    return () => { alive = false; clearInterval(id); };
  }, [station, playing]);

  // ── Station helpers ────────────────────────────────────────────────────────
  // Play a station: tunable ones jump the dial, dial-less customs play directly
  const selectStation = (s) => {
    if (typeof s.freq === 'number') { setCustomStation(null); setFreqRaw(s.freq); }
    else { setCustomStation(s); }
    setPlaying(true);
    setupAudio();
  };
  const step = (dir) => {
    setCustomStation(null);
    const dial = onDial(allStations).sort((a, b) => a.freq - b.freq);
    if (!dial.length) return;
    let base = dial.findIndex(x => station && x.id === station.id);
    if (base < 0) { // nearest to current freq
      let bd = Infinity;
      dial.forEach((s, i) => { const d = Math.abs(s.freq - freq); if (d < bd) { bd = d; base = i; } });
    }
    const ni = (base + dir + dial.length) % dial.length;
    setFreqRaw(dial[ni].freq); setPlaying(true);
    setupAudio();
  };

  // Star toggle. Pinned stations can't be removed. A transient preview station
  // gets promoted to a saved user-station the first time it's starred.
  const toggleFav = (id) => {
    if (PINNED_IDS.includes(id)) return;
    setFavs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const favCurrent = () => {
    if (!station) return;
    if (PINNED_IDS.includes(station.id)) return;
    // Already a known (preset or saved) station → just toggle
    if (stationById(station.id)) { toggleFav(station.id); return; }
    // Transient preview → save it, then star it
    const saved = { ...station, id: `u${Date.now()}` };
    setUserStations(prev => [...prev, saved]);
    setFavs(prev => [...prev, saved.id]);
    setCustomStation(saved);
  };
  const isFav = station
    ? (PINNED_IDS.includes(station.id) || favs.includes(station.id))
    : false;

  // Separate Play / Stop (not a toggle). setupAudio must run on the gesture.
  const handlePlay = () => { setupAudio(); setPlaying(true); };
  const handleStop = () => setPlaying(false);

  // ── Media Session — cover/title/artist + controls on lockscreen / CarPlay ──
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    if (!station) { ms.metadata = null; return; }

    const title  = liveMeta?.title  || station.name || 'MUNforward Radio';
    const artist = liveMeta?.artist || station.tagline || 'MUNforward';
    const artSrc = liveMeta?.artUrl || station.logo || null;
    const artwork = artSrc
      ? [96, 192, 256, 384, 512].map(s => ({ src: artSrc, sizes: `${s}x${s}`, type: 'image/jpeg' }))
      : [];

    try {
      ms.metadata = new window.MediaMetadata({ title, artist, album: station.name || 'MUNforward', artwork });
      ms.playbackState = playing ? 'playing' : 'paused';
    } catch { /* MediaMetadata unsupported */ }
  }, [station, liveMeta, playing]);

  // keep a stable ref to step() for the media-session handlers below
  stepRef.current = step;
  // Register lockscreen / steering-wheel control handlers once
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (a, h) => { try { ms.setActionHandler(a, h); } catch {} };
    set('play',  () => { setupAudio(); setPlaying(true); });
    set('pause', () => setPlaying(false));
    set('stop',  () => setPlaying(false));
    set('nexttrack',     () => stepRef.current(1));
    set('previoustrack', () => stepRef.current(-1));
    return () => ['play','pause','stop','nexttrack','previoustrack'].forEach(a => set(a, null));
  }, []);

  // ── Sleep timer ────────────────────────────────────────────────────────────
  const onSetSleep = (m) => {
    setNowTick(Date.now()); setSleepMin(m);
    setSleepAt(m > 0 ? Date.now() + m * 60000 : null);
  };
  useEffect(() => {
    if (!sleepAt) return;
    const id = setInterval(() => {
      if (Date.now() >= sleepAt) { setPlaying(false); setSleepAt(null); setSleepMin(0); }
      else setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [sleepAt]);
  const sleepRemain = sleepAt ? (() => {
    const s = Math.max(0, Math.round((sleepAt - nowTick) / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  })() : null;

  // ── Alarm ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!alarmOn || !alarm) return;
    const id = setInterval(() => {
      const d = new Date();
      const hhmm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      if (hhmm === alarm && d.getSeconds() === 0) { setPlaying(true); setAlarmOn(false); }
    }, 1000);
    return () => clearInterval(id);
  }, [alarmOn, alarm]);

  // ── Custom stream: preview (try) vs create (save) ──────────────────────────
  const makeStation = (id, { url, name, imageSrc, freq }) => ({
    id,
    name: (name && name.trim()) || 'Custom Stream',
    tagline: url,                     // bottom line when no metadata
    stream: url, meta: null,
    logo: imageSrc || null,
    ...(typeof freq === 'number' ? { freq } : {}),
    theme: CUSTOM_THEME,
  });

  // Preview without saving — transient station id 'custom'
  const onPreviewUrl = (url, imageSrc = null, name = '') => {
    if (!url) return;
    if (isBlockedHttp(url)) { alert('ลิงค์นี้เป็น http:// — ต้องตั้งค่า Cloudflare proxy ก่อนถึงจะเล่นบนเว็บ https ได้'); return; }
    setCustomStation(makeStation('custom', { url, name, imageSrc }));
    setPlaying(true); setMenuOpen(false); setupAudio();
  };

  // Create + save. FM given → dial; no FM → favorites
  const onCreateStation = ({ url, imageSrc = null, name = '', freq = null }) => {
    if (!url) return;
    if (isBlockedHttp(url)) { alert('ลิงค์นี้เป็น http:// — ต้องตั้งค่า Cloudflare proxy ก่อนถึงจะเล่นบนเว็บ https ได้'); return; }
    const id = `u${Date.now()}`;
    const hasFreq = typeof freq === 'number' && !isNaN(freq);
    const snapped = hasFreq ? snap(freq) : null;
    const s = makeStation(id, { url, name, imageSrc, freq: hasFreq ? snapped : undefined });
    setUserStations(prev => [...prev, s]);

    if (hasFreq) {
      setCustomStation(null); setFreqRaw(snapped);   // lands on the dial
    } else {
      setFavs(prev => [...prev, id]);                // lands in favorites
      setCustomStation(s);
    }
    setPlaying(true); setMenuOpen(false); setupAudio();
  };

  // Remove a saved user-station entirely (from favorites + storage)
  const removeStation = (id) => {
    if (PINNED_IDS.includes(id)) return;
    setFavs(prev => prev.filter(x => x !== id));
    setUserStations(prev => prev.filter(s => s.id !== id));
    if (station?.id === id) setCustomStation(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={phoneRef}
      className="phone finish-silver glow-amber shape-boxy logo-sans head-sans"
      style={{ '--logo-size': '14px', '--head-size': '20px' }}
    >
      {/* crossOrigin only on desktop (for Web Audio waveform). On mobile we
          play <audio> directly, so omit it — lets CORS-less streams play too. */}
      <audio ref={audioRef} preload="none" {...(isMobile() ? {} : { crossOrigin: 'anonymous' })} />
      <div className="screen-wrap">
        <div className="radio">
          {/* Header */}
          <div className="header">
            <div className="grille-dots">
              {Array.from({ length: 20 }).map((_, i) => <i key={i} />)}
            </div>
            <div className="logo">
              <span className="rule" />
              <span className="word">RADIO LIVE</span>
              <span className="rule" />
            </div>
            <button className="menu-btn raised" onClick={() => setMenuOpen(true)} aria-label="open menu">
              <i /><i /><i />
            </button>
          </div>

          <Display
            station={station} freq={freq} playing={playing} volume={volume}
            marqueeSpeed={14} liveMeta={liveMeta} isFav={isFav} analyser={analyser}
            onToggleFav={favCurrent}
          />
          <TuningScale freq={freq} />
          <Deck
            playing={playing} onPlay={handlePlay} onStop={handleStop}
            prev={() => step(-1)} next={() => step(1)}
          />
          <Favorites
            currentId={station?.id} onSelect={selectStation}
            stations={favoriteList} pinnedIds={PINNED_IDS} onRemove={removeStation}
          />
        </div>
        <div className="home-ind" />
      </div>

      <MenuDrawer
        open={menuOpen} onClose={() => setMenuOpen(false)}
        onPreviewUrl={onPreviewUrl} onCreateStation={onCreateStation}
        sleepMin={sleepMin} onSetSleep={onSetSleep} sleepRemain={sleepRemain}
        alarm={alarm} onAlarmTime={setAlarm} alarmOn={alarmOn} onAlarmToggle={() => setAlarmOn(v => !v)}
      />
    </div>
  );
}
