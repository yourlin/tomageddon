// Steam 版（Electron）主进程：创建窗口、存档文件读写（原子写）、Steamworks（成就、浮层、正在游玩）
// 开发调试：npm run steam:dev（不从 Steam 启动时 Steamworks 初始化失败，游戏照常运行，成就只是不上报）
'use strict';
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

/** Steamworks App ID：在 Steamworks 后台创建应用后填入（也可在 steam_appid.txt 里配置；480 为 Valve 测试用 Spacewar） */
const APP_ID = Number(process.env.STEAM_APP_ID || readAppId() || 480);
function readAppId() {
  try {
    return fs.readFileSync(path.join(app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname, 'steam_appid.txt'), 'utf8').trim();
  } catch {
    return '';
  }
}

// ---------------- Steamworks ----------------
let steam = null;
try {
  const sw = require('steamworks.js');
  steam = sw.init(APP_ID);
  // 让 Steam 浮层（Shift+Tab）能盖在 Electron 窗口上：必须在 app ready 之前调用
  sw.electronEnableSteamOverlay();
} catch (e) {
  console.warn('[steam] Steamworks 未初始化（未从 Steam 启动或缺少 steamworks.js）：', e && e.message);
  steam = null;
}

// ---------------- 存档：userData/saves/<key>.json ----------------
// Steam Auto-Cloud 在后台配置为同步 %AppData%/Tomageddon/saves/*.json（见 docs/steam/STEAM.md）
const saveDir = () => path.join(app.getPath('userData'), 'saves');
const keyFile = (k) => path.join(saveDir(), encodeURIComponent(k) + '.json');
const pending = new Map();
let flushTimer = null;

function loadAll() {
  const out = {};
  try {
    fs.mkdirSync(saveDir(), { recursive: true });
    for (const f of fs.readdirSync(saveDir())) {
      if (!f.endsWith('.json')) continue;
      try {
        out[decodeURIComponent(f.slice(0, -5))] = fs.readFileSync(path.join(saveDir(), f), 'utf8');
      } catch {
        /* 单个文件损坏时跳过 */
      }
    }
  } catch (e) {
    console.error('[save] 读取失败', e);
  }
  return out;
}

/** 原子写：先写临时文件再 rename，断电或崩溃时不会留下半截存档 */
function writeNow(k, v) {
  const f = keyFile(k);
  if (v === null) {
    fs.rmSync(f, { force: true });
    return;
  }
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, v, 'utf8');
  fs.renameSync(tmp, f);
}
function flush() {
  clearTimeout(flushTimer);
  flushTimer = null;
  for (const [k, v] of pending) {
    try {
      writeNow(k, v);
    } catch (e) {
      console.error('[save] 写入失败', k, e);
    }
  }
  pending.clear();
}

// ---------------- 窗口 ----------------
let win = null;
function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#1a0a0c',
    title: 'Tomageddon',
    // 默认全屏启动；F11 / Alt+Enter 或游戏内全屏按钮可切回窗口（窗口模式用上面的 1600×900）
    fullscreen: true,
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  const dist = app.isPackaged ? path.join(process.resourcesPath, 'app', 'dist-steam') : path.join(__dirname, '..', 'dist-steam');
  void win.loadFile(path.join(dist, 'index.html'));
  // 冒烟测试（TOMA_SMOKE=输出 png 路径）：加载完成 5 秒后截图并退出，用于 CI / 本地自检
  if (process.env.TOMA_SMOKE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          fs.writeFileSync(process.env.TOMA_SMOKE, img.toPNG());
          const info = await win.webContents.executeJavaScript(
            'window.tomaSteam.storageWrite("tomageddon_smoke", "{\\"ok\\":1}"), JSON.stringify({ steam: !!window.tomaSteam, ready: window.tomaSteam && window.tomaSteam.steamReady(), canvas: !!document.querySelector("canvas"), backing: (c => c && [c.width, c.height, Math.round(c.clientWidth * devicePixelRatio), Math.round(c.clientHeight * devicePixelRatio)])(document.querySelector("canvas")), devGlobals: typeof window.run !== "undefined" || typeof window.__dev !== "undefined" })',
          );
          await new Promise((r) => setTimeout(r, 500));
          console.log('[smoke]', info);
        } catch (e) {
          console.error('[smoke] 失败', e);
        }
        flush();
        app.quit();
      }, 5000);
    });
  }
  // 游戏内所有外链都用系统浏览器打开，不在游戏窗口里跳转
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file:')) {
      e.preventDefault();
      if (/^https?:/.test(url)) void shell.openExternal(url);
    }
  });
  const pause = () => win && !win.isDestroyed() && win.webContents.send('toma:pause');
  win.on('blur', pause);
  win.on('minimize', pause);
  win.on('close', flush);
  // F11 / Alt+Enter 切换全屏
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
  });
}

// Steam 浮层打开时暂停游戏
if (steam) {
  try {
    steam.callback.register(steam.callback.SteamCallback.GameOverlayActivated, (ev) => {
      if (ev && ev.active && win) win.webContents.send('toma:pause');
    });
  } catch {
    /* 旧版本 steamworks.js 没有这个回调 */
  }
}

// ---------------- IPC ----------------
ipcMain.on('toma:storage-load', (e) => (e.returnValue = loadAll()));
ipcMain.on('toma:storage-write', (_e, k, v) => {
  pending.set(k, v);
  if (!flushTimer) flushTimer = setTimeout(flush, 300);
});
ipcMain.on('toma:storage-flush', (e) => {
  flush();
  e.returnValue = true;
});
ipcMain.on('toma:open-external', (_e, url) => {
  if (typeof url === 'string' && /^https?:/.test(url)) void shell.openExternal(url);
});
ipcMain.on('toma:set-fullscreen', (_e, on) => win && win.setFullScreen(!!on));
ipcMain.on('toma:is-fullscreen', (e) => (e.returnValue = !!(win && win.isFullScreen())));
ipcMain.on('toma:set-size', (_e, w, h) => {
  if (!win || win.isFullScreen()) return;
  win.setContentSize(Math.max(960, w | 0), Math.max(540, h | 0));
  win.center();
});
ipcMain.on('toma:steam-ready', (e) => (e.returnValue = !!steam));
ipcMain.on('toma:achievement', (_e, id) => {
  if (!steam || typeof id !== 'string') return;
  try {
    if (!steam.achievement.isActivated(id)) steam.achievement.activate(id);
  } catch (err) {
    console.warn('[steam] 成就上报失败', id, err && err.message);
  }
});
ipcMain.on('toma:quit', () => {
  flush();
  app.quit();
});

app.whenReady().then(createWindow);
app.on('before-quit', flush);
app.on('window-all-closed', () => {
  flush();
  app.quit();
});
