// 契合武器：每名角色契合 2 个武器标签（characters.ts 的 favored，见 data/weaponTags.ts）。
// 单契合：武器带其中任意一个标签 → 伤害 +10%，并获得该角色专属的「契合特效」；天赋（systems/Talents.ts）再在此基础上强化契合武器。
// 双契合：两个标签都带（每名角色 2–5 把基础武器）→ 武器再获得契合技与两条标签特性强化（data/synergy.ts）。
import { lang } from '../i18n';
import { weaponTags } from './weaponTags';
import { WEAPONS, type WeaponDef } from './weapons';

/** 契合武器的基础伤害倍率 */
export const FAVORED_DMG = 1.1;

/** 武器带有几个角色契合的标签（0 / 1 / 2；超武继承原武器的主题标签） */
export function favorLevel(favored: readonly string[], def: WeaponDef | undefined): number {
  if (!def) return 0;
  const tags = weaponTags(def);
  return favored.filter((t) => tags.includes(t)).length;
}

/** 武器是否为该角色的契合武器：带任意一个契合标签 */
export function isFavoredWeapon(favored: readonly string[], def: WeaponDef | undefined): boolean {
  return favorLevel(favored, def) > 0;
}

/** 武器是否为该角色的双契合武器：同时带有全部契合标签 */
export function isDoubleFavored(favored: readonly string[], def: WeaponDef | undefined): boolean {
  return favored.length > 1 && favorLevel(favored, def) === favored.length;
}

/** 角色的全部契合武器（商店里能买到的基础武器） */
export function favoredWeapons(c: { favored: readonly string[] }): WeaponDef[] {
  return WEAPONS.filter((w) => !w.evolvedFrom && isFavoredWeapon(c.favored, w));
}

/** 角色的双契合武器（基础武器） */
export function doubleFavoredWeapons(c: { favored: readonly string[] }): WeaponDef[] {
  return WEAPONS.filter((w) => !w.evolvedFrom && isDoubleFavored(c.favored, w));
}

/** 契合特效说明 [中文, English] */
export const AFFINITY_TEXT: Record<string, [string, string]> = {
  tomato: ['连击：30% 概率立刻追加一次 60% 伤害的攻击', 'Combo: 30% chance to follow up with an extra attack for 60% damage'],
  carrot: ['破防：命中叠 1 层破甲', 'Armor Crush: hits apply 1 stack of Armor Break'],
  chili: ['射程 +15%，命中多叠 1 层灼烧', '+15% range; hits apply an extra stack of Burn'],
  corn: ['射程 +25%，穿透 +1', '+25% range, +1 pierce'],
  watermelon: ['爆炸与横扫范围 +25%，击退更强', '+25% explosion & sweep area, stronger knockback'],
  lemon: ['暴击强化：暴击伤害 +30%，暴击附带流血', 'Crit Boost: +30% crit damage; crits inflict Bleed'],
  eggplant: ['连锁 +1 跳', '+1 chain jump'],
  garlic: ['命中 25% 概率流血', '25% chance to Bleed on hit'],
  blueberry: ['分裂：每次多 1 发弹丸（近战武器改为连击）', 'Split: +1 projectile per shot (melee: combo chance instead)'],
  pineapple: ['弹射 +1', '+1 bounce'],
  pumpkin: [
    '闪避后接下来 3 次攻击变成幽灵弹：必定暴击、无限穿透',
    'After a dodge, the next 3 attacks become ghost shots: guaranteed crit, infinite pierce',
  ],
  strawberry: ['人气：每级攻速 +1%（最多 +30%）', 'Popularity: +1% attack speed per level (max +30%)'],
  ginger: ['回旋镖与飞镖每次多扔 1 枚（其他武器改为连击）', 'Boomerangs & shuriken throw +1 (others: combo chance)'],
  avocado: ['爆炸范围 +20%', '+20% explosion area'],
  onion: ['命中 15% 概率致盲', '15% chance to Blind on hit'],
  mushroom: ['命中必定叠 1 层中毒', 'Hits always apply 1 stack of Poison'],
  coconut: ['重拳：每第 4 次攻击造成双倍伤害并大幅击退', 'Haymaker: every 4th attack deals double damage with heavy knockback'],
  grape: ['分裂：每次多 1 发弹丸（近战武器改为连击）', 'Split: +1 projectile per shot (melee: combo chance instead)'],
  cherry: ['攻速 +15%', '+15% attack speed'],
  pea: ['穿透 +1', '+1 pierce'],
  peach: ['命中 3% 概率回复 1 生命', '3% chance to heal 1 HP on hit'],
  dragonfruit: ['命中叠 1 层灼烧', 'Hits apply 1 stack of Burn'],
  beet: ['吸血概率 +3%', '+3% life steal chance'],
  asparagus: ['打被标记的敌人时暴击伤害 +50%', '+50% crit damage against Marked enemies'],
  sweetpotato: ['命中 3% 概率掉落果实（每波最多 4 个）', '3% chance on hit to drop a fruit (max 4 per wave)'],
  kiwi: ['打带减益的敌人时施加易伤', 'Hits on debuffed enemies apply Vulnerable'],
  lychee: ['好运：15% 概率一次多射 1 发', 'Lucky: 15% chance to fire an extra projectile'],
  durian: ['光环与爆炸范围 +20%', '+20% aura & explosion area'],
  bellpepper: ['射程与弹速 +20%', '+20% range & projectile speed'],
  wintermelon: ['连击 25%（站着不动时 50%），站着不动时射程 +20%', '25% combo (50% while standing still); +20% range while standing still'],
  bittermelon: ['命中 8% 概率冰冻', '8% chance to Freeze on hit'],
  sprout: ['每级射程 +1%（最多 +30%）', '+1% range per level (max +30%)'],
  wasabi: ['爆炸范围 +15%，命中附带灼烧', '+15% explosion area; hits Burn'],
  soybean: ['地雷爆炸后再炸开 2 颗小豆雷', 'Mines burst into 2 small bean mines after exploding'],
  jackfruit: ['命中时射出飞刺：1 根 + 每层荆棘 1 根', 'Hits fire spikes: 1 + 1 per Thorns stack'],
  pomegranate: ['分裂：每次多 1 发弹丸', 'Split: +1 projectile per shot'],
  taro: ['光环范围 +15%（计入光环范围上限）', '+15% aura size (counts toward the aura size cap)'],
  cabbage: ['每层坚韧让范围 +4%', '+4% area per Fortify stack'],
  blackberry: ['打被诅咒的敌人时额外叠 1 层腐烂', 'Hits on Cursed enemies apply an extra stack of Rot'],
};

/** 当前语言的契合特效说明 */
export function affinityText(charId: string): string {
  const t = AFFINITY_TEXT[charId];
  return t ? t[lang === 'en' ? 1 : 0] : '';
}
