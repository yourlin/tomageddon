// 玩家武器：自动索敌、自动攻击
import { AuraFx, AURA_LOOK } from './AuraFx';
import Phaser from 'phaser';
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import { WEAPON_MAP, type WeaponDef } from '../data/weapons';
import type { OwnedWeapon } from './RunState';
import type { StatusApply } from '../data/statuses';
import { run } from './RunState';
import type { Stats } from '../data/stats';
import { attackSpeedMultiplier } from '../data/balance';
import { audio } from './Audio';
import { affixTotals } from './WeaponMods';

const PROJ_KEY: Record<string, string> = {
  slingshot: 'proj_tomato',
  pea_shooter: 'proj_pea',
  corn_cannon: 'proj_corn',
  chili_rocket: 'proj_rocket',
  ketchup: 'proj_ketchup',
  mustard_flamer: 'proj_flame',
  soda: 'proj_soda',
  onion_boomerang: 'proj_onion',
  sauce_gatling: 'proj_ketchup',
};

/** 武器伤害；传入持有的武器时计入词条与打造加成 */
export function weaponDamage(def: WeaponDef, tier: number, s: Stats, ow?: OwnedWeapon): number {
  let d = def.damage[tier];
  const sc = def.scaling;
  d += (sc.melee ?? 0) * s.melee + (sc.ranged ?? 0) * s.ranged + (sc.elemental ?? 0) * s.elemental;
  d += (sc.maxHp ?? 0) * s.maxHp + (sc.armor ?? 0) * s.armor + (sc.speed ?? 0) * s.speed;
  const classMult = run.char.classMult?.[def.cls] ?? 1;
  // 分类伤害 %：光环武器只吃光环伤害 %，其余按武器类别
  const pct = def.kind === 'aura' ? s.auraPct : def.cls === 'melee' ? s.meleePct : def.cls === 'ranged' ? s.rangedPct : s.elementalPct;
  d *= (1 + (s.damage + pct) / 100) * classMult;
  d *= 1 + affixTotals(ow).dmg / 100;
  if (run.char.favored.includes(def.id)) d *= 1.2; // 契合武器
  return Math.max(1, d);
}

export function weaponRange(def: WeaponDef, s: Stats, ow?: OwnedWeapon): number {
  // 光环范围只受光环范围属性影响（不吃射程）
  if (def.kind === 'aura') return Math.max(60, def.range * (1 + s.auraSize / 100) + affixTotals(ow).range);
  const bonus = def.cls === 'melee' ? s.range * 0.5 : s.range;
  return Math.max(def.cls === 'melee' ? 70 : 120, def.range + bonus + affixTotals(ow).range);
}

export function weaponCooldown(def: WeaponDef, tier: number, s: Stats, ow?: OwnedWeapon): number {
  return Math.max(0.06, def.cooldown[tier] * attackSpeedMultiplier(s.attackSpeed + affixTotals(ow).speed));
}

interface Mine {
  img: Phaser.GameObjects.Image;
  arm: number;
  alive: boolean;
}

interface WRun {
  owned: OwnedWeapon;
  def: WeaponDef;
  cd: number;
  sprite: Phaser.GameObjects.Image;
  angle: number;
  anim: number; // 攻击动画剩余时间
  animDur: number;
  animAngle: number;
  target: Enemy | null;
  retarget: number;
  mines: Mine[];
  aura?: AuraFx;
}

export class WeaponSystem {
  list: WRun[] = [];

  constructor(private g: GameScene) {
    run.weapons.forEach((w, i) => {
      const def = WEAPON_MAP[w.id];
      const key = `weapon_${def.id}`;
      const sprite = g.add.image(0, 0, key).setDepth(10000);
      const size = def.kind === 'aura' || def.kind === 'mine' ? 30 : 48;
      sprite.setScale(size / Math.max(sprite.width, sprite.height));
      const wr: WRun = {
        owned: w,
        def,
        cd: 0.3 + i * 0.1,
        sprite,
        angle: 0,
        anim: 0,
        animDur: 0.2,
        animAngle: 0,
        target: null,
        retarget: 0,
        mines: [],
      };
      if (def.kind === 'aura') {
        const look = AURA_LOOK[def.id] ?? AURA_LOOK[def.evolvedFrom ?? ''] ?? { color: 0xc8f7c5, style: 'spark' as const };
        wr.aura = new AuraFx(g, look.color, look.style);
      }
      this.list.push(wr);
    });
  }

  update(dt: number): void {
    const g = this.g;
    const s = g.stats;
    const p = g.player;
    const n = this.list.length;
    this.list.forEach((w, i) => {
      const def = w.def;
      const tier = w.owned.tier;
      const range = weaponRange(def, s, w.owned) * g.rangeMult;
      // 武器环绕排布
      const slotA = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      const hx = p.x + Math.cos(slotA) * 34;
      const hy = p.y + 6 + Math.sin(slotA) * 26;

      w.retarget -= dt;
      if (w.retarget <= 0 || !w.target?.alive) {
        w.retarget = 0.12;
        w.target = g.grid.nearest(hx, hy, range + 20);
      }
      const t = w.target;
      if (t) w.angle = Phaser.Math.Angle.RotateTo(w.angle, Math.atan2(t.y - hy, t.x - hx), 0.35);

      // 动画
      let ox = 0,
        oy = 0,
        rot = w.angle;
      if (w.anim > 0) {
        w.anim -= dt;
        const k = 1 - Math.max(0, w.anim) / w.animDur;
        if (def.kind === 'thrust') {
          const ext = Math.sin(k * Math.PI) * range * 0.75;
          ox = Math.cos(w.animAngle) * ext;
          oy = Math.sin(w.animAngle) * ext;
          rot = w.animAngle;
        } else if (def.kind === 'sweep') {
          const sw = w.animAngle - 1.2 + k * 2.4;
          const ext = Math.sin(k * Math.PI) * range * 0.55;
          ox = Math.cos(sw) * ext;
          oy = Math.sin(sw) * ext;
          rot = sw;
        } else {
          const kick = Math.sin(k * Math.PI) * -6;
          ox = Math.cos(w.animAngle) * kick;
          oy = Math.sin(w.animAngle) * kick;
        }
      }
      w.sprite.setPosition(hx + ox, hy + oy).setRotation(rot);
      w.sprite.setFlipY(Math.cos(rot) < 0);
      w.sprite.setDepth(11001);
      w.aura?.update(p.x, p.y, range, dt);

      // 地雷
      if (w.mines.length) this.updateMines(w, dt);

      w.cd -= dt;
      if (w.cd > 0) return;
      if (def.kind === 'aura') {
        w.cd = weaponCooldown(def, tier, s, w.owned);
        this.fireAura(w, range);
        return;
      }
      if (def.kind === 'mine') {
        if (g.enemies.some((e) => e.alive)) {
          w.cd = weaponCooldown(def, tier, s, w.owned);
          this.placeMine(w, range);
        }
        return;
      }
      if (!t) return;
      w.cd = weaponCooldown(def, tier, s, w.owned);
      w.animAngle = Math.atan2(t.y - hy, t.x - hx);
      w.anim = w.animDur = def.cls === 'melee' ? Math.min(0.26, w.cd * 0.8) : 0.1;
      this.fire(w, hx, hy, t, range);
    });
  }

  private info(w: WRun, s: Stats): HitInfo {
    const def = w.def;
    let dmg = weaponDamage(def, w.owned.tier, s, w.owned);
    const ax = affixTotals(w.owned);
    const same = run.specials.sameWeaponBonus;
    if (same) dmg *= 1 + (same * run.weapons.filter((x) => x.id === def.id).length) / 100;
    const crit = Math.random() * 100 < s.crit + (def.critBonus ?? 0) + ax.crit;
    if (crit) dmg *= def.critMult * (1 + ax.critDmg / 100);
    const status: StatusApply[] = [];
    if (ax.burn) status.push({ id: 'burn', dur: 3, stacks: 1, chance: ax.burn });
    if (ax.poison) status.push({ id: 'poison', dur: 4, stacks: 1, chance: ax.poison });
    if (ax.slow) status.push({ id: 'slow', dur: 2, stacks: 1, chance: ax.slow });
    return {
      crit,
      knockback: def.knockback ?? 0,
      effect: def.effect,
      lifeSteal: (def.effect?.lifeSteal ?? 0) + ax.lifeSteal,
      status: status.length ? status : undefined,
      dmg,
      weaponId: def.id,
      cls: def.cls,
    };
  }

  private fire(w: WRun, hx: number, hy: number, t: Enemy, range: number): void {
    const g = this.g;
    const s = g.stats;
    const def = w.def;
    const tier = w.owned.tier;
    const a = w.animAngle;
    switch (def.kind) {
      case 'thrust': {
        const ex = hx + Math.cos(a) * range,
          ey = hy + Math.sin(a) * range;
        const hits = g.grid.query((hx + ex) / 2, (hy + ey) / 2, range / 2 + 20, g.tmp);
        for (const e of [...hits]) {
          if (distToSegment(e.x, e.y, hx, hy, ex, ey) < e.radius + 14) this.hit(e, w, s, hx, hy);
        }
        g.fxThrust(hx, hy, a, range);
        break;
      }
      case 'sweep': {
        const hits = g.grid.query(hx, hy, range, g.tmp);
        for (const e of [...hits]) {
          const d = Phaser.Math.Angle.Wrap(Math.atan2(e.y - hy, e.x - hx) - a);
          if (Math.abs(d) < 1.25 || Phaser.Math.Distance.Between(e.x, e.y, hx, hy) < e.radius + 30) this.hit(e, w, s, hx, hy);
        }
        g.fxSweep(hx, hy, a, range);
        if (def.effect?.explode) {
          const i = this.info(w, s);
          g.explode(hx + Math.cos(a) * range * 0.7, hy + Math.sin(a) * range * 0.7, def.effect.explode, i.dmg * 0.6, i, 0xff6b6b);
        }
        break;
      }
      case 'bullet':
      case 'rocket':
      case 'flame':
      case 'boomerang': {
        const count = def.count?.[tier] ?? 1;
        const spread = Phaser.Math.DegToRad(def.spread ?? 0);
        const pid = def.evolvedFrom ?? def.id;
        const key = g.textures.exists(`proj_${pid}`) ? `proj_${pid}` : (PROJ_KEY[pid] ?? 'proj_player');
        const speed = def.projSpeed ?? 600;
        for (let k = 0; k < count; k++) {
          let ang = a;
          if (count > 1) ang = a - spread / 2 + (spread * k) / (count - 1);
          else if (spread) ang += Phaser.Math.FloatBetween(-spread / 2, spread / 2);
          const b = g.spawnPlayerBullet(key, hx, hy, ang, speed, range / speed, def.kind === 'flame' ? 12 : 9);
          const i = this.info(w, s);
          b.dmg = i.dmg;
          b.crit = i.crit;
          b.knockback = i.knockback ?? 0;
          b.effect = def.effect;
          b.lifeSteal = i.lifeSteal ?? 0;
          b.status = i.status;
          b.src = def.id;
          b.pierce = def.pierce?.[tier] ?? 0;
          b.bounce = def.bounce?.[tier] ?? 0;
          if (def.kind === 'rocket') b.kind = 'rocket';
          if (def.kind === 'flame') {
            b.kind = 'flame';
            b.pierce = 999;
            b.setScale(0.6);
          }
          if (def.kind === 'boomerang') {
            b.kind = 'boomerang';
            b.pierce = 999;
            b.outT = range / speed;
            b.life = 99;
            b.spin = 14;
          }
        }
        audio.play(g, 'shoot', 0.06);
        break;
      }
      case 'chain': {
        const i = this.info(w, s);
        const jumps = def.effect?.chain?.[tier] ?? 2;
        const pts: { x: number; y: number }[] = [{ x: hx, y: hy }];
        const hitSet = new Set<Enemy>();
        let cur: Enemy | null = t;
        let dmg = i.dmg;
        for (let j = 0; j <= jumps && cur; j++) {
          hitSet.add(cur);
          pts.push({ x: cur.x, y: cur.y });
          g.weaponHit(cur, { ...i, dmg }, hx, hy);
          dmg *= 0.85;
          cur = g.grid.nearest(cur.x, cur.y, 200, hitSet);
        }
        g.fxLightning(pts, 0x9bf6ff);
        audio.play(g, 'shoot', 0.06);
        break;
      }
    }
  }

  private hit(e: Enemy, w: WRun, s: Stats, fx: number, fy: number): void {
    const i = this.info(w, s);
    this.g.weaponHit(e, i, fx, fy);
  }

  private fireAura(w: WRun, range: number): void {
    const g = this.g;
    const s = g.stats;
    const hits = [...g.grid.query(g.player.x, g.player.y, range, g.tmp)];
    for (const e of hits) this.hit(e, w, s, g.player.x, g.player.y);
    if (w.aura && hits.length) w.aura.pulse(hits);
  }

  private placeMine(w: WRun, range: number): void {
    const g = this.g;
    if (w.mines.filter((m) => m.alive).length >= 6) return;
    const p = g.player;
    const ang = Math.random() * Math.PI * 2;
    const r = Phaser.Math.FloatBetween(40, range);
    const x = Phaser.Math.Clamp(p.x + Math.cos(ang) * r, g.arena.x + 20, g.arena.right - 20);
    const y = Phaser.Math.Clamp(p.y + Math.sin(ang) * r, g.arena.y + 20, g.arena.bottom - 20);
    const img = g.add.image(p.x, p.y, g.textures.exists('mine_pepper') ? 'mine_pepper' : 'mine').setDepth(2);
    g.tweens.add({ targets: img, x, y, duration: 300, ease: 'Quad.easeOut' });
    w.mines = w.mines.filter((m) => m.alive);
    w.mines.push({ img, arm: 0.6, alive: true });
  }

  private updateMines(w: WRun, dt: number): void {
    const g = this.g;
    for (const m of w.mines) {
      if (!m.alive) continue;
      m.arm -= dt;
      if (m.arm > 0) continue;
      m.img.setAlpha(0.75 + Math.sin(g.time.now / 120) * 0.25);
      if (g.grid.query(m.img.x, m.img.y, 26, g.tmp).length) {
        m.alive = false;
        const i = this.info(w, g.stats);
        g.explode(m.img.x, m.img.y, w.def.effect?.explode ?? 80, i.dmg, i, 0xff5400);
        m.img.destroy();
      }
    }
  }

  destroy(): void {
    for (const w of this.list) {
      w.sprite.destroy();
      w.aura?.destroy();
      for (const m of w.mines) if (m.alive) m.img.destroy();
    }
    this.list = [];
  }
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax,
    dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
