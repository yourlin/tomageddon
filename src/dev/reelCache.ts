// 动画墙录像缓存：录好的帧存进 IndexedDB，下次打开直接播放。
// 每段录像带一个指纹（角色/武器的数据 + 专属演出函数源码 + 录制参数版本），指纹变了才重录。
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { EVOLVED_WEAPONS } from '../data/evolutions';
import { STYLES } from '../systems/SkillStyles';
import { STYLES_2 } from '../systems/SkillStyles2';
import { SkillSystem } from '../systems/SkillSystem';
import { sweepSource } from '../systems/SweepFx';
import { boomPathOf, boomOffset } from '../systems/BoomPaths';
import { CHAIN_STYLE, chainFollowUp } from '../systems/ChainFx';
import { drawMine } from '../art/MineArt';

/** 录制方式（区域、帧数、编码等）改了就把它加一，所有旧录像一起作废 */
const REEL_VER = 3;
const DB = 'tomageddon_dev_reels';
const STORE = 'reels';

export interface CachedReel {
  fp: string;
  label: string;
  frames: string[];
}

function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + s.length.toString(36);
}

/** 录像指纹：技能 = 技能数据 + 外观 + 专属演出源码（没有专属演出则用通用实现 use() 的源码） */
export function reelFingerprint(kind: 'skills' | 'weapons' | 'evolved', id: string): string {
  const parts: unknown[] = [REEL_VER, kind, id];
  if (kind === 'skills') {
    const c = CHARACTERS.find((x) => x.id === id);
    const style = STYLES[id] ?? STYLES_2[id];
    parts.push(c?.skill, c?.look, style ? String(style) : String(SkillSystem.prototype.use));
  } else {
    const w = (kind === 'weapons' ? WEAPONS : EVOLVED_WEAPONS).find((x) => x.id === id);
    parts.push(w);
    // 只有带专属招式 / 轨迹的武器才追加源码，免得其它武器的旧录像全部作废
    const src = sweepSource(id);
    if (src) parts.push(src);
    if (w?.kind === 'boomerang') parts.push(boomPathOf(w), String(boomOffset));
    if (CHAIN_STYLE[id]) parts.push(String(chainFollowUp));
    if (w?.kind === 'mine') parts.push(String(drawMine));
  }
  return fnv(JSON.stringify(parts));
}

let dbP: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  dbP ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbP;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

/** 读取缓存；指纹不符或读取失败都当作没有 */
export async function loadReel(key: string, fp: string): Promise<CachedReel | null> {
  try {
    const r = (await tx('readonly', (s) => s.get(key))) as CachedReel | undefined;
    return r && r.fp === fp && r.frames?.length ? r : null;
  } catch {
    return null;
  }
}

export async function saveReel(key: string, r: CachedReel): Promise<void> {
  try {
    await tx('readwrite', (s) => s.put(r, key));
  } catch (e) {
    console.warn('[动画墙] 录像缓存写入失败', e);
  }
}

/** 清空全部录像缓存，返回清掉的段数 */
export async function clearReels(): Promise<number> {
  try {
    const n = await tx('readonly', (s) => s.count());
    await tx('readwrite', (s) => s.clear());
    return n;
  } catch {
    return 0;
  }
}
