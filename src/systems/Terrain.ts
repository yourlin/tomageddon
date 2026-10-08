// 章节地形机关：每章两种环境效果，给战斗带来变化
// 1 厨房：热油飞溅、下水道口（钻出小怪），偶尔掉落番茄
// 2 菜园：兔子洞（兔子逃窜，击败掉宝）、土拨鼠（钻出扔石头）
// 3 冰箱：冰面（打滑惯性）、冷风（全场吹动 + 减速）
// 4 垃圾场：流沙坑（吸入 + 伤害，会移动）、垃圾坠落
// 5 工厂：传送带（推动所有单位）、蒸汽阀门（周期喷发）
// 1.4.0（G8）新增：2 自动洒水器（浸湿）、4 酸液泄漏（腐蚀）、5 鼓风口（顺风）、6 补光灯（硬化）、7 荆棘藤（流血 + 腐蚀）
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { run } from './RunState';
import { chapterScale, chapterWaves } from '../data/balance';
import { rng } from '../art/Painter';
import { tx } from '../i18n';
import type { StatusApply } from '../data/statuses';

interface Zone {
  kind: 'ice' | 'quicksand' | 'conveyor' | 'fan' | 'lamp';
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  dir: number;
  img: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  t: number;
}

/** 1.4.0 新地形机关的数值（测试与文档共用） */
export const TERRAIN_TUNING = {
  /** 第 2 章自动洒水器：周期性喷洒，范围内玩家与怪物浸湿 */
  sprinkler: { every: 12, minWave: 2, radius: 150, status: { id: 'soaked', dur: 4, stacks: 2 } },
  /** 第 4 章酸液泄漏：玩家附近出现酸液池，造成伤害并腐蚀 */
  acid: { every: 13, minWave: 3, radius: 70, life: 5, baseDmg: 2, status: { id: 'corrode', dur: 3, stacks: 1 } },
  /** 第 5 章鼓风口：站在风口上获得顺风，怪物被吹开 */
  fan: { radius: 90, push: 140, status: { id: 'tailwind', dur: 2, stacks: 1 } },
  /** 第 6 章补光灯：光区内的玩家与怪物都会硬化，每 25 秒换位置 */
  lamp: { radius: 110, move: 25, status: { id: 'hardened', dur: 1.5, stacks: 1 } },
  /** 第 7 章荆棘藤：玩家脚下周期性钻出荆棘 */
  bramble: {
    every: 10,
    minWave: 2,
    radius: 50,
    baseDmg: 3,
    status: [
      { id: 'bleed', dur: 3, stacks: 1 },
      { id: 'corrode', dur: 3, stacks: 1 },
    ],
  },
} as const satisfies Record<string, { status: StatusApply | readonly StatusApply[] } & Record<string, unknown>>;
interface Spot {
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  t: number;
}

export { TERRAIN_INFO } from '../data/chapters';
import { TERRAIN_MECHS_EXTRA } from '../data/chaptersExtra';

/** 各章地形机制的开关键（开发者界面逐个关闭用；键名与 tick() / 区域 kind 一致） */
export const TERRAIN_MECHS: Record<number, [string, string][]> = {
  1: [
    ['oil', '热油飞溅'],
    ['sewer', '下水道钻怪'],
    ['tomato', '掉落番茄'],
  ],
  2: [
    ['rabbit', '兔子洞'],
    ['gopher', '土拨鼠'],
    ['sprinkler', '自动洒水器'],
  ],
  3: [
    ['ice', '冰面'],
    ['gust', '冷风'],
  ],
  4: [
    ['quicksand', '流沙坑'],
    ['qs', '流沙伤害'],
    ['debris', '垃圾坠落'],
    ['move', '流沙移动'],
    ['acid', '酸液泄漏'],
  ],
  5: [
    ['conveyor', '传送带'],
    ['vent', '蒸汽阀门'],
    ['fan', '鼓风口'],
  ],
  ...TERRAIN_MECHS_EXTRA,
};

export class Terrain {
  /** 开发者界面关闭的机制键（见 TERRAIN_MECHS），正常游戏为空 */
  static off = new Set<string>();
  zones: Zone[] = [];
  holes: Spot[] = [];
  /** 第 2 章自动洒水器 */
  sprinklers: Spot[] = [];
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
        place(2, 200, (x, y) =>
          this.sprinklers.push({ x, y, t: 0, img: g.add.image(x, y, 'terrain_vent').setDepth(0.6).setScale(0.7).setTint(0x4cc9f0) }),
        );
        this.timers = { rabbit: 6, gopher: 9, sprinkler: 8 };
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
        this.timers = { debris: 9, move: 20, acid: 10 };
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
        // 鼓风口：放在两条传送带之间的中线上，左右各一个
        for (const x of [A.width * 0.25, A.width * 0.75]) this.addRoundZone('fan', x, A.height * 0.51, TERRAIN_TUNING.fan.radius, 0xcaf0f8);
        break;
      }
      // 1.4.0 第 6 章「腐烂温室」：孢子喷口（复用第 1 章油池实现，改为中毒）+ 堆肥坑钻怪（复用下水道）+ 补光灯（硬化光区）
      case 6:
        place(4, 180, (x, y) => this.holes.push({ x, y, t: 0, img: g.add.image(x, y, 'terrain_hole').setDepth(0.6).setTint(0x8a9a5b) }));
        place(2, 240, (x, y) => this.addRoundZone('lamp', x, y, TERRAIN_TUNING.lamp.radius, 0xffe066));
        this.timers = { spore: 8, compost: 11, lamp_move: TERRAIN_TUNING.lamp.move };
        break;
      // 隐藏第 7 章「腐烂菜园」：腐泥沼（复用流沙，附带腐烂）+ 烂果坠落（复用垃圾坠落）+ 荆棘藤
      case 7:
        for (let i = 0; i < 3; i++) this.addQuicksand();
        for (const z of this.zones) z.img.setTint(0x7f5539);
        this.timers = { debris: 8, bramble: 6 };
        break;
    }
  }

  /** 圆形光区 / 风口（fx_glow 128px 贴图，按半径缩放） */
  private addRoundZone(kind: 'fan' | 'lamp', x: number, y: number, r: number, tint: number): void {
    const img = this.g.add
      .image(x, y, kind === 'fan' ? 'fx_ring' : 'fx_glow')
      .setDepth(0.55)
      .setTint(tint)
      .setAlpha(kind === 'fan' ? 0.7 : 0.45)
      .setScale((r * 2) / 128);
    this.zones.push({ kind, x, y, w: 0, h: 0, r, dir: 0, img, t: 0 });
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
    return base * (1 + 0.3 * w + 0.02 * w * w) * chapterScale(run.chapter.dmgMult, run.wave, chapterWaves(run.chapterId));
  }

  private tick(key: string, dt: number, every: number, minWave = 1): boolean {
    if (run.wave < minWave || Terrain.off.has(key.split('_')[0])) return false;
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
      if (Terrain.off.has(z.kind)) continue;
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
            g.damagePlayer(this.dmg(2), undefined, this.ch === 7 ? [{ id: 'rot', dur: 2 }] : undefined);
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
      } else if (z.kind === 'fan') {
        // 鼓风口：玩家站上去叠顺风；非 Boss 怪物被向外吹开
        z.img.rotation += dt * 6;
        const T = TERRAIN_TUNING.fan;
        if (Phaser.Math.Distance.Between(p.x, p.y, z.x, z.y) < z.r) g.applyPlayerStatus([{ ...T.status }]);
        for (const e of g.grid.query(z.x, z.y, z.r, g.tmp2)) {
          if (e.isBoss) continue;
          const dx = e.x - z.x,
            dy = e.y - z.y,
            d = Math.hypot(dx, dy) || 1;
          e.x += (dx / d) * T.push * dt;
          e.y += (dy / d) * T.push * dt;
        }
      } else if (z.kind === 'lamp') {
        // 补光灯：光区内的玩家与怪物都会硬化（护甲 + 减伤），抢占光区是关键
        z.img.setAlpha(0.4 + 0.08 * Math.sin(z.t * 3));
        const st = TERRAIN_TUNING.lamp.status;
        if (Phaser.Math.Distance.Between(p.x, p.y, z.x, z.y) < z.r) g.applyPlayerStatus([{ ...st }]);
        for (const e of g.grid.query(z.x, z.y, z.r, g.tmp2)) if (!e.isBoss) e.status.apply({ ...st });
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
        {
          const T = TERRAIN_TUNING.sprinkler;
          if (this.sprinklers.length && this.tick('sprinkler', dt, T.every, T.minWave)) {
            const s = Phaser.Utils.Array.GetRandom(this.sprinklers);
            this.pulse(s);
            g.fx.telegraphCircle(s.x, s.y, T.radius, 1.0, 0x4895ef, () => {
              g.fx.ring(s.x, s.y, T.radius, 0x4895ef, 500, true);
              for (let i = 0; i < 6; i++) this.puff(s.x + Phaser.Math.Between(-60, 60), s.y + Phaser.Math.Between(-60, 60), 0.6);
              if (Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y) < T.radius) g.applyPlayerStatus([{ ...T.status }]);
              for (const e of g.grid.query(s.x, s.y, T.radius, g.tmp2)) e.status.apply({ ...T.status });
            });
            g.terrainNotice(tx('洒水器启动！', 'Sprinkler on!'));
          }
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
      case 6:
        if (this.tick('spore', dt, 9, 2)) {
          for (let i = 0; i < 2 + Math.floor(run.wave / 6); i++) {
            const x = p.x + Phaser.Math.Between(-220, 220),
              y = p.y + Phaser.Math.Between(-160, 160);
            g.fx.telegraphCircle(x, y, 65, 1.1, 0x70e000, () =>
              g.addHazard(x, y, 65, 4, this.dmg(3), [{ id: 'poison', dur: 3, stacks: 2 }], 0x80b918),
            );
          }
          g.terrainNotice(tx('孢子喷发！', 'Spore burst!'));
        }
        if (this.tick('compost', dt, 11, 3)) {
          const h = Phaser.Utils.Array.GetRandom(this.holes);
          this.pulse(h);
          for (let i = 0; i < 3; i++) g.time.delayedCall(i * 250, () => g.spawnEnemyNow('blight_sprout', h.x, h.y));
        }
        if (this.tick('lamp_move', dt, TERRAIN_TUNING.lamp.move)) this.moveLamp();
        break;
      case 4:
      case 7:
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
          g.terrainNotice(this.ch === 7 ? tx('烂果坠落！', 'Rotten fruit falling!') : tx('垃圾坠落！', 'Falling junk!'));
        }
        if (this.ch === 4 && this.tick('move', dt, 20)) {
          const old = this.zones.shift();
          if (old) g.tweens.add({ targets: old.img, alpha: 0, duration: 800, onComplete: () => old.img.destroy() });
          this.addQuicksand();
        }
        if (this.ch === 4) {
          const T = TERRAIN_TUNING.acid;
          if (this.tick('acid', dt, T.every, T.minWave)) {
            for (let i = 0; i < 1 + Math.floor(run.wave / 8); i++) {
              const x = p.x + Phaser.Math.Between(-200, 200),
                y = p.y + Phaser.Math.Between(-150, 150);
              g.fx.telegraphCircle(x, y, T.radius, 1.1, 0xa7c957, () =>
                g.addHazard(x, y, T.radius, T.life, this.dmg(T.baseDmg), [{ ...T.status }], 0x90a955),
              );
            }
            g.terrainNotice(tx('酸液泄漏！', 'Acid leak!'));
          }
        }
        if (this.ch === 7) {
          const T = TERRAIN_TUNING.bramble;
          if (this.tick('bramble', dt, T.every, T.minWave)) {
            for (let i = 0; i < 3; i++) {
              const a = (i / 3) * Math.PI * 2 + Math.random();
              const d = i === 0 ? 0 : Phaser.Math.Between(70, 140);
              const x = p.x + Math.cos(a) * d,
                y = p.y + Math.sin(a) * d;
              g.fx.telegraphCircle(x, y, T.radius, 0.9, 0x6a994e, () => {
                g.fx.explosion(x, y, T.radius, 0x386641);
                if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < T.radius + 8)
                  g.damagePlayer(
                    this.dmg(T.baseDmg),
                    undefined,
                    T.status.map((s) => ({ ...s })),
                  );
                for (const e of g.grid.query(x, y, T.radius, g.tmp2)) g.damageEnemy(e, 15 + run.wave * 5);
              });
            }
            g.terrainNotice(tx('荆棘破土！', 'Brambles erupt!'));
          }
        }
        break;
      case 5:
        for (const h of Terrain.off.has('vent') ? [] : this.holes) {
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

  /** 补光灯换位：淡出最早的一盏，在远离玩家处重新点亮 */
  private moveLamp(): void {
    const i = this.zones.findIndex((z) => z.kind === 'lamp');
    if (i < 0) return;
    const [old] = this.zones.splice(i, 1);
    this.g.tweens.add({ targets: old.img, alpha: 0, duration: 800, onComplete: () => old.img.destroy() });
    const A = this.g.arena,
      p = this.g.player;
    let x = 0,
      y = 0;
    for (let k = 0; k < 20; k++) {
      x = Phaser.Math.Between(A.x + 240, A.right - 240);
      y = Phaser.Math.Between(A.y + 240, A.bottom - 240);
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) > 260) break;
    }
    this.addRoundZone('lamp', x, y, TERRAIN_TUNING.lamp.radius, 0xffe066);
    this.g.terrainNotice(tx('补光灯换位了！', 'The grow lamp moved!'));
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
