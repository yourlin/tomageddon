// 武器数值指纹：判断一份历史平衡测试数据对「当前代码」是否还有效。
//   global：影响所有武器实战表现的全局数值（BALANCE、怪物 / Boss 定义）。变了，所有旧数据作废。
//   chapters[id]：每章自己的定义（刷怪池、倍率等）。变了，只作废在这一章采到的样本。
//   weapons[id]：这把武器自身的定义（伤害、冷却、效果……）。变了，只作废这把武器的旧数据。
// 名称、描述、外观（look / 贴图）不参与，改文案不会让数据失效。
// 注意：只覆盖「数据表」。改了战斗代码（如 WeaponSystem 的公式）指纹不会变，这时用 FP_SALT 手动让旧数据全部失效。
// 平衡测试（scripts/batch.mjs 经 window.__dev）和开发者界面（E1 / E2）用的是同一份实现，两边算出来一致。
import { WEAPON_MAP } from '../data/weapons';
import { BALANCE } from '../data/balance';
import { ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import { CHAPTERS } from '../data/chapters';

/** 改了影响武器实战表现的战斗代码时把它加 1：所有历史转换率数据随之失效 */
export const FP_SALT = 1;

/**
 * 只影响个别武器的战斗代码修复：给这几把武器各自加盐，只作废它们的旧样本，其他武器的数据照常可用。
 * 改动记录：
 *   dragon_cleaver / hell_trident = 1：修复怒气爆发冲击波无限递归（栈溢出时这一帧剩下的命中结算全部丢失）
 */
const WEAPON_SALT: Record<string, number> = { dragon_cleaver: 1, hell_trident: 1 };

/**
 * 按武器种类（kind）加盐：测试 bot 的行为修复只影响某一类武器时用。
 *   aura = 1：bot 持有光环时改为站进光环范围（之前远程角色站在 230 外，光环样本严重偏低）
 */
const KIND_SALT: Record<string, number> = { aura: 1 };

const SKIP = new Set(['name', 'desc', 'en', 'enDesc', 'look', 'icon', 'art', 'title', 'lore', 'quote', 'projTint', 'tint']);

/** 稳定序列化：键排序、跳过文案与外观字段、函数忽略 */
function canon(v: unknown): string {
  if (v === null || typeof v !== 'object') return typeof v === 'function' || v === undefined ? '' : JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => !SKIP.has(k) && o[k] !== undefined && typeof o[k] !== 'function')
    .sort()
    .map((k) => `${k}:${canon(o[k])}`)
    .join(',')}}`;
}

/** FNV-1a 32 位，输出 8 位十六进制 */
function hash(s: string): string {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 0x01000193);
  }
  return (x >>> 0).toString(16).padStart(8, '0');
}

export interface WeaponFingerprints {
  global: string;
  weapons: Record<string, string>;
  /** 每章自己的定义（刷怪池、倍率、地形……）。变了，只作废在这一章采到的样本 */
  chapters?: Record<string, string>;
}

let cache: WeaponFingerprints | null = null;

export function weaponFingerprints(): WeaponFingerprints {
  if (cache) return cache;
  // 章节不进全局：改一章的刷怪池不该让其他章采到的样本跟着作废（见 chapters）。
  // BALANCE.chapterCurve（各章倍率曲线、hpAdjust）同理：它的效果已经算进每章的 hpMult / dmgMult 字段，由章节指纹负责
  const { chapterCurve: _cc, ...balanceRest } = BALANCE;
  const global = hash(`${FP_SALT}|${canon(balanceRest)}|${canon(ENEMIES)}|${canon(BOSSES)}`);
  const weapons: Record<string, string> = {};
  for (const [id, d] of Object.entries(WEAPON_MAP)) {
    const salt = `${WEAPON_SALT[id] ?? ''}${KIND_SALT[d.kind] ? `k${KIND_SALT[d.kind]}` : ''}`;
    weapons[id] = hash(salt ? `${salt}|${canon(d)}` : canon(d));
  }
  const chapters: Record<string, string> = {};
  // 血量 / 伤害倍率不计入：转换率 = 实测 ÷ 纸面，主要取决于刷怪构成和命中，微调难度（hpAdjust 等）不该让样本全部作废。
  // 刷怪池、波数、移速、地形等改了才作废这一章
  for (const c of CHAPTERS) {
    const { hpMult: _h, dmgMult: _d, bossHpMult: _b, ...rest } = c;
    chapters[c.id] = hash(`${FP_SALT}|${canon(rest)}`);
  }
  return (cache = { global, weapons, chapters });
}
