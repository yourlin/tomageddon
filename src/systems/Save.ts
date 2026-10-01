// 本地存档：解锁进度、统计、设置
import { CHARACTERS, type CharacterDef } from '../data/characters';

export interface SaveData {
  clearedChapters: number; // 已通关的最高章节
  totalKills: number;
  wins: number;
  bestWave: Record<string, number>; // `${charId}_${chapter}` -> 最佳波次
  charWins: Record<string, number>;
  settings: {
    sfx: number;
    music: number;
    shake: boolean;
    showDmg: boolean;
    showFps: boolean;
    fpsLimit: number;
    lang?: 'zh' | 'en';
    autoSkill: boolean;
  };
  /** 图鉴发现记录 */
  seen: { items: string[]; weapons: string[]; enemies: string[]; bosses: string[] };
  /** 成就：id → 已达成的最高等级（1 起）与达成时间 */
  achievements: Record<string, { tier: number; t: number }>;
  /** 已用成就点购买的角色 */
  ownedChars: string[];
  /** 已花费的成就点 */
  pointsSpent: number;
  /** 每名角色开局次数 */
  charRuns: Record<string, number>;
  /** 每名精英 / Boss 被击败次数 */
  killedBosses: Record<string, number>;
  /** 已阅读过更新日志的版本号（用于主菜单红点） */
  seenVersion?: string;
  /** 成就用累计统计 */
  stats: AchStats;
  /** 成就计数器（见 systems/Counters.ts） */
  counters: Record<string, number>;
}

export interface AchStats {
  eliteKills: number;
  bossKills: number;
  overtimeWins: number; // Boss 狂暴后仍将其击败
  perfectWaves: number; // 未受伤完成的波次
  revives: number;
  t4Crafted: number;
  seedsEarned: number;
}

const KEY = 'tomato_sister_save_v1';

const DEFAULT: SaveData = {
  clearedChapters: 0,
  totalKills: 0,
  wins: 0,
  bestWave: {},
  charWins: {},
  settings: { sfx: 0.7, music: 0.5, shake: true, showDmg: true, showFps: false, fpsLimit: 60, autoSkill: true },
  seen: { items: [], weapons: [], enemies: [], bosses: [] },
  achievements: {},
  ownedChars: [],
  pointsSpent: 0,
  charRuns: {},
  killedBosses: {},
  stats: { eliteKills: 0, bossKills: 0, overtimeWins: 0, perfectWaves: 0, revives: 0, t4Crafted: 0, seedsEarned: 0 },
  counters: {},
};

/** 旧存档迁移：改为成就点购买前，玩过或通关过的角色保留使用权 */
function legacyOwned(d: Partial<SaveData>): string[] {
  const played = new Set(Object.keys(d.bestWave ?? {}).map((k) => k.replace(/_\d+$/, '')));
  for (const id of Object.keys(d.charWins ?? {})) played.add(id);
  return CHARACTERS.filter((c) => c.cost && played.has(c.id)).map((c) => c.id);
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const d = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT),
      ...d,
      settings: { ...DEFAULT.settings, ...(d.settings ?? {}) },
      seen: { ...structuredClone(DEFAULT.seen), ...(d.seen ?? {}) },
      // 旧版成就记录为时间戳，格式不兼容，丢弃后按新规则重新评定
      achievements: Object.fromEntries(Object.entries(d.achievements ?? {}).filter(([, v]) => typeof v === 'object')),
      ownedChars: d.ownedChars ?? legacyOwned(d),
      charRuns: { ...(d.charRuns ?? {}) },
      killedBosses: { ...(d.killedBosses ?? {}) },
      stats: { ...DEFAULT.stats, ...(d.stats ?? {}) },
      counters: { ...(d.counters ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export const save: SaveData = load();

export function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* 隐私模式等情况忽略 */
  }
}

/** 角色是否可用：默认角色，或已用成就点购买 */
export function isUnlocked(c: CharacterDef): boolean {
  return !c.cost || save.ownedChars.includes(c.id);
}

/** 用成就点购买角色；余额由成就系统计算后传入 */
export function buyCharacter(c: CharacterDef, balance: number, price: number): boolean {
  if (isUnlocked(c) || !c.cost || balance < price) return false;
  save.ownedChars.push(c.id);
  save.pointsSpent += price;
  persist();
  return true;
}

export function unlockedCount(): number {
  return CHARACTERS.filter(isUnlocked).length;
}

export function resetSave(): void {
  Object.assign(save, structuredClone(DEFAULT));
  for (const k of Object.keys(seenSets)) delete seenSets[k as SeenKind];
  persist();
}

export type SeenKind = keyof SaveData['seen'];
const seenSets: Partial<Record<SeenKind, Set<string>>> = {};

/** 记录图鉴发现（首次遇到/获得） */
export function markSeen(kind: SeenKind, id: string): void {
  const set = (seenSets[kind] ??= new Set(save.seen[kind]));
  if (set.has(id)) return;
  set.add(id);
  save.seen[kind].push(id);
}

export function isSeen(kind: SeenKind, id: string): boolean {
  return (seenSets[kind] ??= new Set(save.seen[kind])).has(id);
}
