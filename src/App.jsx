import { useState, useRef, useEffect, useCallback } from 'react';
import { BAND, STATIONS } from './data';
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
const stationAt  = (f) => STATIONS.find(s => Math.abs(s.freq - f) < 0.001) || null;
const nearestIdx = (f) => {
  let bi = 0, bd = Infinity;
  STATIONS.forEach((s, i) => { const d = Math.abs(s.freq - f); if (d < bd) { bd = d; bi = i; } });
  return bi;
};

/** Parse Shoutcast "Song - Artist" → { title, artist } */
const parseMeta = (raw) => {
  if (!raw) return null;
  const idx = raw.indexOf(' - ');
  if (idx > 0) return { title: raw.slice(0, idx).trim(), artist: raw.slice(idx + 3).trim() };
  return { title: raw.trim(), artist: null };
};

// ── persistence ───────────────────────────────────────────────────────────────
const loadFavs = () => {
  try { return new Set(JSON.parse(localStorage.getItem('mun-favs') || '[]')); }
  catch { return new Set(STATIONS.map(s => s.id)); }
};
const loadFreq = () => {
  const v = parseFloat(localStorage.getItem('mun-freq'));
  return isNaN(v) ? 103.00 : v;
};

// ── App ───────────────────────────────────────────────────────────────────────
export function App() {
  const [freq, setFreqRaw]        = useState(loadFreq);
  const [playing, setPlaying]     = useState(false);
  const [volume, setVolume]       = useState(0.72);
  const [favs, setFavs]           = useState(loadFavs);
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

  const station = customStation || stationAt(freq);
  const setFreq = (f) => { setCustomStation(null); setFreqRaw(f); };

  // ── persist ────────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('mun-freq', freq); }, [freq]);
  useEffect(() => { localStorage.setItem('mun-favs', JSON.stringify([...favs])); }, [favs]);

  // ── Web Audio setup (called on first user-gesture play) ───────────────────
  const setupAudio = useCallback(() => {
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

      setAnalyser(an);
      srcConnected.current = true;
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }, []);

  // ── Audio element control ─────────────────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const url = station?.stream;
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
        const rawArt = j.songurl || j.streams?.[0]?.songurl || null;
        const raw    = j.songtitle || j.streams?.[0]?.songtitle || j.title || null;
        if (!alive || !raw) return;
        const meta = parseMeta(raw);
        const songKey = `${meta.title}|${meta.artist}`;

        // ── Same song as last poll → keep existing artUrl, no flicker ──
        if (songKey === lastSongKey.current) {
          setLiveMeta(prev => prev ? { ...prev, title: meta.title, artist: meta.artist } : meta);
          return;
        }

        // ── New song → update metadata, then fetch fresh art ──
        lastSongKey.current = songKey;

        // Direct art from stream if present, else fetch from iTunes.
        // Set artUrl straight away (null → Display shows station logo layer);
        // no preloadImage — it can hang on iOS WebKit detached images.
        const directArt = (rawArt && /\.(jpg|jpeg|png|webp|gif)/i.test(rawArt)) ? rawArt : null;
        setLiveMeta({ ...meta, artUrl: directArt });

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
  const selectStation = (s) => {
    setCustomStation(null); setFreqRaw(s.freq); setPlaying(true);
    setupAudio();
  };
  const step = (dir) => {
    setCustomStation(null);
    const base = station ? STATIONS.findIndex(x => x.id === station.id) : nearestIdx(freq);
    const ni = (base + dir + STATIONS.length) % STATIONS.length;
    setFreqRaw(STATIONS[ni].freq); setPlaying(true);
    setupAudio();
  };
  const toggleFav = (id) => setFavs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const isFav = station ? favs.has(station.id) : false;

  // Toggle play — must call setupAudio on the SAME user gesture (synchronous)
  const handleTogglePlay = () => {
    if (!playing) setupAudio();
    setPlaying(p => !p);
  };

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

  // ── Custom URL (+ optional image) ─────────────────────────────────────────
  const onPlayUrl = (url, imageSrc = null) => {
    setCustomStation({
      id: 'custom', name: 'Custom Stream',
      tagline: url,         // shown on bottom line when no metadata
      stream: url, meta: null,
      logo: imageSrc || null,
      theme: { sky: ['#241a12', '#5a3a1e'], sun: '#f4b860', glow: '#e08a2e', water: '#c9762a' }
    });
    setPlaying(true);
    setMenuOpen(false);
    setupAudio();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={phoneRef}
      className="phone finish-silver glow-amber shape-boxy logo-sans head-sans"
      style={{ '--logo-size': '14px', '--head-size': '20px' }}
    >
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
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
            onToggleFav={() => station && toggleFav(station.id)}
          />
          <TuningScale freq={freq} setFreq={setFreq} onHold={() => station && toggleFav(station.id)} />
          <Deck
            volume={volume} setVolume={setVolume} freq={freq} setFreq={setFreq}
            playing={playing} togglePlay={handleTogglePlay}
            prev={() => step(-1)} next={() => step(1)}
          />
          <Favorites currentId={station?.id} onSelect={selectStation} favs={favs} toggleFav={toggleFav} />
        </div>
        <div className="home-ind" />
      </div>

      <MenuDrawer
        open={menuOpen} onClose={() => setMenuOpen(false)} onPlayUrl={onPlayUrl}
        sleepMin={sleepMin} onSetSleep={onSetSleep} sleepRemain={sleepRemain}
        alarm={alarm} onAlarmTime={setAlarm} alarmOn={alarmOn} onAlarmToggle={() => setAlarmOn(v => !v)}
      />
    </div>
  );
}
