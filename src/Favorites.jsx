import { STATIONS } from './data';
import { Icon } from './parts/Icon';
import { RetroArt } from './parts/RetroArt';

export function Favorites({ currentId, onSelect, favs, toggleFav }) {
  return (
    <div className="fav">
      <div className="fav-head">
        <span className="star-ic"><Icon.star /></span>
        <h3>FAVORITE STATIONS</h3>
        <button className="viewall">View all <Icon.chevR width={14} height={14} /></button>
      </div>
      <div className="fav-grid">
        {STATIONS.map(s => {
          const active = s.id === currentId;
          const on = favs.has(s.id);
          return (
            <div key={s.id} className={`fav-card ${active ? 'active' : ''}`} onClick={() => onSelect(s)}>
              {active && <span className="fav-led" />}
              <div className="fav-art">
                {s.logo
                  ? <img className="art-img" src={s.logo} alt={s.name} />
                  : <RetroArt theme={s.theme} size="sm" />
                }
              </div>
              <div className="fav-info">
                <div className="nm">{s.name}</div>
                <div className="fq">{s.freq.toFixed(2)} FM</div>
              </div>
              <button
                className={`fav-star ${on ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleFav(s.id); }}
              >
                {on ? <Icon.star /> : <Icon.starO />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
