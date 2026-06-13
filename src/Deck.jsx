import { Icon } from './parts/Icon';

/**
 * Controls: ⏮  [■ Stop] [▶ Play]  ⏭
 * Play and Stop are separate latching buttons (not a toggle). Default = Stop.
 * The engaged button stays pressed down (vintage tape-deck style).
 */
export function Deck({ playing, onPlay, onStop, prev, next }) {
  return (
    <div className="deck deck-buttons">
      <button className="tbtn side" onClick={prev} aria-label="previous station">
        <Icon.prev />
      </button>

      <div className="transport">
        <button
          className={`tbtn play ${!playing ? 'engaged' : ''}`}
          onClick={onStop}
          aria-label="stop"
        >
          <Icon.stop />
        </button>
        <button
          className={`tbtn play ${playing ? 'engaged' : ''}`}
          onClick={onPlay}
          aria-label="play"
        >
          <Icon.play />
        </button>
      </div>

      <button className="tbtn side" onClick={next} aria-label="next station">
        <Icon.next />
      </button>
    </div>
  );
}
