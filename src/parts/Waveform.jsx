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

    // Synthetic "music-like" motion — used on iOS where FFT returns zeros
    const synthetic = () => {
      phase.current += 0.16;
      for (let i = 0; i < BARS; i++) {
        const t = phase.current + i * 0.45;
        const v = (Math.sin(t) * 0.5 + 0.5) * (Math.sin(t * 0.37 + 1.3) * 0.5 + 0.5);
        const target = 14 + v * 80;
        heights.current[i] = target > heights.current[i] ? target : heights.current[i] * DECAY;
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
