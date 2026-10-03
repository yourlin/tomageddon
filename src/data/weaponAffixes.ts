// 武器随机词条：T3 武器 1 条、T4 武器 2 条；每条分 I~IV 级（数值见 values，下标 = 等级 − 1）。
// 文字自带中英文，{v} 替换为数值。
export type AffixKind = 'dmg' | 'speed' | 'crit' | 'critDmg' | 'range' | 'lifeSteal' | 'burn' | 'poison' | 'slow';

export interface WeaponAffixDef {
  id: AffixKind;
  name: [string, string];
  values: [number, number, number, number];
}

export const WEAPON_AFFIXES: WeaponAffixDef[] = [
  { id: 'dmg', name: ['伤害 +{v}%', 'Damage +{v}%'], values: [8, 14, 22, 32] },
  { id: 'speed', name: ['攻速 +{v}%', 'Attack Speed +{v}%'], values: [6, 10, 15, 22] },
  { id: 'crit', name: ['暴击率 +{v}%', 'Crit Chance +{v}%'], values: [4, 7, 11, 16] },
  { id: 'critDmg', name: ['暴击伤害 +{v}%', 'Crit Damage +{v}%'], values: [15, 25, 40, 60] },
  { id: 'range', name: ['射程 +{v}', 'Range +{v}'], values: [20, 35, 55, 80] },
  { id: 'lifeSteal', name: ['吸血概率 +{v}%', 'Life Steal Chance +{v}%'], values: [1, 2, 3, 5] },
  { id: 'burn', name: ['命中 {v}% 概率灼烧', '{v}% chance to Burn'], values: [8, 14, 22, 32] },
  { id: 'poison', name: ['命中 {v}% 概率中毒', '{v}% chance to Poison'], values: [8, 14, 22, 32] },
  { id: 'slow', name: ['命中 {v}% 概率减速', '{v}% chance to Slow'], values: [10, 18, 28, 40] },
];
export const WEAPON_AFFIX_MAP = Object.fromEntries(WEAPON_AFFIXES.map((a) => [a.id, a])) as Record<AffixKind, WeaponAffixDef>;

/** 词条等级的出现权重（I 常见 → IV 稀有），幸运会提高高等级权重 */
export const AFFIX_TIER_WEIGHTS = [50, 30, 15, 5];
/** 打造：每级伤害加成、最高等级、各级成功率（下标 = 当前等级） */
export const FORGE = {
  dmgPerLevel: 0.08,
  maxLevel: 10,
  chance: [0.95, 0.9, 0.82, 0.74, 0.65, 0.56, 0.48, 0.4, 0.34, 0.3],
};
