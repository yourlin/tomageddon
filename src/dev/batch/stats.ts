// 批量结果的统计：角色 × 章节汇总、死亡波次分布、武器 / 道具持有率与胜率、两次运行对比、CSV、失败局 → DevBuild
import { CHARACTER_MAP } from '../../data/characters';
import { WEAPON_MAP } from '../../data/weapons';
import { ITEM_MAP } from '../../data/items';
import type { StatKey, StatMods } from '../../data/stats';
import { run } from '../../systems/RunState';
import { applyBuild, newBuild, sanitize, type DevBuild, type TalentMode } from '../build';
import type { BatchRecord, JobResult, TalentPreset } from './types';

export const charName = (id: string): string => CHARACTER_MAP[id]?.name ?? id;
export const weaponName = (id: string): string => WEAPON_MAP[id]?.name ?? id;
export const itemName = (id: string): string => ITEM_MAP[id]?.name ?? id;
export const pct = (a: number, b: number): number => (b ? (a / b) * 100 : 0);

// ---------------- 角色 × 章节 ----------------
export interface GroupRow {
  key: string;
  ch: number;
  charId: string;
  n: number;
  wins: number;
  winRate: number;
  avgWave: number;
  timeouts: number;
  /** 失败局的死亡波次 → 局数 */
  deaths: Record<number, number>;
}

export function groupRows(results: JobResult[]): GroupRow[] {
  const by = new Map<string, JobResult[]>();
  for (const r of results) {
    const k = `${r.ch}:${r.charId}`;
    if (!by.has(k)) by.set(k, []);
    by.get(k)!.push(r);
  }
  return [...by.entries()]
    .map(([key, l]) => {
      const wins = l.filter((r) => r.win).length;
      const deaths: Record<number, number> = {};
      for (const r of l) if (!r.win) deaths[r.wave] = (deaths[r.wave] ?? 0) + 1;
      return {
        key,
        ch: l[0].ch,
        charId: l[0].charId,
        n: l.length,
        wins,
        winRate: pct(wins, l.length),
        avgWave: l.reduce((a, r) => a + r.wave, 0) / l.length,
        timeouts: l.filter((r) => r.timeout).length,
        deaths,
      };
    })
    .sort((a, b) => a.ch - b.ch || b.winRate - a.winRate || b.avgWave - a.avgWave);
}

const BARS = ' ▁▂▃▄▅▆▇█';
/** 死亡波次分布的文字条：每波一个字符，高度按该行最大值缩放 */
export function deathBar(deaths: Record<number, number>, maxWave: number): string {
  const mx = Math.max(0, ...Object.values(deaths));
  if (!mx) return '';
  let s = '';
  for (let w = 1; w <= maxWave; w++) {
    const n = deaths[w] ?? 0;
    s += n ? BARS[Math.max(1, Math.round((n / mx) * 8))] : '·';
  }
  return s;
}
export const deathText = (deaths: Record<number, number>): string =>
  Object.entries(deaths)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([w, n]) => `第${w}波×${n}`)
    .join('  ');

export const maxWaveOf = (results: JobResult[]): number => Math.max(15, ...results.map((r) => r.wave));

// ---------------- 武器 / 道具 ----------------
export interface PickRow {
  id: string;
  name: string;
  /** 持有该武器 / 道具的局数 */
  n: number;
  pickRate: number;
  wins: number;
  winRate: number;
  /** 持有时的胜率 − 全体胜率（百分点） */
  lift: number;
  /** 武器：平均最高品质（1~4）；道具：平均件数 */
  avg: number;
}

function pickRows(results: JobResult[], each: (r: JobResult) => Map<string, number>, name: (id: string) => string): PickRow[] {
  const total = results.length;
  const allWin = pct(results.filter((r) => r.win).length, total);
  const agg = new Map<string, { n: number; wins: number; sum: number }>();
  for (const r of results)
    for (const [id, v] of each(r)) {
      const a = agg.get(id) ?? { n: 0, wins: 0, sum: 0 };
      a.n++;
      if (r.win) a.wins++;
      a.sum += v;
      agg.set(id, a);
    }
  return [...agg.entries()]
    .map(([id, a]) => {
      const winRate = pct(a.wins, a.n);
      return { id, name: name(id), n: a.n, pickRate: pct(a.n, total), wins: a.wins, winRate, lift: winRate - allWin, avg: a.sum / a.n };
    })
    .sort((a, b) => b.pickRate - a.pickRate || b.winRate - a.winRate);
}

/** 每局的武器 id → 最高品质（1~4） */
function weaponsOf(r: JobResult): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of r.wl ?? []) m.set(w.id, Math.max(m.get(w.id) ?? 0, w.tier + 1));
  return m;
}
function itemsOf(r: JobResult): Map<string, number> {
  return new Map(Object.entries(r.il ?? {}).filter(([, n]) => n > 0));
}
export const weaponRows = (results: JobResult[]): PickRow[] => pickRows(results, weaponsOf, weaponName);
export const itemRows = (results: JobResult[]): PickRow[] => pickRows(results, itemsOf, itemName);

// ---------------- 与上一次对比 ----------------
export interface Delta {
  key: string;
  label: string;
  cur: number;
  prev: number;
  diff: number;
}

/** 通关率变化：按 章节:角色 对齐，只比较两边都有的组 */
export function compareChars(cur: JobResult[], prev: JobResult[]): Delta[] {
  const p = new Map(groupRows(prev).map((g) => [g.key, g]));
  return groupRows(cur)
    .filter((g) => p.has(g.key))
    .map((g) => {
      const o = p.get(g.key)!;
      return { key: g.key, label: `第${g.ch}章 ${charName(g.charId)}`, cur: g.winRate, prev: o.winRate, diff: g.winRate - o.winRate };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/** 武器持有率变化：任一边出现过的武器都比较（没出现视为 0%） */
export function compareWeapons(cur: JobResult[], prev: JobResult[]): Delta[] {
  const c = new Map(weaponRows(cur).map((r) => [r.id, r.pickRate]));
  const p = new Map(weaponRows(prev).map((r) => [r.id, r.pickRate]));
  return [...new Set([...c.keys(), ...p.keys()])]
    .map((id) => {
      const a = c.get(id) ?? 0,
        b = p.get(id) ?? 0;
      return { key: id, label: weaponName(id), cur: a, prev: b, diff: a - b };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/** 两次运行的配置差异（说明对比是否可比） */
export function cfgDiff(a: BatchRecord, b: BatchRecord): string[] {
  const out: string[] = [];
  if (a.cfg.talents !== b.cfg.talents) out.push(`天赋预设不同（${b.cfg.talents} → ${a.cfg.talents}）`);
  if (a.cfg.chapters.join() !== b.cfg.chapters.join()) out.push(`章节不同（${b.cfg.chapters.join('/')} → ${a.cfg.chapters.join('/')}）`);
  if (a.cfg.runs !== b.cfg.runs) out.push(`每组局数不同（${b.cfg.runs} → ${a.cfg.runs}）`);
  return out;
}

// ---------------- CSV ----------------
const csvCell = (v: unknown): string => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(results: JobResult[]): string {
  const head = [
    '章节',
    '角色ID',
    '角色',
    '局次',
    '通关',
    '到达波次',
    '击杀',
    '等级',
    '道具数',
    '用时秒',
    '超时',
    '武器',
    '道具',
    '伤害前三',
  ];
  const rows = [...results]
    .sort((a, b) => a.ch - b.ch || a.charId.localeCompare(b.charId) || a.run - b.run)
    .map((r) => [
      r.ch,
      r.charId,
      charName(r.charId),
      r.run + 1,
      r.win ? 1 : 0,
      r.wave,
      r.kills,
      r.level,
      r.items,
      r.sec,
      r.timeout ? 1 : 0,
      (r.wl ?? []).map((w) => `${weaponName(w.id)} T${w.tier + 1}${w.forge ? ` +${w.forge}` : ''}`).join(' / '),
      Object.entries(r.il ?? {})
        .map(([id, n]) => (n > 1 ? `${itemName(id)}×${n}` : itemName(id)))
        .join(' / '),
      r.topDmg,
    ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

// ---------------- 失败局 → 沙盒构筑 ----------------
export const canLoad = (r: JobResult): boolean => !r.win && Array.isArray(r.wl) && r.wl.length > 0 && !!CHARACTER_MAP[r.charId];

const TALENT_MODE: Record<TalentPreset, TalentMode> = { none: 'none', mid: 'save', full: 'max' };

/**
 * 转成 DevBuild：武器（含词条 / 打造）、道具、等级、波次照搬；资金为 0。
 * 升级加点的具体选择没有记录，把「最终 levelMods − 构筑按等级 / 波次自动算出的成长」放进 extraMods，属性总量与死亡时一致。
 * 注意：会调用 applyBuild（改写全局 run），调用方随后应 ctx.setBuild。
 */
export function toDevBuild(r: JobResult, talents: TalentPreset): DevBuild {
  const b = sanitize({
    ...newBuild(r.charId),
    chapterId: r.ch,
    wave: Math.max(1, r.wave),
    level: Math.max(0, r.level),
    budget: 0,
    talents: TALENT_MODE[talents],
    weapons: r.wl.map((w) => ({
      id: w.id,
      tier: w.tier,
      affixes: w.affixes?.map((a) => ({ ...a })),
      forge: w.forge,
    })),
    items: { ...r.il },
    levelPicks: [],
    extraMods: {},
    ledger: [],
    ignoreBudget: false,
  });
  applyBuild(b);
  const base = run.levelMods;
  const extra: StatMods = {};
  const keys = new Set([...Object.keys(r.lm ?? {}), ...Object.keys(base)]) as Set<StatKey>;
  for (const k of keys) {
    const d = (r.lm?.[k] ?? 0) - (base[k] ?? 0);
    if (Math.abs(d) > 1e-6) extra[k] = Math.round(d * 1000) / 1000;
  }
  b.extraMods = extra;
  return b;
}
