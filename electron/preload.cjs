// Steam 版预加载脚本：只暴露游戏需要的最小接口（window.tomaSteam），不把 Node / ipcRenderer 整个交给页面
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const pauseCbs = [];
ipcRenderer.on('toma:pause', () => {
  for (const cb of pauseCbs) {
    try {
      cb();
    } catch {
      /* 页面回调出错不影响其他回调 */
    }
  }
});

contextBridge.exposeInMainWorld('tomaSteam', {
  storageLoad: () => ipcRenderer.sendSync('toma:storage-load'),
  storageWrite: (k, v) => ipcRenderer.send('toma:storage-write', String(k), v === null ? null : String(v)),
  storageFlush: () => ipcRenderer.sendSync('toma:storage-flush'),
  openExternal: (url) => ipcRenderer.send('toma:open-external', String(url)),
  setFullscreen: (on) => ipcRenderer.send('toma:set-fullscreen', !!on),
  isFullscreen: () => ipcRenderer.sendSync('toma:is-fullscreen'),
  setWindowSize: (w, h) => ipcRenderer.send('toma:set-size', Number(w), Number(h)),
  unlockAchievement: (id) => ipcRenderer.send('toma:achievement', String(id)),
  steamReady: () => ipcRenderer.sendSync('toma:steam-ready'),
  onShouldPause: (cb) => {
    if (typeof cb === 'function') pauseCbs.push(cb);
  },
  quit: () => ipcRenderer.send('toma:quit'),
});
