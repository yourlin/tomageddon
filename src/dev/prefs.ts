// 开发者界面的本地偏好：面板宽度、停靠方向、密度、快捷键、页签筛选状态。
// 只存在 localStorage（与玩家存档无关），刷新页面后保留。
import type { UiState } from './ctx';

export type KeyAction =
  'charPrev' | 'charNext' | 'monPrev' | 'monNext' | 'palette' | 'help' | 'undo' | 'redo' | 'pause' | 'frame' | 'snapshot' | 'restore';

/** 快捷键用 KeyboardEvent.code 表示；带 Ctrl 的写成 `Ctrl+KeyK` */
export const KEY_LABEL: Record<KeyAction, string> = {
  charPrev: '上一个角色',
  charNext: '下一个角色',
  monPrev: '上一个怪物',
  monNext: '下一个怪物',
  palette: '命令面板',
  help: '快捷键列表',
  undo: '撤销构筑改动',
  redo: '重做构筑改动',
  pause: '暂停 / 继续沙盒',
  frame: '单步前进（暂停时）',
  snapshot: '保存沙盒快照',
  restore: '恢复最近快照',
};

export const DEFAULT_KEYS: Record<KeyAction, string> = {
  charPrev: 'BracketLeft',
  charNext: 'BracketRight',
  monPrev: 'Comma',
  monNext: 'Period',
  palette: 'Ctrl+KeyK',
  help: 'Shift+Slash',
  undo: 'Ctrl+KeyZ',
  redo: 'Ctrl+KeyY',
  pause: 'Backquote',
  frame: 'Backslash',
  snapshot: 'F6',
  restore: 'F7',
};

export interface DevPrefs {
  w: number;
  side: 'right' | 'left';
  compact: boolean;
  keys: Record<KeyAction, string>;
  /** 页签与筛选状态（不含货架等临时对象） */
  ui?: Partial<UiState>;
  scroll?: number;
}

const KEY = 'tomageddon_dev_prefs';

export const prefs: DevPrefs = load();

function load(): DevPrefs {
  const d: DevPrefs = { w: 560, side: 'right', compact: false, keys: { ...DEFAULT_KEYS } };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DevPrefs>;
    return { ...d, ...raw, keys: { ...DEFAULT_KEYS, ...(raw.keys ?? {}) } };
  } catch {
    return d;
  }
}

let timer = 0;
/** 合并写盘（拖动宽度、频繁重绘时不必每次都写） */
export function savePrefs(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* 忽略 */
    }
  }, 200);
}

/** 记住页签状态：去掉货架（含函数无关的大对象，且每次应重新生成） */
export function rememberUi(ui: UiState, scroll: number): void {
  const { shelf: _shelf, ...rest } = ui;
  prefs.ui = JSON.parse(JSON.stringify(rest)) as Partial<UiState>;
  prefs.scroll = scroll;
  savePrefs();
}

/** 把事件转成与 prefs.keys 相同的写法 */
export function keyOf(e: KeyboardEvent): string {
  return (e.ctrlKey || e.metaKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + e.code;
}

export function keyText(k: string): string {
  return k
    .replace(/Key([A-Z])/, '$1')
    .replace(/Digit(\d)/, '$1')
    .replace('BracketLeft', '[')
    .replace('BracketRight', ']')
    .replace('Comma', ',')
    .replace('Period', '.')
    .replace('Slash', '/')
    .replace('Backslash', '\\')
    .replace('Backquote', '`');
}
