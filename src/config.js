'use strict';
/* FBTECH Music Tech per Windows - da dove carica il sito. Di norma il sito vero (cosi' conti, piani e aggiornamenti sono sempre quelli online). */
const DEFAULT_URL = 'https://www.faustoborriello.it/';
const LOCAL = ['localhost', '127.0.0.1', '[::1]'];

function parseBaseUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, error: 'indirizzo mancante' };
  let u; try { u = new URL(raw.trim()); } catch (e) { return { ok: false, error: 'indirizzo non valido' }; }
  const local = LOCAL.indexOf(u.hostname) >= 0;
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) return { ok: false, error: 'serve https (http solo per localhost)' };
  if (u.username || u.password) return { ok: false, error: 'l\'indirizzo non deve contenere utente o password' };
  return { ok: true, url: u.origin + '/', origin: u.origin, protocol: u.protocol, host: u.hostname, port: u.port, local };
}

/* l'ordine: --url=... > variabile FBTECH_URL > file di configurazione > sito vero. Un indirizzo non valido NON blocca: si segnala e si passa al successivo. */
function pickBaseUrl(opts) {
  opts = opts || {}; const argv = opts.argv || [], env = opts.env || {}, file = opts.file || null; const cands = []; const warnings = [];
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    if (a.indexOf('--url=') === 0) cands.push(['argomento --url', a.slice(6)]); else if (a === '--url' && i + 1 < argv.length) cands.push(['argomento --url', String(argv[++i])]);
  }
  if (env.FBTECH_URL) cands.push(['variabile FBTECH_URL', env.FBTECH_URL]);
  if (file && typeof file.url === 'string') cands.push(['file di configurazione', file.url]);
  for (const c of cands) { const p = parseBaseUrl(c[1]); if (p.ok) return Object.assign({ source: c[0], warnings }, p); warnings.push(c[0] + ': ' + p.error + ' (' + String(c[1]).slice(0, 80) + ')'); }
  return Object.assign({ source: 'predefinito', warnings }, parseBaseUrl(DEFAULT_URL));
}

/* www.sito.it e sito.it sono lo stesso sito: entrambi "interni" */
function hostsFor(base) {
  const h = base.host; if (base.local) return [h];
  return h.indexOf('www.') === 0 ? [h, h.slice(4)] : [h, 'www.' + h];
}
function withHosts(base) { return Object.assign({}, base, { hosts: hostsFor(base) }); }

module.exports = { DEFAULT_URL, parseBaseUrl, pickBaseUrl, hostsFor, withHosts };
