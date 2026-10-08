// 通用 UI 组件：按钮、面板、文字
import Phaser from 'phaser';
import { FONT } from '../systems/Textures';
import { audio } from '../systems/Audio';
import { VW, VH } from '../systems/HiDpi';
import { IS_TOUCH } from '../systems/Fullscreen';

/**
 * 触屏界面放大：手机横屏只有约 390 CSS 像素高，720p 的界面会缩到约 0.54 倍，按钮和文字都太小。
 * 触屏设备上（或地址带 ?touchui，方便在电脑上调试）常用界面的字号与按钮放大 TOUCH_UI 倍，可点击区域扩大到约 44pt。
 */
export const TOUCH = IS_TOUCH || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('touchui'));
export const TOUCH_UI = TOUCH ? 1.25 : 1;
/** 触屏时放大的尺寸（字号、按钮高度等） */
export const tu = (n: number): number => Math.round(n * TOUCH_UI);

/** 触屏时把可点击区域扩大到约 44pt（每边最多 14 个逻辑像素，避免和相邻按钮的点击范围抢位）；返回每边扩出的量 */
function touchPad(scene: Phaser.Scene, w: number, h: number): { x: number; y: number } {
  if (!TOUCH) return { x: 0, y: 0 };
  const cssPerUnit = (scene.game.canvas?.clientHeight || VH(scene)) / VH(scene);
  const min = 44 / Math.max(0.1, cssPerUnit);
  const pad = (v: number) => Math.min(14, Math.max(0, (min - v) / 2));
  return { x: pad(w), y: pad(h) };
}

export const COLORS = {
  bg: 0x1a0a0c,
  panel: 0x2b1418,
  panelLight: 0x3d1d22,
  border: 0x7a2e35,
  primary: 0xff4b3e,
  primaryDark: 0xb3261e,
  gold: 0xffd166,
  green: 0x52b788,
  gray: 0x555555,
  text: '#fff4ea',
  textDim: '#c9a9a6',
};

export function text(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  size = 24,
  color = COLORS.text,
  opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    stroke: '#1a0a0c',
    strokeThickness: Math.max(2, size / 7),
    ...opts,
  });
}

export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  color = COLORS.panel,
  border = COLORS.border,
  alpha = 0.95,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(color, alpha).fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(3, border, 1).strokeRoundedRect(x, y, w, h, 16);
  return g;
}

export interface Button extends Phaser.GameObjects.Container {
  setEnabled(v: boolean): Button;
  setLabel(s: string): Button;
  label: Phaser.GameObjects.Text;
}

/** 按钮标签里代表番茄籽（货币）的符号，渲染时换成番茄籽贴图 */
export const SEED = '🌱';

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  color = COLORS.primary,
  size = 24,
): Button {
  const c = scene.add.container(x, y) as Button;
  const bg = scene.add.graphics();
  let enabled = true;
  const draw = (pressed = false) => {
    bg.clear();
    const col = enabled ? color : COLORS.gray;
    bg.fillStyle(Phaser.Display.Color.ValueToColor(col).darken(30).color, 1).fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 14);
    bg.fillStyle(col, 1).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 3 : 0), w, h - 3, 14);
    bg.lineStyle(2, 0xffffff, 0.25).strokeRoundedRect(-w / 2 + 3, -h / 2 + 3 + (pressed ? 3 : 0), w - 6, h - 9, 11);
  };
  draw();
  // 标签里的 🌱 画成番茄籽贴图（与顶栏的番茄籽图标一致），文字拆成「前 + 图标 + 后」居中排列。
  // label 保留一个隐藏的完整文字对象：测试机器人 / 录制脚本按 label.text 找按钮
  const t = text(scene, 0, -2, '', size).setOrigin(0, 0.5);
  const t2 = text(scene, 0, -2, '', size).setOrigin(0, 0.5);
  const icon = scene.add.image(0, -2, 'ui_seed_icon').setVisible(false);
  const full = text(scene, 0, -2, label, size).setOrigin(0.5).setVisible(false);
  const parts = [t, icon, t2];
  let offY = -2;
  const layout = (s: string) => {
    full.setText(s);
    const i = s.indexOf(SEED);
    const seed = i >= 0 && scene.textures.exists('ui_seed_icon');
    t.setText(seed ? s.slice(0, i).trimEnd() : s);
    t2.setText(seed ? s.slice(i + SEED.length).trimStart() : '');
    icon.setVisible(seed);
    const iw = seed ? Math.round(size * 1.05) : 0;
    if (seed) icon.setDisplaySize(iw, iw);
    const gap = Math.round(size * 0.2);
    const items: [Phaser.GameObjects.Text | Phaser.GameObjects.Image, number][] = [];
    if (t.text) items.push([t, t.width]);
    if (seed) items.push([icon, iw]);
    if (t2.text) items.push([t2, t2.width]);
    const total = items.reduce((a, [, wd]) => a + wd, 0) + gap * Math.max(0, items.length - 1);
    let x = -total / 2;
    for (const [o, wd] of items) {
      o.x = o === icon ? x + wd / 2 : x;
      x += wd + gap;
    }
  };
  layout(label);
  c.add([bg, ...parts, full]);
  c.label = full;
  const setY = (y: number) => {
    offY = y;
    for (const o of parts) o.y = y;
  };
  c.setSize(w, h);
  // 触屏：可点击区域比画出来的按钮大一圈（容器的命中坐标以左上角为 0）
  const pad = touchPad(scene, w, h);
  c.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(-pad.x, -pad.y, w + pad.x * 2, h + pad.y * 2),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  // 只有「按下」也发生在这个按钮上才算点击：弹窗刷新、换场景后，新按钮刚好出现在指针下时，
  // 上一次点击的「松开」不会误触它（例如合成后弹窗重排，误点到「卖」）
  let pressed = false;
  c.on('pointerdown', () => {
    pressed = true;
    if (enabled) {
      draw(true);
      setY(1);
    }
  });
  c.on('pointerout', () => {
    pressed = false;
    draw();
    setY(-2);
  });
  c.on('pointerup', (p?: Phaser.Input.Pointer) => {
    draw();
    setY(-2);
    // 测试 / 录制脚本直接 emit('pointerup')，没有 pointer 参数，照常触发
    const real = !!p;
    if (real && !pressed) return;
    pressed = false;
    if (!enabled) return;
    audio.play(scene, 'click');
    onClick();
  });
  c.setEnabled = (v: boolean) => {
    enabled = v;
    draw();
    for (const o of parts) o.setAlpha(v ? 1 : 0.6);
    return c;
  };
  c.setLabel = (s: string) => {
    layout(s);
    setY(offY);
    return c;
  };
  return c;
}

/**
 * 负向属性行：含「−5」「-5%」这样的负数，且没有「+5」之类的正向数值（如「−1 护甲」「远程伤害 −50%」）；
 * 正负都有的行（组合效果等）保持原色
 */
export const NEG_LINE = { test: (s: string): boolean => /(^|[\s·•(（：:])[−-]\s?\d/.test(s) && !/\+\s?\d/.test(s) };
export const NEG_COLOR = '#ff6b6b';

/**
 * 多行说明逐行上色：负向属性行用红色，其余用 color。每行单独换行，返回容器与总高度。
 * （Phaser 的 Text 只能整段一个颜色，所以拆成多个 Text 竖排）
 */
export function statLines(
  scene: Phaser.Scene,
  x: number,
  y: number,
  lines: string[],
  size: number,
  color: string,
  wrapWidth: number,
  lineGap = 1,
): { box: Phaser.GameObjects.Container; height: number } {
  const box = scene.add.container(x, y);
  let h = 0;
  for (const line of lines) {
    const t = text(scene, 0, h, line, size, NEG_LINE.test(line) ? NEG_COLOR : color, {
      wordWrap: { width: wrapWidth, useAdvancedWrap: true },
    });
    box.add(t);
    h += t.height + lineGap;
  }
  return { box, height: Math.max(0, h - lineGap) };
}

/** 可点击的卡片区域 */
export function hitArea(scene: Phaser.Scene, x: number, y: number, w: number, h: number, onClick: () => void): Phaser.GameObjects.Zone {
  const pad = touchPad(scene, w, h);
  const z = scene.add
    .zone(x, y, w, h)
    .setOrigin(0)
    .setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-pad.x, -pad.y, w + pad.x * 2, h + pad.y * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
  // 与 button 一样：按下与松开都在这块区域上才触发，避免刷新后误触
  let pressed = false;
  z.on('pointerdown', () => (pressed = true));
  z.on('pointerout', () => (pressed = false));
  z.on('pointerup', (p?: Phaser.Input.Pointer) => {
    if (p && !pressed) return;
    pressed = false;
    audio.play(scene, 'click');
    onClick();
  });
  return z;
}

/** 让图片按最长边适配到 size */
export function fitImage(img: Phaser.GameObjects.Image, size: number): Phaser.GameObjects.Image {
  const s = size / Math.max(img.width, img.height);
  img.setScale(s);
  return img;
}

/** 屏幕中间飘字提示 */
export function toast(scene: Phaser.Scene, msg: string, color = COLORS.text): void {
  const t = text(scene, VW(scene) / 2, VH(scene) * 0.3, msg, 30, color)
    .setOrigin(0.5)
    .setDepth(1000);
  scene.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 1400, ease: 'Cubic.easeIn', onComplete: () => t.destroy() });
}

/** 画布尺寸变化（旋转屏幕/窗口缩放）时重建场景布局 */
export function autoRelayout(scene: Phaser.Scene, data?: object): void {
  let timer: Phaser.Time.TimerEvent | null = null;
  const onResize = () => {
    timer?.remove();
    timer = scene.time.delayedCall(120, () => scene.scene.restart(data));
  };
  scene.scale.on('resize', onResize);
  scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
}
