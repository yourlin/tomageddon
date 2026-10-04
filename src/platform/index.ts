// 平台适配层：游戏代码只通过这里访问存储、外链、全屏、成就等平台能力。
// - Web 版：localStorage、window.open、浏览器全屏
// - Steam 版（Electron）：预加载脚本注入的 window.tomaSteam；存档写进 userData 目录（原子写，Steam Auto-Cloud 同步）
// 构建时 VITE_PLATFORM=steam 决定用哪一套；ESLint 禁止平台层以外的游戏代码直接用 localStorage / window.open。

/** Electron 预加载脚本暴露的接口（见 electron/preload.cjs） */
export interface SteamBridge {
  /** 启动时同步读取全部存档键值 */
  storageLoad(): Record<string, string>;
  /** 写入（value 为 null 表示删除）；主进程负责原子写盘 */
  storageWrite(key: string, value: string | null): void;
  /** 退出前把未落盘的写入刷完 */
  storageFlush(): void;
  openExternal(url: string): void;
  setFullscreen(on: boolean): void;
  isFullscreen(): boolean;
  setWindowSize(w: number, h: number): void;
  unlockAchievement(id: string): void;
  /** Steam 是否初始化成功（未从 Steam 启动时为 false，成就与浮层不可用） */
  steamReady(): boolean;
  /** 窗口失焦、最小化、Steam 浮层打开时回调（用于自动暂停） */
  onShouldPause(cb: () => void): void;
  quit(): void;
}

declare global {
  interface Window {
    tomaSteam?: SteamBridge;
  }
}

export const IS_STEAM: boolean = import.meta.env.VITE_PLATFORM === 'steam';
const bridge = (): SteamBridge | undefined => (typeof window !== 'undefined' ? window.tomaSteam : undefined);

// ---------------- 存储 ----------------
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** Steam 版：启动时把磁盘上的存档一次性读进内存，之后读内存、写入异步落盘 */
function steamStorage(b: SteamBridge): KV {
  const cache = new Map<string, string>(Object.entries(b.storageLoad()));
  // 首次启动：把网页版（同一 Electron 实例里的 localStorage）里的旧存档导入新存储
  if (!cache.size) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !(k.startsWith('tomato_sister_') || k.startsWith('tomageddon_'))) continue;
        const v = localStorage.getItem(k);
        if (v !== null) {
          cache.set(k, v);
          b.storageWrite(k, v);
        }
      }
    } catch {
      /* 没有旧存档 */
    }
  }
  return {
    getItem: (k) => cache.get(k) ?? null,
    setItem: (k, v) => {
      if (cache.get(k) === v) return;
      cache.set(k, v);
      b.storageWrite(k, v);
    },
    removeItem: (k) => {
      if (!cache.has(k)) return;
      cache.delete(k);
      b.storageWrite(k, null);
    },
  };
}

const webStorage: KV = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* 隐私模式 */
    }
  },
};

const sb = IS_STEAM ? bridge() : undefined;
export const storage: KV = sb ? steamStorage(sb) : webStorage;

// ---------------- 外链 / 全屏 / 成就 ----------------
export function openExternal(url: string): void {
  const b = bridge();
  if (IS_STEAM && b) b.openExternal(url);
  else window.open(url, '_blank', 'noopener');
}

/** Steam 版用窗口级全屏（BrowserWindow.setFullScreen），返回切换后的状态；Web 版返回 null 交给 Phaser 处理 */
export function nativeToggleFullscreen(): boolean | null {
  const b = bridge();
  if (!IS_STEAM || !b) return null;
  const next = !b.isFullscreen();
  b.setFullscreen(next);
  return next;
}

export function setWindowSize(w: number, h: number): void {
  bridge()?.setWindowSize(w, h);
}

export function unlockPlatformAchievement(id: string): void {
  if (IS_STEAM) bridge()?.unlockAchievement(id);
}

export function onShouldPause(cb: () => void): void {
  if (IS_STEAM) bridge()?.onShouldPause(cb);
  // 两个平台都在页面隐藏 / 窗口失焦时暂停
  document.addEventListener('visibilitychange', () => document.hidden && cb());
  window.addEventListener('blur', cb);
}

export const steamReady = (): boolean => !!(IS_STEAM && bridge()?.steamReady());

/** Steam 版不显示捐赠入口（Steam 政策不允许站外付款引导） */
export const SHOW_DONATE = !IS_STEAM;
/** Steam 版是桌面窗口：不需要「请旋转屏幕」、首次触摸自动全屏 */
export const IS_DESKTOP_APP = IS_STEAM;

export function quitApp(): void {
  bridge()?.storageFlush();
  bridge()?.quit();
}
