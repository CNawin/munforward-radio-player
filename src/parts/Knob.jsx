import { useRef, useCallback } from 'react';

export function Knob({ value, onChange, label, sensitivity = 0.6 }) {
  const drag = useRef(null);
  const angle = -135 + value * 270;

  const onDown = useCallback((e) => {
    e.preventDefault();
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    drag.current = { startY, startX, startVal: value };
    const move = (ev) => {
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const dy = drag.current.startY - y;
      const dx = x - drag.current.startX;
      const delta = (dy + dx) / 200 * sensitivity;
      onChange(Math.max(0, Math.min(1, drag.current.startVal + delta)));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }, [value, onChange, sensitivity]);

  return (
    <div className="knob-wrap">
      <div className="knob" onMouseDown={onDown} onTouchStart={onDown}>
        <div className="pointer" style={{ transform: `translateX(-50%) rotate(${angle}deg)`, transformOrigin: 'center 24px' }} />
      </div>
      <div className="knob-label">{label}</div>
    </div>
  );
}
