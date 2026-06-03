import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

function scaleToFit() {
  const s = document.getElementById('scaler');
  if (!s) return;
  const m = 16;
  const sc = Math.min((window.innerWidth - m) / 390, (window.innerHeight - m) / 844, 1);
  s.style.transform = `scale(${sc})`;
}
window.addEventListener('resize', scaleToFit);
setTimeout(scaleToFit, 30);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
