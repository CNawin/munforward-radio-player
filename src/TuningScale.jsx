import { useState, useRef, useEffect } from 'react';
import { BAND } from './data';
import { Icon } from './parts/Icon';

const snap = (f) => {
  const v = Math.round((f - BAND.min) / BAND.step) * BAND.step + BAND.min;
  return Math.max(BAND.min, Math.min(BAND.max, Math.round(v * 100) / 100));
};

export function TuningScale({ freq, setFreq, onHold }) {
  const ref = useRef(null);
  const [w, setW] = useState(258);
  const [holdPct, setHoldPct] = useState(0);
  const pxPerMHz = 30;
  const drag = useRef(null);
  const hold = useRef(null);

  useEffect(() => {
    const measure = () => { if (ref.current) setW(ref.current.offsetWidth); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const tx = w / 2 - (freq - BAND.min) * pxPerMHz;

  const ticks = [];
  const labels = [];
  // Extend ticks ~5 MHz beyond each band edge so the dial is never empty when
  // tuned near the edges (e.g. FM88). Filler ticks are dimmed and unlabelled.
  const PAD = 5;
  const start = Math.ceil((BAND.min - PAD) * 4) / 4;
  for (let f = start; f <= BAND.max + PAD + 0.001; f += 0.25) {
    const x = (f - BAND.min) * pxPerMHz;
    const inBand = f >= BAND.min - 0.001 && f <= BAND.max + 0.001;
    const isInt = Math.abs(f - Math.round(f)) < 0.001;
    const isHalf = Math.abs((f * 2) - Math.round(f * 2)) < 0.001;
    ticks.push(
      <span key={'t' + f.toFixed(2)}
            className={`tick ${isInt ? 'major' : isHalf ? 'mid' : 'minor'}${inBand ? '' : ' pad'}`}
            style={{ left: `${x}px` }} />
    );
    if (isInt && inBand) {
      labels.push(<span key={'l' + f} className="tick-label" style={{ left: `${x}px` }}>{String(Math.round(f))}</span>);
    }
  }

  const onDown = (e) => {
    e.preventDefault();
    const sx = e.touches ? e.touches[0].clientX : e.clientX;
    drag.current = { sx, sf: freq, moved: false };
    const startT = Date.now();
    setHoldPct(0);
    if (hold.current) clearInterval(hold.current);
    const fire = () => { if (hold.current) { clearInterval(hold.current); hold.current = null; } setHoldPct(0); };
    hold.current = setInterval(() => {
      if (drag.current && drag.current.moved) { fire(); return; }
      const pct = Math.min(1, (Date.now() - startT) / 2000);
      setHoldPct(pct);
      if (pct >= 1) { fire(); if (onHold) onHold(); }
    }, 40);
    const move = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const dx = x - drag.current.sx;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      setFreq(snap(drag.current.sf - dx / pxPerMHz));
    };
    const up = () => {
      fire();
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  };

  return (
    <div className="tuner-row">
      <button className="tuner-arrow raised" onClick={() => setFreq(snap(freq - BAND.step))} aria-label="tune down">
        <Icon.chevL />
      </button>
      <div className="scale" ref={ref} onMouseDown={onDown} onTouchStart={onDown}>
        <div className="scale-strip" style={{ transform: `translateX(${tx}px)` }}>
          {ticks}
          {labels}
        </div>
        <div className="scale-pointer" />
        {holdPct > 0.04 && (
          <div className="hold-ring" style={{ '--p': holdPct }}>
            <span>★</span>
          </div>
        )}
      </div>
      <button className="tuner-arrow raised" onClick={() => setFreq(snap(freq + BAND.step))} aria-label="tune up">
        <Icon.chevR />
      </button>
    </div>
  );
}
