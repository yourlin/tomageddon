// 骨骼对象池：同一外观的 Rig 复用，避免频繁创建销毁
import Phaser from 'phaser';
import { Rig } from '../objects/Rig';
import type { RigSpec } from '../art/RigSpec';

export class RigPool {
  private free = new Map<string, Rig[]>();
  constructor(private scene: Phaser.Scene) {}

  acquire(key: string, spec: RigSpec, radius: number): Rig {
    const list = this.free.get(key);
    let rig = list?.pop();
    if (!rig) {
      rig = new Rig(this.scene, spec, key, radius);
      this.scene.add.existing(rig);
    }
    rig.resetVisual();
    rig.setRadius(radius);
    rig.setVisible(true).setActive(true);
    return rig;
  }

  release(key: string, rig: Rig): void {
    rig.setVisible(false).setActive(false);
    let list = this.free.get(key);
    if (!list) {
      list = [];
      this.free.set(key, list);
    }
    list.push(rig);
  }

  /** 预热：提前创建若干个，避免战斗中卡顿 */
  warm(key: string, spec: RigSpec, radius: number, n: number): void {
    const tmp: Rig[] = [];
    for (let i = 0; i < n; i++) tmp.push(this.acquire(key, spec, radius));
    for (const r of tmp) this.release(key, r);
  }
}
