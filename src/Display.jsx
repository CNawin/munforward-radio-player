import { Icon } from './parts/Icon';
import { RetroArt } from './parts/RetroArt';
import { Waveform } from './parts/Waveform';
import { Marquee } from './parts/Marquee';

export function Display({ station, freq, playing, volume, marqueeSpeed = 14, liveSong, isFav, onToggleFav }) {
  const live = playing && !!station;
  const fmStr = freq.toFixed(2);

  return (
    <div className="display">
      <div className="disp-top">
        <div className="disp-left">
          <div className={`onair ${live ? 'live' : 'off'}`}>
            <span className="dot" />
            <span>{live ? 'ON AIR' : 'OFF AIR'}</span>
          </div>
          <div className="nowlabel">NOW PLAYING</div>
          {station
            ? <Marquee className="station-name" text={station.name} speed={marqueeSpeed} />
            : <div className="station-name" style={{ color: 'var(--cream-dim)' }}>No Signal</div>
          }
          {station
            ? <Marquee className="tagline thai" text={liveSong || station.tagline} speed={marqueeSpeed} />
            : <div className="tagline thai">หมุนปุ่ม TUNE หรือเลื่อนสเกลเพื่อค้นหาสถานี</div>
          }
          <Waveform playing={live} amp={0.35 + volume * 0.65} />
        </div>
        {station && (
          <button
            className={`np-star ${isFav ? 'on' : ''}`}
            onClick={onToggleFav}
            aria-label={isFav ? 'remove favorite' : 'add favorite'}
            title="Favorite"
          >
            {isFav ? <Icon.star /> : <Icon.starO />}
          </button>
        )}
        <div className="art">
          {station
            ? (station.logo
                ? <img className="art-img" src={station.logo} alt={station.name} />
                : <RetroArt theme={station.theme} label={{ top: '', sub: '' }} />)
            : <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,#1a1a1a 0 2px,#262626 2px 4px)' }} />
          }
        </div>
      </div>
    </div>
  );
}
