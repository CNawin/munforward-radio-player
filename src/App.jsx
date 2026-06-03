import { useState, useRef, useEffect } from 'react';
import { BAND, STATIONS } from './data';
import { Display } from './Display';
import { TuningScale } from './TuningScale';
import { Deck } from './Deck';
import { Favorites } from './Favorites';
import { MenuDrawer } from './MenuDrawer';
import './radio.css';

const snap = (f) => {
  const v = Math.round((f - BAND.min) / BAND.step) * BAND.step + BAND.min;
  return Math.max(BAND.min, Math.min(BAND.max, Math.round(v * 100) / 100));
};
const stationAt = (f) => STATIONS.find(s => Math.abs(s.freq - f) < 0.001) || null;
const nearestIdx = (f) => {
  let bi = 0, bd = Infinity;
  STATIONS.forEach((s, i) => { const d = Math.abs(s.freq - f); if (d < bd) { bd = d; bi = i; } });
  return bi;
};

const loadFavs = () => {
  try { return new Set(JSON.parse(localStorage.getItem('mun-favs') || '[]')); }
  catch { return new Set(STATIONS.map(s => s.id)); }
};
const loadFreq = () => {
  const v = parseFloat(localStorage.getItem('mun-freq'));
  return isNaN(v) ? 103.00 : v;
};

export function App() {
  const [freq, setFreqRaw] = useState(loadFreq);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.72);
  const [favs, setFavs] = useState(loadFavs);
  const audioRef = useRef(null);
  const [liveSong, setLiveSong] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customStation, setCustomStation] = useState(null);
  const [sleepMin, setSleepMin] = useState(0);
  const [sleepAt, setSleepAt] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [alarm, setAlarm] = useState('');
  const [alarmOn, setAlarmOn] = useState(false);

  const station = customStation || stationAt(freq);
  const setFreq = (f) => { setCustomStation(null); setFreqRaw(f); };

  // Persist last freq
  useEffect(() => { localStorage.setItem('mun-freq', freq); }, [freq]);
  // Persist favs
  useEffect(() => { localStorage.setItem('mun-favs', JSON.stringify([...favs])); }, [favs]);

  // Audio playback
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const url = station && station.stream;
    if (!url) { a.pause(); a.removeAttribute('src'); return; }
    if (a.dataset.url !== url) { a.dataset.url = url; a.src = url; }
    if (playing) { a.play().catch(() => {}); } else { a.pause(); }
  }, [station, playing]);

  useEffect(() => { const a = audioRef.current; if (a) a.volume = volume; }, [volume]);

  // Live Now Playing metadata
  useEffect(() => {
    setLiveSong(null);
    if (!station || !station.meta || !playing) return;
    let alive = true;
    const pull = async () => {
      try {
        const r = await fetch(station.meta, { cache: 'no-store' });
        const j = await r.json();
        const title = j.songtitle || (j.streams && j.streams[0] && j.streams[0].songtitle) || j.title || null;
        if (alive && title) setLiveSong(title);
      } catch { /* CORS / offline — fall back to tagline */ }
    };
    pull();
    const id = setInterval(pull, 12000);
    return () => { alive = false; clearInterval(id); };
  }, [station, playing]);

  const selectStation = (s) => { setCustomStation(null); setFreqRaw(s.freq); setPlaying(true); };
  const step = (dir) => {
    setCustomStation(null);
    const base = station ? STATIONS.findIndex(x => x.id === station.id) : nearestIdx(freq);
    const ni = (base + dir + STATIONS.length) % STATIONS.length;
    setFreqRaw(STATIONS[ni].freq); setPlaying(true);
  };
  const toggleFav = (id) => setFavs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const isFav = station ? favs.has(station.id) : false;

  // Sleep timer
  const onSetSleep = (m) => { setNowTick(Date.now()); setSleepMin(m); setSleepAt(m > 0 ? Date.now() + m * 60000 : null); };
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

  // Alarm
  useEffect(() => {
    if (!alarmOn || !alarm) return;
    const id = setInterval(() => {
      const d = new Date();
      const hhmm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      if (hhmm === alarm && d.getSeconds() === 0) { setPlaying(true); setAlarmOn(false); }
    }, 1000);
    return () => clearInterval(id);
  }, [alarmOn, alarm]);

  // Custom URL
  const onPlayUrl = (url) => {
    setCustomStation({
      id: 'custom', name: 'Custom Stream', tagline: url, stream: url, meta: null,
      theme: { sky: ['#241a12', '#5a3a1e'], sun: '#f4b860', glow: '#e08a2e', water: '#c9762a' }
    });
    setPlaying(true); setMenuOpen(false);
  };

  return (
    <div className="phone finish-silver glow-amber shape-boxy logo-sans head-sans">
      <audio ref={audioRef} preload="none" />
      <div className="screen-wrap">
        <div className="radio">
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
            marqueeSpeed={14} liveSong={liveSong} isFav={isFav}
            onToggleFav={() => station && toggleFav(station.id)}
          />
          <TuningScale freq={freq} setFreq={setFreq} onHold={() => station && toggleFav(station.id)} />
          <Deck
            volume={volume} setVolume={setVolume} freq={freq} setFreq={setFreq}
            playing={playing} togglePlay={() => setPlaying(p => !p)}
            prev={() => step(-1)} next={() => step(1)}
          />
          <Favorites currentId={station ? station.id : null} onSelect={selectStation} favs={favs} toggleFav={toggleFav} />
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
