// J2：构筑分享码——把一局的最终构筑（角色、章节、等级、武器、道具、遗物、升级加点）编码成字符串，
// 可以复制给别人，也可以在练习模式（J3）里导入后打木桩测伤害。
import { CHARACTER_MAP } from '../data/characters';
import { WEAPON_MAP } from '../data/weapons';
import { EVOLVED_WEAPONS } from '../data/evolutions';
import { ITEM_MAP } from '../data/items';
import { RELIC_MAP } from '../data/relics';
import { BASE_STATS, type StatKey, type StatMods } from '../data/stats';
import type { RunState } from './RunState';

export const BUILD_PREFIX = 'TMG1-';

export interface BuildSnapshot {
  c: string; // 角色
  ch: number; // 章节
  lv: number; // 等级
  wv: number; // 波次
  w: [string, number, number?][]; // [武器 id, 档位 0~3, 打造]
  i: Record<string, number>; // 道具 → 数量
  r: string[]; // 遗物
  m: StatMods; // 升级加点与成长
}

const EVO_IDS = new Set(EVOLVED_WEAPONS.map((w) => w.id));
const weaponExists = (id: string): boolean => !!WEAPON_MAP[id] || EVO_IDS.has(id);

export function snapshotRun(run: RunState): BuildSnapshot {
  return {
    c: run.charId,
    ch: run.chapterId,
    lv: run.level,
    wv: run.wave,
    w: run.weapons.map((w) => (w.forge ? [w.id, w.tier, w.forge] : [w.id, w.tier])),
    i: { ...run.items },
    r: [...run.relics],
    m: { ...run.levelMods },
  };
}

// base64url（UTF-8 安全）
const b64 = (s: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const unb64 = (s: string): string => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

export const encodeBuild = (b: BuildSnapshot): string => BUILD_PREFIX + b64(JSON.stringify(b));

/** 解码并校验；任何不认识的内容（未知角色 / 武器 / 道具 / 遗物 / 属性、越界数值）都返回 null */
export function decodeBuild(code: string): BuildSnapshot | null {
  const s = code.trim();
  if (!s.startsWith(BUILD_PREFIX) || s.length > 4000) return null;
  let b: BuildSnapshot;
  try {
    b = JSON.parse(unb64(s.slice(BUILD_PREFIX.length))) as BuildSnapshot;
  } catch {
    return null;
  }
  const int = (v: unknown, lo: number, hi: number): boolean => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
  if (!b || typeof b !== 'object' || !CHARACTER_MAP[b.c]) return null;
  if (!int(b.ch, 1, 7) || !int(b.lv, 0, 999) || !int(b.wv, 1, 9999)) return null;
  if (!Array.isArray(b.w) || b.w.length > 12) return null;
  for (const w of b.w)
    if (!Array.isArray(w) || !weaponExists(w[0]) || !int(w[1], 0, 3) || (w[2] !== undefined && !int(w[2], 0, 10))) return null;
  if (!b.i || typeof b.i !== 'object') return null;
  for (const [id, n] of Object.entries(b.i)) if (!ITEM_MAP[id] || !int(n, 1, 999)) return null;
  if (!Array.isArray(b.r) || !b.r.every((id) => RELIC_MAP[id])) return null;
  if (!b.m || typeof b.m !== 'object') return null;
  for (const [k, v] of Object.entries(b.m))
    if (!(k in BASE_STATS) || typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 10000) return null;
  return b;
}

let uid = 800000;
/** 把构筑写进 run（练习模式用）：start 之后覆盖武器、道具、遗物、等级与升级加点 */
export function applySnapshot(run: RunState, b: BuildSnapshot): void {
  run.start(b.c, b.ch, false, 0);
  run.wave = b.wv;
  run.level = b.lv;
  run.weapons = b.w.map(([id, tier, forge]) => ({ uid: uid++, id, tier, forge }));
  run.items = { ...b.i };
  run.relics = [...b.r];
  run.levelMods = { ...(b.m as Partial<Record<StatKey, number>>) };
  run.dirty();
  run.hp = run.stats.maxHp;
}
