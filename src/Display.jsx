import { Icon } from './parts/Icon';
import { RetroArt } from './parts/RetroArt';
import { Waveform } from './parts/Waveform';
import { Marquee } from './parts/Marquee';

/**
 * liveMeta: { title: string | null, artist: string | null } | null
 *
 * Top line    (station-name): liveMeta.title  OR  station.name
 * Bottom line (tagline):      liveMeta.artist OR  station.tagline (preset tagline / URL for custom)
 */
export function Display({ station, freq, playing, volume, marqueeSpeed = 14,
                          liveMeta, isFav, onToggleFav, analyser }) {
  const live = playing && !!station;

  const topText    = liveMeta?.title  || station?.name    || 'No Signal';
  const bottomText = liveMeta?.artist || station?.tagline || '';

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
            ? <Marquee className="station-name" text={topText} speed={marqueeSpeed} />
            : <div className="station-name" style={{ color: 'var(--cream-dim)' }}>No Signal</div>
          }
          {station
            ? <Marquee className="tagline thai" text={bottomText} speed={marqueeSpeed} />
            : <div className="tagline thai">หมุนปุ่ม TUNE หรือเลื่อนสเกลเพื่อค้นหาสถานี</div>
          }

          <Waveform playing={live} analyser={analyser} />
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
          {station ? (
            <>
              {/* Base layer — station logo or retro art (always present) */}
              {station.logo
                ? <img className="art-img art-base" src={station.logo} alt={station.name} />
                : <RetroArt theme={station.theme} label={{ top: '', sub: '' }} />}

              {/* Top layer — live album art; covers the base once it loads.
                  If it fails, it hides itself and the logo shows through. */}
              {liveMeta?.artUrl && (
                <img
                  key={liveMeta.artUrl}
                  className="art-img art-live"
                  src={liveMeta.artUrl}
                  alt={liveMeta.title || station.name}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(0deg,#1a1a1a 0 2px,#262626 2px 4px)' }} />
          )}
        </div>
      </div>
    </div>
  );
}
