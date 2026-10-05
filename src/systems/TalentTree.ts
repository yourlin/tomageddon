// 天赋树：加点 / 退点 / 重置，以及把已点天赋汇总成属性与特殊效果（开局时生效）
import { TALENT_NODES, TALENT_MAP, type BranchId, type TalentNode, type TreeFx } from '../data/talentTree';
import { ACHIEVEMENTS } from '../data/achievements';
import type { StatMods } from '../data/stats';
import type { ItemSpecial } from '../data/items';
import type { StatusApply } from '../data/statuses';
import { save, persist } from './Save';
import { achTier } from './Achievements';
import { lang } from '../i18n';

export const rankOf = (id: string): number => save.talents[id] ?? 0;

/** 成就累计给的天赋点 */
export function talentPointsEarned(): number {
  let n = save.meta.bonusTp;
  for (const a of ACHIEVEMENTS) if (a.tp) for (let i = 0; i < achTier(a.id); i++) n += a.tp[i] ?? 0;
  return n;
}
export const talentPointsTotal = (): number => ACHIEVEMENTS.reduce((s, a) => s + (a.tp ?? []).reduce((x, y) => x + y, 0), 0);
export const talentPointsSpent = (): number => Object.values(save.talents).reduce((a, b) => a + b, 0);
export const talentPointsFree = (): number => talentPointsEarned() - talentPointsSpent();
export const branchSpent = (b: BranchId): number => TALENT_NODES.filter((n) => n.branch === b).reduce((s, n) => s + rankOf(n.id), 0);

export type RaiseBlock = 'max' | 'points' | 'parent' | 'branch' | null;
/** 不能加点的原因；null 表示可以加 */
export function raiseBlock(n: TalentNode): RaiseBlock {
  if (rankOf(n.id) >= n.max) return 'max';
  if (n.parent && rankOf(n.parent) <= 0) return 'parent';
  if (n.needPoints && branchSpent(n.branch) < n.needPoints) return 'branch';
  if (talentPointsFree() <= 0) return 'points';
  return null;
}

/** 退点后是否仍然合法：子天赋还在用它，或终极天赋的投入要求会被打破时不能退 */
export function canLower(n: TalentNode): boolean {
  const r = rankOf(n.id);
  if (r <= 0) return false;
  if (r === 1 && TALENT_NODES.some((c) => c.parent === n.id && rankOf(c.id) > 0)) return false;
  const after = branchSpent(n.branch) - 1;
  return !TALENT_NODES.some((k) => k.branch === n.branch && k.id !== n.id && k.needPoints && rankOf(k.id) > 0 && after < k.needPoints);
}

export function raise(n: TalentNode): boolean {
  if (raiseBlock(n)) return false;
  save.talents[n.id] = rankOf(n.id) + 1;
  changed();
  return true;
}
export function lower(n: TalentNode): boolean {
  if (!canLower(n)) return false;
  const r = rankOf(n.id) - 1;
  if (r > 0) save.talents[n.id] = r;
  else delete save.talents[n.id];
  changed();
  return true;
}
/** 直接写入一套天赋（测试用：平衡测试按预设加点，不检查天赋点） */
export function setTalents(t: Record<string, number>): void {
  save.talents = { ...t };
  changed();
}

/** 重置：免费、随时可用 */
export function resetBranch(b?: BranchId): void {
  for (const n of TALENT_NODES) if (!b || n.branch === b) delete save.talents[n.id];
  changed();
}

// ---------------- I1 大师层（金番茄购买，无限层） ----------------
/** 大师层每层轮流提升的属性（小幅，6 层一轮） */
export const MASTER_CYCLE: [keyof StatMods, number][] = [
  ['damage', 1],
  ['maxHp', 1],
  ['attackSpeed', 1],
  ['armor', 0.5],
  ['luck', 1],
  ['regen', 0.5],
];
export const nodesMaxTotal = (): number => TALENT_NODES.reduce((s, n) => s + n.max, 0);
/** 天赋树全部点满才开放大师层 */
export const masterUnlocked = (): boolean => TALENT_NODES.every((n) => rankOf(n.id) >= n.max);
/** 购买第 layer+1 层的价格（金番茄） */
export const masterCost = (layer = save.meta.master): number => 40 + 10 * layer;
export function masterMods(layers = save.meta.master): StatMods {
  const m: StatMods = {};
  for (let i = 0; i < layers; i++) {
    const [k, v] = MASTER_CYCLE[i % MASTER_CYCLE.length];
    m[k] = Math.round(((m[k] ?? 0) + v) * 10) / 10;
  }
  return m;
}
export function buyMaster(): boolean {
  if (!masterUnlocked() || save.meta.gold < masterCost()) return false;
  save.meta.gold -= masterCost();
  save.meta.master++;
  changed();
  return true;
}

// ---------------- 效果汇总 ----------------
export interface TreeTotals {
  mods: StatMods;
  /** 按 [效果, 等级] 列出，交给 RunState.specials 的合并逻辑处理叠加 */
  specials: [ItemSpecial, number][];
  dodgeKnives: number;
  castHeal: number;
  castSelf: StatusApply[];
  skillEcho: number;
  startSeeds: number;
  freeRerolls: number;
  lowHpDmg: number;
  bossDmg: number;
  levelChoices: number;
  execute: number;
  cheatDeath: number;
  killRage: number;
  critHeal: number;
  killSeeds: number;
}

let cache: TreeTotals | null = null;
function changed(): void {
  cache = null;
  persist();
}

const NUM_KEYS = [
  'dodgeKnives',
  'castHeal',
  'skillEcho',
  'startSeeds',
  'freeRerolls',
  'lowHpDmg',
  'bossDmg',
  'levelChoices',
  'execute',
  'cheatDeath',
  'killRage',
  'critHeal',
  'killSeeds',
] as const satisfies readonly (keyof TreeFx & keyof TreeTotals)[];

export function treeTotals(): TreeTotals {
  if (cache) return cache;
  const t: TreeTotals = {
    mods: {},
    specials: [],
    dodgeKnives: 0,
    castHeal: 0,
    castSelf: [],
    skillEcho: 0,
    startSeeds: 0,
    freeRerolls: 0,
    lowHpDmg: 0,
    bossDmg: 0,
    levelChoices: 0,
    execute: 0,
    cheatDeath: 0,
    killRage: 0,
    critHeal: 0,
    killSeeds: 0,
  };
  for (const [id, r] of Object.entries(save.talents)) {
    const n = TALENT_MAP[id];
    if (!n || r <= 0) continue;
    const fx = n.fx;
    for (const [k, v] of Object.entries(fx.mods ?? {}) as [keyof StatMods, number][]) t.mods[k] = (t.mods[k] ?? 0) + v * r;
    if (fx.special) t.specials.push([fx.special, r]);
    for (const k of NUM_KEYS) t[k] += (fx[k] ?? 0) * r;
    if (fx.castSelf) t.castSelf.push(...fx.castSelf);
  }
  for (const [k, v] of Object.entries(masterMods()) as [keyof StatMods, number][]) t.mods[k] = (t.mods[k] ?? 0) + v;
  t.skillEcho = Math.min(40, t.skillEcho);
  t.execute = Math.min(20, t.execute);
  cache = t;
  return t;
}

/** 天赋描述：{v} 换成指定等级（默认当前等级，未点时显示 1 级）的累计数值 */
export function nodeText(n: TalentNode, field: 'name' | 'desc', rank?: number): string {
  const t = n[field][lang === 'en' ? 1 : 0];
  const r = rank ?? Math.max(1, rankOf(n.id));
  const v = Math.round(n.val * r * 10) / 10;
  return t.replace('{v}', String(v));
}
