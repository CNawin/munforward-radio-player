import { useRef, useEffect } from 'react';

const BARS = 32;
const DECAY = 0.85;        // Winamp-classic slow fall
const SILENCE_LIMIT = 45;  // frames of zero-FFT before assuming iOS (no real data)

// Deterministic pseudo-random 0..1 per index — decorrelates bars so the
// synthetic EQ bounces independently instead of travelling sideways.
const rnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export function Waveform({ playing, analyser }) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const heights = useRef(new Float32Array(BARS));
  const phase = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const bars = containerRef.current?.querySelectorAll('i');
    if (!bars?.length) return;

    // ── Paused → decay bars to flat ──
    if (!playing) {
      const fade = () => {
        let any = false;
        for (let i = 0; i < BARS; i++) {
          heights.current[i] *= DECAY;
          bars[i].style.height = `${Math.max(3, heights.current[i])}%`;
          if (heights.current[i] > 4) any = true;
        }
        if (any) rafRef.current = requestAnimationFrame(fade);
      };
      rafRef.current = requestAnimationFrame(fade);
      return () => cancelAnimationFrame(rafRef.current);
    }

    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    let silentFrames = 0;

    // Synthetic spectrum — each bar bounces on its own phase/speed (no sideways
    // travelling wave). Bass bars (left) reach higher. Used on iOS, where the
    // AnalyserNode returns all-zero data for streamed audio.
    const synthetic = () => {
      phase.current += 0.09;
      const p = phase.current;
      for (let i = 0; i < BARS; i++) {
        const off  = rnd(i) * Math.PI * 2;        // decorrelated phase
        const sp   = 0.7 + rnd(i + 31) * 1.8;     // decorrelated speed
        const bass = 1 - i / BARS;                // 1 (left) → 0 (right)
        const v = (Math.sin(p * sp + off) * 0.5 + 0.5)
                * (Math.sin(p * sp * 0.5 + off * 1.7) * 0.4 + 0.6);
        const target = 8 + v * (40 + bass * 52);
        heights.current[i] = target > heights.current[i]
          ? target
          : heights.current[i] * DECAY;
        bars[i].style.height = `${Math.max(3, heights.current[i])}%`;
      }
    };

    const real = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < BARS; i++) sum += data[i];
      if (sum === 0) { silentFrames++; return false; }   // no data this frame
      silentFrames = 0;
      for (let i = 0; i < BARS; i++) {
        const freq = (data[i] / 255) * 100;
        heights.current[i] = freq > heights.current[i]
          ? freq
          : heights.current[i] * DECAY;
        bars[i].style.height = `${Math.max(3, heights.current[i])}%`;
      }
      return true;
    };

    const step = () => {
      // Try real FFT first; if the device gives sustained zeros (iOS), draw
      // the synthetic EQ instead. Auto-recovers if real data ever returns.
      if (data && silentFrames < SILENCE_LIMIT) {
        if (!real()) {
          if (silentFrames >= SILENCE_LIMIT) synthetic(); // just crossed → synth
        }
      } else {
        // iOS path (or no analyser): keep checking for real data occasionally
        if (data) { analyser.getByteFrequencyData(data);
          let s = 0; for (let i = 0; i < BARS; i++) s += data[i];
          if (s > 0) { silentFrames = 0; }                // real came back
        }
        synthetic();
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, playing]);

  return (
    <div className="waveform" ref={containerRef}>
      {Array.from({ length: BARS }, (_, i) => (
        <i key={i} style={{ height: '3%' }} />
      ))}
    </div>
  );
}
