// 强制横屏：手机竖屏时（含微信等无法锁定屏幕方向的浏览器）把游戏容器旋转 90° 铺满屏幕，
// 并修正 Phaser 的尺寸计算与触摸坐标。手机真正横过来时自动恢复正常显示。
import Phaser from 'phaser';
import { RES } from './HiDpi';

const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
let rotated = false;

/** 当前是否处于强制横屏（画面旋转）状态 */
export const isRotated = (): boolean => rotated;

export { overlayRoot } from './OverlayRoot';

type ScaleInternals = Phaser.Scale.ScaleManager & { parentSize: Phaser.Structs.Size; parent: HTMLElement };
type InputInternals = Phaser.Input.InputManager & {
  transformPointer(pointer: Phaser.Input.Pointer, pageX: number, pageY: number, wasMove: boolean): void;
};

export function installForceLandscape(game: Phaser.Game): void {
  const stage = document.getElementById('stage');
  const root = document.getElementById('game');
  if (!stage || !root) return;
  const sm = game.scale as ScaleInternals;

  const apply = () => {
    const W = stage.clientWidth,
      H = stage.clientHeight;
    rotated = IS_TOUCH && H > W;
    // 顺时针旋转 90°：容器宽高互换，左上角移到屏幕右上角
    root.style.cssText = rotated
      ? `position:absolute;left:${W}px;top:0;width:${H}px;height:${W}px;transform-origin:0 0;transform:rotate(90deg);`
      : 'position:absolute;left:0;top:0;width:100%;height:100%;';
    sm.refresh();
  };

  // Phaser 用 getBoundingClientRect 取父容器尺寸，旋转后宽高会互换；改用不受变换影响的布局尺寸
  sm.getParentBounds = function (this: ScaleInternals): boolean {
    const w = this.parent.clientWidth,
      h = this.parent.clientHeight;
    if (this.parentSize.width === w && this.parentSize.height === h) return false;
    this.parentSize.setSize(w, h);
    return true;
  };

  // 触摸坐标：屏幕点 (x, y) 对应旋转容器内的 (y, 屏幕宽 − x)
  const im = game.input as InputInternals;
  const orig = im.transformPointer.bind(im);
  im.transformPointer = (pointer, pageX, pageY, wasMove) => {
    if (!rotated) return orig(pointer, pageX, pageY, wasMove);
    const u = pageY,
      v = stage.clientWidth - pageX;
    // 高清渲染：sm.width/height 是物理像素，指针要给游戏代码逻辑坐标（与 HiDpi 的 transformPointer 补丁一致）
    const x = (u * sm.width) / root.clientWidth / RES,
      y = (v * sm.height) / root.clientHeight / RES;
    const p0 = pointer.position,
      p1 = pointer.prevPosition;
    p1.x = p0.x;
    p1.y = p0.y;
    const a = pointer.smoothFactor;
    p0.x = !wasMove || a === 0 ? x : x * a + p1.x * (1 - a);
    p0.y = !wasMove || a === 0 ? y : y * a + p1.y * (1 - a);
  };

  const later = () => setTimeout(apply, 60);
  window.addEventListener('resize', later);
  window.addEventListener('orientationchange', later);
  document.addEventListener('fullscreenchange', later);
  apply();
}
