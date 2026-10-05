// 1.4.0 路线图 G5/G6/G7：新武器 12 把、新武器进化 8 组、新道具 30 个（侧重组合型）。
// 本文件只提供纯数据，接线（合并进 WEAPONS / EVOLUTIONS / ITEMS、图标、i18n、组合判定）由主会话完成。
// 注意：不要从 ../i18n/en/misc 导入任何东西——misc.ts 之后会反向导入本文件的英文覆盖，形成循环依赖。
import type { WeaponDef } from './weapons';
import type { ItemDef, ItemSpecial } from './items';
import type { StatKey, StatMods } from './stats';
import type { WeaponsEn, ItemsEn } from '../i18n/types';
import type { AuraStyle } from '../systems/AuraFx';

// ============================================================================
// 新武器（12 把）
// 补强思路：现有 50 把里「锋利」6、「酱料」7、「爆破」9、「枪械」11 最少，
// kind 里 aura / flame / chain / mine 各只有 3 把，所以新武器优先落在这些标签与类型上。
// ============================================================================
export const EXTRA_WEAPONS: WeaponDef[] = [
  // ---------------- 近战 ----------------
  {
    id: 'wasabi_katana',
    name: '芥末太刀',
    desc: '刀身抹满芥末，刺中带灼烧，暴击率高。',
    cls: 'melee',
    kind: 'thrust',
    tags: ['锋利', '酱料'],
    damage: [10, 17, 27, 41],
    cooldown: [0.85, 0.8, 0.74, 0.67],
    range: 150,
    scaling: { melee: 0.9 },
    critMult: 2.2,
    critBonus: 8,
    effect: { burn: { dps: 2, dur: 1.5 } },
    price: 26,
  },
  {
    id: 'kitchen_scissors',
    name: '厨房剪刀',
    desc: '咔嚓咔嚓快速横剪，暴击率高。',
    cls: 'melee',
    kind: 'sweep',
    tags: ['厨具', '锋利'],
    damage: [8, 14, 22, 33],
    cooldown: [0.85, 0.8, 0.74, 0.68],
    range: 105,
    scaling: { melee: 0.8 },
    critMult: 2.2,
    critBonus: 10,
    knockback: 8,
    price: 22,
  },
  {
    id: 'blender_aura',
    name: '破壁机',
    desc: '在身边高速旋转的刀片，持续切割周围敌人。',
    cls: 'melee',
    kind: 'aura',
    tags: ['厨具', '锋利'],
    damage: [4, 6, 9, 14],
    cooldown: [0.45, 0.43, 0.41, 0.38],
    range: 95,
    scaling: { melee: 0.5 },
    critMult: 2,
    critBonus: 5,
    price: 28,
  },
  {
    id: 'dynamite_drumstick',
    name: '炸药鸡腿',
    desc: '绑着炸药的大鸡腿，抡一下就炸一片。受最大生命加成。',
    cls: 'melee',
    kind: 'sweep',
    tags: ['爆破'],
    damage: [17, 29, 45, 68],
    cooldown: [1.7, 1.6, 1.5, 1.36],
    range: 120,
    scaling: { melee: 1.1, maxHp: 0.1 },
    critMult: 1.5,
    knockback: 30,
    effect: { explode: 85 },
    price: 30,
  },
  // ---------------- 远程 ----------------
  {
    id: 'pepper_grinder',
    name: '胡椒研磨枪',
    desc: '高速射出锋利胡椒粒，可穿透，暴击率高。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['枪械', '锋利'],
    damage: [6, 10, 15, 22],
    cooldown: [0.5, 0.46, 0.42, 0.38],
    range: 400,
    scaling: { ranged: 0.7 },
    critMult: 2.2,
    critBonus: 8,
    projSpeed: 900,
    pierce: [1, 1, 1, 2],
    spread: 8,
    price: 26,
  },
  {
    id: 'soy_bomb',
    name: '酱油炸弹',
    desc: '在身边布下酱油炸弹，爆炸并额外提高吸血概率。',
    cls: 'ranged',
    kind: 'mine',
    tags: ['酱料', '爆破'],
    damage: [15, 25, 39, 60],
    cooldown: [2.2, 2.05, 1.9, 1.7],
    range: 210,
    scaling: { ranged: 0.9 },
    critMult: 1.5,
    effect: { explode: 120, lifeSteal: 3 },
    price: 26,
  },
  {
    id: 'bbq_torch',
    name: '烧烤喷枪',
    desc: '喷出带酱汁的火焰，无限穿透并灼烧，命中额外提高吸血概率。',
    cls: 'ranged',
    kind: 'flame',
    tags: ['枪械', '酱料'],
    damage: [2, 3, 5, 8],
    cooldown: [0.2, 0.18, 0.16, 0.14],
    range: 190,
    scaling: { ranged: 0.25 },
    critMult: 1.5,
    projSpeed: 420,
    spread: 22,
    effect: { burn: { dps: 2, dur: 2 }, lifeSteal: 1 },
    price: 30,
  },
  {
    id: 'jam_mortar',
    name: '果酱迫击炮',
    desc: '轰出一坨果酱，爆炸并黏住敌人（减速 30%）。',
    cls: 'ranged',
    kind: 'rocket',
    tags: ['酱料', '爆破'],
    damage: [16, 27, 42, 64],
    cooldown: [2.0, 1.9, 1.78, 1.6],
    range: 460,
    scaling: { ranged: 1.1 },
    critMult: 1.5,
    projSpeed: 430,
    knockback: 15,
    effect: { explode: 95, slow: { pct: 30, dur: 1.5 } },
    price: 32,
  },
  {
    id: 'sea_urchin_mine',
    name: '海胆雷',
    desc: '浑身是刺的海胆雷，爆炸伤害容易暴击。',
    cls: 'ranged',
    kind: 'mine',
    tags: ['锋利', '爆破'],
    damage: [13, 22, 34, 52],
    cooldown: [1.9, 1.8, 1.65, 1.5],
    range: 230,
    scaling: { ranged: 0.8 },
    critMult: 2.5,
    critBonus: 10,
    effect: { explode: 95 },
    price: 26,
  },
  // ---------------- 元素 ----------------
  {
    id: 'salt_aura',
    name: '海盐结界',
    desc: '锋利的盐晶环绕周身，持续切割周围敌人，容易暴击。',
    cls: 'elemental',
    kind: 'aura',
    tags: ['锋利', '元素'],
    damage: [3, 5, 8, 12],
    cooldown: [0.5, 0.5, 0.5, 0.5],
    range: 115,
    scaling: { elemental: 0.45 },
    critMult: 2,
    critBonus: 10,
    price: 30,
  },
  {
    id: 'cola_zapper',
    name: '可乐电击枪',
    desc: '带电的可乐气泡在敌人间跳跃并减速。受远程伤害少量加成。',
    cls: 'elemental',
    kind: 'chain',
    tags: ['枪械', '元素'],
    damage: [8, 14, 21, 32],
    cooldown: [0.95, 0.88, 0.8, 0.72],
    range: 440,
    scaling: { elemental: 0.7, ranged: 0.3 },
    critMult: 1.5,
    effect: { chain: [2, 3, 4, 5], slow: { pct: 20, dur: 1 } },
    price: 28,
  },
  {
    id: 'hotpot_breath',
    name: '火锅吐息',
    desc: '喷出滚烫红油，强力灼烧，命中额外提高吸血概率。',
    cls: 'elemental',
    kind: 'flame',
    tags: ['酱料', '元素'],
    damage: [3, 4, 6, 10],
    cooldown: [0.22, 0.2, 0.18, 0.16],
    range: 165,
    scaling: { elemental: 0.3 },
    critMult: 1.5,
    projSpeed: 380,
    spread: 28,
    effect: { burn: { dps: 3, dur: 2 }, lifeSteal: 1 },
    price: 30,
  },
];

// ============================================================================
// 新进化（8 组）：与 evolutions.ts 中 evolve(from, item, boost) 的 Boost 同结构
// 主会话：EVOLUTIONS.push(...EXTRA_EVOLUTIONS_SPEC.map((s) => evolve(s.from, s.item, s.boost)))
// 注意 evolve() 内部的 BASE 只含 WEAPONS，需先把 EXTRA_WEAPONS 并入 BASE（否则新武器进化取不到原武器）。
// ============================================================================
export interface ExtraEvolutionSpec {
  from: string;
  item: string;
  boost: {
    id: string;
    name: string;
    desc: string;
    /** 伤害倍率（默认 1.7）、冷却倍率（默认 0.85）、射程倍率（默认 1.15） */
    dmg?: number;
    cd?: number;
    range?: number;
    extra?: Partial<WeaponDef>;
  };
}

export const EXTRA_EVOLUTIONS_SPEC: ExtraEvolutionSpec[] = [
  {
    from: 'pan',
    item: 'helmet',
    boost: {
      id: 'iron_bastion_pan',
      name: '铸铁壁垒锅',
      desc: '锅盖头盔焊成的重锅，一拍震晕一片，还能拍碎面前的敌方子弹，护甲越高越疼。',
      dmg: 1.7,
      range: 1.25,
      extra: { effect: { stun: 0.7 }, scaling: { melee: 1.4, armor: 2 }, knockback: 30 },
    },
  },
  {
    from: 'watermelon_hammer',
    item: 'powder_keg',
    boost: {
      id: 'melon_quake',
      name: '西瓜震地锤',
      desc: '塞满火药的西瓜，抡起砸地引发超大爆炸，地面开裂并连震两圈余震，震倒外围敌人。',
      dmg: 1.8,
      extra: { effect: { explode: 160 }, knockback: 50 },
    },
  },
  {
    from: 'broccoli_staff',
    item: 'battery',
    boost: {
      id: 'storm_broccoli',
      name: '风暴西兰花',
      desc: '电池充满的西兰花，闪电跳得更远还会眩晕，劈完后再落下三道眩晕的小闪电。',
      dmg: 1.6,
      cd: 0.8,
      extra: { effect: { chain: [5, 6, 8, 10], stun: 0.2 } },
    },
  },
  {
    from: 'mustard_flamer',
    item: 'pressure_cooker',
    boost: {
      id: 'mustard_dragon',
      name: '芥末龙息',
      desc: '高压喷射的芥末烈焰，射程更远、灼烧更狠。',
      dmg: 1.7,
      range: 1.3,
      extra: { effect: { burn: { dps: 6, dur: 3 } }, spread: 30 },
    },
  },
  {
    from: 'pepper_mine',
    item: 'baking_powder',
    boost: {
      id: 'pepper_minefield',
      name: '胡椒雷区',
      desc: '泡打粉让胡椒雷膨胀，布雷更快、炸得更大还会灼烧。',
      dmg: 1.7,
      cd: 0.65,
      extra: { effect: { explode: 195, burn: { dps: 4, dur: 2 } } },
    },
  },
  {
    from: 'wasabi_katana',
    item: 'sushi_mat',
    boost: {
      id: 'tsunami_katana',
      name: '怒涛芥末刀',
      desc: '寿司大师的终极一刀，暴击伤害与灼烧大幅提升。',
      dmg: 1.8,
      cd: 0.8,
      range: 1.3,
      extra: { critMult: 3, critBonus: 18, effect: { burn: { dps: 5, dur: 2 } } },
    },
  },
  {
    from: 'blender_aura',
    item: 'turbo_motor',
    boost: {
      id: 'tornado_blender',
      name: '龙卷破壁机',
      desc: '涡轮全开，刀片卷起龙卷风，切割并减速周围敌人。',
      dmg: 1.8,
      range: 1.35,
      extra: { effect: { slow: { pct: 30, dur: 0.8 } }, critBonus: 12 },
    },
  },
  {
    from: 'soy_bomb',
    item: 'fermented_jar',
    boost: {
      id: 'umami_bomb',
      name: '鲜味核弹',
      desc: '发酵百年的酱油炸弹，爆炸巨大并大幅提高吸血概率。',
      dmg: 1.9,
      extra: { effect: { explode: 185, lifeSteal: 6 } },
    },
  },
];

// ============================================================================
// 新道具（30 个）：普通 10 / 稀有 9 / 史诗 7 / 传说 4（现有经典道具为 17/15/11/7）
// 不写 desc，让 describeItem() 根据 mods + special 自动生成；每个都带 icon，无需改 ItemArt 的 HAND_ICONS。
// id 不以「_数字」结尾，避免被 i18n/ItemArt 当作系列道具解析。
// ============================================================================
export const EXTRA_ITEMS: ItemDef[] = [
  // ---------- 普通 ----------
  {
    id: 'wasabi_tube',
    name: '芥末管',
    rarity: 0,
    price: 14,
    mods: { elementalPct: 4, crit: 2 },
    icon: { shape: 'bottle', color: 0x7bd389, color2: 0xffffff },
  },
  {
    id: 'sushi_mat',
    name: '寿司竹帘',
    rarity: 0,
    price: 14,
    mods: { melee: 1, meleePct: 4 },
    icon: { shape: 'scroll', color: 0xc9a227, color2: 0x2d6a4f },
  },
  {
    id: 'salt_pinch',
    name: '一撮海盐',
    rarity: 0,
    price: 14,
    mods: { crit: 3, damage: 2 },
    icon: { shape: 'jar', color: 0xf8f9fa, color2: 0x4cc9f0 },
  },
  {
    id: 'soy_packet',
    name: '酱油小包',
    rarity: 0,
    price: 14,
    mods: { lifeSteal: 1, regen: 1 },
    icon: { shape: 'bottle', color: 0x3d2c2e, color2: 0xe63946 },
  },
  {
    id: 'bbq_charcoal',
    name: '烧烤炭',
    rarity: 0,
    price: 13,
    mods: { elemental: 1, explodeSize: 6 },
    icon: { shape: 'box', color: 0x343a40, color2: 0xff7b00 },
  },
  {
    id: 'spring_coil',
    name: '弹簧圈',
    rarity: 0,
    price: 13,
    mods: { attackSpeed: 4, speed: 1 },
    icon: { shape: 'gear', color: 0xadb5bd, color2: 0xffd166 },
  },
  {
    id: 'oven_mitt',
    name: '烤箱手套',
    rarity: 0,
    price: 15,
    mods: { armor: 1, maxHp: 2 },
    icon: { shape: 'shield', color: 0xe76f51, color2: 0xf8f9fa },
  },
  {
    id: 'jam_jar',
    name: '果酱罐',
    rarity: 0,
    price: 12,
    mods: { regen: 1, maxHp: 2, speed: -1 },
    icon: { shape: 'jar', color: 0x9d0208, color2: 0xffd6a5 },
  },
  {
    id: 'fortune_cookie',
    name: '幸运饼干',
    rarity: 0,
    price: 14,
    mods: { luck: 6, harvest: 3 },
    icon: { shape: 'bread', color: 0xe9c46a, color2: 0xffffff },
  },
  {
    id: 'firework_fuse',
    name: '烟花引信',
    rarity: 0,
    price: 15,
    mods: { explodeSize: 8, ranged: 1 },
    icon: { shape: 'candy', color: 0xf15bb5, color2: 0xffd166 },
  },
  // ---------- 稀有 ----------
  {
    id: 'turbo_motor',
    name: '涡轮马达',
    rarity: 1,
    price: 38,
    mods: { attackSpeed: 6, auraSize: 6, auraPct: 6, maxHp: -2 },
    icon: { shape: 'gear', color: 0x4361ee, color2: 0xffd166 },
  },
  {
    id: 'fermented_jar',
    name: '发酵酱坛',
    rarity: 1,
    price: 40,
    mods: { explodeSize: 14, lifeSteal: 2, armor: -1 },
    special: { explodeOnKill: { chance: 6, dmg: 12 } },
    icon: { shape: 'jar', color: 0x6b4226, color2: 0xffd166 },
  },
  {
    id: 'sharpening_rod',
    name: '磨刀棒',
    rarity: 1,
    price: 38,
    mods: { crit: 4, meleePct: 6, range: -10 },
    special: { critDmg: 10 },
    icon: { shape: 'blade', color: 0x8d99ae, color2: 0x343a40 },
  },
  {
    id: 'spice_rack',
    name: '调料架',
    rarity: 1,
    price: 36,
    mods: { elementalPct: 8, maxHp: -2 },
    special: { burnChance: 8 },
    icon: { shape: 'box', color: 0xbc6c25, color2: 0xe63946 },
  },
  {
    id: 'soup_thermos',
    name: '保温汤壶',
    rarity: 1,
    price: 36,
    mods: { regen: 3, armor: 1, speed: -2 },
    special: { onHurtSelf: [{ id: 'fortify', dur: 4, stacks: 1 }] },
    icon: { shape: 'cup', color: 0x2ec4b6, color2: 0xf1e3d3 },
  },
  {
    id: 'tin_foil',
    name: '锡纸',
    rarity: 1,
    price: 34,
    mods: { armor: 2, dodge: 2, attackSpeed: -3 },
    special: { thorns: 6 },
    icon: { shape: 'shield', color: 0xdee2e6, color2: 0x8d99ae },
  },
  {
    id: 'gunpowder_pouch',
    name: '火药袋',
    rarity: 1,
    price: 40,
    mods: { ranged: 2, explodeSize: 15, maxHp: -3 },
    special: { explodeOnKill: { chance: 8, dmg: 14 } },
    icon: { shape: 'bag', color: 0x495057, color2: 0xff7b00 },
  },
  {
    id: 'chili_flakes',
    name: '辣椒碎',
    rarity: 1,
    price: 36,
    mods: { elemental: 2, attackSpeed: 4, regen: -1 },
    special: { onHit: [{ id: 'burn', dur: 3, stacks: 1, chance: 15 }] },
    icon: { shape: 'seed', color: 0xd00000, color2: 0xffba08 },
  },
  {
    id: 'meat_thermometer',
    name: '肉类温度计',
    rarity: 1,
    price: 35,
    mods: { range: 25, crit: 3 },
    special: { statusDmg: 15 },
    icon: { shape: 'blade', color: 0xe63946, color2: 0xf8f9fa },
  },
  // ---------- 史诗 ----------
  {
    id: 'cast_iron_skillet',
    name: '铸铁煎锅',
    rarity: 2,
    price: 72,
    mods: { armor: 4, melee: 3, maxHp: 4, speed: -4 },
    special: { onHit: [{ id: 'stun', dur: 0.5, stacks: 1, chance: 6 }] },
    icon: { shape: 'shield', color: 0x2b2d42, color2: 0xadb5bd },
  },
  {
    id: 'sauce_fountain',
    name: '酱料喷泉',
    rarity: 2,
    price: 70,
    mods: { lifeSteal: 4, regen: 2 },
    special: { killHeal: 20 },
    icon: { shape: 'bottle', color: 0x9d0208, color2: 0xffd166 },
  },
  {
    id: 'pressure_valve',
    name: '泄压阀',
    rarity: 2,
    price: 72,
    mods: { explodeSize: 25, damage: 5, armor: -1 },
    special: { explodeOnKill: { chance: 12, dmg: 20 } },
    icon: { shape: 'gear', color: 0xb2bec3, color2: 0xe63946 },
  },
  {
    id: 'samurai_tsuba',
    name: '武士刀镡',
    rarity: 2,
    price: 74,
    mods: { crit: 8, meleePct: 10, maxHp: -3 },
    special: { critDmg: 20 },
    icon: { shape: 'ring', color: 0xb8860b, color2: 0x2b2d42 },
  },
  {
    id: 'static_apron',
    name: '静电围裙',
    rarity: 2,
    price: 70,
    mods: { elemental: 4, armor: 2 },
    special: { lightningOnHit: 6 },
    icon: { shape: 'shield', color: 0xffd60a, color2: 0x4361ee },
  },
  {
    id: 'mortar_pestle',
    name: '石臼研钵',
    rarity: 2,
    price: 68,
    mods: { rangedPct: 10, explodeSize: 15, attackSpeed: 4 },
    icon: { shape: 'bowl', color: 0x8d99ae, color2: 0x6b4226 },
  },
  {
    id: 'salt_lamp',
    name: '盐灯',
    rarity: 2,
    price: 70,
    mods: { auraPct: 12, auraSize: 10, maxHp: -3 },
    special: { aura: { radius: 130, every: 1.5, status: [{ id: 'weaken', dur: 2, stacks: 1 }] } },
    icon: { shape: 'gem', color: 0xffafcc, color2: 0xff7b00 },
  },
  // ---------- 传说 ----------
  {
    id: 'michelin_star',
    name: '米其林之星',
    rarity: 3,
    price: 125,
    mods: { damage: 10, crit: 6, harvest: 10, luck: 10 },
    special: { sameWeaponBonus: 5 },
    icon: { shape: 'star', color: 0xe63946, color2: 0xffd166 },
  },
  {
    id: 'dragon_wok',
    name: '龙纹炒锅',
    rarity: 3,
    price: 125,
    mods: { elemental: 6, explodeSize: 30, speed: -4 },
    special: { burnChance: 15, statusDmg: 20 },
    icon: { shape: 'bowl', color: 0xd00000, color2: 0xffd166 },
  },
  {
    id: 'sauce_grail',
    name: '酱之圣杯',
    rarity: 3,
    price: 120,
    mods: { lifeSteal: 8, maxHp: 10, regen: 3, damage: -5 },
    special: { onKillSelf: [{ id: 'vampiric', dur: 3, stacks: 1, chance: 25 }] },
    icon: { shape: 'cup', color: 0xffd166, color2: 0x9d0208 },
  },
  {
    id: 'arsenal_belt',
    name: '军火腰带',
    rarity: 3,
    price: 125,
    mods: { ranged: 6, rangedPct: 12, attackSpeed: 10, explodeSize: 15, melee: -4 },
    icon: { shape: 'bag', color: 0x6b4226, color2: 0xffba08 },
  },
];

// ============================================================================
// 道具组合：同时持有 item 与 needs 时额外获得 bonus（与 special）。
// 建议判定：两者各持有 ≥1 即生效，不随叠加数量倍增；同一条组合只算一次。
// special 只允许 COMBO_SPECIAL_KEYS 里的数值字段（describeCombo 能双语描述，且便于直接累加进 run.specials）。
// ============================================================================
export interface ItemCombo {
  item: string;
  needs: string;
  bonus: StatMods;
  special?: ItemSpecial;
}

export const COMBO_SPECIAL_KEYS = ['burnChance', 'critDmg', 'statusDmg', 'doubleSeed', 'thorns', 'lightningOnHit'] as const;

export const ITEM_COMBOS: ItemCombo[] = [
  { item: 'wasabi_tube', needs: 'sushi_mat', bonus: { meleePct: 6, crit: 3 } },
  { item: 'salt_pinch', needs: 'sharpening_rod', bonus: { crit: 5 }, special: { critDmg: 10 } },
  { item: 'soy_packet', needs: 'sauce_fountain', bonus: { lifeSteal: 3 } },
  { item: 'bbq_charcoal', needs: 'spice_rack', bonus: { elemental: 1 }, special: { burnChance: 10 } },
  { item: 'spring_coil', needs: 'turbo_motor', bonus: { attackSpeed: 8 } },
  { item: 'oven_mitt', needs: 'cast_iron_skillet', bonus: { armor: 3 } },
  { item: 'jam_jar', needs: 'tomato_juice', bonus: { regen: 3 } },
  { item: 'fortune_cookie', needs: 'lucky_cat', bonus: { luck: 10 }, special: { doubleSeed: 5 } },
  { item: 'firework_fuse', needs: 'gunpowder_pouch', bonus: { explodeSize: 15 } },
  { item: 'fermented_jar', needs: 'soy_packet', bonus: { lifeSteal: 2 }, special: { statusDmg: 15 } },
  { item: 'chili_flakes', needs: 'fire_pepper', bonus: { elemental: 2 }, special: { burnChance: 10 } },
  { item: 'meat_thermometer', needs: 'bbq_charcoal', bonus: { elementalPct: 5 }, special: { statusDmg: 20 } },
  { item: 'tin_foil', needs: 'cactus', bonus: { armor: 1 }, special: { thorns: 10 } },
  { item: 'soup_thermos', needs: 'iron_wok', bonus: { armor: 2, regen: 2 } },
  { item: 'pressure_valve', needs: 'pressure_cooker', bonus: { explodeSize: 20 } },
  { item: 'samurai_tsuba', needs: 'sharpener', bonus: { crit: 5, meleePct: 8 } },
  { item: 'static_apron', needs: 'tesla_coil', bonus: { elemental: 2 }, special: { lightningOnHit: 8 } },
  { item: 'mortar_pestle', needs: 'scope', bonus: { rangedPct: 10, range: 30 } },
  { item: 'salt_lamp', needs: 'turbo_motor', bonus: { auraPct: 10, auraSize: 6 } },
  { item: 'michelin_star', needs: 'chef_hat', bonus: { damage: 6, maxHp: 5 } },
  { item: 'dragon_wok', needs: 'powder_keg', bonus: { explodeSize: 25 }, special: { burnChance: 10 } },
  { item: 'sauce_grail', needs: 'vampire_cape', bonus: { lifeSteal: 5, maxHp: 10 } },
  { item: 'arsenal_belt', needs: 'railgun_core', bonus: { ranged: 3, range: 40 } },
];

// ---------------- 组合描述（中英双语，与当前语言无关） ----------------
// 属性名单独保存一份：STAT_INFO 会在切换英文时被原地改写；英文名不能从 en/misc 导入（会循环依赖）。
// 测试里校验这两张表与 STAT_INFO / EN_STATS 一致，防止漂移。
export const COMBO_STAT_ZH: Record<StatKey, string> = {
  maxHp: '最大生命',
  regen: '生命再生',
  lifeSteal: '吸血概率',
  damage: '全伤害',
  meleePct: '近战武器伤害',
  rangedPct: '远程武器伤害',
  elementalPct: '元素武器伤害',
  auraPct: '光环伤害',
  auraSize: '光环范围',
  explodeSize: '爆炸范围',
  melee: '近战伤害',
  ranged: '远程伤害',
  elemental: '元素伤害',
  attackSpeed: '攻击速度',
  crit: '暴击率',
  range: '射程',
  armor: '护甲',
  dodge: '闪避',
  speed: '移动速度',
  luck: '幸运',
  harvest: '收获',
  pickup: '拾取范围',
  xpGain: '经验获取',
  skillCd: '技能冷却缩减',
  skillDmg: '技能伤害',
  skillRange: '技能范围',
  skillDur: '技能持续',
};

export const COMBO_STAT_EN: Record<StatKey, string> = {
  maxHp: 'Max HP',
  regen: 'HP Regen',
  lifeSteal: 'Life Steal Chance',
  damage: 'All Damage',
  meleePct: 'Melee Weapon Dmg',
  rangedPct: 'Ranged Weapon Dmg',
  elementalPct: 'Elemental Weapon Dmg',
  auraPct: 'Aura Damage',
  auraSize: 'Aura Size',
  explodeSize: 'Explosion Size',
  melee: 'Melee Damage',
  ranged: 'Ranged Damage',
  elemental: 'Elemental Damage',
  attackSpeed: 'Attack Speed',
  crit: 'Crit Chance',
  range: 'Range',
  armor: 'Armor',
  dodge: 'Dodge',
  speed: 'Move Speed',
  luck: 'Luck',
  harvest: 'Harvest',
  pickup: 'Pickup Range',
  xpGain: 'XP Gain',
  skillCd: 'Skill Cooldown',
  skillDmg: 'Skill Damage',
  skillRange: 'Skill Area',
  skillDur: 'Skill Duration',
};

/** 带 % 显示的属性（与 STAT_INFO 的 pct 标记一致，测试校验） */
export const COMBO_PCT_KEYS: StatKey[] = [
  'lifeSteal',
  'damage',
  'meleePct',
  'rangedPct',
  'elementalPct',
  'auraPct',
  'auraSize',
  'explodeSize',
  'attackSpeed',
  'crit',
  'dodge',
  'speed',
  'xpGain',
  'skillCd',
  'skillDmg',
  'skillRange',
  'skillDur',
];

const fmt = (key: StatKey, v: number, names: Record<StatKey, string>): string =>
  `${v > 0 ? '+' : ''}${v}${COMBO_PCT_KEYS.includes(key) ? '%' : ''} ${names[key]}`;

/** 组合 special 的双语描述（文案与 describe.ts 的 describeSpecial 保持一致） */
function specialLines(s: ItemSpecial | undefined): [string[], string[]] {
  const out: [string, string][] = [];
  if (s?.burnChance) out.push([`命中 ${s.burnChance}% 概率灼烧`, `${s.burnChance}% chance to Burn on hit`]);
  if (s?.critDmg) out.push([`暴击伤害 +${s.critDmg}%`, `Crit Damage +${s.critDmg}%`]);
  if (s?.statusDmg) out.push([`持续伤害 +${s.statusDmg}%`, `Damage over time +${s.statusDmg}%`]);
  if (s?.doubleSeed) out.push([`${s.doubleSeed}% 概率番茄籽翻倍`, `${s.doubleSeed}% chance to double Seeds`]);
  if (s?.thorns) out.push([`受伤反弹 ${s.thorns} 伤害`, `Reflect ${s.thorns} damage when hurt`]);
  if (s?.lightningOnHit) out.push([`命中 ${s.lightningOnHit}% 概率落雷`, `${s.lightningOnHit}% chance to call lightning on hit`]);
  return [out.map((x) => x[0]), out.map((x) => x[1])];
}

/**
 * 生成组合说明 [中文, 英文]。itemName(id) 返回道具显示名（调用方按当前语言传入）。
 * 例：「芥末管」+「寿司竹帘」：+6% 近战武器伤害、+3% 暴击率
 */
export function describeCombo(c: ItemCombo, itemName: (id: string) => string): [string, string] {
  const keys = (Object.keys(c.bonus) as StatKey[]).filter((k) => c.bonus[k]);
  const [sz, se] = specialLines(c.special);
  const zh = [...keys.map((k) => fmt(k, c.bonus[k]!, COMBO_STAT_ZH)), ...sz].join('、');
  const en = [...keys.map((k) => fmt(k, c.bonus[k]!, COMBO_STAT_EN)), ...se].join(', ');
  const a = itemName(c.item),
    b = itemName(c.needs);
  return [`「${a}」+「${b}」：${zh}`, `${a} + ${b}: ${en}`];
}

// ============================================================================
// 英文覆盖
// ============================================================================
export const EXTRA_WEAPONS_EN: WeaponsEn = {
  wasabi_katana: { name: 'Wasabi Katana', desc: 'A wasabi-smeared blade: thrusts burn and crit often.' },
  kitchen_scissors: { name: 'Kitchen Shears', desc: 'Snip-snip! Fast sweeping cuts with high crit.' },
  blender_aura: { name: 'Blender', desc: 'Spinning blades around you keep slicing nearby enemies.' },
  dynamite_drumstick: {
    name: 'Dynamite Drumstick',
    desc: 'A drumstick strapped with dynamite — every swing blows up a crowd. Scales with Max HP.',
  },
  pepper_grinder: { name: 'Pepper Grinder Gun', desc: 'Fires sharp peppercorns at high speed that pierce and crit often.' },
  soy_bomb: { name: 'Soy Bomb', desc: 'Lays soy sauce bombs that explode. Hits grant extra Life Steal Chance.' },
  bbq_torch: { name: 'BBQ Torch', desc: 'Saucy flames with infinite pierce that burn. Hits grant extra Life Steal Chance.' },
  jam_mortar: { name: 'Jam Mortar', desc: 'Lobs a glob of jam that explodes and sticks enemies (30% slow).' },
  sea_urchin_mine: { name: 'Sea Urchin Mine', desc: 'Spiky urchin mines whose blasts crit easily.' },
  salt_aura: { name: 'Sea Salt Ward', desc: 'Sharp salt crystals orbit you, slicing nearby enemies with high crit.' },
  cola_zapper: {
    name: 'Cola Zapper',
    desc: 'Charged cola bubbles jump between enemies and slow them. Slightly scales with Ranged Damage.',
  },
  hotpot_breath: { name: 'Hotpot Breath', desc: 'Spews scalding chili oil that burns hard. Hits grant extra Life Steal Chance.' },
  // ---- 进化超武 ----
  iron_bastion_pan: {
    name: 'Iron Bastion Pan',
    desc: 'A heavy pan welded from a pot-lid helmet. Every smack stuns a crowd and shatters enemy shots in front of you; hurts more with Armor.',
  },
  melon_quake: {
    name: 'Melon Quake',
    desc: 'A gunpowder-stuffed melon slammed into the ground: a massive blast, cracks in the floor and two aftershocks that knock enemies down.',
  },
  storm_broccoli: {
    name: 'Storm Broccoli',
    desc: 'Fully charged broccoli: lightning jumps farther and stuns, then three small sky bolts drop and stun again.',
  },
  mustard_dragon: { name: 'Mustard Dragon', desc: 'High-pressure mustard flames with longer reach and fiercer burns.' },
  pepper_minefield: { name: 'Pepper Minefield', desc: 'Baking powder puffs up the mines: faster laying, bigger blasts, and burns.' },
  tsunami_katana: { name: 'Tsunami Katana', desc: "A sushi master's ultimate cut — far higher crit damage and burns." },
  tornado_blender: { name: 'Tornado Blender', desc: 'Turbo on full: the blades whip up a tornado that slices and slows.' },
  umami_bomb: { name: 'Umami Nuke', desc: 'Century-fermented soy bombs: huge blasts and much higher Life Steal Chance.' },
};

export const EXTRA_ITEMS_EN: ItemsEn = {
  wasabi_tube: { name: 'Wasabi Tube' },
  sushi_mat: { name: 'Sushi Mat' },
  salt_pinch: { name: 'Pinch of Sea Salt' },
  soy_packet: { name: 'Soy Sauce Packet' },
  bbq_charcoal: { name: 'BBQ Charcoal' },
  spring_coil: { name: 'Spring Coil' },
  oven_mitt: { name: 'Oven Mitt' },
  jam_jar: { name: 'Jam Jar' },
  fortune_cookie: { name: 'Fortune Cookie' },
  firework_fuse: { name: 'Firework Fuse' },
  turbo_motor: { name: 'Turbo Motor' },
  fermented_jar: { name: 'Fermentation Crock' },
  sharpening_rod: { name: 'Honing Rod' },
  spice_rack: { name: 'Spice Rack' },
  soup_thermos: { name: 'Soup Thermos' },
  tin_foil: { name: 'Tin Foil' },
  gunpowder_pouch: { name: 'Gunpowder Pouch' },
  chili_flakes: { name: 'Chili Flakes' },
  meat_thermometer: { name: 'Meat Thermometer' },
  cast_iron_skillet: { name: 'Cast-Iron Skillet' },
  sauce_fountain: { name: 'Sauce Fountain' },
  pressure_valve: { name: 'Pressure Valve' },
  samurai_tsuba: { name: 'Samurai Tsuba' },
  static_apron: { name: 'Static Apron' },
  mortar_pestle: { name: 'Mortar & Pestle' },
  salt_lamp: { name: 'Salt Lamp' },
  michelin_star: { name: 'Michelin Star' },
  dragon_wok: { name: 'Dragon Wok' },
  sauce_grail: { name: 'Sauce Grail' },
  arsenal_belt: { name: 'Arsenal Belt' },
};

// ============================================================================
// 美术接线参数（主会话按需合并）
// ============================================================================
/**
 * 新武器手持图：[基于哪把现有武器的绘制, 染色]。
 * 建议在 WeaponArt.ts 加一个不带金光/闪星的 drawTinted(ctx, base, tint)（复用 drawEvolved 的 source-atop 染色部分），
 * drawWeapon 开头：const ex = EXTRA_WEAPON_ART[id]; if (ex) return drawTinted(ctx, ex[0], ex[1]);
 * 偷懒方案：直接并入 EVOLVED_ART（会多出金色光晕与闪星，看起来像超武，不推荐）。
 */
export const EXTRA_WEAPON_ART: Record<string, [base: string, tint: number]> = {
  wasabi_katana: ['cucumber_katana', 0x7bd389],
  kitchen_scissors: ['knife', 0xff8fab],
  blender_aura: ['whisk_spin', 0x4cc9f0],
  dynamite_drumstick: ['pineapple_mace', 0xe63946],
  pepper_grinder: ['soy_pistol', 0x6b4226],
  soy_bomb: ['popcorn_machine', 0x3d2c2e],
  bbq_torch: ['mustard_flamer', 0xff7b00],
  jam_mortar: ['bean_bazooka', 0x9d0208],
  sea_urchin_mine: ['pepper_mine', 0x3c096c],
  salt_aura: ['garlic_aura', 0xf8f9fa],
  cola_zapper: ['soda', 0x6f1d1b],
  hotpot_breath: ['steam_kettle', 0xd00000],
};

/** 新超武：可直接并入 WeaponArt.ts 的 EVOLVED_ART（基底为进化前武器；新武器基底依赖上面的 EXTRA_WEAPON_ART 已接好） */
export const EXTRA_EVOLVED_ART: Record<string, [base: string, tint: number]> = {
  iron_bastion_pan: ['pan', 0x495057],
  melon_quake: ['watermelon_hammer', 0xff4b3e],
  storm_broccoli: ['broccoli_staff', 0xffd60a],
  mustard_dragon: ['mustard_flamer', 0x9ef01a],
  pepper_minefield: ['pepper_mine', 0xff7b00],
  tsunami_katana: ['wasabi_katana', 0x00b4d8],
  tornado_blender: ['blender_aura', 0xb5179e],
  umami_bomb: ['soy_bomb', 0xffb703],
};

/** 新光环武器外观：并入 AuraFx.ts 的 AURA_LOOK（超武未列出时会按 evolvedFrom 回落到原武器） */
export const EXTRA_AURA_LOOK: Record<string, { color: number; style: AuraStyle }> = {
  blender_aura: { color: 0xdee2e6, style: 'blender' },
  salt_aura: { color: 0xe0fbfc, style: 'salt' },
  tornado_blender: { color: 0xc77dff, style: 'tornado' },
};
