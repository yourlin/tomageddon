// HUD（虚拟摇杆/技能按钮）与游戏场景之间共享的输入状态
export const controls = {
  joyX: 0,
  joyY: 0,
  skillPressed: false,
  pausePressed: false,
  reset(): void {
    this.joyX = 0;
    this.joyY = 0;
    this.skillPressed = false;
    this.pausePressed = false;
  },
};

/** L3：手柄。左摇杆 / 十字键移动，A(0) / X(2) / RB(5) 释放技能，Start(9) 暂停。
 *  直接读 navigator.getGamepads()（不依赖 Phaser 的手柄插件）；按键只在按下的那一帧触发。 */
export interface PadState {
  x: number;
  y: number;
  skill: boolean;
  pause: boolean;
  connected: boolean;
}
const prev: Record<number, boolean> = {};
const DEAD = 0.22;

export function readPad(): PadState {
  const out: PadState = { x: 0, y: 0, skill: false, pause: false, connected: false };
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p || !p.connected) continue;
    out.connected = true;
    const ax = p.axes[0] ?? 0;
    const ay = p.axes[1] ?? 0;
    const mag = Math.hypot(ax, ay);
    if (mag > DEAD) {
      const k = Math.min(1, (mag - DEAD) / (1 - DEAD)) / mag;
      out.x = ax * k;
      out.y = ay * k;
    }
    const b = (i: number) => !!p.buttons[i]?.pressed;
    if (b(14)) out.x = -1;
    if (b(15)) out.x = 1;
    if (b(12)) out.y = -1;
    if (b(13)) out.y = 1;
    const edge = (i: number) => {
      const key = p.index * 100 + i;
      const now = b(i);
      const hit = now && !prev[key];
      prev[key] = now;
      return hit;
    };
    if (edge(0) || edge(2) || edge(5)) out.skill = true;
    if (edge(9)) out.pause = true;
    break;
  }
  return out;
}

/** 手柄震动：和屏幕震动同步触发。intensity 沿用屏幕震动的强度（0.006~0.02），换算成马达强度；
 *  上一次震动还没结束时，只有更强的才会打断，避免连续小震动把手柄一直占着。 */
let rumbleUntil = 0;
let rumbleMag = 0;
export function rumble(intensity: number, durMs: number): void {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
  const now = performance.now();
  const mag = Math.min(1, intensity * 40);
  if (mag <= 0 || (now < rumbleUntil && mag <= rumbleMag)) return;
  for (const p of navigator.getGamepads()) {
    const act = (p as (Gamepad & { vibrationActuator?: { playEffect?: (t: string, o: object) => Promise<unknown> } }) | null)
      ?.vibrationActuator;
    if (!p?.connected || !act?.playEffect) continue;
    rumbleUntil = now + durMs;
    rumbleMag = mag;
    void act
      .playEffect('dual-rumble', { startDelay: 0, duration: Math.min(durMs, 1000), weakMagnitude: mag * 0.6, strongMagnitude: mag })
      ?.catch?.(() => {});
  }
}

/** 当前是否接着手柄（不读按键，不影响边沿检测） */
export function padConnected(): boolean {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return false;
  return [...navigator.getGamepads()].some((p) => p?.connected);
}
