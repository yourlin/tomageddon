// 武器词条与打造：生成/洗练词条、打造升级（有失败概率）、汇总词条加成
import { WEAPON_AFFIXES, WEAPON_AFFIX_MAP, AFFIX_TIER_WEIGHTS, FORGE, type AffixKind } from '../data/weaponAffixes';
import { WEAPON_MAP } from '../data/weapons';
import { TIER_PRICE_MULT } from '../data/weapons';
import { lang } from '../i18n';
import type { OwnedWeapon } from './RunState';

export interface WeaponAffix {
  id: AffixKind;
  /** 等级 1~4 */
  tier: number;
}

/** 词条数量：T3（tier 下标 2）1 条，T4（下标 3）2 条 */
export const affixSlots = (tier: number): number => (tier >= 3 ? 2 : tier === 2 ? 1 : 0);

function rollTier(luck: number): number {
  // 幸运每 20 点把低等级权重向高等级挪一些
  const shift = Math.max(0, Math.min(20, luck / 20));
  const w = AFFIX_TIER_WEIGHTS.map((x, i) => Math.max(1, x + (i - 1.5) * shift * 4));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return i + 1;
  return 1;
}

function rollOne(exclude: AffixKind[], luck: number): WeaponAffix {
  const pool = WEAPON_AFFIXES.filter((a) => !exclude.includes(a.id));
  return { id: pool[Math.floor(Math.random() * pool.length)].id, tier: rollTier(luck) };
}

/** 补足词条数量（升品质或新获得 T3/T4 武器时调用） */
export function ensureAffixes(w: OwnedWeapon, luck = 0): void {
  const list = (w.affixes ??= []);
  while (list.length < affixSlots(w.tier))
    list.push(
      rollOne(
        list.map((a) => a.id),
        luck,
      ),
    );
}

export function rerollAll(w: OwnedWeapon, luck = 0): void {
  w.affixes = [];
  ensureAffixes(w, luck);
}

export function rerollOne(w: OwnedWeapon, idx: number, luck = 0): void {
  const list = w.affixes ?? [];
  if (!list[idx]) return;
  list[idx] = rollOne(
    list.filter((_, i) => i !== idx).map((a) => a.id),
    luck,
  );
}

/** 洗练价格：全部洗练便宜，单条洗练约 2.5 倍 */
export const rerollAllCost = (wave: number): number => Math.round(8 + wave * 2);
export const rerollOneCost = (wave: number): number => Math.round(rerollAllCost(wave) * 2.5);

/** 打造价格随等级指数上涨；与武器基础价挂钩 */
export function forgeCost(w: OwnedWeapon): number {
  const base = WEAPON_MAP[w.id].price * TIER_PRICE_MULT[3] * 0.15;
  return Math.round(base * Math.pow(1.45, w.forge ?? 0));
}
export const forgeChance = (w: OwnedWeapon): number => FORGE.chance[Math.min(w.forge ?? 0, FORGE.chance.length - 1)];
export const canForge = (w: OwnedWeapon): boolean => w.tier >= 3 && (w.forge ?? 0) < FORGE.maxLevel;

/** 打造一次：成功等级 +1，失败只扣费用；返回是否成功 */
export function forge(w: OwnedWeapon): boolean {
  if (!canForge(w)) return false;
  const ok = Math.random() < forgeChance(w);
  if (ok) w.forge = (w.forge ?? 0) + 1;
  return ok;
}

export interface AffixTotals {
  dmg: number;
  speed: number;
  crit: number;
  critDmg: number;
  range: number;
  lifeSteal: number;
  burn: number;
  poison: number;
  slow: number;
}

/** 汇总一把武器的词条加成（打造等级计入伤害） */
export function affixTotals(w: OwnedWeapon | undefined): AffixTotals {
  const t: AffixTotals = { dmg: 0, speed: 0, crit: 0, critDmg: 0, range: 0, lifeSteal: 0, burn: 0, poison: 0, slow: 0 };
  if (!w) return t;
  for (const a of w.affixes ?? []) t[a.id] += WEAPON_AFFIX_MAP[a.id].values[a.tier - 1];
  t.dmg += (w.forge ?? 0) * FORGE.dmgPerLevel * 100;
  return t;
}

export const AFFIX_TIER_ROMAN = ['I', 'II', 'III', 'IV'];
/** 词条文字：「伤害 +14%（II）」 */
export function affixText(a: WeaponAffix): string {
  const d = WEAPON_AFFIX_MAP[a.id];
  return `${d.name[lang === 'en' ? 1 : 0].replace('{v}', String(d.values[a.tier - 1]))} (${AFFIX_TIER_ROMAN[a.tier - 1]})`;
}
/** 词条等级颜色：I 白 · II 蓝 · III 紫 · IV 橙 */
export const AFFIX_TIER_COLOR = ['#dfe6e9', '#4aa3ff', '#b46bff', '#ff9f1c'];
