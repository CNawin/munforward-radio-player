import { useRef, useEffect } from 'react';

const BARS = 32;
const DECAY = 0.85; // Winamp-classic slow fall

export function Waveform({ playing, analyser }) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const heights = useRef(new Float32Array(BARS));
  const phase = useRef(0);

  // Direct-DOM animation (no React re-render per frame)
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
    let zeroFrames = 0;
    let useFallback = !analyser; // no analyser → synthetic from the start

    // Synthetic EQ-like motion — used on iOS where FFT returns zeros.
    // Bass bars (left) move bigger & slower, treble (right) smaller & jumpier.
    const synthetic = () => {
      phase.current += 0.13;
      const p = phase.current;
      for (let i = 0; i < BARS; i++) {
        const bass = 1 - i / BARS;                       // 1 at left → 0 at right
        const a = Math.sin(p * (1 + i * 0.06) + i * 0.7);
        const b = Math.sin(p * 0.53 + i * 1.9);
        const c = Math.sin(p * 2.1 + i * 0.33);
        const mix = (a * 0.5 + b * 0.3 + c * 0.2) * 0.5 + 0.5; // 0..1
        const target = 8 + mix * (45 + bass * 50);       // bass taller
        heights.current[i] = target > heights.current[i]
          ? target
          : heights.current[i] * DECAY;
        bars[i].style.height = `${Math.max(3, heights.current[i])}%`;
      }
    };

    const step = () => {
      if (analyser && !useFallback) {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < BARS; i++) sum += data[i];

        if (sum === 0) {
          // iOS WebKit: streamed MediaElement gives all-zero FFT → fall back
          if (++zeroFrames > 30) useFallback = true;
        } else {
          zeroFrames = 0;
          for (let i = 0; i < BARS; i++) {
            const freq = (data[i] / 255) * 100;
            heights.current[i] = freq > heights.current[i]
              ? freq
              : heights.current[i] * DECAY;
            bars[i].style.height = `${Math.max(3, heights.current[i])}%`;
          }
        }
      }

      if (useFallback) synthetic();

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
