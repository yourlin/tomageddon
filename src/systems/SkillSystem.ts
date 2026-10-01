// 角色主动技能（大招）
// 伤害 = 当前武器平均单次伤害 × 系数 ×（1+技能伤害%）；范围受射程与技能范围影响；持续时间受技能持续影响
import { treeTotals } from './TalentTree';
import { bump } from './Counters';
import Phaser from 'phaser';
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { SkillDef } from '../data/characters';
import type { Stats, StatMods } from '../data/stats';
import type { StatusApply } from '../data/statuses';
import { run } from './RunState';
import { audio } from './Audio';
import type { Enemy } from '../objects/Enemy';
import { Rig } from '../objects/Rig';
import { weaponDamage } from './WeaponSystem';
import { WEAPON_MAP } from '../data/weapons';
import { castFx, drainLines } from './SkillFx';
import { tx } from '../i18n';

interface Field {
  x: number;
  y: number;
  r: number;
  t: number;
  tick: number;
  img: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Image;
  info: HitInfo;
}

/** 技能自带回复量的整体系数（数据里 heal: 0.2 → 实际回复 9% 最大生命） */
const HEAL_SCALE = 0.45;

export class SkillSystem {
  skill: SkillDef;
  cd = 3;
  buffT = 0;
  buffMods: StatMods | null = null;
  ghostT = 0;
  dash: { t: number; vx: number; vy: number; hit: Set<Enemy>; info: HitInfo } | null = null;
  clone: { rig: Rig; t: number; shoot: number; dmg: number } | null = null;
  fields: Field[] = [];

  constructor(private g: GameScene) {
    this.skill = run.char.skill;
    this.cd = 0; // 每波开局技能冷却重置
  }

  get maxCd(): number {
    return this.skill.cd * Math.max(0.3, 1 - this.g.stats.skillCd / 100);
  }
  get ready(): boolean {
    return this.cd <= 0;
  }
  get invulnerable(): boolean {
    return this.ghostT > 0 || this.dash !== null;
  }

  /** 当前武器平均单次伤害（技能伤害的基准，保证与普攻同一量级） */
  private power(s: Stats): number {
    const ws = run.weapons;
    if (!ws.length) return 8;
    let sum = 0;
    for (const w of ws) sum += weaponDamage(WEAPON_MAP[w.id], w.tier, s, w);
    return sum / ws.length;
  }

  private damage(s: Stats, mult = this.skill.mult ?? 1): number {
    return Math.max(1, this.power(s) * mult * (1 + s.skillDmg / 100));
  }

  /** 技能范围：受射程（±40%）与技能范围属性影响 */
  radius(base: number): number {
    const s = this.g.stats;
    return base * Phaser.Math.Clamp(1 + s.range / 600, 0.8, 1.4) * Math.max(0.5, 1 + s.skillRange / 100);
  }

  private dur(base: number): number {
    return base * Math.max(0.5, 1 + this.g.stats.skillDur / 100);
  }

  /** 技能施加的状态：持续时间受技能持续属性加成 */
  private statuses(list: StatusApply[] | undefined): StatusApply[] | undefined {
    return list?.map((a) => ({ ...a, dur: a.dur >= 900 ? a.dur : this.dur(a.dur) }));
  }

  private densestTarget(r: number): { x: number; y: number } | null {
    const g = this.g;
    let best: Enemy | null = null,
      bestN = -1;
    let k = 0;
    for (const e of g.enemies) {
      if (!e.alive || k++ > 40) continue;
      if (Phaser.Math.Distance.Between(e.x, e.y, g.player.x, g.player.y) > 700) continue;
      const n = g.grid.query(e.x, e.y, r * 0.8, g.tmp2).length + (e.isBoss ? 3 : 0);
      if (n > bestN) {
        bestN = n;
        best = e;
      }
    }
    return best ? { x: best.x, y: best.y } : null;
  }

  /** 自动释放判断：按技能形态选择时机（范围伤害等敌人扎堆、回复等掉血、保命技能等危险） */
  autoWants(): boolean {
    const g = this.g,
      p = g.player;
    let near = 0,
      nearest = 1e9,
      bossNear = false;
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 260) near++;
      if (d < nearest) nearest = d;
      if (e.isBoss && d < 450) bossNear = true;
    }
    const hpPct = run.hp / g.stats.maxHp;
    switch (this.skill.type) {
      case 'heal':
        return hpPct < 0.6 || near >= 8;
      case 'ghost':
      case 'dash':
        return (hpPct < 0.5 && nearest < 140) || near >= 8 || bossNear;
      case 'buff':
        return near >= 4 || bossNear;
      case 'clone':
        return near >= 3 || bossNear;
      default:
        return near >= 5 || bossNear;
    }
  }

  use(): void {
    if (!this.ready) return;
    const g = this.g;
    const sk = this.skill;
    const s = g.stats;
    const p = g.player;
    this.cd = this.maxCd;
    // 天赋：施法回复、施法增益、回响（立刻冷却完毕）
    const tt = treeTotals();
    if (tt.castHeal) g.heal(Math.max(1, Math.round((g.stats.maxHp * tt.castHeal) / 100)));
    if (tt.castSelf.length) g.applyPlayerStatus(tt.castSelf);
    if (tt.skillEcho && Math.random() * 100 < tt.skillEcho) {
      this.cd = Math.min(this.cd, 0.4);
      g.fx.label(p.x, p.y - 40, tx('回响！', 'Echo!'), '#b46bff');
    }
    bump('casts');
    bump(`cast:${sk.type}`);
    audio.play(g, 'skill');
    p.play('cast', true);
    castFx(g, sk, sk.type === 'buff' || sk.type === 'ghost' ? this.dur(sk.duration ?? 3) : 0, Math.atan2(g.moveY || 0.0001, g.moveX || 1));
    const status = this.statuses(sk.status);
    const info: HitInfo = { dmg: this.damage(s), crit: false, knockback: 30, lifeSteal: 0, status, weaponId: 'skill' };
    if (sk.selfStatus) g.applyPlayerStatus(this.statuses(sk.selfStatus));
    if (sk.xp) run.addXp(sk.xp);

    switch (sk.type) {
      case 'nova': {
        const r = this.radius(sk.radius ?? 180);
        g.fx.nova(p.x, p.y, r, sk.color);
        for (const e of [...g.grid.query(p.x, p.y, r, g.tmp)]) g.weaponHit(e, { ...info, knockback: 60 }, p.x, p.y);
        g.shake(0.006, 150);
        break;
      }
      case 'curse': {
        // 群体减益：大范围施加状态，伤害很低
        const r = (sk.radius ?? 260) >= 600 ? 3000 : this.radius(sk.radius ?? 260);
        g.fx.nova(p.x, p.y, Math.min(r, 900), sk.color);
        for (const e of [...g.grid.query(p.x, p.y, r, g.tmp)]) {
          g.weaponHit(e, { ...info, knockback: 0 }, p.x, p.y);
          g.fx.burst(e.x, e.y - e.radius, sk.color, 2);
        }
        break;
      }
      case 'screen': {
        // 全屏攻击：镜头内所有敌人
        const v = g.cameras.main.worldView;
        g.cameras.main.flash(180, 255, 255, 255, false);
        for (const e of [...g.enemies]) {
          if (!e.alive || !v.contains(e.x, e.y)) continue;
          g.fx.bolt(
            [
              { x: e.x + Phaser.Math.Between(-40, 40), y: e.y - 500 },
              { x: e.x, y: e.y },
            ],
            sk.color,
          );
          g.weaponHit(e, { ...info, knockback: 0 }, e.x, e.y - 10);
        }
        g.shake(0.01, 250);
        break;
      }
      case 'missile': {
        // 发射 AOE：向敌群最密集处发射炮弹，落地爆炸
        const r = this.radius(sk.radius ?? 150);
        const t = this.densestTarget(r) ?? { x: p.x + g.facing * 250, y: p.y };
        const gold = run.charId === 'pineapple';
        const shell = g.add
          .image(p.x, p.y, gold ? 'proj_coin' : 'proj_rocket')
          .setDepth(14000)
          .setScale(2);
        const sx = p.x,
          sy = p.y;
        g.fx.telegraphCircle(t.x, t.y, r, 0.45, sk.color);
        g.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 450,
          onUpdate: (tw) => {
            const k = tw.getValue() ?? 0;
            shell.setPosition(sx + (t.x - sx) * k, sy + (t.y - sy) * k - Math.sin(k * Math.PI) * 160).setRotation(k * 8);
          },
          onComplete: () => {
            shell.destroy();
            g.explode(t.x, t.y, r, info.dmg, info, sk.color, gold);
            g.shake(0.012, 250);
          },
        });
        break;
      }
      case 'barrage': {
        // 单体连发：对单个目标高速连射
        const n = sk.count ?? 10;
        const pick = () => {
          if (run.charId === 'asparagus') {
            let best: Enemy | null = null;
            for (const e of g.grid.query(p.x, p.y, 600, g.tmp)) if (!best || e.hp > best.hp) best = e;
            return best;
          }
          return g.grid.nearest(p.x, p.y, 600);
        };
        for (let i = 0; i < n; i++) {
          g.time.delayedCall(i * 70, () => {
            const t = pick();
            if (!t) return;
            const b = g.spawnPlayerBullet(
              run.charId === 'pea' ? 'proj_pea' : 'proj_player',
              p.x,
              p.y,
              Math.atan2(t.y - p.y, t.x - p.x) + Phaser.Math.FloatBetween(-0.05, 0.05),
              950,
              0.8,
              10,
            );
            b.dmg = info.dmg;
            b.pierce = run.charId === 'asparagus' ? 3 : 0;
            b.status = status;
            b.setTint(sk.color);
            audio.play(g, 'shoot', 0.03);
          });
        }
        break;
      }
      case 'field': {
        // 禁锢领域：在身边展开区域，持续对区域内敌人施加控制
        const r = this.radius(sk.radius ?? 180);
        const img = g.add
          .image(p.x, p.y, 'fx_pool')
          .setTint(sk.color)
          .setAlpha(0.45)
          .setDepth(1.5)
          .setScale((r * 2) / 256);
        const ring = g.add
          .image(p.x, p.y, 'fx_ring')
          .setTint(sk.color)
          .setAlpha(0.9)
          .setDepth(1.6)
          .setScale((r * 2) / 128);
        this.fields.push({ x: p.x, y: p.y, r, t: this.dur(sk.duration ?? 5), tick: 0, img, ring, info: { ...info, knockback: 0 } });
        g.fx.nova(p.x, p.y, r, sk.color);
        break;
      }
      case 'dash': {
        let dx = g.moveX,
          dy = g.moveY;
        if (!dx && !dy) {
          dx = g.facing;
          dy = 0;
        }
        const len = Math.hypot(dx, dy) || 1;
        const dur = 0.22;
        const speed = this.radius(sk.distance ?? 300) / dur;
        this.dash = { t: dur, vx: (dx / len) * speed, vy: (dy / len) * speed, hit: new Set(), info };
        if (sk.heal) g.heal(Math.round(s.maxHp * sk.heal * HEAL_SCALE));
        break;
      }
      case 'buff': {
        this.buffT = this.dur(sk.duration ?? 5);
        this.buffMods = sk.mods ?? null;
        g.recalcStats();
        g.fx.nova(p.x, p.y, 120, sk.color);
        break;
      }
      case 'ghost': {
        this.ghostT = this.dur(sk.duration ?? 2.5);
        this.buffT = this.ghostT;
        this.buffMods = sk.mods ?? null;
        g.recalcStats();
        p.setAlpha(0.45);
        break;
      }
      case 'ring': {
        const n = sk.count ?? 18;
        for (let i = 0; i < n; i++) {
          const b = g.spawnPlayerBullet(
            'proj_player',
            p.x,
            p.y,
            (i / n) * Math.PI * 2,
            620,
            0.9 * Math.max(0.5, 1 + s.skillRange / 100),
            10,
          );
          b.dmg = info.dmg;
          b.pierce = 2;
          b.knockback = 20;
          b.status = status;
          b.setTint(sk.color);
        }
        break;
      }
      case 'heal': {
        const r = this.radius(sk.radius ?? 180);
        const hits = [...g.grid.query(p.x, p.y, r, g.tmp)];
        drainLines(g, hits);
        g.fx.nova(p.x, p.y, r, sk.color);
        for (const e of hits) {
          g.weaponHit(e, info, p.x, p.y);
          g.fx.bolt(
            [
              { x: e.x, y: e.y },
              { x: p.x, y: p.y },
            ],
            0xff4d6d,
          );
        }
        // 吸取：每命中 1 个敌人回 0.5 点，最多 6% 最大生命；再加技能自带的回复量（整体 ×HEAL_SCALE）
        g.heal(Math.min(Math.round(s.maxHp * 0.06), Math.round(hits.length * 0.5)) + Math.round(s.maxHp * (sk.heal ?? 0) * HEAL_SCALE));
        break;
      }
      case 'strikes': {
        const n = sk.count ?? 6;
        const alive = g.enemies.filter((e) => e.alive && Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < 700);
        Phaser.Utils.Array.Shuffle(alive);
        const r = this.radius(sk.radius ?? 80);
        for (let i = 0; i < n; i++) {
          const target = alive[i];
          const x = target ? target.x : p.x + Phaser.Math.Between(-250, 250);
          const y = target ? target.y : p.y + Phaser.Math.Between(-200, 200);
          g.time.delayedCall(i * 90, () => {
            g.fx.bolt(
              [
                { x: x + Phaser.Math.Between(-30, 30), y: y - 500 },
                { x, y },
              ],
              sk.color,
            );
            g.explode(x, y, r, info.dmg, info, sk.color);
          });
        }
        break;
      }
      case 'clone': {
        const rig = new Rig(g, run.char.look, `char_${run.charId}`, p.radius * 0.9);
        g.add.existing(rig);
        rig.setPosition(p.x + 40, p.y).setAlpha(0.7);
        rig.setStatusTint(0x9ecbff);
        rig.play('spawn', true);
        this.clone = { rig, t: this.dur(sk.duration ?? 8), shoot: 0, dmg: info.dmg };
        break;
      }
    }
  }

  update(dt: number): void {
    const g = this.g;
    if (this.cd > 0) this.cd -= dt;
    if (this.buffT > 0) {
      this.buffT -= dt;
      if (this.buffT <= 0) {
        this.buffMods = null;
        g.recalcStats();
      }
    }
    if (this.ghostT > 0) {
      this.ghostT -= dt;
      if (this.ghostT <= 0) g.player.setAlpha(1);
    }
    if (this.dash) {
      const d = this.dash;
      d.t -= dt;
      const p = g.player;
      p.x = Phaser.Math.Clamp(p.x + d.vx * dt, g.arena.x + 20, g.arena.right - 20);
      p.y = Phaser.Math.Clamp(p.y + d.vy * dt, g.arena.y + 20, g.arena.bottom - 20);
      g.fx.afterimage(p, this.skill.color);
      for (const e of [...g.grid.query(p.x, p.y, 50, g.tmp)]) {
        if (d.hit.has(e)) continue;
        d.hit.add(e);
        g.weaponHit(e, { ...d.info, knockback: 80 }, p.x, p.y);
      }
      if (d.t <= 0) this.dash = null;
    }
    // 领域
    for (const f of this.fields) {
      f.t -= dt;
      f.tick -= dt;
      f.ring.rotation += dt;
      f.img.setAlpha(0.35 + Math.sin(g.time.now / 150) * 0.1);
      if (f.tick <= 0) {
        f.tick = 0.5;
        for (const e of [...g.grid.query(f.x, f.y, f.r, g.tmp)]) g.weaponHit(e, f.info, f.x, f.y);
      }
      if (f.t <= 0) {
        f.img.destroy();
        f.ring.destroy();
      }
    }
    this.fields = this.fields.filter((f) => f.t > 0);
    if (this.clone) {
      const c = this.clone;
      c.t -= dt;
      c.shoot -= dt;
      const p = g.player;
      const ox = c.rig.x,
        oy = c.rig.y;
      c.rig.x += (p.x + 55 * g.facing * -1 - c.rig.x) * Math.min(1, dt * 4);
      c.rig.y += (p.y - 25 - c.rig.y) * Math.min(1, dt * 4);
      c.rig.setDepth(c.rig.y);
      const t = g.grid.nearest(c.rig.x, c.rig.y, 450);
      c.rig.tick(dt, Math.min(1, Math.hypot(c.rig.x - ox, c.rig.y - oy) / (dt * 150 + 0.001)), t ? t.x - c.rig.x : g.facing);
      if (c.shoot <= 0 && t) {
        c.shoot = 0.25;
        c.rig.play('attack');
        const b = g.spawnPlayerBullet('proj_pea', c.rig.x, c.rig.y, Math.atan2(t.y - c.rig.y, t.x - c.rig.x), 750, 0.7, 9);
        b.dmg = c.dmg;
      }
      if (c.t <= 0) {
        const rig = c.rig;
        rig.die(() => rig.destroy());
        this.clone = null;
      }
    }
  }

  destroy(): void {
    this.clone?.rig.destroy();
    this.clone = null;
    for (const f of this.fields) {
      f.img.destroy();
      f.ring.destroy();
    }
    this.fields = [];
  }
}
