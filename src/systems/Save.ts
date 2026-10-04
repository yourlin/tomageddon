// 本地存档：解锁进度、统计、设置
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { storage } from '../platform';

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
    /** L1：伤害数字密度 0~1（暴击始终显示） */
    dmgDensity?: number;
    /** L1：屏幕震动强度倍率 */
    shakeScale?: number;
    /** L1：粒子数量倍率 */
    particles?: number;
    /** L2：移动端摇杆大小倍率、放在右手边 */
    joyScale?: number;
    joyRight?: boolean;
    /** L2：移动端按钮大小倍率 */
    btnScale?: number;
    showFps: boolean;
    fpsLimit: number;
    lang?: 'zh' | 'en';
    autoSkill: boolean;
  };
  /** 图鉴发现记录 */
  seen: { items: string[]; weapons: string[]; enemies: string[]; bosses: string[] };
  /** 成就：id → 已达成的最高等级（1 起）与达成时间 */
  achievements: Record<string, { tier: number; t: number }>;
  /** 旧版本（成就点购买制）已买下的角色：改为成就解锁后保留使用权 */
  ownedChars: string[];
  /** 旧版本已花费的成就点（已不再使用，保留字段以兼容旧存档） */
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
  /** 天赋树：节点 id → 等级 */
  talents: Record<string, number>;
  /** 最近的对局记录（新的在前，最多 30 条） */
  history: RunRecord[];
  /** 已看过的新手提示 */
  tutorial: Record<string, boolean>;
  /** 挑战成绩：`daily:2026-10-01` → 个人最佳 */
  challenges: Record<string, { best: number; bestWave: number; attempts: number; won: boolean }>;
  /** 存档结构版本（K4）：读档时按 MIGRATIONS 逐级升级 */
  saveVersion: number;
  /** 1.4.0「通关之后」的长期进度 */
  meta: MetaSave;
}

/** 1.4.0 新增的长期进度（危机等级、无尽、遗物、角色任务、Meta 成长） */
export interface MetaSave {
  /** 每章已解锁的最高危机等级（章节 id → 0~20） */
  dangerUnlocked: Record<string, number>;
  /** 角色 × 章节 通关过的最高危机等级（`${charId}_${chapterId}`） */
  dangerBest: Record<string, number>;
  /** 章节 × 危机等级 的通关次数（`${chapterId}_${level}`） */
  dangerClears: Record<string, number>;
  /** 角色 × 章节 无尽最高波数 */
  endlessBest: Record<string, number>;
  /** 金番茄：只从危机等级与无尽获得，用于天赋大师层与外观 */
  gold: number;
  goldEarned: number;
  /** 天赋大师层已购买层数 */
  master: number;
  /** 危机通关奖励的额外天赋点 */
  bonusTp: number;
  /** 角色熟练度经验 */
  mastery: Record<string, number>;
  /** 已完成的角色任务 id */
  quests: Record<string, number>;
  /** 角色觉醒开关（完成 3 个任务后可开） */
  awaken: Record<string, boolean>;
  /** 遗物图鉴 */
  relics: string[];
  /** 每日挑战连续天数 */
  streak: { last: string; days: number; best: number; claimed: number[] };
  /** 当前称号（成就 id） */
  title: string;
  /** 已购买的皮肤 id 与每个角色当前使用的皮肤 */
  skins: string[];
  skinOf: Record<string, string>;
  /** 无尽复活使用次数（统计） */
  endlessRevives: number;
  /** G4：看过真结局的次数 */
  trueEnding?: number;
  /** 个人最佳：危机等级最快通关（`${chapterId}_${level}` → 秒） */
  fastest: Record<string, number>;
}

export const SAVE_VERSION = 2;

export function defaultMeta(): MetaSave {
  return {
    dangerUnlocked: {},
    dangerBest: {},
    dangerClears: {},
    endlessBest: {},
    gold: 0,
    goldEarned: 0,
    master: 0,
    bonusTp: 0,
    mastery: {},
    quests: {},
    awaken: {},
    relics: [],
    streak: { last: '', days: 0, best: 0, claimed: [] },
    title: '',
    skins: [],
    skinOf: {},
    endlessRevives: 0,
    fastest: {},
  };
}

type Raw = Record<string, unknown>;
/** 存档迁移：下标 i 把版本 i+1 的存档升级到 i+2。只追加，不修改已有步骤 */
export const MIGRATIONS: ((d: Raw) => void)[] = [
  // 1 → 2（1.4.0）：新增 meta；从旧的「最佳波次」推出无尽最高波数（>15 的部分）
  (d) => {
    const m = defaultMeta();
    for (const [k, w] of Object.entries((d.bestWave as Record<string, number>) ?? {})) if (w > 15) m.endlessBest[k] = w;
    d.meta = m;
  },
];

/** 把任意版本的原始存档升级到当前版本（就地修改并返回） */
export function migrate(d: Raw): Raw {
  let v = typeof d.saveVersion === 'number' ? d.saveVersion : 1;
  while (v < SAVE_VERSION) {
    MIGRATIONS[v - 1](d);
    v++;
  }
  d.saveVersion = SAVE_VERSION;
  // 新版本追加字段时，旧存档里缺的键用默认值补齐
  d.meta = { ...defaultMeta(), ...((d.meta as Raw) ?? {}) };
  const m = d.meta as MetaSave;
  m.streak = { ...defaultMeta().streak, ...(m.streak ?? {}) };
  return d;
}

/** 一局的战绩摘要（战绩页与局后数据页使用） */
export interface RunRecord {
  t: number;
  charId: string;
  chapterId: number;
  endless: boolean;
  /** 挑战模式：daily / weekly + 日期键 */
  challenge?: { kind: 'daily' | 'weekly' | 'custom' | 'free'; key: string; score: number };
  /** J2：构筑分享码（1.4.0） */
  build?: string;
  win: boolean;
  wave: number;
  level: number;
  kills: number;
  sec: number;
  weapons: { id: string; tier: number; forge?: number }[];
  items: number;
  /** 伤害来源 → 伤害（只保留前 10） */
  dmg: [string, number][];
  /** 每波收入 */
  income: number[];
  /** J1：每波 DPS（1.4.0） */
  dps?: number[];
  /** 番茄危机等级（1.4.0） */
  danger?: number;
  /** 本局遗物（1.4.0） */
  relics?: string[];
  /** 无尽模式里花钱复活过（成绩单独标记） */
  revived?: boolean;
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
  talents: {},
  history: [],
  challenges: {},
  tutorial: {},
  saveVersion: SAVE_VERSION,
  meta: defaultMeta(),
};

/** 旧存档迁移：改为成就点购买前，玩过或通关过的角色保留使用权 */
function legacyOwned(d: Partial<SaveData>): string[] {
  const played = new Set(Object.keys(d.bestWave ?? {}).map((k) => k.replace(/_\d+$/, '')));
  for (const id of Object.keys(d.charWins ?? {})) played.add(id);
  return CHARACTERS.filter((c) => c.unlock && played.has(c.id)).map((c) => c.id);
}

function load(): SaveData {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return normalize(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT);
  }
}

/** 原始存档对象 → 当前版本的完整存档（迁移 + 补默认值）；导入存档也走这里 */
export function normalize(input: unknown): SaveData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = migrate({ ...(input as Raw) }) as Record<string, any>;
  return {
    ...structuredClone(DEFAULT),
    ...d,
    settings: { ...DEFAULT.settings, ...(d.settings ?? {}) },
    seen: { ...structuredClone(DEFAULT.seen), ...(d.seen ?? {}) },
    // 旧版成就记录为时间戳，格式不兼容，丢弃后按新规则重新评定
    achievements: Object.fromEntries(
      Object.entries(d.achievements ?? {}).filter(([, v]) => typeof v === 'object'),
    ) as SaveData['achievements'],
    ownedChars: d.ownedChars ?? legacyOwned(d),
    charRuns: { ...(d.charRuns ?? {}) },
    killedBosses: { ...(d.killedBosses ?? {}) },
    stats: { ...DEFAULT.stats, ...(d.stats ?? {}) },
    counters: { ...(d.counters ?? {}) },
    talents: { ...(d.talents ?? {}) },
    history: Array.isArray(d.history) ? d.history : [],
    challenges: { ...(d.challenges ?? {}) },
    tutorial: { ...(d.tutorial ?? {}) },
  };
}

/** K5：导出存档为文本（带前缀与版本，便于识别） */
export function exportSave(): string {
  return 'TMSAVE1.' + btoa(unescape(encodeURIComponent(JSON.stringify(save))));
}
/** K5：从文本导入存档（支持导出格式或原始 JSON）；成功后覆盖当前存档并写盘 */
export function importSave(text: string): string | null {
  let obj: unknown;
  try {
    const t = text.trim();
    obj = t.startsWith('TMSAVE1.') ? JSON.parse(decodeURIComponent(escape(atob(t.slice(8))))) : JSON.parse(t);
  } catch {
    return 'invalid';
  }
  if (!obj || typeof obj !== 'object' || !('settings' in obj) || !('seen' in obj)) return 'invalid';
  const next = normalize(obj);
  for (const k of Object.keys(save)) delete (save as unknown as Raw)[k];
  Object.assign(save, next);
  for (const k of Object.keys(seenSets)) delete seenSets[k as SeenKind];
  persist();
  return null;
}

export const save: SaveData = load();

/** 开发者界面（?dev）下禁止写盘：沙盒里的击杀、天赋改动、图鉴发现都只留在内存，不污染玩家存档 */
let persistOff = false;
export function disablePersist(): void {
  persistOff = true;
}
export const persistDisabled = (): boolean => persistOff;

export function persist(): void {
  if (persistOff) return;
  try {
    storage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* 隐私模式等情况忽略 */
  }
}

/** 角色是否可用：默认角色、已达成解锁成就，或旧版本已用成就点买下（保留使用权） */
export function isUnlocked(c: CharacterDef): boolean {
  if (!c.unlock || save.ownedChars.includes(c.id)) return true;
  return (save.achievements[c.unlock.ach]?.tier ?? 0) >= c.unlock.tier;
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
