import { Icon } from './parts/Icon';
import { RetroArt } from './parts/RetroArt';

/**
 * stations  : ordered list to show (pinned first, then starred)
 * pinnedIds : ids that can't be removed (shown with a lock dot, no remove)
 * onSelect  : play a station
 * onRemove  : remove a starred/custom station
 */
const MIN_SLOTS = 6; // 3 rows × 2 — box sized to fit exactly

export function Favorites({ currentId, onSelect, stations = [], pinnedIds = [], onRemove }) {
  const emptyCount = Math.max(0, MIN_SLOTS - stations.length);

  return (
    <div className="fav">
      <div className="fav-head">
        <span className="star-ic"><Icon.star /></span>
        <h3>FAVORITE STATIONS</h3>
      </div>

      <div className="fav-grid">
        {stations.map(s => {
            const active = s.id === currentId;
            const pinned = pinnedIds.includes(s.id);
            return (
              <div key={s.id} className={`fav-card ${active ? 'active' : ''}`} onClick={() => onSelect(s)}>
                {active && <span className="fav-led" />}
                <div className="fav-art">
                  {s.logo
                    ? <img className="art-img" src={s.logo} alt={s.name} onError={(e) => { e.target.style.display = 'none'; }} />
                    : <RetroArt theme={s.theme} size="sm" />
                  }
                </div>
                <div className="fav-info">
                  <div className="nm">{s.name}</div>
                  <div className="fq">
                    {typeof s.freq === 'number' ? `${s.freq.toFixed(2)} FM` : 'STREAM'}
                  </div>
                </div>
                {pinned ? (
                  <span className="fav-pin" title="ปักหมุด"><Icon.star /></span>
                ) : (
                  <button
                    className="fav-star on"
                    title="เอาออกจากรายการโปรด"
                    onClick={(e) => { e.stopPropagation(); onRemove?.(s.id); }}
                  >
                    <Icon.star />
                  </button>
                )}
              </div>
            );
          })}

          {/* Faint placeholder slots — reserve space, ready to fill */}
          {Array.from({ length: emptyCount }, (_, i) => (
            <div key={`slot-${i}`} className="fav-slot" aria-hidden="true">
              <span>+</span>
            </div>
          ))}
        </div>
    </div>
  );
}
