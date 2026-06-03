export function RetroArt({ theme, label, size = 'lg' }) {
  const fallback = { sky: ['#1b1140', '#7a1f6b'], sun: '#ff5db1', glow: '#c33ce0', water: '#9b2fd6' };
  const t = (theme && theme.sky) ? theme : fallback;
  const slats = [];
  for (let i = 0; i < 6; i++) {
    slats.push(
      <span key={i} style={{
        position: 'absolute', left: '-10%', right: '-10%',
        bottom: `${i * 13}%`, height: '5%',
        background: t.sky[1], opacity: 0.65 + i * 0.04
      }} />
    );
  }
  const sunSize = size === 'lg' ? 58 : 26;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(180deg, ${t.sky[0]} 0%, ${t.sky[1]} 100%)`,
      overflow: 'hidden'
    }}>
      {/* glow halo */}
      <div style={{
        position: 'absolute', left: '50%', bottom: size === 'lg' ? '34%' : '30%',
        transform: 'translateX(-50%)', width: sunSize * 2.2, height: sunSize * 2.2,
        borderRadius: '50%', background: `radial-gradient(circle, ${t.glow}55, transparent 70%)`
      }} />
      {/* sun */}
      <div style={{
        position: 'absolute', left: '50%', bottom: size === 'lg' ? '40%' : '34%',
        transform: 'translateX(-50%)', width: sunSize, height: sunSize,
        borderRadius: '50%', overflow: 'hidden',
        background: `linear-gradient(180deg, ${t.sun}, ${t.glow})`
      }}>{slats}</div>
      {/* water band */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%',
        background: `linear-gradient(180deg, ${t.water}, ${t.sky[1]})`,
        boxShadow: `inset 0 1px 0 ${t.sun}66`
      }} />
      {/* water shimmer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', opacity: 0.5,
        background: `repeating-linear-gradient(180deg, transparent 0 4px, ${t.sky[1]}88 4px 6px)`
      }} />
      {/* palm silhouette */}
      {t.palm && size === 'lg' && (
        <div style={{ position: 'absolute', right: '12%', bottom: '40%', width: 0, height: 0 }}>
          <div style={{ position: 'absolute', width: '3px', height: '46px', background: '#0d0a08', bottom: 0, transformOrigin: 'bottom', transform: 'rotate(6deg)' }} />
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              position: 'absolute', bottom: '44px', width: '22px', height: '8px',
              background: '#0d0a08', borderRadius: '0 80% 0 0',
              transformOrigin: 'left bottom', transform: `rotate(${-50 + i * 30}deg)`
            }} />
          ))}
        </div>
      )}
      {/* city skyline */}
      {t.city && size === 'lg' && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: '38%', height: '26%',
          display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '0 8px', opacity: 0.92
        }}>
          {[10,18,8,24,14,30,12,20,9,16].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h * 2}%`, background: '#0c0a10' }} />
          ))}
        </div>
      )}
      {label && (
        <div className="art-label">
          <b>{label.top}</b>
          <small>{label.sub}</small>
        </div>
      )}
    </div>
  );
}
