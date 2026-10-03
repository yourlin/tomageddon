// I 模块：数值覆盖层。直接改内存里的数据表（武器 / 道具 / 怪物 / Boss / 平衡常量），不写回源码。
// 覆盖项记在 localStorage；勾选「刷新后保留」时，下次打开开发者界面会先重新套用。
import { WEAPON_MAP } from '../data/weapons';
import { ITEM_MAP } from '../data/items';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP } from '../data/bosses';
import { BALANCE } from '../data/balance';
import { CHARACTER_MAP } from '../data/characters';

type Obj = Record<string, unknown>;

export interface TableDef {
  name: string;
  file: string;
  /** 条目表：id -> 对象；BALANCE 这类单对象用 { '': BALANCE } */
  rows: Record<string, Obj>;
}

export const TABLES: Record<string, TableDef> = {
  weapons: { name: '武器', file: 'src/data/weapons.ts', rows: WEAPON_MAP as unknown as Record<string, Obj> },
  items: { name: '道具', file: 'src/data/items.ts', rows: ITEM_MAP as unknown as Record<string, Obj> },
  enemies: { name: '小怪', file: 'src/data/enemies.ts', rows: ENEMY_MAP as unknown as Record<string, Obj> },
  bosses: { name: '精英 / Boss', file: 'src/data/bosses.ts', rows: BOSS_MAP as unknown as Record<string, Obj> },
  chars: { name: '角色', file: 'src/data/characters.ts', rows: CHARACTER_MAP as unknown as Record<string, Obj> },
  balance: { name: '平衡常量', file: 'src/data/balance.ts', rows: { '': BALANCE as unknown as Obj } },
};

export interface Override {
  table: string;
  id: string;
  /** 字段路径，如 ['dmg'] 或 ['patterns', '0', 'cd'] */
  path: string[];
  value: number;
  orig: number;
}

const KEY = 'tomageddon_dev_overrides';
interface Stored {
  keep: boolean;
  list: Override[];
}

export const overrides: Stored = load();

function load(): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '') as Stored;
    if (Array.isArray(s.list)) return s;
  } catch {
    /* 没有或损坏 */
  }
  return { keep: false, list: [] };
}
function persist(): void {
  localStorage.setItem(KEY, JSON.stringify(overrides.keep ? overrides : { keep: false, list: [] }));
}

/** 取 / 写 path 指向的值（路径不存在返回 undefined） */
export function getAt(o: unknown, path: string[]): unknown {
  let cur = o;
  for (const p of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Obj)[p];
  }
  return cur;
}
function setAt(o: unknown, path: string[], v: number): boolean {
  const parent = getAt(o, path.slice(0, -1));
  if (parent === null || typeof parent !== 'object') return false;
  (parent as Obj)[path[path.length - 1]] = v;
  return true;
}

/** 列出一个条目里所有数字字段（递归 3 层，数组按下标） */
export function numericFields(o: unknown, depth = 3, prefix: string[] = []): string[][] {
  if (o === null || typeof o !== 'object' || depth < 0) return [];
  const out: string[][] = [];
  for (const [k, v] of Object.entries(o as Obj)) {
    if (typeof v === 'number') out.push([...prefix, k]);
    else if (v && typeof v === 'object') out.push(...numericFields(v, depth - 1, [...prefix, k]));
  }
  return out;
}

const same = (a: Override, t: string, id: string, path: string[]) => a.table === t && a.id === id && a.path.join('.') === path.join('.');

export function setOverride(table: string, id: string, path: string[], value: number): string | null {
  const row = TABLES[table]?.rows[id];
  if (!row) return '找不到条目';
  const cur = getAt(row, path);
  if (typeof cur !== 'number') return '不是数字字段';
  const i = overrides.list.findIndex((o) => same(o, table, id, path));
  const orig = i >= 0 ? overrides.list[i].orig : cur;
  setAt(row, path, value);
  if (value === orig) {
    if (i >= 0) overrides.list.splice(i, 1);
  } else if (i >= 0) overrides.list[i].value = value;
  else overrides.list.push({ table, id, path, value, orig });
  persist();
  return null;
}

export function revertOverride(o: Override): void {
  const row = TABLES[o.table]?.rows[o.id];
  if (row) setAt(row, o.path, o.orig);
  overrides.list = overrides.list.filter((x) => x !== o);
  persist();
}

export function clearOverrides(): void {
  for (const o of [...overrides.list]) revertOverride(o);
}

export function setKeep(v: boolean): void {
  overrides.keep = v;
  persist();
}

/** 启动时套用保留下来的覆盖项（原值以当前源码为准重新记录） */
export function applyOverrides(): void {
  if (!overrides.keep) {
    overrides.list = [];
    return;
  }
  const list = overrides.list;
  overrides.list = [];
  for (const o of list) setOverride(o.table, o.id, o.path, o.value);
}

export function findOverride(table: string, id: string, path: string[]): Override | undefined {
  return overrides.list.find((o) => same(o, table, id, path));
}

/** I3：导出为可以粘贴进源码的片段，按文件 / 条目分组 */
export function exportPatch(): string {
  const byFile = new Map<string, Map<string, Override[]>>();
  for (const o of overrides.list) {
    const f = TABLES[o.table].file;
    if (!byFile.has(f)) byFile.set(f, new Map());
    const m = byFile.get(f)!;
    if (!m.has(o.id)) m.set(o.id, []);
    m.get(o.id)!.push(o);
  }
  const out: string[] = [];
  for (const [file, rows] of byFile) {
    out.push(`// ===== ${file} =====`);
    for (const [id, list] of rows) {
      out.push(id ? `// id: '${id}'` : '// BALANCE');
      for (const o of list) out.push(`  ${o.path.join('.')}: ${o.value}, // 原 ${o.orig}`);
    }
    out.push('');
  }
  return out.join('\n');
}
