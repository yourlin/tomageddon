import Phaser from 'phaser';
import { button, TOUCH } from './UI';
import { VH } from '../systems/HiDpi';
import { tx } from '../i18n';

/** Brass page arrows: quiet book furniture with a full 44px touch hit area. */
export function journalNav(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: 'left' | 'right' | 'up' | 'down',
  click: () => void,
  enabled = true,
) {
  const scale = (scene.game.canvas.clientHeight || VH(scene)) / VH(scene);
  const size = TOUCH ? Math.ceil(44 / Math.max(0.1, scale)) : 44;
  const b = button(scene, x, y, size, size, '', click);
  (b.list[0] as Phaser.GameObjects.Graphics).setVisible(false);
  b.label.setText(
    {
      left: tx('上一页', 'Previous page'),
      right: tx('下一页', 'Next page'),
      up: tx('向上滚动', 'Scroll up'),
      down: tx('向下滚动', 'Scroll down'),
    }[direction],
  );
  const plate = scene.add.circle(0, 0, size * 0.34, 0x392521, 0.74).setStrokeStyle(1.3, 0xb99460, 0.8);
  const icon = scene.add
    .image(0, 0, 'menu:arrow-left')
    .setDisplaySize(size * 0.34, size * 0.34)
    .setAngle({ left: 0, right: 180, up: 90, down: -90 }[direction])
    .setTint(0xe4c48b);
  b.add([plate, icon]);
  const setEnabled = b.setEnabled.bind(b);
  b.setEnabled = (on: boolean) => {
    setEnabled(on);
    plate.setAlpha(on ? 1 : 0.25);
    icon.setAlpha(on ? 1 : 0.25);
    return b;
  };
  return b.setEnabled(enabled);
}
