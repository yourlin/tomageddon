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
  killHeal?: number; // 每击杀 N 个敌人回复 1 生命
  shopDiscount?: number; // 商店折扣 %
  rerolls?: number; // 每波商店刷新次数上限 +N（总上限 10）
  onHit?: StatusApply[]; // 命中时对敌人施加
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
  max?: number; // 最多持有数量
  icon?: { shape: string; color: number; color2: number; glyph?: string };
  series?: string;
  /** 原始中文名（切换英文后仍用于图标配色，保证两种语言图标一致） */
  nameZh?: string;
}

export const ITEMS: ItemDef[] = [
  // ---------- 普通 ----------
  { id: 'band_aid', name: '创可贴', rarity: 0, price: 12, mods: { maxHp: 3 } },
  { id: 'tomato_juice', name: '番茄汁', rarity: 0, price: 14, mods: { regen: 2 } },
  { id: 'toothpick', name: '牙签', rarity: 0, price: 13, mods: { melee: 2, range: -5 } },
  { id: 'rubber_band', name: '橡皮筋', rarity: 0, price: 13, mods: { ranged: 2 } },
  { id: 'lighter', name: '打火机', rarity: 0, price: 13, mods: { elemental: 2 } },
  { id: 'apron', name: '围裙', rarity: 0, price: 15, mods: { armor: 2 } },
  { id: 'coffee', name: '黑咖啡', rarity: 0, price: 15, mods: { attackSpeed: 6, maxHp: -1 } },
  { id: 'sneakers', name: '旧球鞋', rarity: 0, price: 14, mods: { speed: 5 } },
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
    max: 3,
    icon: { shape: 'scroll', color: 0xffd166, color2: 0xe63946 },
  },
  { id: 'firecracker', name: '小鞭炮', rarity: 0, price: 15, mods: { explodeSize: 10 } },
  // ---------- 稀有 ----------
  {
    id: 'big_magnet',
    name: '强力磁铁',
    rarity: 1,
    price: 30,
    mods: { pickup: 80, harvest: 6, speed: -3 },
    icon: { shape: 'heart', color: 0x4361ee, color2: 0xadb5bd },
  },
  { id: 'chef_hat', name: '厨师帽', rarity: 1, price: 35, mods: { melee: 4, armor: 1, maxHp: 5, ranged: -2 } },
  { id: 'scope', name: '瞄准镜', rarity: 1, price: 38, mods: { ranged: 4, range: 40, crit: 5, attackSpeed: -5 } },
  { id: 'battery', name: '电池', rarity: 1, price: 36, mods: { elemental: 4, attackSpeed: 7, maxHp: -3 } },
  { id: 'mosquito', name: '蚊子标本', rarity: 1, price: 40, mods: { lifeSteal: 4, maxHp: -2 } },
  { id: 'energy_drink', name: '能量饮料', rarity: 1, price: 38, mods: { attackSpeed: 10, speed: 3, regen: -1 } },
  { id: 'helmet', name: '锅盖头盔', rarity: 1, price: 40, mods: { armor: 3, speed: -3 } },
  {
    id: 'piggy_bank',
    name: '存钱罐',
    rarity: 1,
    price: 30,
    mods: {},
    special: { interest: 10 },
    max: 3,
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
    mods: { armor: 3, speed: -3 },
    special: { thorns: 8 },
    desc: '受到伤害时对攻击者造成 8 点伤害',
  },
  {
    id: 'lucky_cat',
    name: '招财猫',
    rarity: 1,
    price: 38,
    mods: { luck: 18, damage: -4 },
    special: { doubleSeed: 10 },
    desc: '10% 概率番茄籽翻倍',
  },
  { id: 'running_shoes', name: '跑鞋', rarity: 1, price: 38, mods: { speed: 12, dodge: 2, armor: -1 } },
  { id: 'lemonade', name: '柠檬水', rarity: 1, price: 36, mods: { regen: 4, maxHp: 4, damage: -4 } },
  {
    id: 'bandage_roll',
    name: '绷带卷',
    rarity: 1,
    price: 40,
    mods: { maxHp: 7, regen: 1, speed: -3 },
    special: { killHeal: 25 },
    desc: '每击杀 25 个敌人回复 1 生命',
  },
  { id: 'baking_powder', name: '泡打粉', rarity: 1, price: 36, mods: { explodeSize: 22, elemental: 2, maxHp: -3 } },
  // ---------- 史诗 ----------
  {
    id: 'vip_card',
    name: '会员卡',
    rarity: 2,
    price: 55,
    mods: { luck: 5 },
    special: { rerolls: 2 },
    max: 2,
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
  { id: 'iron_wok', name: '铁锅盾', rarity: 2, price: 70, mods: { armor: 5, maxHp: 5, speed: -5 } },
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
    max: 1,
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
  { id: 'backpack', name: '双肩背包', rarity: 2, price: 80, mods: { speed: -3 }, special: { weaponSlot: 1 }, max: 2, desc: '武器栏 +1' },
  { id: 'coupon', name: '优惠券', rarity: 2, price: 55, mods: {}, special: { shopDiscount: 10 }, max: 3, desc: '商店价格 -10%' },
  { id: 'protein', name: '蛋白粉', rarity: 2, price: 75, mods: { maxHp: 10, melee: 2, speed: -2 } },
  { id: 'pressure_cooker', name: '高压锅', rarity: 2, price: 70, mods: { explodeSize: 30, armor: 1 } },
  // ---------- 传说 ----------
  { id: 'golden_tomato', name: '黄金番茄', rarity: 3, price: 120, mods: { damage: 15, maxHp: 10, luck: 15, speed: -5 } },
  {
    id: 'phoenix_feather',
    name: '凤凰羽毛',
    rarity: 3,
    price: 110,
    mods: { regen: 3 },
    special: { revive: 1 },
    max: 1,
    desc: '死亡时以 50% 生命复活一次',
  },
  { id: 'chef_knife_set', name: '大厨刀具套装', rarity: 3, price: 130, mods: { melee: 8, crit: 8, attackSpeed: 8, ranged: -4 } },
  { id: 'railgun_core', name: '电磁核心', rarity: 3, price: 130, mods: { ranged: 8, range: 60, attackSpeed: 8, melee: -4 } },
  { id: 'grandma_recipe', name: '外婆的秘方', rarity: 3, price: 115, mods: { harvest: 25, xpGain: 25, luck: 20, damage: -8 } },
  { id: 'vampire_cape', name: '吸血鬼披风', rarity: 3, price: 125, mods: { lifeSteal: 10, damage: 8, dodge: 5, regen: -3 } },
  { id: 'powder_keg', name: '火药桶', rarity: 3, price: 115, mods: { explodeSize: 50, damage: 5, speed: -3 } },
];

/** 手工设计的道具 + 系列化生成的道具 */
// 1.4.0 G7：新道具 30 个
ITEMS.push(...EXTRA_ITEMS);
export const ALL_ITEMS: ItemDef[] = [...ITEMS, ...GENERATED_ITEMS];

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i]));

/** 升级时的属性选项（按稀有度数值不同）。attackClass 为 null 表示所有流派通用 */
export const LEVELUP_OPTIONS: { key: keyof StatMods & string; values: number[] }[] = [
  { key: 'maxHp', values: [3, 6, 9, 12] },
  { key: 'regen', values: [2, 3, 4, 5] },
  { key: 'lifeSteal', values: [1, 2, 3, 4] },
  { key: 'meleePct', values: [6, 10, 14, 19] },
  { key: 'rangedPct', values: [6, 10, 14, 19] },
  { key: 'elementalPct', values: [6, 10, 14, 19] },
  { key: 'auraPct', values: [7, 11, 16, 21] },
  { key: 'auraSize', values: [6, 10, 14, 20] },
  { key: 'explodeSize', values: [8, 12, 16, 22] },
  { key: 'melee', values: [2, 3, 4, 5] },
  { key: 'ranged', values: [1, 2, 3, 4] },
  { key: 'elemental', values: [1, 2, 3, 4] },
  { key: 'attackSpeed', values: [5, 10, 15, 20] },
  { key: 'crit', values: [3, 5, 7, 9] },
  { key: 'range', values: [15, 30, 45, 60] },
  { key: 'armor', values: [1, 2, 3, 4] },
  { key: 'dodge', values: [3, 6, 9, 12] },
  { key: 'pickup', values: [15, 25, 40, 60] },
  { key: 'speed', values: [3, 6, 9, 12] },
  { key: 'luck', values: [5, 10, 15, 20] },
  { key: 'harvest', values: [5, 8, 10, 12] },
  { key: 'skillDmg', values: [8, 12, 16, 22] },
  { key: 'skillCd', values: [4, 6, 8, 10] },
];
