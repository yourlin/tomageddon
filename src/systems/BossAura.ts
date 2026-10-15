// Boss 阶段的常驻外观：跟随 Boss 的光晕、火焰、烟尾、环绕物、滴落、飘雪、护盾环、警报环。
// 由 BossPhaseDirector 在阶段切换时设置，Boss 死亡或换阶段时清除。
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';

export type AuraKind = 'glow' | 'flame' | 'smoke' | 'orbit' | 'drip' | 'snow' | 'shield' | 'alarm' | 'sparks';
export interface AuraSpec {
  kind: AuraKind;
  color: number;
  /** 环绕物数量（orbit） */
  n?: number;
}

interface Live {
  e: Enemy;
  spec: AuraSpec[];
  objs: Phaser.GameObjects.GameObject[];
  t: number;
  emitT: number;
}

export class BossAura {
  private live: Live[] = [];

  constructor(private g: GameScene) {}

  set(e: Enemy, spec: AuraSpec[] | undefined): void {
    this.clear(e);
    if (!spec?.length) return;
    const g = this.g;
    const objs: Phaser.GameObjects.GameObject[] = [];
    for (const s of spec) {
      if (s.kind === 'glow')
        objs.push(
          g.add
            .image(e.x, e.y, 'fx_glow')
            .setTint(s.color)
            .setAlpha(0.45)
            .setScale((e.radius * 3.2) / 128)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setName('glow'),
        );
      else if (s.kind === 'shield' || s.kind === 'alarm')
        objs.push(
          g.add
            .image(e.x, e.y, 'fx_ring')
            .setTint(s.color)
            .setAlpha(0.7)
            .setScale((e.radius * 3) / 128)
            .setName(s.kind),
        );
      else if (s.kind === 'orbit')
        for (let i = 0; i < (s.n ?? 6); i++) {
          const gr = g.add.graphics().setName('orbit');
          gr.fillStyle(s.color, 1).fillTriangle(-7, 6, 7, 6, 0, -9);
          gr.lineStyle(2, 0x000000, 0.35).strokeTriangle(-7, 6, 7, 6, 0, -9);
          objs.push(gr);
        }
    }
    this.live.push({ e, spec, objs, t: 0, emitT: 0 });
  }

  clear(e: Enemy): void {
    for (const l of this.live) if (l.e === e) for (const o of l.objs) o.destroy();
    this.live = this.live.filter((l) => l.e !== e);
  }

  update(dt: number): void {
    const g = this.g;
    for (const l of this.live) {
      const e = l.e;
      if (!e.alive) {
        for (const o of l.objs) o.destroy();
        l.objs = [];
        continue;
      }
      l.t += dt;
      l.emitT -= dt;
      let oi = 0;
      for (const o of l.objs) {
        const im = o as Phaser.GameObjects.Image;
        if (o.name === 'orbit') {
          const n = l.objs.filter((x) => x.name === 'orbit').length;
          const a = l.t * 1.6 + (oi++ / n) * Math.PI * 2;
          im.setPosition(e.x + Math.cos(a) * e.radius * 1.6, e.y + Math.sin(a) * e.radius * 1.1 - e.radius * 0.2);
          im.setRotation(a + Math.PI / 2).setDepth(Math.sin(a) > 0 ? e.y + 1 : e.y - 1);
        } else {
          im.setPosition(e.x, e.y).setDepth(e.y - 1);
          if (o.name === 'glow') im.setAlpha(0.35 + 0.15 * Math.sin(l.t * 4));
          if (o.name === 'shield') im.setRotation(l.t * 0.8);
          if (o.name === 'alarm') im.setAlpha(Math.sin(l.t * 10) > 0 ? 0.85 : 0.2).setRotation(-l.t * 2.5);
        }
      }
      if (l.emitT > 0) continue;
      l.emitT = 0.09;
      for (const s of l.spec) {
        const x = e.x + (Math.random() - 0.5) * e.radius * 1.6,
          y = e.y + (Math.random() - 0.5) * e.radius;
        if (s.kind === 'flame' || s.kind === 'sparks') {
          const im = g.add
            .image(x, y, s.kind === 'flame' ? 'fx_glow' : 'fx_spark')
            .setTint(s.color)
            .setDepth(e.y + 1)
            .setScale(s.kind === 'flame' ? 0.16 : 0.5)
            .setBlendMode(Phaser.BlendModes.ADD);
          g.tweens.add({
            targets: im,
            y: y - 50 - Math.random() * 40,
            alpha: 0,
            scale: 0.03,
            duration: 500,
            onComplete: () => im.destroy(),
          });
        } else if (s.kind === 'smoke' && Math.random() < 0.5) {
          const im = g.add
            .image(x, y, 'fx_smoke')
            .setTint(s.color)
            .setDepth(e.y - 1)
            .setAlpha(0.5)
            .setScale(0.4);
          g.tweens.add({ targets: im, y: y - 30, scale: 1.1, alpha: 0, duration: 900, onComplete: () => im.destroy() });
        } else if (s.kind === 'drip' && Math.random() < 0.4) {
          const gr = g.add
            .graphics()
            .setDepth(e.y + 1)
            .setPosition(x, e.y + e.radius * 0.6);
          gr.fillStyle(s.color, 0.9).fillEllipse(0, 0, 8, 12);
          g.tweens.add({ targets: gr, y: gr.y + 30, alpha: 0, duration: 600, onComplete: () => gr.destroy() });
        } else if (s.kind === 'snow' && Math.random() < 0.6) {
          const sx = e.x + (Math.random() - 0.5) * e.radius * 5;
          const im = g.add
            .image(sx, e.y - e.radius * 2.5, 'fx_glow')
            .setTint(s.color)
            .setDepth(14000)
            .setScale(0.06)
            .setAlpha(0.9);
          g.tweens.add({
            targets: im,
            y: e.y + e.radius * 2,
            x: sx + (Math.random() - 0.5) * 40,
            alpha: 0,
            duration: 1400,
            onComplete: () => im.destroy(),
          });
        }
      }
    }
    this.live = this.live.filter((l) => l.objs.length || l.e.alive);
  }
}
