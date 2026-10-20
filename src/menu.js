'use strict';
/* FBTECH Music Tech per Windows - menu in italiano. E' solo una descrizione (nessun legame con Electron): ctx fornisce le azioni, cosi' si puo' provare. */
const PAGES = [
  { label: 'Studio multitraccia', path: 'crea/#studio', key: '1' },
  { label: 'Accordatore', path: 'crea/#accordatore', key: '2' },
  { label: 'Metronomo', path: 'crea/#metronomo', key: '3' },
  { label: 'Console DJ', path: 'dj/', key: '4' },
  { label: 'Laura, il tecnico virtuale', path: 'music-tech.html', key: '5' },
  { label: 'Banco virtuale', path: 'laboratorio/banco-virtuale/', key: '6' },
  { label: 'Il mio account', path: 'account/', key: '7' }
];

function buildTemplate(ctx) {
  return [
    { label: '&File', submenu: [
      { label: 'Home Music Tech', accelerator: 'CmdOrCtrl+H', click: function () { ctx.goto('music-tech.html'); } },
      { type: 'separator' },
      { label: 'Esci', accelerator: 'Alt+F4', click: function () { ctx.quit(); } }
    ] },
    { label: '&Vai a', submenu: PAGES.map(function (p) { return { label: p.label, accelerator: 'CmdOrCtrl+' + p.key, click: function () { ctx.goto(p.path); } }; }) },
    { label: '&Audio e MIDI', submenu: [
      { label: 'Impostazioni audio di Windows…', click: function () { ctx.openSystem('ms-settings:sound'); } },
      { label: 'Privacy del microfono in Windows…', click: function () { ctx.openSystem('ms-settings:privacy-microphone'); } },
      { type: 'separator' },
      { label: 'Come scegliere la scheda audio…', click: function () { ctx.audioHelp(); } }
    ] },
    { label: 'V&isualizza', submenu: [
      { label: 'Ricarica la pagina', accelerator: 'CmdOrCtrl+R', click: function () { ctx.reload(false); } },
      { label: 'Ricarica senza cache', accelerator: 'CmdOrCtrl+Shift+R', click: function () { ctx.reload(true); } },
      { type: 'separator' },
      { label: 'Schermo intero', accelerator: 'F11', click: function () { ctx.toggleFullscreen(); } },
      { label: 'Sempre in primo piano', type: 'checkbox', checked: !!ctx.isOnTop(), click: function () { ctx.toggleOnTop(); } },
      { type: 'separator' },
      { label: 'Ingrandisci', accelerator: 'CmdOrCtrl+=', click: function () { ctx.zoom(0.1); } },
      { label: 'Riduci', accelerator: 'CmdOrCtrl+-', click: function () { ctx.zoom(-0.1); } },
      { label: 'Dimensione normale', accelerator: 'CmdOrCtrl+0', click: function () { ctx.zoom('reset'); } }
    ] },
    { label: 'Fi&nestra', submenu: [
      { label: 'Riduci a icona', accelerator: 'CmdOrCtrl+M', click: function () { ctx.minimize(); } },
      { label: 'Chiudi', accelerator: 'CmdOrCtrl+W', click: function () { ctx.quit(); } }
    ] },
    { label: '&Aiuto', submenu: [
      { label: 'Apri il sito nel browser', click: function () { ctx.openInBrowser(); } },
      { label: 'Console di diagnostica (per l\'assistenza)', accelerator: 'CmdOrCtrl+Shift+I', click: function () { ctx.devtools(); } },
      { label: 'Apri la cartella dei dati dell\'app', click: function () { ctx.openDataFolder(); } },
      { type: 'separator' },
      { label: 'Informazioni su FBTECH Music Tech', click: function () { ctx.about(); } }
    ] }
  ];
}
module.exports = { buildTemplate, PAGES };
