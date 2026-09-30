// 角色专属天赋：每名角色一个独特机制（文字见 data/characters.ts 的 talent 字段）。
// 部分天赋直接用角色的 special 实现（落雷、暴击伤害、利息、持续伤害），其余在这里按战斗事件挂钩。
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import type { StatMods } from '../data/stats';
import { STATUSES } from '../data/statuses';
import { run } from './RunState';

/** 每完成一波的永久成长 */
export function waveGrowthMods(charId: string): StatMods | null {
  return charId === 'tomato' ? { maxHp: 1, damage: 1 } : null;
}
/** 每次升级的额外永久成长 */
export function levelGrowthMods(charId: string): StatMods | null {
  return charId === 'strawberry' ? { maxHp: 1, damage: 1 } : null;
}
/** 本波第一次商店刷新是否免费 */
export const freeFirstReroll = (charId: string): boolean => charId === 'lychee';

export class TalentSystem {
  private readonly id: string;
  private dodgeT = 0; // 南瓜幽灵：闪避后的增伤窗口
  private blindCd = 0; // 洋葱大叔：催泪弹冷却
  private auraT = 0; // 榴莲霸王：光环周期
  private invulnT = 0; // 葡萄魔术师：周期无敌
  private regenT = 0; // 冬瓜和尚：静止回血
  private saved = false; // 蜜桃天使：本波是否已触发保命

  constructor(private g: GameScene) {
    this.id = run.charId;
  }

  private get still(): boolean {
    return this.g.moveX === 0 && this.g.moveY === 0;
  }

  /** 造成伤害倍率 */
  dmgMult(e: Enemy, info: HitInfo): number {
    const g = this.g,
      s = g.stats,
      p = g.player;
    switch (this.id) {
      case 'carrot':
        return info.cls === 'melee' ? 1 + Math.max(0, s.armor) * 0.015 : 1;
      case 'chili':
        return e.status.has('burn') ? 1.3 : 1;
      case 'corn':
        return 1 + Math.min(0.3, (Math.hypot(e.x - p.x, e.y - p.y) / 100) * 0.06);
      case 'watermelon':
        return 1 + Math.max(0, s.maxHp) / 1000;
      case 'blueberry': {
        const n: Record<string, number> = {};
        for (const w of run.weapons) n[w.id] = (n[w.id] ?? 0) + 1;
        return 1 + Object.values(n).reduce((a, c) => a + Math.floor(c / 2), 0) * 0.05;
      }
      case 'pumpkin':
        return this.dodgeT > 0 ? 1.4 : 1;
      case 'ginger':
        return 1 + Math.max(0, s.speed) * 0.004;
      case 'avocado':
        return info.explosion ? 1 + 0.1 * (run.wave - 1) : 1;
      case 'cherry':
        return 1 + Math.max(0, s.attackSpeed) * 0.002;
      case 'pea':
        return 1 + run.weapons.length * 0.03;
      case 'beet':
        return 1 + Math.max(0, 1 - run.hp / s.maxHp) * 0.6;
      case 'asparagus':
        return e.hp > e.maxHp * 0.8 ? 1.4 : 1;
      case 'kiwi':
        return e.status.list.some((x) => STATUSES[x.id].kind === 'debuff') ? 1.2 : 1;
      case 'lychee':
        return 1 + Math.max(0, s.luck) * 0.001;
      case 'bittermelon':
        return e.status.has('slow') || e.status.has('freeze') ? 1.35 : 1;
      case 'sprout':
        return 1 + run.level * 0.015;
      default:
        return 1;
    }
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

  lifeStealMult(): number {
    return this.id === 'garlic' && run.hp < this.g.stats.maxHp * 0.5 ? 2 : 1;
  }

  /** 命中后（伤害结算前） */
  onHit(e: Enemy, info: HitInfo): void {
    if (this.id === 'coconut' && info.cls === 'melee' && Math.random() < 0.12) e.status.apply({ id: 'stun', dur: 0.6 });
  }

  onKill(e: Enemy, crit: boolean, byExplosion: boolean): void {
    const g = this.g;
    if (this.id === 'lemon' && crit) g.heal(1, false);
    if (this.id === 'mushroom' && e.status.has('poison'))
      for (const o of g.grid.query(e.x, e.y, 150, [])) if (o.alive && o !== e) o.status.apply({ id: 'poison', dur: 4, stacks: 3 });
    if (this.id === 'wasabi' && byExplosion && Math.random() < 0.4) {
      const s = g.stats,
        dmg = 18 * (1 + s.damage / 100) + s.elemental;
      const x = e.x,
        y = e.y;
      g.time.delayedCall(80, () => g.explode(x, y, 70, dmg, { dmg, crit: false, explosion: true }, 0xff9f1c));
    }
  }

  onDodge(): void {
    if (this.id === 'pumpkin') this.dodgeT = 1.5;
  }

  onHurt(): void {
    if (this.id !== 'onion' || this.blindCd > 0) return;
    this.blindCd = 3;
    const p = this.g.player;
    this.g.fx.ring(p.x, p.y, 180, 0xe9ecef, 300);
    for (const o of this.g.grid.query(p.x, p.y, 180, [])) if (o.alive) o.status.apply({ id: 'blind', dur: 2 });
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

  /** 拾取果实时额外获得的番茄籽 */
  fruitSeeds(): number {
    return this.id === 'sweetpotato' ? 2 + run.wave : 0;
  }

  update(dt: number): void {
    const g = this.g;
    if (this.dodgeT > 0) this.dodgeT -= dt;
    if (this.blindCd > 0) this.blindCd -= dt;
    switch (this.id) {
      case 'grape':
        if ((this.invulnT += dt) >= 8) {
          this.invulnT = 0;
          g.applyPlayerStatus([{ id: 'invuln', dur: 1 }]);
        }
        break;
      case 'durian':
        if ((this.auraT += dt) >= 1) {
          this.auraT = 0;
          const p = g.player;
          for (const o of g.grid.query(p.x, p.y, 140, [])) if (o.alive) o.status.apply({ id: 'vulnerable', dur: 1.5 });
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
}
