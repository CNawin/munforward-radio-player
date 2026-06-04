import { useState, useRef } from 'react';

export function MenuDrawer({ open, onClose, onPreviewUrl, onCreateStation,
                             sleepMin, onSetSleep, sleepRemain,
                             alarm, onAlarmTime, alarmOn, onAlarmToggle, version = 'v1.0.0 · 2026' }) {
  const [url, setUrl]             = useState('');
  const [name, setName]           = useState('');
  const [fm, setFm]               = useState('');   // optional FM number (string)
  const [imgSrc, setImgSrc]       = useState('');   // data URL or http URL
  const [imgUrlInput, setImgUrlInput] = useState('');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImgSrc(ev.target.result); setImgUrlInput(''); };
    reader.readAsDataURL(file);
  };

  const handleImgUrl = (v) => {
    setImgUrlInput(v);
    setImgSrc(v);
  };

  const reset = () => { setUrl(''); setName(''); setFm(''); setImgSrc(''); setImgUrlInput(''); };

  const preview = () => {
    const u = url.trim();
    if (u) onPreviewUrl(u, imgSrc || null, name.trim());
  };

  const create = () => {
    const u = url.trim();
    if (!u) return;
    const f = parseFloat(fm);
    const freq = (!isNaN(f) && f >= 87.5 && f <= 108) ? f : null;
    onCreateStation({ url: u, imageSrc: imgSrc || null, name: name.trim(), freq });
    reset();
  };

  const handleClose = () => { onClose(); };

  return (
    <div className={`menu-overlay ${open ? 'open' : ''}`} onClick={handleClose}>
      <div
        className={`menu-drawer m-sheet ${open ? 'open' : ''}`}
        style={{ transform: open ? 'translateY(0)' : 'translateY(105%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="menu-grip" />
        <div className="menu-titlebar">
          <span className="menu-title">MENU</span>
          <button className="menu-close raised" onClick={handleClose} aria-label="close menu">✕</button>
        </div>

        {/* ── Add custom station ── */}
        <section className="menu-sec">
          <div className="menu-sec-h">เพิ่มสถานีเอง</div>

          {/* Stream URL */}
          <input
            className="url-input" type="url" inputMode="url" spellCheck={false}
            value={url} placeholder="Stream URL — https://…/stream"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') preview(); }}
          />

          {/* Name + FM */}
          <div className="field-row">
            <input
              className="url-input" type="text" spellCheck={false}
              value={name} placeholder="ชื่อสถานี (ไม่บังคับ)"
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="url-input fm-input" type="number" inputMode="decimal"
              min="87.5" max="108" step="0.25"
              value={fm} placeholder="เลข FM"
              onChange={(e) => setFm(e.target.value)}
            />
          </div>
          <div className="field-hint thai">
            ใส่เลข FM → ไปอยู่บนหน้าปัด (หมุนหาได้) · ไม่ใส่ → ลงรายการโปรด
          </div>

          {/* Image picker */}
          <div className="img-picker">
            <div className="img-picker-label">รูปภาพสถานี (ไม่บังคับ)</div>
            <div className="img-picker-row">
              <div className="img-thumb" onClick={() => fileRef.current?.click()}>
                {imgSrc
                  ? <img src={imgSrc} alt="preview" onError={() => setImgSrc('')} />
                  : <span className="img-thumb-ph">🎵</span>
                }
              </div>
              <div className="img-picker-inputs">
                <button className="img-file-btn raised" onClick={() => fileRef.current?.click()}>
                  📁 เลือกรูปจากเครื่อง
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                <input
                  className="url-input" type="url" inputMode="url" spellCheck={false}
                  value={imgUrlInput} placeholder="หรือ Image URL…"
                  onChange={(e) => handleImgUrl(e.target.value)}
                />
              </div>
            </div>
            {imgSrc && (
              <button className="img-clear" onClick={() => { setImgSrc(''); setImgUrlInput(''); }}>
                ✕ ลบรูป
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="url-actions">
            <button className="url-preview raised" onClick={preview}>▶ ลองเล่น</button>
            <button className="url-go raised" onClick={create}>+ สร้างสถานี</button>
          </div>
        </section>

        {/* ── Sleep timer ── */}
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

        {/* ── Alarm ── */}
        <section className="menu-sec">
          <div className="menu-sec-h">ALARM</div>
          <div className="alarm-row">
            <input className="time-input" type="time" value={alarm} onChange={(e) => onAlarmTime(e.target.value)} />
            <button
              className={`switch ${alarmOn ? 'on' : ''}`}
              onClick={onAlarmToggle}
              aria-label="toggle alarm" role="switch" aria-checked={alarmOn}
            >
              <span className="switch-knob" />
            </button>
          </div>
          {alarmOn && alarm && (
            <div className="alarm-note thai">เปิดวิทยุเวลา {alarm} — ต้องเปิดหน้านี้ค้างไว้</div>
          )}
        </section>

        {/* ── About ── */}
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
