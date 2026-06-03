import { useState, useRef, useEffect } from 'react';

export function Marquee({ text, className, speed = 38 }) {
  const wrapRef = useRef(null);
  const measRef = useRef(null);
  const trackRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    let raf = 0, pos = 0, last = 0, segW = 0;
    const measure = () => {
      if (!wrapRef.current || !measRef.current) return false;
      const cw = wrapRef.current.clientWidth;
      const tw = measRef.current.scrollWidth;
      segW = tw;
      return tw > cw + 2;
    };
    const ov = measure();
    setOverflow(ov);
    if (ov) {
      const step = (now) => {
        if (!last) last = now;
        const dt = (now - last) / 1000; last = now;
        pos -= speed * dt;
        if (segW > 0 && -pos >= segW) pos += segW;
        if (trackRef.current) trackRef.current.style.transform = `translateX(${pos}px)`;
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    } else if (trackRef.current) {
      trackRef.current.style.transform = 'translateX(0)';
    }
    const onResize = () => {
      const o = measure(); setOverflow(o);
      if (!o) { pos = 0; if (trackRef.current) trackRef.current.style.transform = 'translateX(0)'; }
    };
    window.addEventListener('resize', onResize);
    const t1 = setTimeout(onResize, 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); window.removeEventListener('resize', onResize); };
  }, [text, speed]);

  return (
    <div className={`marquee ${className || ''}`} ref={wrapRef}>
      <div className="marquee-track" ref={trackRef}>
        <span className="marquee-seg" ref={measRef}>{text}</span>
        {overflow && <span className="marquee-seg" aria-hidden>{text}</span>}
      </div>
    </div>
  );
}
