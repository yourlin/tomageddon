// 战斗镜头：手机屏幕小，镜头拉近一些让角色更大。只改画面——
// 按「镜头内」判定的玩法（全屏技能等）用 gameplayView，仍是拉近前的视野，手机和电脑玩法一致。
import Phaser from 'phaser';

/** 手机（触屏且短边 < 500 CSS 像素）拉近 1.25 倍，其他设备不变 */
export const BATTLE_ZOOM: number = (() => {
  if (typeof window === 'undefined') return 1;
  const touch = !!window.matchMedia?.('(pointer: coarse)').matches;
  return touch && Math.min(window.innerWidth, window.innerHeight) < 500 ? 1.25 : 1;
})();

/** 玩法上的「镜头内」范围：以当前视野中心为准，还原到拉近前的大小 */
export function gameplayView(cam: Phaser.Cameras.Scene2D.Camera): Phaser.Geom.Rectangle {
  const v = cam.worldView;
  if (BATTLE_ZOOM === 1) return v;
  const w = v.width * BATTLE_ZOOM,
    h = v.height * BATTLE_ZOOM;
  return new Phaser.Geom.Rectangle(v.centerX - w / 2, v.centerY - h / 2, w, h);
}
