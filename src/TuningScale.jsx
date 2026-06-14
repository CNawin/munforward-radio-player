import { BAND } from './data';

/**
 * Analog dial — DISPLAY ONLY.
 * The whole FM band sits on a fixed scale; the red needle moves to show the
 * current frequency. Station changes come from the ⏮ ⏭ buttons / Favorites,
 * not from dragging this dial.
 */
export function TuningScale({ freq }) {
  const span = BAND.max - BAND.min;
  const PAD = 5; // % inset on each side so 88 / 108 labels aren't clipped
  const toPct = (f) => PAD + ((f - BAND.min) / span) * (100 - 2 * PAD);
  const ticks = [];
  const labels = [];

  // Ticks every 0.5 MHz; labels every 2 MHz (88, 90, … 108)
  for (let f = BAND.min; f <= BAND.max + 0.001; f += 0.5) {
    const pct = toPct(f);
    const isInt = Math.abs(f - Math.round(f)) < 0.001;
    const isLabel = isInt && Math.round(f) % 2 === 0;
    ticks.push(
      <span key={'t' + f}
            className={`tick ${isLabel ? 'major' : isInt ? 'mid' : 'minor'}`}
            style={{ left: `${pct}%` }} />
    );
    if (isLabel) {
      labels.push(
        <span key={'l' + f} className="tick-label" style={{ left: `${pct}%` }}>
          {Math.round(f)}
        </span>
      );
    }
  }

  const clamped = Math.max(BAND.min, Math.min(BAND.max, freq));
  const needlePct = toPct(clamped);

  return (
    <div className="tuner-row">
      <div className="scale display-dial">
        <div className="scale-fixed">
          {ticks}
          {labels}
        </div>
        <div className="scale-needle" style={{ left: `${needlePct}%` }} />
      </div>
    </div>
  );
}
