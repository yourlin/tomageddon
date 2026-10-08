// 道具（被动物品），在商店购买，可叠加。rarity: 0 普通 1 稀有 2 史诗 3 传说
import type { StatMods } from './stats';
import type { StatusApply } from './statuses';
import { GENERATED_ITEMS } from './itemGen';
import { EXTRA_ITEMS } from './gearExtra';

export interface ItemSpecial {
  explodeOnKill?: { chance: number; dmg: number }; // 击杀爆炸
  thorns?: number; // 受伤时反弹伤害
  revive?: number; // 复活次数
  weaponSlot?: number; // 额外武器栏
  burnChance?: number; // 所有命中附带灼烧概率 %
  shield?: number; // 每 N 秒获得一次抵挡护盾
  doubleSeed?: number; // 番茄籽翻倍概率 %
  interest?: number; // 每波结束获得当前番茄籽的 % 利息
  lightningOnHit?: number; // 命中时概率触发闪电 %
  split?: number; // 武器子弹命中后分裂层数 +N（总层数上限 BALANCE.split.cap，每层伤害递减）
  killHeal?: number; // 每击杀 N 个敌人回复 1 生命
  shopDiscount?: number; // 商店折扣 %
  rerolls?: number; // 每波商店刷新次数上限 +N（总上限 10）
  legendCap?: number; // 每种传说道具的持有上限 +N（角色 / 天赋 / 遗物等均可提供）
  onHit?: StatusApply[]; // 命中时对敌人施加
  onAuraHit?: StatusApply[]; // 只有光环武器命中时才对敌人施加（光环系列道具）
  onHitSelf?: StatusApply[]; // 命中时对自己施加
  onKillSelf?: StatusApply[]; // 击杀时对自己施加
  onHurtSelf?: StatusApply[]; // 受伤时对自己施加
  onHurtEnemy?: StatusApply[]; // 受伤时对攻击者施加
  onDodgeSelf?: StatusApply[]; // 闪避时对自己施加
  waveStartSelf?: StatusApply[]; // 每波开始对自己施加
  periodicSelf?: { every: number; status: StatusApply[] };
  aura?: { radius: number; every: number; status: StatusApply[] }; // 周期性对周围敌人施加
  sameWeaponBonus?: number; // 每把同名武器 +% 伤害
  fruitHeal?: number; // 果实回血 +%
  crateMult?: number; // 宝箱掉率倍数
  critDmg?: number; // 暴击伤害 +%
  statusDmg?: number; // 持续伤害 +%
  cleanseEvery?: number; // 每 N 秒净化减益
}

export interface ItemDef {
  id: string;
  name: string;
  desc?: string;
  rarity: number;
  price: number;
  mods: StatMods;
  special?: ItemSpecial;
  /** 最多持有数量。不填时按稀有度默认（RARITY_ITEM_CAP：普通 3、稀有 2、史诗 1、传说 1）；填了就以它为准 */
  max?: number;
  icon?: { shape: string; color: number; color2: number; glyph?: string };
  series?: string;
  /** 原始中文名（切换英文后仍用于图标配色，保证两种语言图标一致） */
  nameZh?: string;
}

export const ITEMS: ItemDef[] = [
  // ---------- 普通 ----------
  { id: 'band_aid', name: '创可贴', rarity: 0, price: 12, mods: { maxHp: 3 } },
  { id: 'tomato_juice', name: '番茄汁', rarity: 0, price: 14, mods: { regen: 2 } },
  { id: 'toothpick', name: '牙签', rarity: 0, price: 13, mods: { melee: 2, ranged: -1 } },
  { id: 'rubber_band', name: '橡皮筋', rarity: 0, price: 13, mods: { ranged: 2 } },
  { id: 'lighter', name: '打火机', rarity: 0, price: 13, mods: { elemental: 2 } },
  { id: 'apron', name: '围裙', rarity: 0, price: 15, mods: { armor: 2 } },
  { id: 'coffee', name: '黑咖啡', rarity: 0, price: 15, mods: { attackSpeed: 6, maxHp: -1 } },
  { id: 'sneakers', name: '旧球鞋', rarity: 0, price: 14, mods: { speed: 3 } },
  { id: 'clover', name: '四叶草', rarity: 0, price: 12, mods: { luck: 8 } },
  { id: 'seed_bag', name: '种子袋', rarity: 0, price: 16, mods: { harvest: 6 } },
  { id: 'magnet', name: '冰箱贴', rarity: 0, price: 10, mods: { pickup: 30 } },
  { id: 'glasses', name: '老花镜', rarity: 0, price: 14, mods: { range: 30, dodge: -1 } },
  { id: 'feather', name: '羽毛', rarity: 0, price: 14, mods: { dodge: 3 } },
  { id: 'hot_sauce', name: '辣酱包', rarity: 0, price: 14, mods: { damage: 5 } },
  { id: 'notebook', name: '食谱笔记', rarity: 0, price: 14, mods: { xpGain: 10 } },
  {
    id: 'reroll_ticket',
    name: '刷新券',
    rarity: 0,
    price: 18,
    mods: {},
    special: { rerolls: 1 },
    icon: { shape: 'scroll', color: 0xffd166, color2: 0xe63946 },
  },
  { id: 'firecracker', name: '小鞭炮', rarity: 0, price: 15, mods: { explodeSize: 10 } },
  // ---------- 稀有 ----------
  {
    id: 'big_magnet',
    name: '强力磁铁',
    rarity: 1,
    price: 30,
    mods: { pickup: 80, harvest: 6, speed: -2 },
    icon: { shape: 'heart', color: 0x4361ee, color2: 0xadb5bd },
  },
  { id: 'chef_hat', name: '厨师帽', rarity: 1, price: 35, mods: { melee: 4, armor: 1, maxHp: 5, ranged: -2 } },
  { id: 'scope', name: '瞄准镜', rarity: 1, price: 38, mods: { ranged: 4, range: 40, crit: 5, attackSpeed: -5 } },
  { id: 'battery', name: '电池', rarity: 1, price: 36, mods: { elemental: 4, attackSpeed: 7, maxHp: -3 } },
  { id: 'mosquito', name: '蚊子标本', rarity: 1, price: 40, mods: { lifeSteal: 4, maxHp: -2 } },
  { id: 'energy_drink', name: '能量饮料', rarity: 1, price: 38, mods: { attackSpeed: 10, speed: 2, regen: -1 } },
  { id: 'helmet', name: '锅盖头盔', rarity: 1, price: 40, mods: { armor: 3, speed: -2 } },
  {
    id: 'piggy_bank',
    name: '存钱罐',
    rarity: 1,
    price: 30,
    mods: {},
    special: { interest: 10 },
    desc: '每波结束获得当前番茄籽 10% 的利息（每波上限 6×波次）',
  },
  {
    id: 'bomb_seed',
    name: '爆裂种子',
    rarity: 1,
    price: 42,
    mods: { damage: 6, maxHp: -2 },
    special: { explodeOnKill: { chance: 10, dmg: 15 } },
    desc: '击杀敌人时 10% 概率爆炸',
  },
  {
    id: 'cactus',
    name: '仙人掌',
    rarity: 1,
    price: 34,
    mods: { armor: 3, speed: -2 },
    special: { thorns: 8 },
    desc: '受到伤害时对攻击者造成 8 点伤害',
  },
  {
    id: 'lucky_cat',
    name: '招财猫',
    rarity: 1,
    price: 38,
    mods: { luck: 18, maxHp: -2 },
    special: { doubleSeed: 10 },
    desc: '10% 概率番茄籽翻倍',
  },
  { id: 'running_shoes', name: '跑鞋', rarity: 1, price: 38, mods: { speed: 6, dodge: 2, armor: -1 } },
  { id: 'lemonade', name: '柠檬水', rarity: 1, price: 36, mods: { regen: 4, maxHp: 4, speed: -2 } },
  {
    id: 'bandage_roll',
    name: '绷带卷',
    rarity: 1,
    price: 40,
    mods: { maxHp: 7, regen: 1, speed: -2 },
    special: { killHeal: 25 },
    desc: '每击杀 25 个敌人回复 1 生命',
  },
  { id: 'baking_powder', name: '泡打粉', rarity: 1, price: 36, mods: { explodeSize: 22, elemental: 2, maxHp: -3 } },
  {
    id: 'pomegranate',
    name: '爆籽石榴',
    rarity: 1,
    price: 46,
    mods: { ranged: 1, rangedPct: -6 },
    special: { split: 1 },
    icon: { shape: 'fruit', color: 0xc1121f, color2: 0xffafcc },
  },
  // ---------- 史诗 ----------
  {
    id: 'vip_card',
    name: '会员卡',
    rarity: 2,
    price: 55,
    mods: { luck: 5 },
    special: { rerolls: 2 },
    icon: { shape: 'book', color: 0x9d4edd, color2: 0xffd166 },
  },
  {
    id: 'vacuum',
    name: '吸尘器',
    rarity: 2,
    price: 60,
    mods: { pickup: 150, luck: 5 },
    icon: { shape: 'box', color: 0x2ec4b6, color2: 0xe9ecef },
  },
  { id: 'iron_wok', name: '铁锅盾', rarity: 2, price: 70, mods: { armor: 5, maxHp: 5, speed: -3 } },
  { id: 'sharpener', name: '磨刀石', rarity: 2, price: 72, mods: { crit: 10, melee: 3 } },
  {
    id: 'tesla_coil',
    name: '特斯拉线圈',
    rarity: 2,
    price: 75,
    mods: { elemental: 4 },
    special: { lightningOnHit: 10 },
    desc: '命中时 10% 概率召唤闪电',
  },
  {
    id: 'bubble',
    name: '泡泡糖',
    rarity: 2,
    price: 70,
    mods: { dodge: 3 },
    special: { shield: 10 },
    desc: '每 10 秒获得一次抵挡伤害的泡泡护盾',
  },
  {
    id: 'fire_pepper',
    name: '魔鬼椒',
    rarity: 2,
    price: 68,
    mods: { elemental: 3, damage: 5 },
    special: { burnChance: 20 },
    desc: '所有命中 20% 概率造成灼烧',
  },
  { id: 'backpack', name: '双肩背包', rarity: 3, price: 120, mods: { speed: -2 }, special: { weaponSlot: 1 }, desc: '武器栏 +1' },
  { id: 'coupon', name: '优惠券', rarity: 2, price: 55, mods: {}, special: { shopDiscount: 10 }, desc: '商店价格 -10%' },
  { id: 'protein', name: '蛋白粉', rarity: 2, price: 75, mods: { maxHp: 10, melee: 2, speed: -1 } },
  { id: 'pressure_cooker', name: '高压锅', rarity: 2, price: 70, mods: { explodeSize: 30, armor: 1 } },
  {
    id: 'onion_layers',
    name: '千层洋葱',
    rarity: 2,
    price: 78,
    mods: { ranged: 2, attackSpeed: -4 },
    special: { split: 1 },
    icon: { shape: 'orb', color: 0xb5838d, color2: 0xf8edeb },
  },
  // ---------- 传说 ----------
  { id: 'golden_tomato', name: '黄金番茄', rarity: 3, price: 120, mods: { damage: 15, maxHp: 10, luck: 15, speed: -3 } },
  {
    id: 'phoenix_feather',
    name: '凤凰羽毛',
    rarity: 3,
    price: 110,
    mods: { regen: 3 },
    special: { revive: 1 },
    desc: '死亡时以 50% 生命复活一次',
  },
  { id: 'chef_knife_set', name: '大厨刀具套装', rarity: 3, price: 130, mods: { melee: 8, crit: 8, attackSpeed: 8, ranged: -4 } },
  { id: 'railgun_core', name: '电磁核心', rarity: 3, price: 130, mods: { ranged: 8, range: 60, attackSpeed: 8, melee: -4 } },
  { id: 'grandma_recipe', name: '外婆的秘方', rarity: 3, price: 115, mods: { harvest: 25, xpGain: 25, luck: 20, armor: -3 } },
  { id: 'vampire_cape', name: '吸血鬼披风', rarity: 3, price: 125, mods: { lifeSteal: 10, damage: 8, dodge: 5, regen: -3 } },
  { id: 'powder_keg', name: '火药桶', rarity: 3, price: 115, mods: { explodeSize: 50, damage: 5, speed: -2 } },
  {
    id: 'cluster_tomato',
    name: '串串番茄',
    rarity: 3,
    price: 135,
    mods: { rangedPct: 8, ranged: 2 },
    special: { split: 2 },
    icon: { shape: 'fruit', color: 0xe63946, color2: 0x52b788 },
  },
];

/** 手工设计的道具 + 系列化生成的道具 */
// 1.4.0 G7：新道具 30 个
ITEMS.push(...EXTRA_ITEMS);
export const ALL_ITEMS: ItemDef[] = [...ITEMS, ...GENERATED_ITEMS];

/** 百分比类加成（全伤害、各类伤害 %、攻速、暴击、光环、爆炸、技能、经验）防属性爆炸：
 *  道具上的正向数值统一 × PCT_ITEM_SCALE（至少 1），代价（负值）不变 */
export const PCT_SCALED_KEYS: (keyof StatMods)[] = [
  'damage',
  'meleePct',
  'rangedPct',
  'elementalPct',
  'auraPct',
  'auraSize',
  'explodeSize',
  'attackSpeed',
  'crit',
  'xpGain',
  'skillCd',
  'skillDmg',
  'skillRange',
  'skillDur',
];
export const PCT_ITEM_SCALE = 0.4;
/** 道具幸运上限（普通 / 稀有 / 史诗 / 传说）：幸运决定商店武器品质与道具稀有度，加太多会过早拿到跨档装备 */
export const LUCK_ITEM_CAP = [3, 5, 7, 10];
/** 道具闪避上限 %（普通 / 稀有 / 史诗 / 传说）：闪避是概率免伤，叠太高会站着不动也打不死 */
export const DODGE_ITEM_CAP = [2, 3, 4, 6];
export const PCT_LEVELUP_SCALE = 0.5;
const scalePct = (v: number, k: number): number => (v > 0 ? Math.max(1, Math.round(v * k)) : v);
for (const it of ALL_ITEMS) {
  const lk = it.mods.luck;
  if (lk !== undefined && lk > 0) it.mods.luck = Math.min(lk, LUCK_ITEM_CAP[Math.min(3, it.rarity)]);
  const dg = it.mods.dodge;
  if (dg !== undefined && dg > 0) it.mods.dodge = Math.min(dg, DODGE_ITEM_CAP[Math.min(3, it.rarity)]);
}
for (const it of ALL_ITEMS)
  for (const key of PCT_SCALED_KEYS) {
    const v = it.mods[key];
    if (v !== undefined) it.mods[key] = scalePct(v, PCT_ITEM_SCALE);
  }

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i]));

/** 传说稀有度（RARITY 下标） */
export const LEGEND_RARITY = 3;
/** 每种传说道具默认最多持有 1 件 */
export const LEGEND_ITEM_CAP = 1;
/** 各稀有度默认持有上限：普通 3 件、稀有 2 件、史诗 1 件、传说 1 件 */
export const RARITY_ITEM_CAP = [3, 2, 1, LEGEND_ITEM_CAP];

/** 道具的基础持有上限（不含加成）：填了 max 以 max 为准，否则按稀有度 */
export function baseItemCap(it: ItemDef): number {
  return it.max ?? RARITY_ITEM_CAP[Math.min(it.rarity, RARITY_ITEM_CAP.length - 1)];
}

/** 实际持有上限：传说道具再加上 specials.legendCap（角色、天赋等提供） */
export function itemCapFor(it: ItemDef, legendBonus = 0): number {
  return baseItemCap(it) + (it.rarity >= LEGEND_RARITY ? Math.max(0, legendBonus) : 0);
}

/** 升级时的属性选项（按稀有度数值不同）。attackClass 为 null 表示所有流派通用。
 *  光环范围、技能范围、爆炸范围、拾取范围不在升级选项里：只能靠道具 / 天赋等获得（避免范围无限膨胀）。
 *  百分比类数值按 PCT_LEVELUP_SCALE 缩减（见 LEVELUP_OPTIONS 末尾） */
export const LEVELUP_OPTIONS: { key: keyof StatMods & string; values: number[] }[] = [
  { key: 'maxHp', values: [3, 6, 9, 12] },
  // 回血类（生命再生、吸血）每次升级只加 1 点，不随升级稀有度提高
  { key: 'regen', values: [1, 1, 1, 1] },
  { key: 'lifeSteal', values: [1, 1, 1, 1] },
  { key: 'meleePct', values: [6, 10, 14, 19] },
  { key: 'rangedPct', values: [6, 10, 14, 19] },
  { key: 'elementalPct', values: [6, 10, 14, 19] },
  { key: 'auraPct', values: [7, 11, 16, 21] },
  { key: 'melee', values: [2, 3, 4, 5] },
  { key: 'ranged', values: [1, 2, 3, 4] },
  { key: 'elemental', values: [1, 2, 3, 4] },
  { key: 'attackSpeed', values: [5, 10, 15, 20] },
  { key: 'crit', values: [3, 5, 7, 9] },
  { key: 'range', values: [15, 30, 45, 60] },
  { key: 'armor', values: [1, 2, 3, 4] },
  { key: 'dodge', values: [1, 2, 3, 4] },
  { key: 'speed', values: [1, 2, 3, 4] },
  { key: 'luck', values: [1, 2, 3, 4] },
  { key: 'harvest', values: [5, 8, 10, 12] },
  { key: 'skillDmg', values: [8, 12, 16, 22] },
  { key: 'skillCd', values: [4, 6, 8, 10] },
];
for (const o of LEVELUP_OPTIONS) if (PCT_SCALED_KEYS.includes(o.key)) o.values = o.values.map((v) => scalePct(v, PCT_LEVELUP_SCALE));
