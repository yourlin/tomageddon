// 当前输入方式：界面据此决定显示手柄按键（LB / A / B…）、键盘焦点框，还是触屏的箭头与纯文字按钮。
// 手柄有任何按键或摇杆动作即进入 pad；键盘按键进入 keys；触屏 / 鼠标点击回到 pointer。
export type InputMode = 'pointer' | 'keys' | 'pad';

let mode: InputMode = 'pointer';
const listeners = new Set<(m: InputMode) => void>();

export const inputMode = (): InputMode => mode;

export function setInputMode(next: InputMode): void {
  if (next === mode) return;
  mode = next;
  for (const fn of [...listeners]) fn(mode);
}

/** 订阅变化，返回取消订阅 */
export function onInputMode(fn: (m: InputMode) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof window !== 'undefined') {
  // 切回触屏要等这次点击结束后再通知：界面重建若发生在按下与抬起之间，这次点击会落空
  let pending = false;
  window.addEventListener('pointerdown', () => (pending = mode !== 'pointer'), true);
  window.addEventListener('pointerup', () => {
    if (!pending) return;
    pending = false;
    setTimeout(() => setInputMode('pointer'), 0);
  });
  window.addEventListener('keydown', (e) => {
    if (!e.repeat) setInputMode('keys');
  });
}
