// 帧率上限与帧数显示
import Phaser from 'phaser';
import { save } from './Save';

export const FPS_OPTIONS = [30, 60, 90, 120];

type Loop = Phaser.Core.TimeStep & { _limitRate: number; _target: number };

// Phaser 自带的 stepLimitFPS 用 `累计 delta >= 帧间隔` 判定且渲染后清零：
// rAF 时间戳的亚毫秒抖动会导致多跳一帧（120Hz 屏上限 120 实测只有 ~78，90 只有 60）。
// 这里改为按"下一帧计划时刻"调度，允许 1ms 提前量，长期平均帧率精确贴合上限。
let nextAt = 0;
function limitedStep(this: Loop, time: number): void {
  if (time < nextAt - 1) return;
  nextAt += this._limitRate;
  if (nextAt < time) nextAt = time + this._limitRate; // 卡顿后重新对齐，避免连帧追赶
  this.step(time);
}

/** 运行时修改帧率上限（需要重启 TimeStep 循环以重新绑定步进函数） */
export function applyFpsLimit(game: Phaser.Game, fps: number): void {
  const loop = game.loop as Loop;
  loop.stepLimitFPS = limitedStep;
  loop.fpsLimit = fps;
  loop.hasFpsLimit = fps > 0;
  loop._limitRate = fps > 0 ? 1000 / fps : 0;
  // 失焦/冷却时 Phaser 会把 delta 钳到 _target，低帧率下会变成慢动作，需与上限一致
  if (fps > 0) {
    loop.targetFps = fps;
    loop._target = 1000 / fps;
  }
  nextAt = 0;
  if (loop.running) {
    loop.sleep();
    loop.wake();
  }
}

let el: HTMLDivElement | null = null;
export let measuredFps = 0;
let timer = 0;
let frames = 0;
const countFrame = () => frames++;

/** 左下角帧数显示（DOM 覆盖层，不受场景切换影响） */
export function setFpsDisplay(game: Phaser.Game, on: boolean): void {
  if (!on) {
    el?.remove();
    el = null;
    clearInterval(timer);
    game.events.off('postrender', countFrame);
    return;
  }
  if (el) return;
  el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:6px;bottom:6px;z-index:20;padding:2px 8px;border-radius:6px;background:rgba(0,0,0,0.55);color:#9ef01a;font:bold 13px monospace;pointer-events:none;';
  document.body.appendChild(el);
  // 统计真实渲染帧
  frames = 0;
  let last = performance.now();
  game.events.on('postrender', countFrame);
  const upd = () => {
    if (!el) return;
    const now = performance.now();
    const f = (frames * 1000) / (now - last);
    frames = 0;
    last = now;
    measuredFps = f;
    el.textContent = `FPS ${Math.round(f)}`;
    el.style.color = f >= 55 ? '#9ef01a' : f >= 28 ? '#ffd166' : '#ff4d4d';
  };
  timer = window.setInterval(upd, 1000);
}

export function applyPerfSettings(game: Phaser.Game): void {
  applyFpsLimit(game, save.settings.fpsLimit);
  setFpsDisplay(game, save.settings.showFps);
}
