'use strict';
/* FINTO Electron: imita le funzioni che main.js usa (come le ricordo dalla documentazione), cosi' main.js si puo' far girare e osservare senza Windows. */
const EventEmitter = require('events'); const os = require('os'); const path = require('path'); const fs = require('fs');
function makeFake(opts) {
  opts = opts || {};
  const userData = opts.userData || fs.mkdtempSync(path.join(os.tmpdir(), 'fbapp-'));
  const log = { openExternal: [], openPath: [], loadURL: [], loadFile: [], dialogs: [], switches: [], blocker: [], windows: [], reloads: 0, hardReloads: 0, devtools: [], quit: 0, appId: '', menu: null, req: null, chk: null, userData: userData };
  class WC extends EventEmitter {
    constructor() { super(); this.zoom = 1; this.url = ''; this.openHandler = null; }
    loadURL(u) { log.loadURL.push(u); this.url = u; return Promise.resolve(); }
    loadFile(f, o) { log.loadFile.push([f, o]); this.url = 'file:///' + f.replace(/\\/g, '/') + '?url=' + encodeURIComponent(o && o.query && o.query.url || ''); return Promise.resolve(); }
    setWindowOpenHandler(h) { this.openHandler = h; } setZoomFactor(z) { this.zoom = z; } getZoomFactor() { return this.zoom; } getURL() { return this.url; }
    reload() { log.reloads++; } reloadIgnoringCache() { log.hardReloads++; } openDevTools(o) { log.devtools.push(o); }
  }
  class BW extends EventEmitter {
    constructor(o) { super(); this.opts = o; this.webContents = new WC(); this._max = !!opts.startMax; log.windows.push(this); }
    show() { this.shown = true; } maximize() { this._max = true; } isMaximized() { return this._max; } getNormalBounds() { return { x: 40, y: 30, width: 1100, height: 720 }; }
    isDestroyed() { return !!this.destroyed; } isMinimized() { return false; } restore() { this.restored = true; } focus() { this.focused = true; } minimize() { this.minimized = true; }
    setFullScreen(v) { this.fs = v; } isFullScreen() { return !!this.fs; } setAlwaysOnTop(v) { this.top = v; }
  }
  const app = Object.assign(new EventEmitter(), {
    whenReady: function () { return Promise.resolve(); }, setAppUserModelId: function (i) { log.appId = i; }, commandLine: { appendSwitch: function (k, v) { log.switches.push([k, v]); } },
    getPath: function () { return userData; }, getVersion: function () { return '1.0.0'; }, requestSingleInstanceLock: function () { return opts.lock !== false; }, quit: function () { log.quit++; }
  });
  const electron = {
    app: app, BrowserWindow: BW,
    Menu: { setApplicationMenu: function (m) { log.menu = m; }, buildFromTemplate: function (t) { return t; } },
    shell: { openExternal: function (u) { log.openExternal.push(u); return Promise.resolve(); }, openPath: function (p) { log.openPath.push(p); return Promise.resolve(''); } },
    session: { defaultSession: { setPermissionRequestHandler: function (h) { log.req = h; }, setPermissionCheckHandler: function (h) { log.chk = h; } } },
    dialog: { showMessageBox: function (w, o) { log.dialogs.push(o); return Promise.resolve({ response: 0 }); } },
    powerSaveBlocker: { start: function (t) { log.blocker.push(['start', t]); return 7; }, stop: function (i) { log.blocker.push(['stop', i]); }, isStarted: function () { return true; } },
    screen: { getAllDisplays: function () { return opts.displays || [{ workArea: { x: 0, y: 0, width: 1920, height: 1040 } }]; } }
  };
  return { electron: electron, log: log };
}
module.exports = { makeFake };
