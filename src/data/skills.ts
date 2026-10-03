// 大招冷却自动计算：按招式的伤害、覆盖范围、控制、增益强度折算“威力分”，威力越大 CD 越长
import type { SkillDef } from './characters';
import type { StatusApply, StatusId } from './statuses';

const STATUS_W: Partial<Record<StatusId, number>> = {
  stun: 4,
  freeze: 4,
  slow: 0.4,
  sticky: 0.5,
  burn: 0.35,
  poison: 0.3,
  bleed: 0.35,
  rot: 0.3,
  weaken: 0.5,
  vulnerable: 0.6,
  armorBreak: 0.4,
  mark: 0.5,
  blind: 0.5,
  confuse: 0.6,
  curse: 0.5,
  silence: 0.5,
  enrage: 1.2,
  haste: 0.4,
  rage: 0.15,
  invuln: 3,
  regen: 0.3,
  fortify: 0.25,
  lucky: 0.12,
  focus: 0.25,
  vampiric: 0.3,
  barrier: 1,
  thorns: 0.2,
};

function statusScore(list: StatusApply[] | undefined): number {
  let s = 0;
  for (const a of list ?? []) s += (STATUS_W[a.id] ?? 0.3) * a.dur * (a.stacks ?? 1) + (a.id === 'shield' ? (a.value ?? 0) * 0.1 : 0);
  return s;
}

/** 预估命中目标数 */
export function skillTargets(sk: SkillDef): number {
  const r = sk.radius ?? 180;
  const area = (k: number, cap: number) => Math.min(cap, Math.max(1, (r / 100) ** 2 * k));
  switch (sk.type) {
    case 'nova':
    case 'heal':
    case 'field':
      return area(2.2, 12);
    case 'curse':
      return r >= 600 ? 14 : area(2.2, 12);
    case 'screen':
      return 14;
    case 'missile':
      return area(2.5, 10);
    case 'strikes':
      return (sk.count ?? 6) * 1.3;
    case 'ring':
      return (sk.count ?? 18) * 0.35;
    case 'barrage':
      return (sk.count ?? 10) * 0.9;
    case 'dash':
      return (sk.distance ?? 300) / 90;
    case 'clone':
      return (sk.duration ?? 8) * 2.4;
    default:
      return 1;
  }
}

export function skillPower(sk: SkillDef): { dmg: number; ctrl: number; buff: number } {
  const T = skillTargets(sk);
  const dmg = (sk.mult ?? 0) * T * (sk.type === 'field' ? (sk.duration ?? 5) * 0.4 : 1);
  const ctrl = statusScore(sk.status) * Math.min(T, 8) * 0.16 * (sk.type === 'field' ? (sk.duration ?? 5) * 0.5 : 1);
  let buff = statusScore(sk.selfStatus) + (sk.heal ?? 0) * 75 + (sk.xp ?? 0) * 0.3;
  const d = sk.duration ?? 0;
  if (sk.type === 'ghost') buff += d * 3;
  if (sk.type === 'buff' || sk.type === 'ghost')
    for (const [k, v] of Object.entries(sk.mods ?? {})) buff += Math.abs(v as number) * d * (k === 'attackSpeed' ? 0.02 : 0.012);
  return { dmg, ctrl, buff };
}

/** 冷却 = (8 + 0.9×伤害分 + 控制分 + 增益分) × 0.65，限制在 8~30 秒 */
export function skillCooldown(sk: SkillDef): number {
  const p = skillPower(sk);
  return Math.round(Math.min(30, Math.max(8, (8 + p.dmg * 0.9 + p.ctrl + p.buff) * 0.65)));
}

/** 技能自带回复量的整体系数（数据里 heal: 0.2 → 实际回复 9% 最大生命）；描述与文档必须使用乘后数值 */
export const HEAL_SCALE = 0.45;
/** 吸取回复形态：每命中 1 个敌人回复的生命，以及该部分的上限（占最大生命比例） */
export const DRAIN_PER_HIT = 0.5;
export const DRAIN_MAX_PCT = 0.06;

/** 技能实际回复的最大生命百分比（四舍五入到 0.1） */
export const skillHealPct = (heal: number): number => Math.round(heal * HEAL_SCALE * 1000) / 10;

export const SKILL_TYPE_NAME: Record<string, string> = {
  nova: '周身爆发',
  dash: '突进冲撞',
  buff: '自身增益',
  ghost: '无敌潜行',
  ring: '环形弹幕',
  heal: '吸取回复',
  strikes: '多点轰炸',
  clone: '召唤分身',
  barrage: '单体连发',
  missile: '发射 AOE',
  screen: '全屏攻击',
  field: '禁锢领域',
  curse: '群体减益',
};
