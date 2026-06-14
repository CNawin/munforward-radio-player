import { useState, useRef, useEffect } from 'react';
import { Icon } from './parts/Icon';
import { RetroArt } from './parts/RetroArt';

/**
 * stations  : ordered list to show (pinned first, then starred)
 * pinnedIds : ids that can't be removed (shown with a lock dot, no remove)
 * onSelect  : play a station
 * onRemove  : remove a starred/custom station
 */
const MIN_SLOTS = 8; // 4 rows × 2 — box sized to fit; silver shows below

export function Favorites({ currentId, onSelect, stations = [], editableIds = [], onEdit, onDelete }) {
  const emptyCount = Math.max(0, MIN_SLOTS - stations.length);
  const [revealedId, setRevealedId] = useState(null);  // card showing ✎ 🗑
  const timerRef = useRef(null);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null; };
  const hideActions = () => { clearTimer(); setRevealedId(null); };
  const reveal = (id) => {
    clearTimer();
    setRevealedId(id);
    timerRef.current = setTimeout(() => setRevealedId(null), 5000); // auto-hide after 5s
  };

  // hide the actions if the playing station changes / on unmount
  useEffect(() => {
    if (revealedId && revealedId !== currentId) hideActions();
  }, [currentId]);          // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimer(), []);

  const handleCard = (s) => {
    const isActive = s.id === currentId;
    const editable = editableIds.includes(s.id);
    if (isActive && editable) {
      reveal(s.id);          // second tap on the active custom card → reveal
    } else {
      hideActions();
      onSelect(s);           // first tap → just play
    }
  };

  return (
    <div className="fav">
      <div className="fav-head">
        <span className="star-ic"><Icon.star /></span>
        <h3>FAVORITE STATIONS</h3>
      </div>

      <div className="fav-grid">
        {stations.map(s => {
            const active = s.id === currentId;
            const editable = editableIds.includes(s.id);   // user-created station
            const revealed = revealedId === s.id && editable;
            return (
              <div key={s.id} className={`fav-card ${active ? 'active' : ''}`} onClick={() => handleCard(s)}>
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
                {revealed && (
                  <div className="fav-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="fav-act edit" aria-label="แก้ไขสถานี"
                            onClick={() => { hideActions(); onEdit?.(s); }}>
                      <Icon.edit />
                    </button>
                    <button
                      className="fav-act del" aria-label="ลบสถานี"
                      onClick={() => { hideActions(); if (window.confirm(`ต้องการลบ "${s.name}" ใช่ไหม?`)) onDelete?.(s.id); }}
                    >
                      <Icon.trash />
                    </button>
                  </div>
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
