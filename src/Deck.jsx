import { BAND } from './data';
import { Icon } from './parts/Icon';
import { Knob } from './parts/Knob';

const snap = (f) => {
  const v = Math.round((f - BAND.min) / BAND.step) * BAND.step + BAND.min;
  return Math.max(BAND.min, Math.min(BAND.max, Math.round(v * 100) / 100));
};

export function Deck({ volume, setVolume, freq, setFreq, playing, togglePlay, prev, next }) {
  const tuneVal = (freq - BAND.min) / (BAND.max - BAND.min);
  return (
    <div className="deck">
      <Knob value={volume} onChange={setVolume} label="VOLUME" />
      <div className="transport">
        <button className="tbtn side" onClick={prev} aria-label="previous station"><Icon.prev /></button>
        <button className="tbtn play" onClick={togglePlay} aria-label="play/pause">
          {playing ? <Icon.pause /> : <Icon.play />}
        </button>
        <button className="tbtn side" onClick={next} aria-label="next station"><Icon.next /></button>
      </div>
      <Knob value={tuneVal} onChange={(v) => setFreq(snap(BAND.min + v * (BAND.max - BAND.min)))} label="TUNE" />
    </div>
  );
}
