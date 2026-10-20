'use strict';
/* FBTECH Music Tech per Windows - regole di sicurezza: cosa puo' restare dentro la finestra, cosa va nel browser, cosa si blocca, quali permessi si concedono.
   Il sito e' l'UNICO che puo' usare microfono e MIDI; tutto il resto del web si apre nel browser normale. */

function parse(url) { try { return new URL(String(url)); } catch (e) { return null; } }

function isInternal(url, base) {
  const u = parse(url); if (!u || !base) return false;
  return u.protocol === base.protocol && base.hosts.indexOf(u.hostname) >= 0 && (u.port || '') === (base.port || '');
}
function isOfflinePage(url, offlineUrl) { return typeof url === 'string' && !!offlineUrl && url.indexOf(offlineUrl) === 0; }

/* will-navigate: 'allow' (resta nella finestra) | 'external' (si apre nel browser) | 'deny' */
function navigationDecision(url, ctx) {
  if (isInternal(url, ctx.base) || isOfflinePage(url, ctx.offlineUrl)) return 'allow';
  const u = parse(url); if (!u) return 'deny';
  if (u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:' || u.protocol === 'tel:') return 'external';
  return 'deny';   /* file:, javascript:, data:, blob: di altri, ms-settings: dal sito, ecc. */
}
/* window.open / target=_blank */
function windowOpenDecision(url, ctx) {
  if (isInternal(url, ctx.base)) return 'same-window';
  const d = navigationDecision(url, ctx); return d === 'external' ? 'external' : 'deny';
}

const ALLOWED = ['midi', 'midiSysex', 'fullscreen', 'clipboard-sanitized-write', 'pointerLock', 'speaker-selection'];
/* permission: nome del permesso; ctx: { origin, mediaTypes (richiesta) | mediaType (controllo), base } */
function permissionDecision(permission, ctx) {
  if (!ctx || !isInternal(ctx.origin, ctx.base)) return false;
  if (permission === 'media' || permission === 'audioCapture') {
    const t = ctx.mediaTypes || (ctx.mediaType && ctx.mediaType !== 'unknown' ? [ctx.mediaType] : null);
    if (!t) return true;                       /* "unknown": e' un controllo generico, si risponde si' per l'audio; la telecamera arriva sempre con il tipo */
    return t.length > 0 && t.every(function (x) { return x === 'audio'; });   /* SOLO microfono: niente telecamera */
  }
  return ALLOWED.indexOf(permission) >= 0;
}

module.exports = { isInternal, isOfflinePage, navigationDecision, windowOpenDecision, permissionDecision, ALLOWED };
