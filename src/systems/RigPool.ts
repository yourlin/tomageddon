// 外观对象池：同一身份（且同一种实现：Rig / 外部素材）的外观复用，避免频繁创建销毁。
// 回池时停掉 tween、清回调 / 染色 / 翻转 / 透明度，下一只怪不会继承上一只的死亡状态。
import Phaser from 'phaser';
import type { EntityVisual, VisualIdent } from '../objects/EntityVisual';
import { createEntityVisual, visualPoolKey } from '../objects/visualFactory';

export class VisualPool {
  private free = new Map<string, EntityVisual[]>();
  private keyOf = new WeakMap<EntityVisual, string>();
  constructor(private scene: Phaser.Scene) {}

  acquire(v: VisualIdent, radius: number): EntityVisual {
    const key = visualPoolKey(this.scene, v);
    let vis = this.free.get(key)?.pop();
    if (!vis) {
      vis = createEntityVisual(this.scene, v, radius);
      this.keyOf.set(vis, key);
      this.scene.add.existing(vis);
    }
    vis.resetVisual();
    vis.setRadius(radius);
    vis.setVisible(true).setActive(true);
    return vis;
  }

  release(vis: EntityVisual): void {
    const key = this.keyOf.get(vis);
    this.scene.tweens.killTweensOf(vis);
    vis.onDieDone = null;
    vis.resetVisual();
    vis.setVisible(false).setActive(false);
    if (!key || !vis.scene) return;
    let list = this.free.get(key);
    if (!list) this.free.set(key, (list = []));
    if (!list.includes(vis)) list.push(vis);
  }

  /** 预热：提前创建若干个，避免战斗中卡顿 */
  warm(v: VisualIdent, radius: number, n: number): void {
    const tmp: EntityVisual[] = [];
    for (let i = 0; i < n; i++) tmp.push(this.acquire(v, radius));
    for (const r of tmp) this.release(r);
  }
}
