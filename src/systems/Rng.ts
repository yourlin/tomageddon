// 可设种子的随机数：挑战模式里，商店、升级选项、宝箱、精英/Boss 抽取都由种子决定，
// 同一天（同一周）所有玩家面对的是同一套随机结果（操作顺序相同时完全一致）。
export type Rand = () => number;

/** mulberry32：快速、分布均匀的 32 位种子随机数 */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 字符串 → 32 位种子（FNV-1a） */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const pickOf = <T>(arr: readonly T[], r: Rand): T => arr[Math.floor(r() * arr.length)];
export function shuffleWith<T>(arr: T[], r: Rand): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const p2 = (n: number) => String(n).padStart(2, '0');
/** 本地日期键：2026-10-01 */
export const dayKey = (d = new Date()): string => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
/** ISO 周键：2026-W40 */
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${p2(w)}`;
}
/** 从 2020-01-01 起的天数（连续挑战天数用） */
export const dayNumber = (d = new Date()): number => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
