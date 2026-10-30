import { createSaucePool } from './JuiceArt';
// 双契合武器的契合技（docs/design/DOUBLE_SYNERGY.md；说明文字与武器对照表见 data/synergy.ts）。
// 标签特性强化是常驻属性，放在 Talents.affMods 里；这里只实现按次数 / 时间 / 命中触发的武器机制。
// 契合技自己打出的伤害（气刃、碎片、余震、地带……）都带 echo 标记，不会再触发天赋与契合技。
import Phaser from 'phaser';
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import type { Bullet } from '../objects/Bullet';
import type { StatusApply } from '../data/statuses';
import { WEAPON_MAP, type WeaponDef } from '../data/weapons';
import { isDoubleFavored } from '../data/affinity';
import { synergySkill } from '../data/synergy';
import { run } from './RunState';
import type { ShotMods } from './Talents';

/** WeaponSystem 每把武器上的契合技状态 */
export interface SynRun {
  /** 契合技（专属键或攻击方式）；不是双契合为 null */
  key: string | null;
  /** 出手计数 */
  n: number;
  /** 计时器（护盾、脉冲） */
  t: number;
  /** 连珠：当前攻速加成与停火计时 */
  ramp: number;
  rampT: number;
}

interface Zone {
  x: number;
  y: number;
  r: number;
  t: number;
  tick: number;
  info: HitInfo;
  img: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
  /** 每次结算时额外做的事（西兰花放电） */
  zap?: boolean;
}

const S = (id: StatusApply['id'], dur: number, stacks = 1, chance?: number): StatusApply => ({ id, dur, stacks, chance });

export class Synergy {
  private zones: Zone[] = [];
  private wave = -1;
  private fruits = 0;
  private seeds = 0;
  private healT = 0;
  private healN = 0;
  private stickLive = 0;
  private stench = new WeakMap<Enemy, number>();

  constructor(private g: GameScene) {}

  /** 武器的契合技状态（WeaponSystem 建武器时调用） */
  init(def: WeaponDef): SynRun {
    const key = isDoubleFavored(run.char.favored, def) ? synergySkill(def).key : null;
    return { key, n: 0, t: 0, ramp: 0, rampT: 0 };
  }

  private resetWave(): void {
    if (this.wave === run.wave) return;
    this.wave = run.wave;
    this.fruits = 0;
    this.seeds = 0;
  }

  // ---------------- 小工具 ----------------
  private echo(info: HitInfo, mult: number, extra: Partial<HitInfo> = {}): HitInfo {
    return { ...info, dmg: info.dmg * mult, echo: true, rageBurst: undefined, ...extra };
  }

  /** 以 (x, y) 为圆心打一圈 */
  private hitAround(x: number, y: number, r: number, info: HitInfo, knock = 0, skip?: Enemy): void {
    const g = this.g;
    for (const e of [...g.grid.query(x, y, r, g.tmp)]) if (e !== skip) g.weaponHit(e, { ...info, knockback: knock }, x, y);
  }

  /** 从 (x, y) 朝四周（或朝 dir 的扇形）射出 n 颗小碎片 */
  private shards(x: number, y: number, n: number, info: HitInfo, tint: number, key = 'proj_player', dir?: number): void {
    const g = this.g;
    for (let k = 0; k < n; k++) {
      const a = dir === undefined ? (k / n) * Math.PI * 2 + Math.random() * 0.3 : dir - 0.5 + (n > 1 ? k / (n - 1) : 0.5);
      const b = g.spawnPlayerBullet(key, x, y, a, 480, 0.55, 7);
      this.arm(b, info, tint);
      b.setScale(0.7);
    }
  }

  private arm(b: Bullet, info: HitInfo, tint: number): void {
    b.dmg = info.dmg;
    b.crit = info.crit;
    b.critBonus = info.critBonus ?? 0;
    b.knockback = info.knockback ?? 0;
    b.status = info.status;
    b.src = info.weaponId ?? '';
    b.echo = true;
    b.setTint(tint);
  }

  /** 地面效果：每 0.5 秒对范围内敌人结算一次 info（伤害 + 状态） */
  private zone(x: number, y: number, r: number, dur: number, info: HitInfo, color: number, zap = false, sauce = false): void {
    const g = this.g;
    if (this.zones.length >= 16) this.zones.shift()?.img.destroy();
    const img = sauce
      ? createSaucePool(g, x, y, r, color, 0.5)
      : g.add
          .image(x, y, 'fx_pool')
          .setTint(color)
          .setAlpha(0.5)
          .setDepth(1.4)
          .setScale((r * 2) / 256);
    this.zones.push({ x, y, r, t: dur, tick: 0, info, img, zap });
  }

  /** 子母弹：在 (x, y) 附近依次炸开 n 颗小炸弹 */
  private bomblets(x: number, y: number, n: number, r: number, info: HitInfo, color: number): void {
    const g = this.g;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2,
        d = r * (0.6 + Math.random() * 0.6);
      const bx = x + Math.cos(a) * d,
        by = y + Math.sin(a) * d;
      g.time.delayedCall(140 + k * 90, () => g.explode(bx, by, r * 0.5, info.dmg, { ...info, explosion: true }, color));
    }
  }

  /** 直线气刃 */
  private airBlade(x: number, y: number, a: number, range: number, info: HitInfo, knock: number, tint: number): void {
    const b = this.g.spawnPlayerBullet('proj_player', x, y, a, 760, (range * 1.4) / 760, 12);
    this.arm(b, { ...info, knockback: knock }, tint);
    b.pierce = 99;
    b.setScale(1.5, 0.7);
  }

  // ---------------- WeaponSystem 调用 ----------------
  /** 出手前：本次开火的一次性加成（强化弹、三连箭、浮游炮、连珠） */
  preAttack(sr: SynRun, sm: ShotMods): void {
    if (!sr.key) return;
    const n = ++sr.n;
    switch (sr.key) {
      case 'bullet':
        if (n % 5 === 0) {
          sm.mult *= 2;
          sm.pierce += 2;
          const prev = sm.bullet;
          sm.bullet = (b) => {
            prev?.(b);
            b.setScale(b.scaleX * 1.6);
          };
        }
        break;
      case 'tripleArrow':
        if (n % 4 === 0) sm.count += 2;
        break;
      case 'extraDrone':
        sm.count += 1;
        break;
      case 'cherryRamp':
        sr.ramp = Math.min(30, sr.ramp + 1.5);
        sr.rampT = 1;
        break;
    }
  }

  /** 出手后：按次数触发的契合技 */
  postAttack(sr: SynRun, def: WeaponDef, hx: number, hy: number, a: number, t: Enemy, range: number, info: HitInfo): void {
    if (!sr.key || info.echo) return;
    const n = sr.n;
    const tint = def.projTint ?? 0xfff4ea;
    switch (sr.key) {
      case 'thrust':
        if (n % 3 === 0) this.airBlade(hx, hy, a, range, this.echo(info, 0.6), 0, 0xfff4ea);
        break;
      case 'lanceCharge':
        if (n % 3 === 0) this.airBlade(hx, hy, a, range, this.echo(info, 0.6), 90, 0xffd166);
        break;
      case 'acidSplash':
        if (n % 3 === 0) {
          this.hitAround(t.x, t.y, 90, this.echo(info, 0.3, { status: [S('armorBreak', 4, 2)] }));
          this.g.fx.ring(t.x, t.y, 90, 0xffe066, 300);
        }
        break;
      case 'dragonBreath':
        if (n % 3 === 0) {
          const far = range * 1.8;
          for (const e of [...this.g.grid.query(hx, hy, far, this.g.tmp)]) {
            const d = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(e.y - hy, e.x - hx) - a));
            if (d < 0.6) this.g.weaponHit(e, this.echo(info, 1.2, { status: [S('burn', 3, 2)] }), hx, hy);
          }
          this.g.fx.burst(hx + Math.cos(a) * range, hy + Math.sin(a) * range, 0xff4b3e, 14);
        }
        break;
      case 'fistWave':
        if (n % 4 === 0) {
          this.hitAround(t.x, t.y, 90, this.echo(info, 0.8), 40);
          this.g.fx.ring(t.x, t.y, 90, 0xa47148, 280);
        }
        break;
      case 'sweep':
        if (n % 4 === 0) {
          this.hitAround(hx, hy, range, this.echo(info, 1), 20);
          this.g.fx.ring(hx, hy, range, tint, 320);
        }
        break;
      case 'melonQuake':
        if (n % 4 === 0) {
          this.hitAround(hx, hy, range * 1.4, this.echo(info, 0.35, { status: [S('slow', 2, 2)] }));
          this.g.fx.ring(hx, hy, range * 1.4, 0xff4d6d, 360);
        }
        break;
      case 'flame':
        if (n % 3 === 0) this.zone(t.x, t.y, 60, 2, this.echo(info, 0.2, { status: [S('burn', 2)] }), 0xff7b00);
        break;
      case 'sauceZone':
        if (n % 3 === 0) this.zone(t.x, t.y, 70, 3, this.echo(info, 0.15, { status: [S('slow', 2), S('burn', 2)] }), 0xc1121f, false, true);
        break;
      case 'sporeCloud':
        if (n % 4 === 0) this.zone(t.x, t.y, 80, 3, this.echo(info, 0.1, { status: [S('poison', 4)] }), 0x9d4edd);
        break;
      case 'popcornRing':
        if (n % 3 === 0) this.shards(t.x, t.y, 8, this.echo(info, 0.35), 0xffd166);
        break;
      case 'macaronBurst':
        if (n % 6 === 0) this.shards(t.x, t.y, 5, this.echo(info, 0.4), 0xffafcc);
        break;
      case 'grapeTrick':
        if (n % 3 === 0) this.shards(t.x, t.y, 3, this.echo(info, 0.5), 0x9d4edd, 'proj_grape_shotgun');
        break;
      case 'peaSprout':
        if (n % 5 === 0) this.sprout(t.x, t.y, this.echo(info, 0.5));
        break;
    }
  }

  /** 豌豆苗：在 (x, y) 冒出，0.3 秒一颗向最近的敌人吐 3 颗豌豆 */
  private sprout(x: number, y: number, info: HitInfo): void {
    const g = this.g;
    g.fx.burst(x, y, 0x38b000, 8);
    for (let k = 0; k < 3; k++)
      g.time.delayedCall(250 + k * 300, () => {
        const e = g.grid.nearest(x, y, 300);
        if (!e) return;
        const b = g.spawnPlayerBullet('proj_pea', x, y, Math.atan2(e.y - y, e.x - x), 600, 0.6, 7);
        this.arm(b, info, 0x70e000);
      });
  }

  /** 每颗子弹生成后：挂上命中 / 爆炸 / 半程回调 */
  onBullet(sr: SynRun, def: WeaponDef, b: Bullet, info: HitInfo): void {
    if (!sr.key || info.echo) return;
    const g = this.g;
    const tint = def.projTint ?? 0xfff4ea;
    const boom = (fn: (x: number, y: number) => void) => (b.onBoom = fn);
    const half = (fn: (x: number, y: number) => void) =>
      g.time.delayedCall(b.pathDur * 500, () => {
        if (b.alive && b.kind === 'boomerang') fn(b.x, b.y);
      });
    switch (sr.key) {
      case 'rocket':
        boom((x, y) => this.bomblets(x, y, 3, (def.effect?.explode ?? 60) * b.areaMul, this.echo(info, 0.3), 0xff9f1c));
        break;
      case 'chiliCluster':
        boom((x, y) => this.bomblets(x, y, 4, (def.effect?.explode ?? 60) * b.areaMul, this.echo(info, 0.35), 0xff4b3e));
        break;
      case 'beanPop':
        boom((x, y) => this.shards(x, y, 5, this.echo(info, 0.4), 0xe9c46a));
        break;
      case 'seedBurst':
        boom((x, y) => this.shards(x, y, 6, this.echo(info, 0.35), 0xc1121f));
        break;
      case 'boomerang':
        half((x, y) => this.towardNearest(x, y, 2, this.echo(info, 0.35), tint));
        break;
      case 'aniseShatter':
        half((x, y) => this.shards(x, y, 6, this.echo(info, 0.25), 0xb5651d));
        break;
      case 'onionPeel':
        half((x, y) => this.towardNearest(x, y, 3, this.echo(info, 0.45), 0xe0aaff));
        break;
      case 'wispBounce':
        b.bounce += 2;
        break;
      case 'knifeStick':
        b.onHit = (e) => {
          if (this.stickLive >= 12) return;
          this.stickLive++;
          g.time.delayedCall(1000, () => {
            this.stickLive--;
            if (e.alive) g.explode(e.x, e.y, 50, info.dmg * 0.4, this.echo(info, 0.4, { explosion: true }), 0x95d5b2);
          });
        };
        break;
      case 'redEnvelope':
        if (b.crit)
          b.onHit = (e) => {
            this.resetWave();
            if (this.seeds >= 15) return;
            this.seeds++;
            g.dropSeed(e.x, e.y);
          };
        break;
    }
  }

  /** 朝最近的 n 个方向各射一颗小镖 */
  private towardNearest(x: number, y: number, n: number, info: HitInfo, tint: number): void {
    const g = this.g;
    const near = g.grid.query(x, y, 320, g.tmp).slice(0, n);
    for (let k = 0; k < n; k++) {
      const e = near[k];
      const a = e ? Math.atan2(e.y - y, e.x - x) : Math.random() * Math.PI * 2;
      const b = g.spawnPlayerBullet('proj_player', x, y, a, 520, 0.6, 8);
      this.arm(b, info, tint);
      b.setScale(0.75);
    }
  }

  /** 地雷爆炸后 */
  mineBoom(sr: SynRun, x: number, y: number, r: number, info: HitInfo, color: number): void {
    if (!sr.key) return;
    const g = this.g;
    if (sr.key === 'mine')
      g.time.delayedCall(500, () => g.explode(x, y, r * 0.8, info.dmg * 0.5, this.echo(info, 0.5, { explosion: true }), color));
    else if (sr.key === 'beanPop') this.shards(x, y, 5, this.echo(info, 0.4), 0xe9c46a);
  }

  /** 连锁闪电结束后 */
  chainEnd(sr: SynRun, hits: Enemy[], info: HitInfo, color: number): void {
    if (!sr.key || !hits.length) return;
    const g = this.g;
    const last = hits[hits.length - 1];
    if (sr.key === 'chain') {
      if (last.alive) {
        g.weaponHit(last, this.echo(info, 0.6), last.x, last.y);
        g.fxLightning(
          [
            { x: last.x, y: last.y - 60 },
            { x: last.x, y: last.y },
          ],
          color,
        );
      }
    } else if (sr.key === 'broccoliTree' && sr.n % 3 === 0) {
      this.zone(last.x, last.y, 150, 3, this.echo(info, 0.3), 0x52b788, true);
      g.fx.burst(last.x, last.y, 0x52b788, 10);
    }
  }

  /** 光环每次结算后 */
  auraTick(sr: SynRun, hits: Enemy[], info: HitInfo): void {
    if (!sr.key) return;
    const g = this.g;
    if (sr.key === 'garlicDrain') {
      const dead = hits.filter((e) => !e.alive).length;
      if (g.time.now - this.healT > 1000) {
        this.healT = g.time.now;
        this.healN = 0;
      }
      const n = Math.min(dead, 3 - this.healN);
      if (n > 0) {
        this.healN += n;
        g.heal(n, true, 'synergy');
      }
    } else if (sr.key === 'stinkBurst') {
      for (const e of hits) {
        if (!e.alive) continue;
        const k = (this.stench.get(e) ?? 0) + 1;
        if (k >= 3) {
          this.stench.set(e, 0);
          this.shards(e.x, e.y, 8, this.echo(info, 0.4), 0xc9b458);
        } else this.stench.set(e, k);
      }
    }
  }

  /** 每帧：返回 true 表示这一帧要让光环脉冲（默认光环契合技） */
  update(sr: SynRun, def: WeaponDef, dt: number, range: number): boolean {
    if (!sr.key) return false;
    const g = this.g;
    if (sr.rampT > 0 && (sr.rampT -= dt) <= 0) sr.ramp = 0;
    sr.t += dt;
    if (sr.key === 'aura' && sr.t >= 4) {
      sr.t = 0;
      return def.kind === 'aura';
    }
    const guard = sr.key === 'taroWard' ? { every: 2, r: range } : sr.key === 'panGuard' ? { every: 3, r: 110 } : null;
    if (guard && sr.t >= guard.every) {
      const p = g.player;
      const b = g.enemyBullets.find((x) => x.alive && Math.hypot(x.x - p.x, x.y - p.y) < guard.r);
      if (b) {
        sr.t = 0;
        g.fx.ring(b.x, b.y, 24, sr.key === 'taroWard' ? 0xb39ddb : 0xb2bec3, 200);
        b.kill();
      }
    }
    return false;
  }

  /** 额外攻速 %（连珠、血怒） */
  extraSpeed(sr: SynRun): number {
    if (sr.key === 'cherryRamp') return sr.ramp;
    if (sr.key === 'bloodRage') return 40 * Math.max(0, 1 - run.hp / Math.max(1, this.g.stats.maxHp));
    return 0;
  }

  /** 额外范围 %（禅定：站着不动时） */
  extraArea(sr: SynRun): number {
    return sr.key === 'zenSweep' && this.g.moveX === 0 && this.g.moveY === 0 ? 40 : 0;
  }

  /** GameScene.weaponHit 每次命中后（只处理武器本体的命中） */
  afterHit(e: Enemy, info: HitInfo, frozen: boolean): void {
    if (info.echo || !info.weaponId) return;
    const def = WEAPON_MAP[info.weaponId];
    if (!def || !isDoubleFavored(run.char.favored, def)) return;
    const g = this.g;
    const fav = run.char.favored;
    this.resetWave();
    if (fav.includes('蔬果') && this.fruits < 3 && Math.random() < 0.03) {
      this.fruits++;
      g.dropFruit(e.x, e.y);
    }
    if (fav.includes('甜点') && Math.random() < 0.02) g.heal(1, true, 'synergy');
    const key = synergySkill(def).key;
    switch (key) {
      case 'honeyStick':
        if (e.alive) {
          g.applyDot(e, S('sticky', 1.2));
          g.applyDot(e, S('vulnerable', 2));
        }
        break;
      case 'truthMark':
        if (e.alive) g.applyDot(e, S('mark', 4));
        break;
      case 'curseSpread': {
        if (e.alive) g.applyDot(e, S('curse', 4));
        const o = g.grid.nearest(e.x, e.y, 180, new Set([e]));
        if (o) g.applyDot(o, S('curse', 4));
        break;
      }
      case 'yamDrop':
        if (this.fruits < 3 && Math.random() < 0.02) {
          this.fruits++;
          g.dropFruit(e.x, e.y);
        }
        break;
      case 'iceShatter':
        if (frozen) {
          this.hitAround(e.x, e.y, 70, this.echo(info, 0.6), 0, e);
          g.fx.burst(e.x, e.y, 0x90e0ef, 10);
        } else if (e.alive && Math.random() < 0.1) g.applyDot(e, S('freeze', 1));
        break;
    }
  }

  /** 地面效果计时（WeaponSystem.update 每帧调一次） */
  tick(dt: number): void {
    const g = this.g;
    for (const z of this.zones) {
      z.t -= dt;
      z.tick -= dt;
      if (z.tick <= 0 && z.t > 0) {
        z.tick = 0.5;
        if (z.zap) {
          const e = g.grid.nearest(z.x, z.y, z.r);
          if (e) {
            g.weaponHit(e, z.info, z.x, z.y);
            g.fxLightning(
              [
                { x: z.x, y: z.y },
                { x: e.x, y: e.y },
              ],
              0x9ef01a,
            );
          }
        } else for (const e of [...g.grid.query(z.x, z.y, z.r, g.tmp)]) g.weaponHit(e, z.info, z.x, z.y);
      }
      if (z.t <= 0) z.img.destroy();
      else if (z.t < 0.5) z.img.setAlpha(z.t);
    }
    this.zones = this.zones.filter((z) => z.t > 0);
  }

  destroy(): void {
    for (const z of this.zones) z.img.destroy();
    this.zones = [];
  }
}
