// 通用 UI 组件：按钮、面板、文字
import Phaser from 'phaser';
import { FONT } from '../systems/Textures';
import { audio } from '../systems/Audio';

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
  const t = text(scene, 0, -2, label, size).setOrigin(0.5);
  c.add([bg, t]);
  c.label = t;
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => {
    if (enabled) {
      draw(true);
      t.y = 1;
    }
  });
  c.on('pointerout', () => {
    draw();
    t.y = -2;
  });
  c.on('pointerup', () => {
    draw();
    t.y = -2;
    if (!enabled) return;
    audio.play(scene, 'click');
    onClick();
  });
  c.setEnabled = (v: boolean) => {
    enabled = v;
    draw();
    t.setAlpha(v ? 1 : 0.6);
    return c;
  };
  c.setLabel = (s: string) => {
    t.setText(s);
    return c;
  };
  return c;
}

/** 可点击的卡片区域 */
export function hitArea(scene: Phaser.Scene, x: number, y: number, w: number, h: number, onClick: () => void): Phaser.GameObjects.Zone {
  const z = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
  z.on('pointerup', () => {
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
  const t = text(scene, scene.scale.width / 2, scene.scale.height * 0.3, msg, 30, color)
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
