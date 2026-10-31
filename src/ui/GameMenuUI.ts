// Shared surfaces for settings and the in-game pause menu. Reuse the cover's
// buttons and the game's own portraits/weapon art, keeping every label live.
import Phaser from 'phaser';
import { coverButton } from './CoverUI';
import { text, hitArea, tu } from './UI';

export const MENU = { panel: 0x281b21, row: 0x49302e, gold: 0xb88d58, cream: '#fff0ce', dim: '#c4ac91' };
const ICONS = [
  'volume-up-fill',
  'display',
  'controller',
  'archive-fill',
  'bar-chart-fill',
  'lightning-charge-fill',
  'fullscreen',
  'play-fill',
  'gear-fill',
  'box-arrow-right',
  'arrow-left',
  'trash3-fill',
  'toggle-on',
  'toggle-off',
];

export function preloadGameMenu(scene: Phaser.Scene): void {
  for (const icon of ICONS)
    if (!scene.textures.exists(`menu:${icon}`))
      scene.load.svg(`menu:${icon}`, `${import.meta.env.BASE_URL}assets/ui/icons/${icon}.svg`, { width: 48, height: 48 });
  if (!scene.textures.exists('menu:corner')) scene.load.image('menu:corner', `${import.meta.env.BASE_URL}assets/ui/menu-corner.webp`);
}

/** 设置页背景 */
export function preloadSettingsArt(scene: Phaser.Scene): void {
  preloadGameMenu(scene);
  if (!scene.textures.exists('settings:kitchen'))
    scene.load.image('settings:kitchen', `${import.meta.env.BASE_URL}assets/ui/settings-kitchen.webp`);
}

export function menuPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): void {
  const g = scene.add.graphics();
  g.fillStyle(MENU.panel, 0.97).fillRoundedRect(x, y, w, h, 18);
  g.lineStyle(1.5, MENU.gold, 1).strokeRoundedRect(x, y, w, h, 18);
  g.lineStyle(1, MENU.gold, 0.18).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 14);
  if (scene.textures.exists('menu:corner')) {
    for (const [cx, cy, angle] of [
      [x + 19, y + 19, 0],
      [x + w - 19, y + 19, 90],
      [x + w - 19, y + h - 19, 180],
      [x + 19, y + h - 19, 270],
    ])
      scene.add.image(cx, cy, 'menu:corner').setDisplaySize(38, 38).setAngle(angle);
  }
}

export function menuIcon(scene: Phaser.Scene, x: number, y: number, icon: string, size = 23): Phaser.GameObjects.Image {
  return scene.add.image(x, y, `menu:${icon}`).setDisplaySize(size, size);
}

export function menuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  click: () => void,
  primary = false,
  size = 21,
  icon?: string,
) {
  const b = coverButton(scene, x, y, w, h, label, click, primary, size);
  if (icon) {
    // 没有文字的纯图标按钮：图标居中
    const glyph = menuIcon(scene, label ? -w / 2 + 26 : 0, -1, icon, Math.min(24, size + 2));
    b.add(glyph);
    // Reserve room for the icon while retaining UI.button's hidden full label.
    for (const o of b.list) if (o instanceof Phaser.GameObjects.Text && o.visible) o.x += 9;
  }
  return b;
}

export function menuHeading(scene: Phaser.Scene, x: number, y: number, label: string, size = 40): Phaser.GameObjects.Text {
  return text(scene, x, y, label, size, MENU.cream, { fontStyle: 'bold', stroke: '#703529', strokeThickness: 4 });
}

export function menuRule(scene: Phaser.Scene, x: number, y: number, w: number): void {
  scene.add
    .graphics()
    .lineStyle(1, MENU.gold, 0.45)
    .lineBetween(x, y, x + w, y);
}

/** A real switch icon from Bootstrap Icons, with an explicit localized state. */
export function menuToggle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  read: () => boolean,
  change: () => void,
  on: string,
  off: string,
): void {
  const knob = scene.add.ellipse(x + (read() ? 11.6 : -11.6), y, 30, 24, 0xfff0ce);
  const icon = menuIcon(scene, x, y, read() ? 'toggle-on' : 'toggle-off', 60).setDisplaySize(62, 50);
  const label = text(scene, x + 46, y, read() ? on : off, tu(17), MENU.cream).setOrigin(0, 0.5);
  const refresh = () => {
    icon.setTexture(`menu:${read() ? 'toggle-on' : 'toggle-off'}`).setTint(read() ? 0xff7952 : 0xa38b7d);
    knob.x = x + (read() ? 11.6 : -11.6);
    label.setText(read() ? on : off);
  };
  refresh();
  hitArea(scene, x - 45, y - 20, 125, 40, () => {
    change();
    refresh();
  });
}
