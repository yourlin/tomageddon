import Phaser from 'phaser';
import { coverButton } from './CoverUI';
import { COLORS } from './UI';
import { preloadGameMenu } from './GameMenuUI';

export function preloadWorkbench(scene: Phaser.Scene): void {
  preloadGameMenu(scene);
  for (const icon of ['lock-fill', 'unlock-fill'])
    if (!scene.textures.exists(`workbench:${icon}`))
      scene.load.svg(`workbench:${icon}`, `${import.meta.env.BASE_URL}assets/ui/icons/${icon}.svg`, { width: 48, height: 48 });
  if (!scene.textures.exists('workbench:kitchen'))
    scene.load.image('workbench:kitchen', `${import.meta.env.BASE_URL}assets/ui/workbench-kitchen.webp`);
}

export function workbenchBackground(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, w: number, h: number): void {
  if (scene.textures.exists('workbench:kitchen')) {
    const bg = scene.add.image(w / 2, h / 2, 'workbench:kitchen');
    bg.setScale(Math.max(w / bg.width, h / bg.height));
    layer.add(bg);
  }
  layer.add(scene.add.rectangle(w / 2, h / 2, w, h, 0x170d15, 0.36));
}

export function workbenchPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = COLORS.panel, border = 0xb88d58) {
  return scene.add
    .graphics()
    .fillStyle(fill === COLORS.panel ? 0x281b21 : fill, 0.96)
    .fillRoundedRect(x, y, w, h, 12)
    .lineStyle(1.5, border, 0.9)
    .strokeRoundedRect(x, y, w, h, 12)
    .lineStyle(1, 0xb88d58, 0.17)
    .strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 9);
}

export function workbenchButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  click: () => void,
  color = COLORS.primary,
  size = 18,
) {
  const b = coverButton(scene, x, y, w, h, label, click, color === COLORS.primary || color === COLORS.green, size);
  const enable = b.setEnabled.bind(b);
  b.setEnabled = (on: boolean) => {
    enable(on);
    b.setAlpha(on ? 1 : 0.48);
    return b;
  };
  return b;
}
