// 全屏：支持时进入全屏并锁定横屏；不支持的环境（iPhone Safari、iPhone 微信等）弹出操作指引
import Phaser from 'phaser';
import { tx } from '../i18n';
import { overlayRoot } from './ForceLandscape';
import { nativeToggleFullscreen } from '../platform';

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const IS_WECHAT = /MicroMessenger/i.test(ua);
export const IS_IOS =
  /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
export const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
/** 从主屏幕图标启动（PWA 独立窗口），本身就是全屏 */
const IS_STANDALONE =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

type FsDoc = Document & { webkitFullscreenEnabled?: boolean };
export const fullscreenSupported = (): boolean => !!(document.fullscreenEnabled || (document as FsDoc).webkitFullscreenEnabled);

/** 切换全屏；返回是否进入了全屏流程（false 表示已显示指引） */
let lastToggle = 0;

export function toggleFullscreen(scene: Phaser.Scene): boolean {
  // 同一次点击可能同时触发按钮与“首次触摸自动全屏”，短时间内只处理一次
  const now = performance.now();
  if (now - lastToggle < 600) return true;
  lastToggle = now;
  // Steam 版：窗口级全屏
  if (nativeToggleFullscreen() !== null) return true;
  const sm = scene.scale;
  if (sm.isFullscreen) {
    sm.stopFullscreen();
    return true;
  }
  if (IS_STANDALONE) return true;
  if (!fullscreenSupported()) {
    showGuide();
    return false;
  }
  // 部分内置浏览器声明支持但实际失败：监听失败事件后改为显示指引
  sm.once(Phaser.Scale.Events.FULLSCREEN_FAILED, showGuide);
  sm.once(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, showGuide);
  sm.startFullscreen();
  const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  o?.lock?.('landscape').catch(() => {});
  return true;
}

/** 手机上首次触摸时自动尝试全屏（浏览器要求必须由用户操作触发）；不支持时不打扰 */
export function autoFullscreenOnFirstTouch(game: Phaser.Game): void {
  if (!IS_TOUCH || IS_STANDALONE || !fullscreenSupported()) return;
  const once = () => {
    window.removeEventListener('pointerup', once, true);
    const scene = game.scene.getScenes(true)[0];
    if (scene && !scene.scale.isFullscreen) toggleFullscreen(scene);
  };
  window.addEventListener('pointerup', once, true);
}

// ---------------- 无法全屏时的指引 ----------------
let guide: HTMLDivElement | null = null;

function showGuide(): void {
  if (guide) return;
  const steps = IS_WECHAT
    ? tx(
        '微信内置浏览器不支持全屏。<br>点击右上角 <b>「···」</b>，选择 <b>「在浏览器打开」</b>，即可全屏游玩。',
        'WeChat’s built-in browser can’t go fullscreen.<br>Tap <b>“···”</b> at the top right and choose <b>“Open in Browser”</b>.',
      )
    : IS_IOS
      ? tx(
          'iPhone 浏览器不支持网页全屏。<br>点击 Safari 底部的 <b>分享按钮</b> → <b>「添加到主屏幕」</b>，<br>从桌面图标启动即为全屏。',
          'iPhone browsers can’t make web pages fullscreen.<br>Tap Safari’s <b>Share</b> button → <b>“Add to Home Screen”</b>,<br>then launch from the home-screen icon for fullscreen.',
        )
      : tx('当前浏览器不支持全屏，请换用 Chrome 等浏览器打开。', 'This browser doesn’t support fullscreen. Try Chrome or another browser.');
  guide = document.createElement('div');
  guide.style.cssText =
    'position:fixed;inset:0;z-index:40;background:rgba(10,4,6,0.82);display:flex;align-items:center;justify-content:center;' +
    'font:17px/1.7 "PingFang SC","Microsoft YaHei",sans-serif;color:#fff4ea;text-align:center;';
  guide.innerHTML =
    (IS_WECHAT ? '<div style="position:absolute;top:8px;right:22px;font-size:44px;color:#ffd166">⤴</div>' : '') +
    `<div style="max-width:560px;padding:22px 28px;border-radius:16px;background:#2b1418;border:2px solid #ffd166">` +
    `<div style="font-size:22px;color:#ffd166;margin-bottom:8px">${tx('全屏游玩', 'Play fullscreen')}</div>${steps}` +
    `<div style="margin-top:14px;opacity:.6;font-size:14px">${tx('点击任意位置关闭', 'Tap anywhere to close')}</div></div>`;
  guide.addEventListener('pointerup', () => {
    guide?.remove();
    guide = null;
  });
  overlayRoot().appendChild(guide);
}
