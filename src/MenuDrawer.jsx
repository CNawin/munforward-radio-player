import { useState } from 'react';

export function MenuDrawer({ open, onClose, onPlayUrl, sleepMin, onSetSleep, sleepRemain,
                             alarm, onAlarmTime, alarmOn, onAlarmToggle, version = 'v1.0.0 · 2026' }) {
  const [url, setUrl] = useState('');
  const submit = () => { const u = url.trim(); if (u) onPlayUrl(u); };
  const closed = 'translateY(105%)';

  return (
    <div className={`menu-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div
        className={`menu-drawer m-sheet ${open ? 'open' : ''}`}
        style={{ transform: open ? 'translateY(0)' : closed }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="menu-grip" />
        <div className="menu-titlebar">
          <span className="menu-title">MENU</span>
          <button className="menu-close raised" onClick={onClose} aria-label="close menu">✕</button>
        </div>

        {/* Custom stream URL */}
        <section className="menu-sec">
          <div className="menu-sec-h">CUSTOM STREAM URL</div>
          <div className="url-row">
            <input
              className="url-input" type="url" inputMode="url" spellCheck={false}
              value={url} placeholder="https://…/stream"
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            />
            <button className="url-go raised" onClick={submit}>PLAY</button>
          </div>
        </section>

        {/* Sleep timer */}
        <section className="menu-sec">
          <div className="menu-sec-h">
            SLEEP TIMER
            {sleepRemain && <span className="menu-badge">{sleepRemain}</span>}
          </div>
          <div className="chip-row">
            {[['Off', 0], ['15m', 15], ['30m', 30], ['60m', 60]].map(([lab, v]) => (
              <button key={v} className={`mchip raised ${sleepMin === v ? 'on' : ''}`} onClick={() => onSetSleep(v)}>
                {lab}
              </button>
            ))}
          </div>
        </section>

        {/* Alarm */}
        <section className="menu-sec">
          <div className="menu-sec-h">ALARM</div>
          <div className="alarm-row">
            <input className="time-input" type="time" value={alarm} onChange={(e) => onAlarmTime(e.target.value)} />
            <button
              className={`switch ${alarmOn ? 'on' : ''}`}
              onClick={onAlarmToggle}
              aria-label="toggle alarm"
              role="switch"
              aria-checked={alarmOn}
            >
              <span className="switch-knob" />
            </button>
          </div>
          {alarmOn && alarm && (
            <div className="alarm-note thai">เปิดวิทยุเวลา {alarm} — ต้องเปิดหน้านี้ค้างไว้</div>
          )}
        </section>

        {/* About */}
        <section className="menu-sec about">
          <div className="menu-sec-h">ABOUT</div>
          <div className="about-row">
            <div className="about-name">MUNforward Radio</div>
            <div className="about-ver">{version}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
