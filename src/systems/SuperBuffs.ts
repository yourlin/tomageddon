// 超武增益：只有部分超武自带（WeaponDef.superBuff），击败精英时触发，只强化这把超武自己。
// 规则：触发后持续 dur 秒，期间再击败精英继续叠层直到满层；满层后再击败精英不重置倒计时；结束后冷却 cd 秒。
// 同种增益不叠加：同时持有多把带同一增益的超武，共用一份层数、持续与冷却。
import type { WeaponDef } from '../data/weapons';
import { BALANCE } from '../data/balance';

export type SuperBuffKind = 'rage' | 'haste' | 'focus' | 'vampiric';

interface BuffState {
  stacks: number;
  t: number;
  cd: number;
}

export const SUPER_BUFF_NAME: Record<SuperBuffKind, [string, string]> = {
  rage: ['怒气', 'Rage'],
  haste: ['急速', 'Haste'],
  focus: ['专注', 'Focus'],
  vampiric: ['嗜血', 'Bloodlust'],
};

/** 超武增益的说明 [中文, English] */
export function superBuffText(k: SuperBuffKind): [string, string] {
  const S = BALANCE.superBuff;
  const tail = [
    `（击败精英触发，持续 ${S.dur} 秒、冷却 ${S.cd} 秒，只强化这把超武）`,
    ` (on elite kill, ${S.dur}s, ${S.cd}s cooldown, this weapon only)`,
  ];
  switch (k) {
    case 'rage':
      return [
        `超武增益·怒气：每层伤害 +${S.rage.per}%，最多 ${S.maxStacks} 层；叠满后下一击伤害 ×${S.rage.burstMult} 并震出冲击波，然后清空${tail[0]}`,
        `Super Buff · Rage: +${S.rage.per}% damage per stack, up to ${S.maxStacks}; at full stacks the next hit deals ×${S.rage.burstMult} with a shockwave, then clears${tail[1]}`,
      ];
    case 'haste':
      return [
        `超武增益·急速：每层攻速 +${S.haste.per}%，最多 ${S.maxStacks} 层${tail[0]}`,
        `Super Buff · Haste: +${S.haste.per}% attack speed per stack, up to ${S.maxStacks}${tail[1]}`,
      ];
    case 'focus':
      return [
        `超武增益·专注：每层让下一次暴击伤害 +${S.focus.per}%，暴击时消耗 1 层，最多 ${S.maxStacks} 层${tail[0]}`,
        `Super Buff · Focus: each stack adds +${S.focus.per}% to the next crit and is consumed on crit, up to ${S.maxStacks}${tail[1]}`,
      ];
    case 'vampiric':
      return [
        `超武增益·嗜血：生命低于 ${S.vampiric.hpBelow * 100}% 时每层吸血 +${S.vampiric.per}%，最多 ${S.maxStacks} 层${tail[0]}`,
        `Super Buff · Bloodlust: below ${S.vampiric.hpBelow * 100}% HP, +${S.vampiric.per}% life steal per stack, up to ${S.maxStacks}${tail[1]}`,
      ];
  }
}

export class SuperBuffs {
  private s: Record<SuperBuffKind, BuffState> = {
    rage: { stacks: 0, t: 0, cd: 0 },
    haste: { stacks: 0, t: 0, cd: 0 },
    focus: { stacks: 0, t: 0, cd: 0 },
    vampiric: { stacks: 0, t: 0, cd: 0 },
  };

  /** 当前持有的超武里有哪些增益 */
  constructor(private owned: () => Set<SuperBuffKind>) {}

  stacks(k: SuperBuffKind): number {
    return this.s[k].t > 0 ? this.s[k].stacks : 0;
  }

  /** 击败精英：每种持有的增益各自触发 / 叠层；返回本次有变化的增益（用于飘字） */
  onEliteKill(): { kind: SuperBuffKind; stacks: number }[] {
    const out: { kind: SuperBuffKind; stacks: number }[] = [];
    const S = BALANCE.superBuff;
    for (const k of this.owned()) {
      const b = this.s[k];
      if (b.cd > 0) continue;
      if (b.t > 0) {
        if (b.stacks >= S.maxStacks) continue; // 满层后不重置倒计时
        b.stacks++;
      } else {
        b.stacks = 1;
        b.t = S.dur;
      }
      out.push({ kind: k, stacks: b.stacks });
    }
    return out;
  }

  update(dt: number): void {
    for (const b of Object.values(this.s)) {
      if (b.t > 0) {
        b.t -= dt;
        if (b.t <= 0) this.end(b);
      } else if (b.cd > 0) b.cd -= dt;
    }
  }

  private end(b: BuffState): void {
    b.t = 0;
    b.stacks = 0;
    b.cd = BALANCE.superBuff.cd;
  }

  /** 这把超武的伤害倍率；怒气满层时这一击爆发（×burstMult）并清空，返回 burst = true 让调用方补冲击波 */
  hitMult(def: WeaponDef): { mult: number; burst: boolean } {
    if (def.superBuff !== 'rage') return { mult: 1, burst: false };
    const S = BALANCE.superBuff;
    const b = this.s.rage;
    if (b.t <= 0) return { mult: 1, burst: false };
    if (b.stacks >= S.maxStacks) {
      this.end(b);
      return { mult: (1 + (S.rage.per * S.maxStacks) / 100) * S.rage.burstMult, burst: true };
    }
    return { mult: 1 + (S.rage.per * b.stacks) / 100, burst: false };
  }

  /** 这把超武的额外攻速 % */
  attackSpeed(def: WeaponDef): number {
    return def.superBuff === 'haste' ? BALANCE.superBuff.haste.per * this.stacks('haste') : 0;
  }

  /** 这把超武暴击时：消耗 1 层专注，返回暴击伤害倍率 */
  onCrit(def: WeaponDef): number {
    if (def.superBuff !== 'focus' || this.stacks('focus') <= 0) return 1;
    this.s.focus.stacks--;
    if (this.s.focus.stacks <= 0) this.end(this.s.focus);
    return 1 + BALANCE.superBuff.focus.per / 100;
  }

  /** 这把超武的额外吸血概率 %（只在残血时生效） */
  lifeSteal(def: WeaponDef, hpPct: number): number {
    if (def.superBuff !== 'vampiric' || hpPct >= BALANCE.superBuff.vampiric.hpBelow) return 0;
    return BALANCE.superBuff.vampiric.per * this.stacks('vampiric');
  }
}
