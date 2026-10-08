// 天赋树：加点 / 退点 / 重置，以及把已点天赋汇总成属性与特殊效果（开局时生效）
import { TALENT_NODES, TALENT_MAP, type BranchId, type TalentNode, type TreeFx } from '../data/talentTree';
import { ACHIEVEMENTS } from '../data/achievements';
import type { StatMods } from '../data/stats';
import type { ItemSpecial } from '../data/items';
import type { StatusApply } from '../data/statuses';
import { save, persist } from './Save';
import { achTier } from './Achievements';
import { lang } from '../i18n';

// ---------------- 天赋方案：默认方案 + 角色专属方案 ----------------
/** 当前方案：null = 默认方案；角色 id = 该角色的方案（没有定制时继承默认方案） */
let profile: string | null = null;
export function setTalentProfile(charId: string | null): void {
  if (profile === charId) return;
  profile = charId;
  cache = null;
}
export const talentProfile = (): string | null => profile;
/** 该角色是否有自己的天赋方案 */
export const hasCustomTalents = (charId: string): boolean => !!save.charTalents[charId];
/** 当前方案的等级表（角色没有定制时就是默认方案） */
function ranks(): Record<string, number> {
  return (profile && save.charTalents[profile]) || save.talents;
}
/** 要修改时取可写的等级表：角色还没定制就先复制一份默认方案（写时复制） */
function writable(): Record<string, number> {
  if (!profile) return save.talents;
  return (save.charTalents[profile] ??= { ...save.talents });
}
/** 删除角色的专属方案，恢复继承默认方案 */
export function clearCustomTalents(charId: string): void {
  delete save.charTalents[charId];
  changed();
}

export const rankOf = (id: string): number => ranks()[id] ?? 0;

/** 成就累计给的天赋点 */
export function talentPointsEarned(): number {
  let n = save.meta.bonusTp;
  for (const a of ACHIEVEMENTS) if (a.tp) for (let i = 0; i < achTier(a.id); i++) n += a.tp[i] ?? 0;
  return n;
}
export const talentPointsTotal = (): number => ACHIEVEMENTS.reduce((s, a) => s + (a.tp ?? []).reduce((x, y) => x + y, 0), 0);
/** 当前方案已用的点数（各方案共用同一份天赋点，各自独立分配） */
export const talentPointsSpent = (): number => Object.values(ranks()).reduce((a, b) => a + b, 0);
export const talentPointsFree = (): number => talentPointsEarned() - talentPointsSpent();
export const branchSpent = (b: BranchId): number => TALENT_NODES.filter((n) => n.branch === b).reduce((s, n) => s + rankOf(n.id), 0);

export type RaiseBlock = 'max' | 'points' | 'parent' | 'branch' | 'exclusive' | null;
/** 不能加点的原因；null 表示可以加 */
export function raiseBlock(n: TalentNode): RaiseBlock {
  if (rankOf(n.id) >= n.max) return 'max';
  if (n.parent && rankOf(n.parent) <= 0) return 'parent';
  if (n.needPoints && branchSpent(n.branch) < n.needPoints) return 'branch';
  if (exclusiveTaken(n)) return 'exclusive';
  if (talentPointsFree() <= 0) return 'points';
  return null;
}

/** 同一互斥组里已经点了别的天赋（二选一的关键天赋） */
export function exclusiveTaken(n: TalentNode): TalentNode | undefined {
  if (!n.exclusive) return undefined;
  return TALENT_NODES.find((o) => o.id !== n.id && o.exclusive === n.exclusive && rankOf(o.id) > 0);
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
  writable()[n.id] = rankOf(n.id) + 1;
  changed();
  return true;
}
export function lower(n: TalentNode): boolean {
  if (!canLower(n)) return false;
  const r = rankOf(n.id) - 1;
  const t = writable();
  if (r > 0) t[n.id] = r;
  else delete t[n.id];
  changed();
  return true;
}
/** 直接写入默认方案（测试用：平衡测试按预设加点，不检查天赋点；角色没有专属方案时开局即继承它） */
export function setTalents(t: Record<string, number>): void {
  save.talents = { ...t };
  changed();
}

/** 重置：免费、随时可用 */
export function resetBranch(b?: BranchId): void {
  const t = writable();
  for (const n of TALENT_NODES) if (!b || n.branch === b) delete t[n.id];
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
/** 天赋树全部点满才开放大师层；二选一的关键天赋每组点满其中一个即可 */
export const masterUnlocked = (): boolean =>
  TALENT_NODES.every(
    (n) => rankOf(n.id) >= n.max || (!!n.exclusive && TALENT_NODES.some((o) => o.exclusive === n.exclusive && rankOf(o.id) >= o.max)),
  );
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
  meleeQuake: number;
  meleeBreak: number;
  rangedFar: number;
  rangedPierce: number;
  elemBurst: number;
  elemDebuffDmg: number;
  auraSlow: number;
  auraPulse: number;
}

let cache: TreeTotals | null = null;
function changed(): void {
  cache = null;
  persist();
}

/** 本局通过升级「局内天赋」获得的额外等级（只在本局生效，叠加在天赋树等级上、不超过上限）；由 RunState 写入 */
let runRanks: Record<string, number> = {};
export function setRunTalents(r: Record<string, number>): void {
  runRanks = r;
  cache = null;
}
/** 天赋树等级 + 本局等级（不超过上限） */
export const effectiveRank = (id: string): number => Math.min(TALENT_MAP[id]?.max ?? 0, rankOf(id) + (runRanks[id] ?? 0));

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
  'meleeQuake',
  'meleeBreak',
  'rangedFar',
  'rangedPierce',
  'elemBurst',
  'elemDebuffDmg',
  'auraSlow',
  'auraPulse',
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
    meleeQuake: 0,
    meleeBreak: 0,
    rangedFar: 0,
    rangedPierce: 0,
    elemBurst: 0,
    elemDebuffDmg: 0,
    auraSlow: 0,
    auraPulse: 0,
  };
  for (const id of new Set([...Object.keys(ranks()), ...Object.keys(runRanks)])) {
    const n = TALENT_MAP[id];
    const r = effectiveRank(id);
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
