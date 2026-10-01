// 状态效果容器：负责叠层、计时、持续伤害与属性汇总
import { STATUSES, type StatusId, type StatusApply } from '../data/statuses';

export interface StatusEntry {
  id: StatusId;
  stacks: number;
  t: number;
  dur: number;
  value: number;
}

export interface StatusTotals {
  speed: number;
  attackSpeed: number;
  dmgDealt: number;
  dmgTaken: number;
  armor: number;
  crit: number;
  dodge: number;
  range: number;
  luck: number;
  lifeSteal: number;
  regen: number;
  dps: number;
  reflect: number;
  disable: boolean;
  noHeal: boolean;
  noAttack: boolean;
  confuse: boolean;
  immune: boolean;
}

const EMPTY: StatusTotals = {
  speed: 0,
  attackSpeed: 0,
  dmgDealt: 0,
  dmgTaken: 0,
  armor: 0,
  crit: 0,
  dodge: 0,
  range: 0,
  luck: 0,
  lifeSteal: 0,
  regen: 0,
  dps: 0,
  reflect: 0,
  disable: false,
  noHeal: false,
  noAttack: false,
  confuse: false,
  immune: false,
};

export class StatusSet {
  list: StatusEntry[] = [];
  totals: StatusTotals = { ...EMPTY };
  /** 抗性：0~1，Boss 对控制类减益有抗性 */
  ccResist = 0;
  private dirty = false;
  private tickAcc = 0;
  version = 0;
  /** 成功施加状态时回调（敌人用于成就计数） */
  onApplied?: (id: StatusId) => void;

  clear(): void {
    this.list.length = 0;
    this.totals = { ...EMPTY };
    this.version++;
  }

  has(id: StatusId): boolean {
    return this.list.some((s) => s.id === id);
  }
  get(id: StatusId): StatusEntry | undefined {
    return this.list.find((s) => s.id === id);
  }
  stacks(id: StatusId): number {
    return this.get(id)?.stacks ?? 0;
  }

  /** 返回是否成功施加 */
  apply(a: StatusApply, dpsScale = 1): boolean {
    if (a.chance !== undefined && Math.random() * 100 >= a.chance) return false;
    const def = STATUSES[a.id];
    let dur = a.dur;
    if (def.disable && this.ccResist > 0) {
      if (this.ccResist >= 1) return false;
      dur *= 1 - this.ccResist;
    }
    if (def.kind === 'debuff' && this.totals.immune) return false;
    this.onApplied?.(a.id);
    const cur = this.get(a.id);
    const add = a.stacks ?? 1;
    if (cur) {
      cur.stacks = Math.min(def.maxStacks, cur.stacks + add);
      cur.t = Math.max(cur.t, dur);
      cur.dur = Math.max(cur.dur, dur);
      if (a.value !== undefined) cur.value = a.id === 'shield' ? cur.value + a.value : Math.max(cur.value, a.value * dpsScale);
    } else {
      this.list.push({
        id: a.id,
        stacks: Math.min(def.maxStacks, add),
        t: dur,
        dur,
        value: (a.value ?? 0) * (a.id === 'shield' ? 1 : dpsScale),
      });
    }
    this.dirty = true;
    return true;
  }

  remove(id: StatusId): void {
    const n = this.list.length;
    this.list = this.list.filter((s) => s.id !== id);
    if (this.list.length !== n) this.dirty = true;
  }

  /** 清除所有减益 */
  cleanse(): void {
    this.list = this.list.filter((s) => STATUSES[s.id].kind === 'buff');
    this.dirty = true;
  }

  /** 护盾吸收伤害，返回剩余伤害 */
  absorb(dmg: number): number {
    const sh = this.get('shield');
    if (!sh) return dmg;
    const used = Math.min(sh.value, dmg);
    sh.value -= used;
    if (sh.value <= 0.01) this.remove('shield');
    return dmg - used;
  }

  /** 返回本帧的持续伤害（0.5 秒结算一次） */
  update(dt: number): number {
    let expired = false;
    for (const s of this.list) {
      s.t -= dt;
      if (s.t <= 0) expired = true;
    }
    if (expired) {
      this.list = this.list.filter((s) => s.t > 0);
      this.dirty = true;
    }
    if (this.dirty) this.recalc();
    this.tickAcc += dt;
    if (this.tickAcc >= 0.5 && this.totals.dps > 0) {
      this.tickAcc = 0;
      return this.totals.dps * 0.5;
    }
    if (this.tickAcc >= 0.5) this.tickAcc = 0;
    return 0;
  }

  private recalc(): void {
    const t: StatusTotals = { ...EMPTY };
    for (const s of this.list) {
      const d = STATUSES[s.id];
      const n = s.stacks;
      t.speed += (d.speed ?? 0) * n;
      t.attackSpeed += (d.attackSpeed ?? 0) * n;
      t.dmgDealt += (d.dmgDealt ?? 0) * n;
      t.dmgTaken += (d.dmgTaken ?? 0) * n;
      t.armor += (d.armor ?? 0) * n;
      t.crit += (d.crit ?? 0) * n;
      t.dodge += (d.dodge ?? 0) * n;
      t.range += (d.range ?? 0) * n;
      t.luck += (d.luck ?? 0) * n;
      t.lifeSteal += (d.lifeSteal ?? 0) * n;
      t.regen += (d.regen ?? 0) * n;
      t.reflect += (d.reflect ?? 0) * n;
      // dps：value 字段可覆盖基础每层伤害（按来源伤害缩放）
      if (d.dps) t.dps += (s.value > 0 ? s.value : d.dps) * n;
      if (d.disable) t.disable = true;
      if (d.noHeal) t.noHeal = true;
      if (d.noAttack) t.noAttack = true;
      if (d.confuse) t.confuse = true;
      if (d.immune) t.immune = true;
    }
    t.speed = Math.max(-80, t.speed);
    this.totals = t;
    this.dirty = false;
    this.version++;
  }
}
