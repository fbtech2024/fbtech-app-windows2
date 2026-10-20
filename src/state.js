'use strict';
/* Posizione e dimensione della finestra: si ricordano, ma senza mai far comparire la finestra fuori dallo schermo (monitor scollegato, risoluzione cambiata). */
const MIN_W = 800, MIN_H = 560, DEF = { width: 1280, height: 800 };

function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function sanitizeState(saved, displays) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const out = { width: DEF.width, height: DEF.height, maximized: s.maximized === true, zoom: 1 };
  const w = num(s.width), h = num(s.height); if (w !== null) out.width = clamp(Math.round(w), MIN_W, 7680); if (h !== null) out.height = clamp(Math.round(h), MIN_H, 4320);
  const z = num(s.zoom); if (z !== null && z >= 0.5 && z <= 3) out.zoom = Math.round(z * 100) / 100;
  const x = num(s.x), y = num(s.y);
  if (x !== null && y !== null && Array.isArray(displays)) {
    const vis = displays.some(function (d) { const a = d && d.workArea; if (!a) return false; const ox = Math.min(x + out.width, a.x + a.width) - Math.max(x, a.x), oy = Math.min(y + out.height, a.y + a.height) - Math.max(y, a.y); return ox >= 120 && oy >= 60; });
    if (vis) { out.x = Math.round(x); out.y = Math.round(y); }
  }
  return out;
}
function serializeState(bounds, maximized, zoom) {
  const b = bounds || {}; return { x: b.x, y: b.y, width: b.width, height: b.height, maximized: !!maximized, zoom: zoom };
}
module.exports = { sanitizeState, serializeState, MIN_W, MIN_H, DEF };
