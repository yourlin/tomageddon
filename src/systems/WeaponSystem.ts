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
import { BALANCE, attackSpeedMultiplier, meleeInReach, MELEE_THRUST_PAD } from '../data/balance';
import { audio } from './Audio';
import { affixTotals } from './WeaponMods';
import { SWEEP_STYLE, sweepHalfArc, sweepPose, playSweep } from './SweepFx';
import { boomPathOf, BOOM_TIME } from './BoomPaths';
import { CHAIN_STYLE, chainColor, chainFollowUp } from './ChainFx';
import { MINE_BOOM_COLOR } from '../art/MineArt';
import { isFavoredWeapon, FAVORED_DMG } from '../data/affinity';
import type { AffMods, ShotMods } from './Talents';

const PROJ_KEY: Record<string, string> = {
  slingshot: 'proj_tomato',
  pea_shooter: 'proj_pea',
  corn_cannon: 'proj_corn',
  chili_rocket: 'proj_rocket',
  ketchup: 'proj_ketchup',
  mustard_flamer: 'proj_flame',
  soda: 'proj_soda',
  onion_boomerang: 'proj_onion',
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
  if (isFavoredWeapon(run.char.favored, def)) d *= FAVORED_DMG; // 契合武器（超武按原武器判定）
  return Math.max(1, d);
}

/** extraAura：契合特效带来的光环范围 %，与光环范围属性相加后一起封顶 */
export function weaponRange(def: WeaponDef, s: Stats, ow?: OwnedWeapon, extraAura = 0): number {
  // 光环范围只受光环范围属性影响（不吃射程），总加成封顶 BALANCE.auraSizeCap
  if (def.kind === 'aura') {
    const size = Math.min(s.auraSize + extraAura, BALANCE.auraSizeCap);
    return Math.max(60, def.range * (1 + size / 100) + affixTotals(ow).range);
  }
  const bonus = def.cls === 'melee' ? s.range * 0.5 : s.range;
  return Math.max(def.cls === 'melee' ? 70 : 120, def.range + bonus + affixTotals(ow).range);
}

/** extraSpeed：契合特效 / 天赋带来的攻速 %，与攻速属性相加后按同一条曲线换算 */
export function weaponCooldown(def: WeaponDef, tier: number, s: Stats, ow?: OwnedWeapon, extraSpeed = 0): number {
  return Math.max(0.06, def.cooldown[tier] * attackSpeedMultiplier(s.attackSpeed + affixTotals(ow).speed + extraSpeed));
}

interface Conv {
  count: number;
  pierce: number;
  bounce: number;
  chain: number;
  combo: number;
  area: number;
}

/** 把契合加成按武器类型换算：近战没有「弹丸 / 穿透」，就换成连击与范围 */
function convert(def: WeaponDef, m: AffMods | null, sm: ShotMods | null): Conv {
  const r: Conv = { count: sm?.count ?? 0, pierce: sm?.pierce ?? 0, bounce: 0, chain: 0, combo: 0, area: 0 };
  if (!m) return r;
  const k = def.kind;
  r.combo = m.combo;
  r.area = m.area;
  r.chain = m.chain;
  if (k === 'bullet' || k === 'rocket' || k === 'flame' || k === 'boomerang' || k === 'mine') r.count += m.count;
  else if (k === 'chain') r.chain += m.count;
  else r.combo += 0.25 * m.count;
  if (k === 'bullet') {
    r.pierce += m.pierce;
    r.bounce += m.bounce;
  } else if (k === 'chain') r.chain += m.pierce + m.bounce;
  else r.area += 10 * (m.pierce + m.bounce);
  r.combo = Math.min(0.9, r.combo);
  return r;
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
  /** 契合加成（每帧刷新；非契合武器为 null） */
  mods: AffMods | null;
  /** 本次开火的一次性加成（重拳、幽灵弹……） */
  shot: ShotMods | null;
  /** 连击追加攻击的伤害倍率（平时为 1） */
  dmgMul: number;
  /** 柠檬刺客：暴击重置冷却的内置冷却 */
  resetCd: number;
  /** 芋头术士：光环脉冲计时 */
  pulseT: number;
  /** 挥砍残影计时 */
  ghostT: number;
  /** 普通横扫进行中：伤害跟着刀走，刀扫过哪里才结算哪里 */
  sweep?: PendingSweep;
}

interface PendingSweep {
  /** 挥动中心朝向 */
  a: number;
  half: number;
  range: number;
  /** 已扫过的相对角（相对 a，从 -half 往 +half） */
  prev: number;
  done: Set<Enemy>;
  /** 出手时的一次性加成快照（hit 结算时临时还原） */
  shot: ShotMods | null;
  dmgMul: number;
}

/** 武器精灵最长边（像素）：近战 / 远程武器，与光环 / 地雷 */
const WEAPON_SIZE = 58;
const WEAPON_SIZE_SMALL = 36;
/** 普通横扫：从挥出到收回的缓动；ext 在开头 15% 伸出、最后 15% 收回 */
const easeInOut = (k: number): number => 0.5 - 0.5 * Math.cos(Math.PI * k);
const reach = (k: number): number => Math.min(1, k / 0.15, (1 - k) / 0.15);

export class WeaponSystem {
  list: WRun[] = [];
  /** 本帧所有武器中的最大实际射程（像素，已含契合 / 场景倍率），供 HUD 判断精英是否在射程内 */
  maxRange = 0;

  constructor(private g: GameScene) {
    run.weapons.forEach((w, i) => {
      const def = WEAPON_MAP[w.id];
      const key = `weapon_${def.id}`;
      const sprite = g.add.image(0, 0, key).setDepth(10000);
      const size = def.kind === 'aura' || def.kind === 'mine' ? WEAPON_SIZE_SMALL : WEAPON_SIZE;
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
        mods: null,
        shot: null,
        dmgMul: 1,
        resetCd: 0,
        pulseT: 0,
        ghostT: 0,
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
    const talent = g.talent;
    let maxRange = 0;
    this.list.forEach((w, i) => {
      const def = w.def;
      const tier = w.owned.tier;
      const m = (w.mods = talent.affMods(def));
      const cv = convert(def, m, null);
      // 契合加成：射程 %；光环改加光环范围（与属性一起封顶）；近战直刺 / 横扫吃一半范围加成
      let range = weaponRange(def, s, w.owned, def.kind === 'aura' ? cv.area : 0) * g.rangeMult;
      if (m && def.kind !== 'aura') {
        range *= 1 + m.range / 100;
        if (def.kind === 'thrust' || def.kind === 'sweep') range *= 1 + cv.area / 200;
      }
      if (range > maxRange) maxRange = range;
      const spd = m?.atkSpd ?? 0;
      // 柠檬刺客：暴击后重置这把武器的冷却（每把每秒最多一次）
      if (w.resetCd > 0) w.resetCd -= dt;
      if (talent.resetReq.has(def.id) && w.resetCd <= 0) {
        w.resetCd = 1;
        w.cd = Math.min(w.cd, 0.05);
      }
      // 武器环绕排布（武器变大后离身体稍远一点）
      const slotA = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      const hx = p.x + Math.cos(slotA) * 38;
      const hy = p.y + 6 + Math.sin(slotA) * 28;

      w.retarget -= dt;
      const melee = def.kind === 'sweep' || def.kind === 'thrust';
      if (w.retarget <= 0 || !w.target?.alive || (melee && !this.reachable(w.target, def.kind, hx, hy, range))) {
        w.retarget = 0.12;
        w.target = melee ? this.nearestReachable(def.kind as 'sweep' | 'thrust', hx, hy, range) : g.grid.nearest(hx, hy, range + 20);
      }
      const t = w.target;
      if (t) w.angle = Phaser.Math.Angle.RotateTo(w.angle, Math.atan2(t.y - hy, t.x - hx), 0.35);

      // 动画
      let ox = 0,
        oy = 0,
        rot = w.angle,
        flip = Math.cos(rot) < 0;
      if (w.anim > 0) {
        w.anim -= dt;
        const k = 1 - Math.max(0, w.anim) / w.animDur;
        // 武器中心离手的最远距离：让刀尖正好到达攻击范围边缘
        const far = Math.max(12, range - w.sprite.displayWidth * 0.5);
        if (def.kind === 'thrust') {
          // 快速刺出、稍慢收回，刀尖穿过整条攻击线
          const ext = (k < 0.35 ? easeInOut(k / 0.35) : 1 - easeInOut((k - 0.35) / 0.65)) * far;
          ox = Math.cos(w.animAngle) * ext;
          oy = Math.sin(w.animAngle) * ext;
          rot = w.animAngle;
        } else if (def.kind === 'sweep') {
          const st = SWEEP_STYLE[def.id];
          const pose = sweepPose(st, w.animAngle, k, range);
          let sw: number, ext: number;
          if (pose) ({ sw, ext } = pose);
          else {
            // 普通横扫：伸到攻击范围边缘，从扇区一侧完整扫到另一侧（与命中判定的扇区一致）
            const half = Math.min(Math.PI, sweepHalfArc(undefined) * (1 + cv.area / 200));
            sw = w.animAngle - half + easeInOut(k) * half * 2;
            ext = reach(k) * far;
            if (w.sweep) this.advanceSweep(w, sw - w.sweep.a, hx, hy, s);
          }
          ox = Math.cos(sw) * ext;
          oy = Math.sin(sw) * ext;
          rot = sw;
          // 整个挥动过程保持同一朝向，避免越过竖直方向时精灵突然翻面
          flip = Math.cos(w.animAngle) < 0;
          if (!st && (w.ghostT -= dt) <= 0) {
            w.ghostT = 0.022;
            this.ghost(w.sprite, hx + ox, hy + oy, rot, flip);
          }
        } else {
          const kick = Math.sin(k * Math.PI) * -6;
          ox = Math.cos(w.animAngle) * kick;
          oy = Math.sin(w.animAngle) * kick;
        }
      }
      // 横扫动画结束：把还没扫到的扇区补完（低帧率时最后一帧可能跳过末端）
      if (w.sweep && w.anim <= 0) {
        this.advanceSweep(w, w.sweep.half, hx, hy, s);
        w.sweep = undefined;
      }
      w.sprite.setPosition(hx + ox, hy + oy).setRotation(rot);
      w.sprite.setFlipY(flip);
      w.sprite.setDepth(11001);
      w.aura?.update(p.x, p.y, range, dt);

      // 地雷
      if (w.mines.length) this.updateMines(w, dt);

      // 芋头术士：契合光环每 3 秒向外脉冲一次
      if (def.kind === 'aura' && talent.auraPulse(def) && (w.pulseT += dt) >= 3) {
        w.pulseT = 0;
        this.auraPulse(w, range * 1.5);
      }

      w.cd -= dt;
      if (w.cd > 0) return;
      if (def.kind === 'aura') {
        w.cd = weaponCooldown(def, tier, s, w.owned, spd);
        this.fireAura(w, range);
        return;
      }
      if (def.kind === 'mine') {
        if (g.enemies.some((e) => e.alive)) {
          w.cd = weaponCooldown(def, tier, s, w.owned, spd);
          w.shot = talent.onFire(def);
          const k = 1 + convert(def, m, w.shot).count;
          for (let j = 0; j < k; j++) this.placeMine(w, range, k - 1);
          w.shot = null;
        }
        return;
      }
      if (!t) return;
      w.cd = weaponCooldown(def, tier, s, w.owned, spd);
      w.animAngle = Math.atan2(t.y - hy, t.x - hx);
      w.anim = w.animDur = def.cls === 'melee' ? Math.min(0.26, w.cd * 0.8) : 0.1;
      this.attack(w, hx, hy, t, range, false);
    });
    this.maxRange = maxRange;
    talent.resetReq.clear();
  }

  /** 横扫残影：武器精灵的淡出拷贝，让挥过的轨迹看得清（代替弧形刀光） */
  private ghost(src: Phaser.GameObjects.Image, x: number, y: number, rot: number, flip: boolean): void {
    const g = this.g;
    const img = g.add
      .image(x, y, src.texture.key)
      .setScale(src.scaleX, src.scaleY)
      .setRotation(rot)
      .setFlipY(flip)
      .setDepth(11000)
      .setAlpha(0.35)
      .setTintFill(0xfff4ea);
    g.tweens.add({ targets: img, alpha: 0, duration: 130, onComplete: () => img.destroy() });
  }

  /** 开火一次；契合武器按连击概率在 0.11 秒后追加一次（追加攻击不再连击） */
  private attack(w: WRun, hx: number, hy: number, t: Enemy, range: number, combo: boolean): void {
    const g = this.g;
    w.shot = g.talent.onFire(w.def);
    if (combo) w.dmgMul = w.mods?.comboMult ?? 0.6;
    this.fire(w, hx, hy, t, range);
    w.dmgMul = 1;
    const cv = convert(w.def, w.mods, w.shot);
    w.shot = null;
    if (combo || cv.combo <= 0 || Math.random() >= cv.combo) return;
    g.time.delayedCall(110, () => {
      if (!this.list.includes(w)) return;
      const k = w.def.kind;
      const melee = k === 'sweep' || k === 'thrust';
      const ok = (e: Enemy): boolean => e.alive && (!melee || this.reachable(e, k, hx, hy, range));
      const tt = ok(t) ? t : melee ? this.nearestReachable(k as 'sweep' | 'thrust', hx, hy, range) : g.grid.nearest(hx, hy, range + 20);
      if (!tt) return;
      w.animAngle = Math.atan2(tt.y - hy, tt.x - hx);
      w.anim = w.animDur = w.def.cls === 'melee' ? 0.16 : 0.1;
      this.attack(w, hx, hy, tt, range, true);
    });
  }

  private info(w: WRun, s: Stats): HitInfo {
    const def = w.def;
    const m = w.mods;
    const sm = w.shot;
    let dmg = weaponDamage(def, w.owned.tier, s, w.owned) * w.dmgMul * (sm?.mult ?? 1);
    const ax = affixTotals(w.owned);
    const same = run.specials.sameWeaponBonus;
    if (same) dmg *= 1 + (same * run.weapons.filter((x) => x.id === def.id).length) / 100;
    const crit = !!sm?.forceCrit || Math.random() * 100 < s.crit + (def.critBonus ?? 0) + ax.crit + (m?.crit ?? 0);
    // 这里只乘武器自身的暴击倍率；词条暴击伤害随 HitInfo.critBonus 传给 weaponHit，
    // 与道具 / 角色 / 天赋的暴击伤害合并成一个加法池（上限 BALANCE.critDmgCap）
    if (crit) dmg *= def.critMult;
    const status: StatusApply[] = [];
    if (ax.burn) status.push({ id: 'burn', dur: 3, stacks: 1, chance: ax.burn });
    if (ax.poison) status.push({ id: 'poison', dur: 4, stacks: 1, chance: ax.poison });
    if (ax.slow) status.push({ id: 'slow', dur: 2, stacks: 1, chance: ax.slow });
    if (m) status.push(...m.status);
    return {
      crit,
      knockback: (def.knockback ?? 0) + (m?.knock ?? 0) + (sm?.knock ?? 0),
      effect: def.effect,
      lifeSteal: (def.effect?.lifeSteal ?? 0) + ax.lifeSteal + (m?.lifeSteal ?? 0),
      status: status.length ? status : undefined,
      dmg,
      weaponId: def.id,
      cls: def.cls,
      critBonus: ax.critDmg + (m?.critDmg ?? 0),
    };
  }

  private fire(w: WRun, hx: number, hy: number, t: Enemy, range: number): void {
    const g = this.g;
    const s = g.stats;
    const def = w.def;
    const tier = w.owned.tier;
    const a = w.animAngle;
    const cv = convert(def, w.mods, w.shot);
    const areaMul = 1 + cv.area / 100;
    switch (def.kind) {
      case 'thrust': {
        const ex = hx + Math.cos(a) * range,
          ey = hy + Math.sin(a) * range;
        const hits = g.grid.query((hx + ex) / 2, (hy + ey) / 2, range / 2 + MELEE_THRUST_PAD + 6, g.tmp);
        for (const e of [...hits]) {
          if (distToSegment(e.x, e.y, hx, hy, ex, ey) < e.radius + MELEE_THRUST_PAD) this.hit(e, w, s, hx, hy);
        }
        g.fxThrust(hx, hy, a, range);
        break;
      }
      case 'sweep': {
        const st = SWEEP_STYLE[def.id];
        const half = Math.min(Math.PI, sweepHalfArc(st) * (1 + cv.area / 200));
        if (!st) {
          // 普通横扫：伤害跟着刀走（见 advanceSweep），刀扫到哪里才结算哪里，与画面一致
          if (w.sweep) this.advanceSweep(w, w.sweep.half, hx, hy, s);
          w.sweep = { a, half, range, prev: -half, done: new Set(), shot: w.shot, dmgMul: w.dmgMul };
          this.advanceSweep(w, -half, hx, hy, s);
        } else {
          const hits = g.grid.query(hx, hy, range, g.tmp);
          for (const e of [...hits]) {
            const d = Phaser.Math.Angle.Wrap(Math.atan2(e.y - hy, e.x - hx) - a);
            if (Math.abs(d) < half || Phaser.Math.Distance.Between(e.x, e.y, hx, hy) < e.radius + 30) this.hit(e, w, s, hx, hy);
          }
        }
        // 超武专属招式；其余超武用通用刀光；普通横扫武器不画弧形刀光，靠武器本身挥过攻击区域（见 update 的挥动动画）
        if (st) playSweep(st, { g, x: hx, y: hy, a, range, info: this.info(w, s) });
        else if (def.evolvedFrom) g.fxSweep(hx, hy, a, range);
        if (def.effect?.explode) {
          const i = this.info(w, s);
          g.explode(hx + Math.cos(a) * range * 0.7, hy + Math.sin(a) * range * 0.7, def.effect.explode * areaMul, i.dmg * 0.6, i, 0xff6b6b);
        }
        break;
      }
      case 'bullet':
      case 'rocket':
      case 'flame':
      case 'boomerang': {
        const count = (def.count?.[tier] ?? 1) + cv.count;
        // 契合额外弹丸没有自带散射时，给一个小角度散开
        const spread = Phaser.Math.DegToRad(def.spread ?? (cv.count > 0 ? 10 + 4 * cv.count : 0));
        const pid = def.evolvedFrom ?? def.id;
        const key =
          def.projKey && g.textures.exists(def.projKey)
            ? def.projKey
            : g.textures.exists(`proj_${pid}`)
              ? `proj_${pid}`
              : (PROJ_KEY[pid] ?? 'proj_player');
        const speed = (def.projSpeed ?? 600) * (1 + (w.mods?.projSpd ?? 0) / 100);
        for (let k = 0; k < count; k++) {
          let ang = a;
          if (count > 1) ang = a - spread / 2 + (spread * k) / (count - 1);
          else if (spread) ang += Phaser.Math.FloatBetween(-spread / 2, spread / 2);
          const b = g.spawnPlayerBullet(key, hx, hy, ang, speed, range / speed, def.kind === 'flame' ? 12 : 9);
          const i = this.info(w, s);
          b.dmg = i.dmg;
          b.crit = i.crit;
          b.critBonus = i.critBonus ?? 0;
          b.knockback = i.knockback ?? 0;
          b.effect = def.effect;
          b.lifeSteal = i.lifeSteal ?? 0;
          b.status = i.status;
          b.src = def.id;
          b.pierce = (def.pierce?.[tier] ?? 0) + cv.pierce;
          b.bounce = (def.bounce?.[tier] ?? 0) + cv.bounce;
          b.areaMul = areaMul;
          b.homing = def.homing ?? 0;
          if (def.projTint !== undefined) b.setTint(def.projTint);
          // 分裂只给普通子弹（火焰 / 回旋镖 / 火箭各有自己的命中逻辑）
          b.split = def.kind === 'bullet' ? run.specials.split + (def.splitShots ?? 0) : 0;
          if (def.kind === 'rocket') b.kind = 'rocket';
          if (def.kind === 'flame') {
            b.kind = 'flame';
            b.pierce = 999;
            b.setScale(0.6);
          }
          if (def.kind === 'boomerang') {
            b.kind = 'boomerang';
            b.pierce = 999;
            b.path = boomPathOf(def);
            b.pathReach = range * 0.95;
            b.pathDur = (range / speed) * BOOM_TIME[b.path];
            b.pathAng = ang;
            // 多枚时左右交替，单枚随机往一边拐
            b.pathSide = count > 1 ? (k % 2 ? -1 : 1) : Math.random() < 0.5 ? -1 : 1;
            b.life = 99;
            b.spin = 14;
          }
          w.shot?.bullet?.(b);
        }
        audio.play(g, 'shoot', 0.06);
        break;
      }
      case 'chain': {
        const i = this.info(w, s);
        const jumps = (def.effect?.chain?.[tier] ?? 2) + cv.chain;
        const pts: { x: number; y: number }[] = [{ x: hx, y: hy }];
        const hitSet = new Set<Enemy>();
        let cur: Enemy | null = t;
        let dmg = i.dmg;
        for (let j = 0; j <= jumps && cur; j++) {
          hitSet.add(cur);
          pts.push({ x: cur.x, y: cur.y });
          g.weaponHit(cur, { ...i, dmg }, hx, hy);
          if (j > 0) g.talent.onChainJump(def, cur);
          dmg *= 0.85;
          cur = g.grid.nearest(cur.x, cur.y, 200, hitSet);
        }
        g.fxLightning(pts, chainColor(def.id));
        const cst = CHAIN_STYLE[def.id];
        if (cst) chainFollowUp(g, cst, [...hitSet], i, def.critMult);
        audio.play(g, 'shoot', 0.06);
        break;
      }
    }
  }

  /** 近战：这个敌人是否在触及范围内（与命中判定同一标准） */
  private reachable(e: Enemy, kind: string, hx: number, hy: number, range: number): boolean {
    return meleeInReach(kind === 'thrust' ? 'thrust' : 'sweep', Math.hypot(e.x - hx, e.y - hy), e.radius, range);
  }

  /** 近战：触及范围内中心最近的敌人。大体型敌人身体边缘进入射程就会被选中 */
  private nearestReachable(kind: 'sweep' | 'thrust', hx: number, hy: number, range: number): Enemy | null {
    const g = this.g;
    let best: Enemy | null = null,
      bd = Infinity;
    for (const e of g.grid.query(hx, hy, range + (kind === 'thrust' ? MELEE_THRUST_PAD : 0), g.tmp)) {
      const d = Math.hypot(e.x - hx, e.y - hy);
      if (d < bd && meleeInReach(kind, d, e.radius, range)) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  /**
   * 普通横扫：把刀从上次的位置扫到 rel（相对挥动中心的角度），结算这段扇区里的敌人。
   * 按敌人身体的角宽放宽判定；贴身（手边 30 像素内）的敌人在第一下就命中。每只敌人每刀只结算一次。
   */
  private advanceSweep(w: WRun, rel: number, hx: number, hy: number, s: Stats): void {
    const ps = w.sweep;
    if (!ps) return;
    const lo = ps.prev,
      hi = Math.max(lo, Math.min(ps.half, rel));
    const g = this.g;
    const hits = [...g.grid.query(hx, hy, ps.range, g.tmp)];
    const shot = w.shot,
      mul = w.dmgMul;
    w.shot = ps.shot;
    w.dmgMul = ps.dmgMul;
    for (const e of hits) {
      if (ps.done.has(e) || !e.alive) continue;
      const dist = Math.hypot(e.x - hx, e.y - hy);
      const d = Phaser.Math.Angle.Wrap(Math.atan2(e.y - hy, e.x - hx) - ps.a);
      const tol = Math.min(0.6, e.radius / Math.max(1, dist));
      const inArc = Math.abs(d) <= ps.half + tol && d >= lo - tol && d <= hi + tol;
      if (inArc || dist < e.radius + 30) {
        ps.done.add(e);
        this.hit(e, w, s, hx, hy);
      }
    }
    w.shot = shot;
    w.dmgMul = mul;
    ps.prev = hi;
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

  /** 芋头术士：光环向外脉冲一圈，造成一次伤害并击退 */
  private auraPulse(w: WRun, range: number): void {
    const g = this.g;
    const s = g.stats;
    const p = g.player;
    const look = AURA_LOOK[w.def.id] ?? AURA_LOOK[w.def.evolvedFrom ?? ''];
    g.fx.ring(p.x, p.y, range, look?.color ?? 0xcdb4db, 420, true);
    for (const e of [...g.grid.query(p.x, p.y, range, g.tmp)]) {
      const i = this.info(w, s);
      g.weaponHit(e, { ...i, knockback: (i.knockback ?? 0) + 40 }, p.x, p.y);
    }
  }

  private placeMine(w: WRun, range: number, extra = 0): void {
    const g = this.g;
    if (w.mines.filter((m) => m.alive).length >= 6 + extra) return;
    const p = g.player;
    const ang = Math.random() * Math.PI * 2;
    const r = Phaser.Math.FloatBetween(40, range);
    const x = Phaser.Math.Clamp(p.x + Math.cos(ang) * r, g.arena.x + 20, g.arena.right - 20);
    const y = Phaser.Math.Clamp(p.y + Math.sin(ang) * r, g.arena.y + 20, g.arena.bottom - 20);
    const def = w.def;
    const key = [`mine_${def.id}`, `mine_${def.evolvedFrom ?? ''}`].find((k) => g.textures.exists(k)) ?? 'mine';
    // 超武的雷大一圈，并带一点转角，摆在地上不至于千篇一律
    const img = g.add
      .image(p.x, p.y, key)
      .setDepth(2)
      .setScale(def.evolvedFrom ? 1 : 0.85)
      .setRotation(Phaser.Math.FloatBetween(-0.35, 0.35));
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
      const area = 1 + convert(w.def, w.mods, null).area / 100;
      const boomR = (w.def.effect?.explode ?? 80) * area;
      // 触发半径跟随爆炸半径：敌人进入爆炸圈的内侧就引爆，避免"擦边走过不炸"
      const triggerR = Math.max(45, boomR * 0.45);
      if (g.grid.query(m.img.x, m.img.y, triggerR, g.tmp).length) {
        m.alive = false;
        const i = this.info(w, g.stats);
        g.explode(m.img.x, m.img.y, boomR, i.dmg, i, MINE_BOOM_COLOR[w.def.id] ?? MINE_BOOM_COLOR[w.def.evolvedFrom ?? ''] ?? 0xff5400);
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
