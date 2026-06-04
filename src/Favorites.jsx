import { Icon } from './parts/Icon';
import { RetroArt } from './parts/RetroArt';

/**
 * stations  : ordered list to show (pinned first, then starred)
 * pinnedIds : ids that can't be removed (shown with a lock dot, no remove)
 * onSelect  : play a station
 * onRemove  : remove a starred/custom station
 */
export function Favorites({ currentId, onSelect, stations = [], pinnedIds = [], onRemove }) {
  return (
    <div className="fav">
      <div className="fav-head">
        <span className="star-ic"><Icon.star /></span>
        <h3>FAVORITE STATIONS</h3>
      </div>

      {stations.length === 0 ? (
        <div className="fav-empty thai">ยังไม่มีสถานี — กดดาว ★ ที่หน้าจอ หรือสร้างสถานีในเมนู</div>
      ) : (
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
        </div>
      )}
    </div>
  );
}
