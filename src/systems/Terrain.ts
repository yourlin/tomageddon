// 章节地形机关：每章两种环境效果，给战斗带来变化
// 1 厨房：热油飞溅、下水道口（钻出小怪），偶尔掉落番茄
// 2 菜园：兔子洞（兔子逃窜，击败掉宝）、土拨鼠（钻出扔石头）
// 3 冰箱：冰面（打滑惯性）、冷风（全场吹动 + 减速）
// 4 垃圾场：流沙坑（吸入 + 伤害，会移动）、垃圾坠落
// 5 工厂：传送带（推动所有单位）、蒸汽阀门（周期喷发）
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { run } from './RunState';
import { chapterScale } from '../data/balance';
import { rng } from '../art/Painter';
import { tx } from '../i18n';

interface Zone {
  kind: 'ice' | 'quicksand' | 'conveyor';
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  dir: number;
  img: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  t: number;
}
interface Spot {
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  t: number;
}

export { TERRAIN_INFO } from '../data/chapters';

export class Terrain {
  zones: Zone[] = [];
  holes: Spot[] = [];
  private timers: Record<string, number> = {};
  private wind: { vx: number; vy: number; t: number } | null = null;
  private windFx: Phaser.GameObjects.Image[] = [];
  private ch: number;

  constructor(private g: GameScene) {
    this.ch = run.chapterId;
    const A = g.arena;
    const r = rng(this.ch * 131 + run.wave * 7);
    const rand = (a: number, b: number) => a + r() * (b - a);
    const cx = A.width / 2,
      cy = A.height / 2;
    const far = (x: number, y: number) => Math.hypot(x - cx, y - cy) > 260; // 不放在出生点
    const place = (n: number, pad: number, fn: (x: number, y: number) => void) => {
      let k = 0,
        guard = 0;
      while (k < n && guard++ < 200) {
        const x = rand(A.x + pad, A.right - pad),
          y = rand(A.y + pad, A.bottom - pad);
        if (!far(x, y)) continue;
        fn(x, y);
        k++;
      }
    };
    switch (this.ch) {
      case 1: // 下水道口
        for (const [x, y] of [
          [160, 160],
          [A.width - 160, 160],
          [160, A.height - 160],
          [A.width - 160, A.height - 160],
        ]) {
          this.holes.push({ x, y, t: 0, img: g.add.image(x, y, 'terrain_sewer').setDepth(0.6).setScale(0.9) });
        }
        this.timers = { oil: 8, sewer: 10, tomato: 18 };
        break;
      case 2:
        place(5, 150, (x, y) => this.holes.push({ x, y, t: 0, img: g.add.image(x, y, 'terrain_hole').setDepth(0.6) }));
        this.timers = { rabbit: 6, gopher: 9 };
        break;
      case 3:
        place(4, 220, (x, y) => {
          const s = rand(0.9, 1.4);
          const img = g.add.image(x, y, 'terrain_ice').setDepth(0.55).setScale(s).setRotation(rand(0, 3));
          this.zones.push({ kind: 'ice', x, y, w: 0, h: 0, r: 110 * s, dir: 0, img, t: 0 });
        });
        this.timers = { gust: 12 };
        break;
      case 4:
        for (let i = 0; i < 3; i++) this.addQuicksand();
        this.timers = { debris: 9, move: 20 };
        break;
      case 5: {
        for (const [y, dir] of [
          [A.height * 0.3, 1],
          [A.height * 0.72, -1],
        ] as [number, number][]) {
          const img = g.add
            .tileSprite(cx, y, A.width - 200, 96, 'terrain_conveyor')
            .setDepth(0.55)
            .setFlipX(dir < 0);
          this.zones.push({ kind: 'conveyor', x: cx, y, w: A.width - 200, h: 96, r: 0, dir, img, t: 0 });
        }
        place(4, 180, (x, y) => this.holes.push({ x, y, t: rand(2, 8), img: g.add.image(x, y, 'terrain_vent').setDepth(0.6) }));
        break;
      }
    }
  }

  private addQuicksand(): void {
    const A = this.g.arena,
      p = this.g.player;
    let x = 0,
      y = 0;
    for (let i = 0; i < 20; i++) {
      x = Phaser.Math.Between(A.x + 200, A.right - 200);
      y = Phaser.Math.Between(A.y + 200, A.bottom - 200);
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) > 260) break;
    }
    const img = this.g.add.image(x, y, 'terrain_quicksand').setDepth(0.55).setAlpha(0);
    const r = Phaser.Math.Between(95, 130);
    img.setScale((r * 2.2) / 256);
    this.g.tweens.add({ targets: img, alpha: 1, duration: 800 });
    this.zones.push({ kind: 'quicksand', x, y, w: 0, h: 0, r, dir: 0, img, t: 0 });
  }

  private dmg(base: number): number {
    // 地形伤害随波次明显成长（二次项），后期热油、坠物等也有威胁
    const w = run.wave - 1;
    return base * (1 + 0.3 * w + 0.02 * w * w) * chapterScale(run.chapter.dmgMult, run.wave);
  }

  private tick(key: string, dt: number, every: number, minWave = 1): boolean {
    if (run.wave < minWave) return false;
    this.timers[key] = (this.timers[key] ?? every) - dt;
    if (this.timers[key] > 0) return false;
    this.timers[key] = every * Phaser.Math.FloatBetween(0.8, 1.2);
    return true;
  }

  update(dt: number): void {
    const g = this.g;
    const p = g.player;
    g.envVX = 0;
    g.envVY = 0;
    g.slippery = false;
    if (g.waveOver) return;

    // ---------- 区域效果 ----------
    for (const z of this.zones) {
      z.t += dt;
      if (z.kind === 'ice') {
        if (Phaser.Math.Distance.Between(p.x, p.y, z.x, z.y) < z.r) g.slippery = true;
      } else if (z.kind === 'quicksand') {
        z.img.rotation += dt * 0.8;
        const pull = (tx: number, ty: number, strength: number): [number, number] => {
          const dx = z.x - tx,
            dy = z.y - ty,
            d = Math.hypot(dx, dy) || 1;
          if (d > z.r) return [0, 0];
          const k = strength * (0.4 + 0.6 * (1 - d / z.r));
          return [(dx / d) * k, (dy / d) * k];
        };
        const [vx, vy] = pull(p.x, p.y, 95);
        if (vx || vy) {
          g.envVX += vx;
          g.envVY += vy;
          g.applyPlayerStatus([{ id: 'sticky', dur: 0.3 }]);
          if (Phaser.Math.Distance.Between(p.x, p.y, z.x, z.y) < z.r * 0.3 && this.tick(`qs_dmg_${z.x}`, dt, 0.6))
            g.damagePlayer(this.dmg(2));
        }
        for (const e of g.grid.query(z.x, z.y, z.r, g.tmp2)) {
          if (e.isBoss) continue;
          const [ex, ey] = pull(e.x, e.y, 70);
          e.x += ex * dt;
          e.y += ey * dt;
        }
      } else if (z.kind === 'conveyor') {
        (z.img as Phaser.GameObjects.TileSprite).tilePositionX -= dt * 110 * z.dir;
        const inside = (x: number, y: number) => Math.abs(x - z.x) < z.w / 2 && Math.abs(y - z.y) < z.h / 2;
        if (inside(p.x, p.y)) g.envVX += 120 * z.dir;
        for (const e of g.enemies) if (e.alive && !e.isBoss && inside(e.x, e.y)) e.x += 90 * z.dir * dt;
      }
    }

    // ---------- 周期事件 ----------
    switch (this.ch) {
      case 1:
        if (this.tick('oil', dt, 9, 2)) {
          for (let i = 0; i < 2 + Math.floor(run.wave / 6); i++) {
            const x = p.x + Phaser.Math.Between(-220, 220),
              y = p.y + Phaser.Math.Between(-160, 160);
            g.fx.telegraphCircle(x, y, 60, 1.1, 0xff9f1c, () =>
              // 每 0.5 秒结算一次，伤害约等于同波次蟑螂的一次接触伤害（原为 1.5，几乎没有威胁）
              g.addHazard(x, y, 60, 4, this.dmg(3), [{ id: 'burn', dur: 2, stacks: 1 }], 0xffb703),
            );
          }
          g.terrainNotice(tx('热油飞溅！', 'Hot oil splash!'));
        }
        if (this.tick('sewer', dt, 11, 3)) {
          const h = Phaser.Utils.Array.GetRandom(this.holes);
          this.pulse(h);
          for (let i = 0; i < 3; i++) g.time.delayedCall(i * 250, () => g.spawnEnemyNow(run.wave >= 6 ? 'cockroach' : 'mold', h.x, h.y));
        }
        if (this.tick('tomato', dt, 35, 2)) {
          const A = g.arena;
          const x = Phaser.Math.Between(A.x + 120, A.right - 120),
            y = Phaser.Math.Between(A.y + 120, A.bottom - 120);
          g.fx.telegraphCircle(x, y, 30, 0.8, 0x52ff8a, () => g.dropFruit(x, y));
        }
        break;
      case 2:
        if (this.tick('rabbit', dt, 7)) {
          const h = Phaser.Utils.Array.GetRandom(this.holes);
          this.pulse(h);
          g.spawnEnemyNow('rabbit', h.x, h.y);
        }
        if (this.tick('gopher', dt, 10, 3)) {
          // 选离玩家较近的洞
          const h = [...this.holes].sort(
            (a, b) => Phaser.Math.Distance.Between(a.x, a.y, p.x, p.y) - Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y),
          )[Math.floor(Math.random() * 2)];
          this.pulse(h);
          g.time.delayedCall(500, () => g.spawnEnemyNow('gopher', h.x, h.y - 6));
        }
        break;
      case 3:
        if (this.wind) {
          this.wind.t -= dt;
          g.envVX += this.wind.vx;
          g.envVY += this.wind.vy;
          for (const e of g.enemies)
            if (e.alive && !e.isBoss) {
              e.x += this.wind.vx * 0.7 * dt;
              e.y += this.wind.vy * 0.7 * dt;
            }
          if (Math.random() < dt * 20) {
            const cam = g.cameras.main;
            const img = g.add
              .image(
                cam.worldView.x + Math.random() * cam.worldView.width,
                cam.worldView.y + Math.random() * cam.worldView.height,
                'terrain_wind',
              )
              .setDepth(14000)
              .setAlpha(0.7)
              .setRotation(Math.atan2(this.wind.vy, this.wind.vx));
            g.tweens.add({
              targets: img,
              x: img.x + this.wind.vx * 3,
              y: img.y + this.wind.vy * 3,
              alpha: 0,
              duration: 700,
              onComplete: () => img.destroy(),
            });
          }
          if (this.wind.t <= 0) this.wind = null;
        } else if (this.tick('gust', dt, 14, 4)) {
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          g.terrainNotice(tx('冷风来袭！', 'Cold wind incoming!'));
          g.time.delayedCall(1200, () => {
            this.wind = { vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, t: 3.5 };
            g.applyPlayerStatus([{ id: 'slow', dur: 3.5, stacks: 1 }]);
          });
        }
        break;
      case 4:
        if (this.tick('debris', dt, 9, 2)) {
          for (let i = 0; i < 3 + Math.floor(run.wave / 5); i++) {
            const x = p.x + Phaser.Math.Between(-260, 260),
              y = p.y + Phaser.Math.Between(-200, 200);
            g.fx.telegraphCircle(x, y, 55, 1.2, 0xadb5bd, () => {
              g.fx.explosion(x, y, 55, 0x6c757d);
              if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < 60)
                g.damagePlayer(this.dmg(3), undefined, [{ id: 'stun', dur: 0.4, chance: 40 }]);
              for (const e of g.grid.query(x, y, 55, g.tmp2)) g.damageEnemy(e, 20 + run.wave * 6);
            });
          }
          g.terrainNotice(tx('垃圾坠落！', 'Falling junk!'));
        }
        if (this.tick('move', dt, 20)) {
          const old = this.zones.shift();
          if (old) g.tweens.add({ targets: old.img, alpha: 0, duration: 800, onComplete: () => old.img.destroy() });
          this.addQuicksand();
        }
        break;
      case 5:
        for (const h of this.holes) {
          h.t -= dt;
          if (h.t > 0) {
            if (Math.random() < dt * 2) this.puff(h.x, h.y, 0.3);
            continue;
          }
          h.t = Phaser.Math.FloatBetween(7, 11);
          g.fx.telegraphCircle(h.x, h.y, 80, 1.0, 0xffffff, () => {
            for (let i = 0; i < 8; i++) this.puff(h.x + Phaser.Math.Between(-30, 30), h.y + Phaser.Math.Between(-30, 30), 1);
            if (Phaser.Math.Distance.Between(h.x, h.y, p.x, p.y) < 85)
              g.damagePlayer(this.dmg(3), undefined, [{ id: 'burn', dur: 2, stacks: 2 }]);
            for (const e of g.grid.query(h.x, h.y, 80, g.tmp2)) g.damageEnemy(e, 15 + run.wave * 6);
          });
        }
        break;
    }
  }

  private pulse(h: Spot): void {
    this.g.tweens.add({ targets: h.img, scale: h.img.scale * 1.15, yoyo: true, duration: 150 });
    this.g.fx.burst(h.x, h.y, 0x8d6e63, 6);
  }

  private puff(x: number, y: number, a: number): void {
    const sm = this.g.add
      .image(x, y, 'fx_smoke')
      .setDepth(14000)
      .setAlpha(0.6 * a)
      .setScale(0.3);
    this.g.tweens.add({ targets: sm, y: y - 60, scale: 0.9, alpha: 0, duration: 900, onComplete: () => sm.destroy() });
  }
}
