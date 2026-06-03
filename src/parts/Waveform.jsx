export function Waveform({ playing, bars = 32, amp = 1 }) {
  const items = [];
  for (let i = 0; i < bars; i++) {
    const base = 20 + Math.abs(Math.sin(i * 1.3)) * 70 * amp;
    items.push(
      <i key={i} style={{
        height: `${Math.max(12, base)}%`,
        animationDelay: `${(i % 8) * 0.07}s`,
        opacity: playing ? 1 : 0.4
      }} />
    );
  }
  return <div className={`waveform ${playing ? 'playing' : ''}`}>{items}</div>;
}
