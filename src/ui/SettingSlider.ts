import Phaser from 'phaser';
import { text, tu } from './UI';

export interface SettingRange {
  min: number;
  max: number;
  step: number;
  read: () => number;
  write: (value: number) => void;
  commit: () => void;
}

/** Track taps and captured dragging share the same clamped, stepped value. */
export function settingSlider(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  id: string,
  range: SettingRange,
  format: () => string,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y).setName(`setting-slider:${id}`).setDepth(1);
  const track = scene.add.graphics();
  const label = text(scene, width / 2, 0, '', tu(16), '#ffe4b2').setOrigin(1, 0.5);
  const left = -width / 2 + 9,
    right = width / 2 - 70,
    ty = 0;
  const draw = () => {
    const ratio = Phaser.Math.Clamp((range.read() - range.min) / (range.max - range.min), 0, 1);
    const knob = left + (right - left) * ratio;
    track
      .clear()
      .fillStyle(0x160e0d, 1)
      .fillRoundedRect(left, ty - 4, right - left, 8, 4);
    if (knob > left) track.fillStyle(0xef6045, 1).fillRoundedRect(left, ty - 4, Math.max(4, knob - left), 8, 4);
    track.lineStyle(1, 0x9a6944, 1).strokeRoundedRect(left, ty - 4, right - left, 8, 4);
    track.fillStyle(0xffe6b9, 1).fillCircle(knob, ty, 9).lineStyle(2, 0x805134, 1).strokeCircle(knob, ty, 9);
    label.setText(format());
    c.setData('value', range.read());
  };
  const hit = scene.add.zone(0, 0, width, 40).setInteractive({ useHandCursor: true }).setName(`setting-slider-hit:${id}`);
  scene.input.setDraggable(hit);
  const update = (pointer: Phaser.Input.Pointer) => {
    const world = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const local = c.getWorldTransformMatrix().applyInverse(world.x, world.y);
    const fraction = Phaser.Math.Clamp((local.x - left) / (right - left), 0, 1);
    const value = range.min + Math.round((fraction * (range.max - range.min)) / range.step) * range.step;
    const next = Number(Phaser.Math.Clamp(value, range.min, range.max).toFixed(4));
    if (next !== range.read()) range.write(next);
    draw();
  };
  hit.on('pointerdown', update);
  hit.on('drag', update);
  const finish = (pointer?: Phaser.Input.Pointer) => {
    if (pointer) update(pointer);
    else {
      // PadNav confirms controls with pointerup without a mouse pointer.
      range.write(range.read() >= range.max ? range.min : Number(Math.min(range.max, range.read() + range.step).toFixed(4)));
      draw();
    }
    range.commit();
  };
  hit.on('pointerup', finish);
  hit.on('dragend', finish);
  c.add([track, label, hit]);
  c.setData('min', range.min).setData('max', range.max).setData('step', range.step);
  draw();
  return c;
}
