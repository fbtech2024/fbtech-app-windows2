'use strict';
/* FBTECH Music Tech per Windows (T37) - processo principale. E' volutamente SOTTILE: apre il sito vero in una finestra sicura e sistema le cose che nel browser
   danno fastidio (permessi del microfono e del MIDI, audio che si ferma a finestra nascosta, finestra che non ricorda dove stava). Tutta la logica e' in src/ (provata a parte). */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, Menu, shell, session, dialog, powerSaveBlocker, screen } = require('electron');
const config = require('./src/config');
const guard = require('./src/guard');
const stateLib = require('./src/state');
const menuLib = require('./src/menu');

app.setAppUserModelId('it.faustoborriello.fbtech.music');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');   /* l'audio parte senza dover cliccare prima (DJ, metronomo) */

let win = null, base = null, picked = null, offlineFile = '', offlineUrl = '', powerId = -1, onTop = false, crashes = [];
function userFile(n) { return path.join(app.getPath('userData'), n); }
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }
function writeJson(f, o) { try { fs.mkdirSync(path.dirname(f), { recursive: true }); const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(o), 'utf8'); fs.renameSync(t, f); } catch (e) { /* la finestra non deve mai bloccarsi per un file */ } }
function gctx() { return { base: base, offlineUrl: offlineUrl }; }

function setupSession() {
  const ses = session.defaultSession;
  /* SOLO il nostro sito puo' usare il microfono e il MIDI; la telecamera e tutto il resto sono negati */
  ses.setPermissionRequestHandler(function (wc, permission, callback, details) {
    callback(guard.permissionDecision(permission, { origin: (details && details.requestingUrl) || (wc && wc.getURL && wc.getURL()) || '', mediaTypes: details && details.mediaTypes, base: base }));
  });
  ses.setPermissionCheckHandler(function (wc, permission, requestingOrigin, details) {
    return guard.permissionDecision(permission, { origin: requestingOrigin || (details && details.requestingUrl) || '', mediaType: details && details.mediaType, base: base });
  });
}

function loadTarget(url) { if (win && !win.isDestroyed()) { win.webContents.loadURL(url); } }
function loadOffline(failedUrl) { if (win && !win.isDestroyed()) { win.webContents.loadFile(offlineFile, { query: { url: failedUrl || base.url } }); } }

function createWindow() {
  const st = stateLib.sanitizeState(readJson(userFile('window-state.json')), screen.getAllDisplays());
  const opts = { width: st.width, height: st.height, minWidth: stateLib.MIN_W, minHeight: stateLib.MIN_H, show: false, backgroundColor: '#06111c', title: 'FBTECH Music Tech', icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, backgroundThrottling: false, spellcheck: false } };
  if (typeof st.x === 'number' && typeof st.y === 'number') { opts.x = st.x; opts.y = st.y; }
  win = new BrowserWindow(opts);
  const wc = win.webContents;
  win.once('ready-to-show', function () { if (st.maximized) { win.maximize(); } win.show(); });
  wc.on('did-finish-load', function () { if (st.zoom !== 1) { wc.setZoomFactor(st.zoom); } });
  /* i link: dentro solo il nostro sito; il resto del web si apre nel browser normale; tutto il resto si blocca */
  wc.setWindowOpenHandler(function (d) {
    const r = guard.windowOpenDecision(d.url, gctx());
    if (r === 'external') { shell.openExternal(d.url); } else if (r === 'same-window') { loadTarget(d.url); }
    return { action: 'deny' };
  });
  function guardNav(e, url) { const r = guard.navigationDecision(url, gctx()); if (r === 'allow') { return; } e.preventDefault(); if (r === 'external') { shell.openExternal(url); } }
  wc.on('will-navigate', guardNav); wc.on('will-redirect', guardNav);
  /* senza rete: pagina chiara con "Riprova" (codice -3 = navigazione annullata di proposito: non e' un errore) */
  wc.on('did-fail-load', function (e, code, desc, url, isMainFrame) { if (isMainFrame && code !== -3 && !guard.isOfflinePage(url, offlineUrl)) { loadOffline(url); } });
  wc.on('render-process-gone', function () { const now = Date.now(); crashes = crashes.filter(function (t) { return now - t < 60000; }); crashes.push(now); if (crashes.length <= 3) { setTimeout(function () { if (win && !win.isDestroyed()) { wc.reload(); } }, 500); } });
  win.on('close', function () { try { writeJson(userFile('window-state.json'), stateLib.serializeState(win.getNormalBounds(), win.isMaximized(), wc.getZoomFactor())); } catch (e) { /* niente */ } });
  win.on('closed', function () { win = null; });
  wc.loadURL(base.url);
  if (process.argv.indexOf('--dev') >= 0) { wc.openDevTools({ mode: 'detach' }); }
}

function buildMenu() {
  const wc = function () { return win && !win.isDestroyed() ? win.webContents : null; };
  const c = {
    goto: function (p) { loadTarget(new URL(p, base.url).toString()); },
    quit: function () { app.quit(); },
    openSystem: function (u) { if (/^ms-settings:[a-z-]+$/.test(u)) { shell.openExternal(u); } },
    reload: function (hard) { const w = wc(); if (!w) { return; } if (hard) { w.reloadIgnoringCache(); } else { w.reload(); } },
    toggleFullscreen: function () { if (win) { win.setFullScreen(!win.isFullScreen()); } },
    toggleOnTop: function () { onTop = !onTop; if (win) { win.setAlwaysOnTop(onTop); } },
    isOnTop: function () { return onTop; },
    zoom: function (d) { const w = wc(); if (!w) { return; } const z = d === 'reset' ? 1 : Math.min(3, Math.max(0.5, Math.round((w.getZoomFactor() + d) * 10) / 10)); w.setZoomFactor(z); },
    minimize: function () { if (win) { win.minimize(); } },
    openInBrowser: function () { shell.openExternal(base.url); },
    devtools: function () { const w = wc(); if (w) { w.openDevTools({ mode: 'detach' }); } },
    openDataFolder: function () { shell.openPath(app.getPath('userData')); },
    about: function () {
      dialog.showMessageBox(win, { type: 'info', title: 'Informazioni', message: 'FBTECH Music Tech per Windows', buttons: ['OK'],
        detail: 'Versione ' + app.getVersion() + '\nElectron ' + process.versions.electron + ' · Chromium ' + process.versions.chrome + '\nSito: ' + base.url + ' (' + picked.source + ')\nDati dell\'app: ' + app.getPath('userData') + (picked.warnings.length ? '\n\nAvvisi: ' + picked.warnings.join('; ') : '') });
    },
    audioHelp: function () {
      dialog.showMessageBox(win, { type: 'info', title: 'Come scegliere la scheda audio', message: 'Qualsiasi scheda audio vista da Windows', buttons: ['OK'],
        detail: 'L\'app usa le schede audio che Windows riconosce (integrata, USB, Bluetooth, interfacce audio).\n\n1) Collega la scheda PRIMA di aprire l\'app (o dopo, poi scegli Visualizza > Ricarica).\n2) Nello Studio e nella Console DJ apri "Audio" (⚙) e scegli ingresso e uscita.\n3) Per cambiare la scheda predefinita di tutto il computer: menu Audio e MIDI > Impostazioni audio di Windows.\n4) Se il microfono non funziona: menu Audio e MIDI > Privacy del microfono, e controlla che le app desktop possano usarlo.' });
    }
  };
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuLib.buildTemplate(c)));
}

function start() {
  picked = config.pickBaseUrl({ argv: process.argv.slice(1), env: process.env, file: readJson(userFile('fbtech-config.json')) });
  base = config.withHosts(picked);
  offlineFile = path.join(__dirname, 'offline.html'); offlineUrl = pathToFileURL(offlineFile).toString();
  if (picked.warnings.length) { console.warn('[FBTECH] ' + picked.warnings.join(' | ')); }
  setupSession(); createWindow(); buildMenu();
  powerId = powerSaveBlocker.start('prevent-app-suspension');   /* il computer non si "addormenta" mentre suoni */
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', function () { if (win) { if (win.isMinimized()) { win.restore(); } win.focus(); } });
  app.on('window-all-closed', function () { if (powerId >= 0 && powerSaveBlocker.isStarted(powerId)) { powerSaveBlocker.stop(powerId); } app.quit(); });
  app.whenReady().then(start);
}
