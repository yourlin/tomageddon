// 本地存档：解锁进度、统计、设置
import { CHARACTERS, type CharacterDef } from '../data/characters';

export interface SaveData {
  clearedChapters: number; // 已通关的最高章节
  totalKills: number;
  wins: number;
  bestWave: Record<string, number>; // `${charId}_${chapter}` -> 最佳波次
  charWins: Record<string, number>;
  settings: { sfx: number; music: number; shake: boolean; showDmg: boolean; showFps: boolean; fpsLimit: number; lang?: 'zh' | 'en' };
  /** 图鉴发现记录 */
  seen: { items: string[]; weapons: string[]; enemies: string[]; bosses: string[] };
}

const KEY = 'tomato_sister_save_v1';

const DEFAULT: SaveData = {
  clearedChapters: 0,
  totalKills: 0,
  wins: 0,
  bestWave: {},
  charWins: {},
  settings: { sfx: 0.7, music: 0.5, shake: true, showDmg: true, showFps: false, fpsLimit: 60 },
  seen: { items: [], weapons: [], enemies: [], bosses: [] },
};

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

export function isUnlocked(c: CharacterDef): boolean {
  const u = c.unlock;
  if (!u) return true;
  if (u.chapter !== undefined && save.clearedChapters >= u.chapter) return true;
  if (u.kills !== undefined && save.totalKills >= u.kills) return true;
  if (u.wins !== undefined && save.wins >= u.wins) return true;
  return false;
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
