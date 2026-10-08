// 角色专属天赋：每名角色一个独特机制（文字见 data/characters.ts 的 talent 字段）。
// 1.4.0 契合改版：天赋改为强化「契合武器」（data/affinity.ts）——
//   affMods()  契合特效 + 天赋带来的武器参数（连击、弹丸、穿透、弹射、连锁、射程、攻速、范围、暴击……）
//   onFire()   每次开火的一次性效果（重拳、幽灵弹、热枪、红包弹……）
//   preHit / afterHit / onExplode / onKill  按战斗事件触发的天赋效果
// 天赋自己发射的追加弹丸 / 爆炸带 echo 标记，不会再触发天赋，避免连锁失控。
// 部分天赋仍直接用角色的 special 实现（落雷、暴击伤害、利息、持续伤害、复活、净化）。
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import type { Bullet } from '../objects/Bullet';
import type { StatMods } from '../data/stats';
import type { StatusApply } from '../data/statuses';
import { STATUSES } from '../data/statuses';
import { WEAPON_MAP, type WeaponDef } from '../data/weapons';
import { isFavoredWeapon } from '../data/affinity';
import { BALANCE, speedBonusPct } from '../data/balance';
import { tx } from '../i18n';
import { run } from './RunState';

/** 每完成一波的永久成长 */
export function waveGrowthMods(charId: string): StatMods | null {
  return charId === 'tomato' ? { maxHp: 1 } : null;
}
/** 每次升级的额外永久成长 */
export function levelGrowthMods(charId: string): StatMods | null {
  return charId === 'strawberry' ? { maxHp: 1 } : null;
}
/** 本波第一次商店刷新是否免费 */
export const freeFirstReroll = (charId: string): boolean => charId === 'lychee';

/** 契合武器的参数加成（数值均为加法，百分比项单位为 %） */
export interface AffMods {
  /** 连击概率 0~1 与连击伤害倍率 */
  combo: number;
  comboMult: number;
  /** 弹丸 / 穿透 / 弹射 / 连锁次数（WeaponSystem 按武器类型换算成合适的效果） */
  count: number;
  pierce: number;
  bounce: number;
  chain: number;
  range: number;
  atkSpd: number;
  /** 横扫扇形、爆炸、光环范围 % */
  area: number;
  projSpd: number;
  crit: number;
  critDmg: number;
  lifeSteal: number;
  knock: number;
  status: StatusApply[];
}

/** 单次开火的一次性加成 */
export interface ShotMods {
  mult: number;
  knock: number;
  forceCrit: boolean;
  /** 额外弹丸（本次开火） */
  count: number;
  /** 额外穿透（本次开火） */
  pierce: number;
  /** 本次开火必定眩晕（秒） */
  stun?: number;
  /** 每颗子弹生成后的加工 */
  bullet?: (b: Bullet) => void;
}

/** 命中前采集的目标状态（afterHit 用） */
export interface HitCtx {
  burning: boolean;
  stunned: boolean;
  frozen: boolean;
  cursed: boolean;
}

const S = (id: StatusApply['id'], dur: number, stacks = 1, chance?: number): StatusApply => ({ id, dur, stacks, chance });
const NO_CTX: HitCtx = { burning: false, stunned: false, frozen: false, cursed: false };
const BULLETISH = new Set(['bullet', 'rocket', 'flame', 'boomerang']);

function emptyMods(): AffMods {
  return {
    combo: 0,
    comboMult: 0.6,
    count: 0,
    pierce: 0,
    bounce: 0,
    chain: 0,
    range: 0,
    atkSpd: 0,
    area: 0,
    projSpd: 0,
    crit: 0,
    critDmg: 0,
    lifeSteal: 0,
    knock: 0,
    status: [],
  };
}

/** 樱桃双枪「连珠炮」的过热循环：每发 +1 层热枪（攻速 +1%），叠到 max 层后过热 overheat 秒（攻速 −overheatSlow%）并清零 */
export const CHERRY_HEAT = { max: 20, overheat: 2, overheatSlow: 30 };

export class TalentSystem {
  private readonly id: string;
  private readonly fav: readonly string[];
  private dodgeT = 0; // 南瓜幽灵：闪避后的攻速窗口
  private ghost = 0; // 南瓜幽灵：剩余幽灵弹
  private blindCd = 0; // 洋葱大叔：催泪弹冷却
  private invulnT = 0; // 葡萄魔术师：周期无敌
  private regenT = 0; // 冬瓜和尚：静止回血
  private saved = false; // 蜜桃天使：本波是否已触发保命
  private heat = 0; // 樱桃双枪：热枪层数
  private heatT = 0;
  /** 樱桃双枪：过热剩余时间（期间攻速 −30%、不叠热枪） */
  private overheatT = 0;
  private fedT = 0; // 红薯厨神：吃饱窗口
  private vetT = 0; // 卷心菜老兵：净化后攻速窗口
  private punch = new Map<string, number>(); // 椰子拳师：各武器出拳计数
  private stench = new WeakMap<Enemy, number>(); // 榴莲霸王：臭气层数
  private fruitDrops = 0; // 红薯厨神：本波契合掉落的果实
  private lastWave = -1;
  private lastFavDmg = 10; // 最近一次契合命中伤害（击杀追加弹用）
  private healCd = 0;
  /** 菠萝蜜卫士「刺针齐射」/ 蜜桃天使「圣光弹」：自动攻击计时 */
  private autoT = 0;
  /** 各类追加效果的冷却（秒），防止大量命中同帧刷屏 */
  private cds: Record<string, number> = {};
  /** 柠檬刺客：本帧请求重置冷却的武器 id */
  readonly resetReq = new Set<string>();

  constructor(private g: GameScene) {
    this.id = run.charId;
    this.fav = run.char.favored;
  }

  private get still(): boolean {
    return this.g.moveX === 0 && this.g.moveY === 0;
  }

  private ready(key: string, cd: number): boolean {
    if ((this.cds[key] ?? 0) > 0) return false;
    this.cds[key] = cd;
    return true;
  }

  isFavored(def: WeaponDef | undefined): boolean {
    return isFavoredWeapon(this.fav, def);
  }
  isFavoredId(id: string | undefined): boolean {
    return !!id && this.isFavored(WEAPON_MAP[id]);
  }

  /** 契合武器的参数加成；不是契合武器返回 null */
  affMods(def: WeaponDef): AffMods | null {
    if (!this.isFavored(def)) return null;
    const g = this.g,
      s = g.stats,
      m = emptyMods(),
      ps = g.pstatus;
    const lv = run.level;
    switch (this.id) {
      case 'tomato':
        m.combo = 0.2 + Math.min(0.2, 0.02 * Math.max(0, run.wave - 1));
        break;
      case 'carrot':
        m.status.push(S('armorBreak', 4));
        m.area = Math.min(40, Math.max(0, s.armor) * 2);
        break;
      case 'chili':
        m.range = 30;
        m.status.push(S('burn', 2.5));
        break;
      case 'corn':
        m.range = 25;
        m.pierce = 1;
        break;
      case 'watermelon':
        m.area = 25 + Math.min(50, Math.max(0, s.maxHp) / 4);
        m.knock = 20;
        break;
      case 'lemon':
        m.critDmg = 30;
        break;
      case 'eggplant':
        m.chain = 1;
        break;
      case 'blueberry': {
        const n: Record<string, number> = {};
        for (const w of run.weapons) if (this.isFavored(WEAPON_MAP[w.id])) n[w.id] = (n[w.id] ?? 0) + 1;
        const pairs = Object.values(n).reduce((a, c) => a + Math.floor(c / 2), 0);
        m.count = 1 + Math.min(2, pairs);
        break;
      }
      case 'pineapple':
        m.bounce = 1 + Math.min(3, Math.floor(run.seeds / 100));
        break;
      case 'pumpkin':
        if (this.dodgeT > 0) m.atkSpd = 40;
        break;
      case 'strawberry': {
        m.atkSpd = Math.min(30, lv);
        const n = Math.floor(lv / 4);
        for (let i = 0; i < n; i++) {
          const k = i % 4;
          if (k === 0) m.range += 15;
          else if (k === 1) m.count += 1;
          else if (k === 2) m.pierce += 1;
          else m.crit += 5;
        }
        break;
      }
      case 'ginger':
        m.count = 1;
        m.atkSpd = speedBonusPct(s.speed) * 0.4;
        break;
      case 'avocado':
        m.area = 20;
        break;
      case 'onion':
        m.status.push(S('blind', 2, 1, 15));
        break;
      case 'mushroom':
        m.status.push(S('poison', 5));
        break;
      case 'grape':
      case 'pomegranate':
        m.count = 1;
        break;
      case 'cherry':
        m.atkSpd = this.overheatT > 0 ? 15 - CHERRY_HEAT.overheatSlow : 15 + this.heat;
        break;
      case 'pea':
        m.pierce = 1;
        break;
      case 'peach':
        if (ps.has('shield')) m.pierce = 1;
        break;
      case 'dragonfruit':
        m.status.push(S('burn', 3));
        break;
      case 'beet': {
        m.lifeSteal = 3;
        const lost = Math.floor(Math.max(0, 1 - run.hp / s.maxHp) * 10);
        m.atkSpd = lost * 6;
        m.area = lost * 3;
        break;
      }
      case 'sweetpotato':
        if (this.fedT > 0) {
          m.atkSpd = 25;
          m.area = 20;
        }
        break;
      case 'durian':
        m.area = 20;
        break;
      case 'bellpepper':
        m.range = 20;
        m.projSpd = 20;
        if (ps.has('shield')) {
          m.atkSpd = 30;
          m.count = 1;
        }
        break;
      case 'wintermelon':
        if (this.still) {
          m.range = 20;
          m.combo = 0.5;
        }
        break;
      case 'bittermelon':
        m.status.push(S('freeze', 1, 1, 8));
        break;
      case 'sprout':
        m.range = Math.min(30, lv);
        m.atkSpd = Math.min(40, lv);
        m.pierce = Math.min(3, Math.floor(lv / 5));
        break;
      case 'wasabi':
        m.area = 15;
        m.status.push(S('burn', 2.5));
        break;
      case 'soybean':
        if (g.skill?.clone) m.atkSpd = 50;
        break;
      case 'taro':
        m.area = 25;
        break;
      case 'cabbage':
        m.area = ps.stacks('fortify') * 4;
        if (this.vetT > 0) m.atkSpd = 30;
        break;
    }
    return m;
  }

  /** 契合武器开火一次（有副作用：计数、层数） */
  onFire(def: WeaponDef): ShotMods {
    const sm: ShotMods = { mult: 1, knock: 0, forceCrit: false, count: 0, pierce: 0 };
    if (!this.isFavored(def)) return sm;
    const bulletish = BULLETISH.has(def.kind);
    switch (this.id) {
      case 'coconut': {
        const n = (this.punch.get(def.id) ?? 0) + 1;
        this.punch.set(def.id, n % 4);
        if (n % 4 === 0) {
          sm.mult = 2.5;
          sm.knock = 30;
          sm.stun = 0.4;
        }
        break;
      }
      case 'pumpkin':
        if (this.ghost > 0) {
          this.ghost--;
          sm.forceCrit = true;
          sm.pierce = 99;
          sm.bullet = (b) => b.setTint(0xe0aaff);
        }
        break;
      case 'cherry':
        // 过热循环：叠满热枪后过热一段时间（攻速下降、清零），之后重新叠
        if (this.overheatT <= 0 && ++this.heat >= CHERRY_HEAT.max) {
          this.heat = 0;
          this.overheatT = CHERRY_HEAT.overheat;
          this.g.fx.label(this.g.player.x, this.g.player.y - 50, tx('过热！', 'Overheat!'), '#ff4d6d');
        }
        this.heatT = 1;
        break;
      case 'corn':
        sm.bullet = (b) => {
          b.distPierce = 3;
        };
        break;
      case 'asparagus':
        sm.bullet = (b) => {
          b.refundFull = true;
        };
        break;
      case 'pea': {
        const ch = 0.08 * run.weapons.length;
        sm.bullet = (b) => {
          if (b.kind === 'normal' && Math.random() < ch) b.split += 1;
        };
        break;
      }
      case 'lychee': {
        if (bulletish && Math.random() < 0.15) sm.count = 1;
        const ch = Math.min(0.3, Math.max(0, this.g.stats.luck) / 400);
        const cm = def.critMult;
        sm.bullet = (b) => {
          if (Math.random() >= ch) return;
          if (!b.crit) b.dmg *= cm;
          b.crit = true;
          b.bounce += 2;
          b.setTint(0xff3b30);
        };
        break;
      }
    }
    return sm;
  }

  /** 命中结算前：天赋带来的额外暴击。返回 [是否暴击, 额外暴击伤害 %] */
  preHit(e: Enemy, info: HitInfo, crit: boolean, marked: boolean): [boolean, number] {
    if (info.echo || !this.isFavoredId(info.weaponId)) return [crit, 0];
    let extra = 0,
      bonus = 0;
    switch (this.id) {
      case 'onion':
        if (e.status.has('blind')) extra = 30;
        break;
      case 'kiwi':
        extra = 5 * new Set(e.status.list.filter((x) => STATUSES[x.id].kind === 'debuff').map((x) => x.id)).size;
        break;
      case 'asparagus':
        if (e.hp >= e.maxHp) extra = 100;
        if (marked && crit) bonus = 50;
        break;
      case 'bittermelon':
        if (e.status.has('freeze')) extra = 100;
        break;
    }
    if (!crit && extra > 0 && Math.random() * 100 < extra) crit = true;
    return [crit, bonus];
  }

  /** 命中前采集目标状态 */
  ctx(e: Enemy, info: HitInfo): HitCtx {
    if (info.echo || !this.isFavoredId(info.weaponId)) return NO_CTX;
    const st = e.status;
    return { burning: st.has('burn'), stunned: st.has('stun'), frozen: st.has('freeze'), cursed: st.has('curse') };
  }

  /** 契合武器命中后（伤害已结算） */
  afterHit(e: Enemy, info: HitInfo, crit: boolean, c: HitCtx, dmg: number): void {
    if (info.echo || !this.isFavoredId(info.weaponId)) return;
    const g = this.g;
    this.lastFavDmg = dmg;
    const src = info.weaponId;
    switch (this.id) {
      case 'carrot':
        if (e.alive && e.status.stacks('armorBreak') >= 3) e.status.apply({ id: 'stun', dur: 0.3 });
        break;
      case 'chili':
        if (c.burning && this.ready('spark', 0.25)) this.boom(e.x, e.y, 55, dmg * 0.3, 0xff7b00, src);
        break;
      case 'lemon':
        if (crit) {
          if (e.alive) e.status.apply({ id: 'bleed', dur: 3 });
          if (src) this.resetReq.add(src);
        }
        break;
      case 'coconut':
        if (c.stunned && this.ready('quake', 0.35)) this.boom(e.x, e.y, 75, dmg * 0.5, 0xbc6c25, src);
        break;
      case 'grape': {
        const sure = g.pstatus.has('invuln');
        if ((sure || Math.random() < 0.15) && this.ready('phantom', sure ? 0.08 : 0.15)) {
          const ex = new Set<Enemy>([e]);
          const t = g.grid.nearest(e.x, e.y, 350, ex);
          if (t) this.shot(e.x, e.y, Math.atan2(t.y - e.y, t.x - e.x), 620, 0.7, dmg * 0.6, 'proj_grape_shotgun', 0xc77dff, src);
        }
        break;
      }
      case 'peach': {
        const shield = g.pstatus.has('shield');
        if (this.healCd <= 0 && (shield || Math.random() < 0.03)) {
          this.healCd = shield ? 0.34 : 0.5;
          g.heal(1, false);
        }
        break;
      }
      case 'dragonfruit':
        if (c.burning && this.ready('breath', 0.6)) {
          const p = g.player,
            a = Math.atan2(e.y - p.y, e.x - p.x);
          for (const d of [-0.22, 0, 0.22]) {
            const b = this.shot(p.x, p.y, a + d, 420, 0.4, dmg * 0.4, 'proj_flame', 0xff5400, src);
            if (b) {
              b.kind = 'flame';
              b.pierce = 999;
              b.setScale(0.6);
            }
          }
        }
        break;
      case 'sweetpotato':
        if (run.wave !== this.lastWave) {
          this.lastWave = run.wave;
          this.fruitDrops = 0;
        }
        if (this.fruitDrops < 4 && Math.random() < 0.03) {
          this.fruitDrops++;
          g.dropFruit(e.x, e.y);
        }
        break;
      case 'kiwi':
        if (e.alive && e.status.list.some((x) => STATUSES[x.id].kind === 'debuff')) e.status.apply({ id: 'vulnerable', dur: 3 });
        break;
      case 'durian': {
        const n = (this.stench.get(e) ?? 0) + 1;
        if (n >= 3 && this.ready('stench', 0.2)) {
          this.stench.set(e, 0);
          this.radial(e.x, e.y, 8, dmg * 0.5, 'proj_player', 0xc9a227, src, 0);
        } else this.stench.set(e, Math.min(3, n));
        break;
      }
      case 'bittermelon':
        if (c.frozen) {
          e.status.remove('freeze');
          this.boom(e.x, e.y, 65, dmg * 0.5, 0xa9def9, src);
        }
        break;
      case 'jackfruit':
        if (this.ready('spikes', 0.6)) {
          const n = Math.min(6, 1 + g.pstatus.stacks('thorns'));
          this.radial(g.player.x, g.player.y, n, dmg * 0.5, 'proj_player', 0x6a994e, src, 1);
        }
        break;
      case 'blackberry':
        if (c.cursed) {
          if (e.alive) e.status.apply({ id: 'rot', dur: 4 });
          if (this.ready('hex', 0.3)) {
            const t = g.grid.nearest(e.x, e.y, 160, new Set<Enemy>([e]));
            if (t && !t.status.has('curse')) {
              t.status.apply({ id: 'curse', dur: 3 });
              g.fxLightning(
                [
                  { x: e.x, y: e.y },
                  { x: t.x, y: t.y },
                ],
                0x9d4edd,
              );
            }
          }
        }
        break;
    }
  }

  /** 契合连锁每跳一次（茄子法师：概率引下落雷） */
  onChainJump(def: WeaponDef, e: Enemy): void {
    if (this.id === 'eggplant' && this.isFavored(def) && Math.random() < 0.15) this.g.skyBolt(e);
  }

  /** 爆炸结算后 */
  onExplode(x: number, y: number, r: number, dmg: number, info: HitInfo): void {
    if (info.echo || !this.isFavoredId(info.weaponId)) return;
    const g = this.g;
    const src = info.weaponId;
    if (this.id === 'avocado') {
      const ch = Math.min(0.6, 0.3 + 0.03 * Math.max(0, run.wave - 1));
      if (Math.random() < ch) {
        const a = Math.random() * Math.PI * 2;
        const ex = x + Math.cos(a) * r * 0.8,
          ey = y + Math.sin(a) * r * 0.8;
        g.time.delayedCall(140, () => this.boom(ex, ey, r * 0.6, dmg * 0.5, 0xa7c957, src));
      }
    } else if (this.id === 'soybean' && WEAPON_MAP[src ?? '']?.kind === 'mine') {
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const ex = x + Math.cos(a) * 55,
          ey = y + Math.sin(a) * 55;
        g.time.delayedCall(220 + i * 120, () => this.boom(ex, ey, 48, dmg * 0.4, 0xe9d8a6, src));
      }
    }
  }

  onKill(e: Enemy, byExplosion: boolean, src: string): void {
    const g = this.g;
    if (this.id === 'mushroom' && e.status.has('poison')) {
      for (const o of g.grid.query(e.x, e.y, 150, [])) if (o.alive && o !== e) o.status.apply({ id: 'poison', dur: 4, stacks: 3 });
      const s = g.stats,
        dmg = (6 + s.elemental * 1.5) * (1 + s.damage / 100);
      for (let i = 0; i < 3; i++) {
        const b = this.shot(e.x, e.y, (i / 3) * Math.PI * 2 + Math.random(), 380, 1.4, dmg, 'proj_pea', 0x9d4edd, 'talent');
        if (b) {
          b.homing = 6;
          b.status = [S('poison', 4, 2)];
        }
      }
    }
    if (this.id === 'wasabi' && byExplosion && Math.random() < 0.4) {
      const s = g.stats,
        dmg = 18 * (1 + s.damage / 100) + s.elemental;
      const x = e.x,
        y = e.y;
      g.time.delayedCall(80, () => {
        g.explode(x, y, 70, dmg, { dmg, crit: false, explosion: true }, 0xff9f1c);
        for (let i = 0; i < 2; i++) {
          const b = this.shot(x, y, Math.random() * Math.PI * 2, 380, 0.45, dmg * 0.5, 'proj_flame', 0xff7b00, 'talent');
          if (b) {
            b.kind = 'flame';
            b.pierce = 999;
            b.setScale(0.6);
          }
        }
      });
    }
    // 籽弹倾泻：契合武器击杀爆出 3 颗籽弹；籽弹击杀时再爆一轮（籽弹连锁，最多 1 次）
    if (this.id === 'pomegranate' && (this.isFavoredId(src) || src === 'pom_seed'))
      this.radial(
        e.x,
        e.y,
        3,
        this.lastFavDmg * 0.5,
        'proj_seed_spitter',
        0xff4d6d,
        src === 'pom_seed' ? 'pom_seed2' : 'pom_seed',
        0,
        Math.random() * Math.PI,
      );
  }

  onDodge(): void {
    if (this.id === 'pumpkin') {
      this.dodgeT = 1.5;
      this.ghost = 3;
    }
  }

  onHurt(): void {
    if (this.id !== 'onion' || this.blindCd > 0) return;
    this.blindCd = 3;
    const p = this.g.player;
    this.g.fx.ring(p.x, p.y, 180, 0xe9ecef, 300);
    for (const o of this.g.grid.query(p.x, p.y, 180, [])) if (o.alive) o.status.apply({ id: 'blind', dur: 2 });
  }

  /** 拾取果实 */
  onFruit(): void {
    if (this.id === 'sweetpotato') this.fedT = 5;
  }

  /** 净化减益或复活后 */
  onCleanse(): void {
    if (this.id === 'cabbage') this.vetT = 5;
  }

  /** 芋头术士：契合光环是否周期脉冲 */
  auraPulse(def: WeaponDef): boolean {
    return this.id === 'taro' && this.isFavored(def);
  }

  /** 致命伤害时调用；返回 true 表示已保命 */
  preventDeath(): boolean {
    if (this.id !== 'peach' || this.saved) return false;
    this.saved = true;
    run.hp = 1;
    this.g.iframes = 2;
    this.g.fx.ring(this.g.player.x, this.g.player.y, 120, 0xffc8dd, 500, true);
    return true;
  }

  /** 受到伤害倍率 */
  takenMult(): number {
    switch (this.id) {
      case 'watermelon':
        return 0.9;
      case 'bellpepper':
        return 0.85;
      case 'wintermelon':
        return this.still ? 0.75 : 1;
      default:
        return 1;
    }
  }

  /** 契合武器的伤害倍率：大蒜伯爵按已损失生命增伤（满血 ×1，空血 ×1.6）；卷心菜老兵每层坚韧 +5% */
  favDmgMult(def: WeaponDef): number {
    if (!this.isFavored(def)) return 1;
    if (this.id === 'garlic') return 1 + 0.6 * Math.max(0, 1 - run.hp / Math.max(1, this.g.stats.maxHp));
    if (this.id === 'cabbage') return 1 + 0.05 * this.g.pstatus.stacks('fortify');
    return 1;
  }

  /** 大蒜伯爵「血之盛宴」：契合武器的吸血冷却缩短、同一次群体命中可连续触发数次（见 BALANCE.lifeSteal） */
  lifeStealRule(weaponId: string | undefined): { cdMult: number; burst: number } {
    if (this.id === 'garlic' && weaponId && isFavoredWeapon(this.fav, WEAPON_MAP[weaponId]))
      return { cdMult: BALANCE.lifeSteal.favoredCdMult, burst: BALANCE.lifeSteal.favoredBurst };
    return { cdMult: 1, burst: 1 };
  }

  /** 拾取果实时额外获得的番茄籽 */
  fruitSeeds(): number {
    return this.id === 'sweetpotato' ? 2 + run.wave : 0;
  }

  update(dt: number): void {
    const g = this.g;
    if (this.dodgeT > 0) this.dodgeT -= dt;
    if (this.blindCd > 0) this.blindCd -= dt;
    if (this.fedT > 0) this.fedT -= dt;
    if (this.vetT > 0) this.vetT -= dt;
    if (this.healCd > 0) this.healCd -= dt;
    for (const k in this.cds) if (this.cds[k] > 0) this.cds[k] -= dt;
    if (this.heatT > 0 && (this.heatT -= dt) <= 0) this.heat = 0;
    if (this.overheatT > 0) this.overheatT -= dt;
    switch (this.id) {
      case 'grape':
        if ((this.invulnT += dt) >= 8) {
          this.invulnT = 0;
          g.applyPlayerStatus([{ id: 'invuln', dur: 1 }]);
        }
        break;
      case 'jackfruit':
        // 刺针齐射：每 1.2 秒向最近的敌人射出 3 根穿透刺针（伤害随护甲、最大生命成长），前期也有稳定输出
        if ((this.autoT += dt) >= 1.2) {
          const p = g.player,
            t = g.grid.nearest(p.x, p.y, 360);
          if (t) {
            this.autoT = 0;
            const s = g.stats,
              a = Math.atan2(t.y - p.y, t.x - p.x);
            for (const d of [-0.18, 0, 0.18]) {
              const b = this.shot(p.x, p.y, a + d, 560, 0.7, 5 + s.armor + s.maxHp * 0.05, 'proj_player', 0x6a994e, 'talent');
              if (b) b.pierce = 1;
            }
          }
        }
        break;
      case 'durian':
        // 臭刺投掷：每 1.5 秒向最近的敌人掷出臭刺（伤害随元素伤害、护甲成长），附带中毒与虚弱——够得着站远的射手
        if ((this.autoT += dt) >= 1.5) {
          const p = g.player,
            t = g.grid.nearest(p.x, p.y, 400);
          if (t) {
            this.autoT = 0;
            const s = g.stats;
            const b = this.shot(
              p.x,
              p.y,
              Math.atan2(t.y - p.y, t.x - p.x),
              520,
              0.85,
              4 + s.elemental + s.armor * 0.5,
              'proj_player',
              0xc9a227,
              'talent',
            );
            if (b) b.status = [S('poison', 3, 2), S('weaken', 2, 1)];
          }
        }
        break;
      case 'peach':
        // 圣光弹：每 0.8 秒向最近的敌人发射追踪光弹（伤害随远程伤害、生命再生成长），有护盾时一次 2 枚
        if ((this.autoT += dt) >= 0.8) {
          const p = g.player,
            t = g.grid.nearest(p.x, p.y, 420);
          if (t) {
            this.autoT = 0;
            const s = g.stats,
              a = Math.atan2(t.y - p.y, t.x - p.x);
            const n = g.pstatus.has('shield') ? 2 : 1;
            for (let k = 0; k < n; k++) {
              const b = this.shot(
                p.x,
                p.y,
                a + (k - (n - 1) / 2) * 0.3,
                520,
                0.9,
                6 + s.ranged + s.regen * 0.5,
                'proj_player',
                0xffc8dd,
                'talent',
              );
              if (b) b.homing = 6;
            }
          }
        }
        break;
      case 'wintermelon':
        if (!this.still) this.regenT = 0;
        else if ((this.regenT += dt) >= 1) {
          this.regenT = 0;
          g.heal(Math.max(1, Math.round(g.stats.maxHp * 0.02)), false);
        }
        break;
    }
  }

  // ---------------- 天赋追加效果 ----------------
  /** 天赋小爆炸（不再触发天赋） */
  private boom(x: number, y: number, r: number, dmg: number, color: number, src?: string): void {
    this.g.explode(x, y, r, dmg, { dmg, crit: false, explosion: true, echo: true, weaponId: src }, color);
  }

  /** 天赋追加子弹（不再触发天赋） */
  private shot(
    x: number,
    y: number,
    ang: number,
    speed: number,
    life: number,
    dmg: number,
    key: string,
    tint: number,
    src = 'talent',
  ): Bullet | null {
    const g = this.g;
    const k = g.textures.exists(key) ? key : 'proj_player';
    const b = g.spawnPlayerBullet(k, x, y, ang, speed, life, 8);
    b.dmg = Math.max(1, dmg);
    b.src = src;
    b.echo = true;
    b.setTint(tint).setScale(0.8);
    return b;
  }

  /** 向四周均匀发射 n 颗追加子弹 */
  private radial(x: number, y: number, n: number, dmg: number, key: string, tint: number, src?: string, pierce = 0, rot = 0): void {
    const extra = this.id === 'jackfruit' ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const b = this.shot(x, y, rot + (i / n) * Math.PI * 2, 520, 0.6, dmg, key, tint, src);
      if (b) b.pierce = pierce + extra;
    }
    if (n > 0) this.g.fx.ring(x, y, 40, tint, 200);
  }
}
