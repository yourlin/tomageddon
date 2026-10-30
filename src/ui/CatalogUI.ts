import type Phaser from 'phaser';
import { workbenchButton } from './WorkbenchUI';
import { TOUCH } from './UI';
import { VH } from '../systems/HiDpi';

/** Keep actual touch targets at least 44 CSS pixels after the canvas scales. */
export function catalogButton(...args: Parameters<typeof workbenchButton>): ReturnType<typeof workbenchButton> {
  if (TOUCH) {
    const scene = args[0] as Phaser.Scene;
    const cssScale = (scene.game.canvas.clientHeight || VH(scene)) / VH(scene);
    args[4] = Math.max(args[4], Math.ceil(44 / Math.max(0.1, cssScale)));
    args[8] = Math.max(args[8] ?? 18, 26);
  }
  return workbenchButton(...args);
}
