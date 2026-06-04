import { useRef, useEffect } from 'react';

const BARS = 32;
const DECAY = 0.85; // Winamp-classic slow fall

// Real-FFT spectrum. Reacts to actual audio on desktop. On iOS the
// AnalyserNode returns all-zero data (WebKit limit) so the bars stay flat —
// which is why the waveform is hidden on mobile via CSS (no fake animation).
export function Waveform({ playing, analyser }) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const heights = useRef(new Float32Array(BARS));

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const bars = containerRef.current?.querySelectorAll('i');
    if (!bars?.length) return;

    // Paused / no analyser → decay to flat
    if (!analyser || !playing) {
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

    const data = new Uint8Array(analyser.frequencyBinCount); // 32 bins
    const step = () => {
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < BARS; i++) {
        const freq = (data[i] / 255) * 100;
        heights.current[i] = freq > heights.current[i]
          ? freq
          : heights.current[i] * DECAY;
        bars[i].style.height = `${Math.max(3, heights.current[i])}%`;
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
