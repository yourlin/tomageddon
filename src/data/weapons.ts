// 武器数据。每把武器 4 个品质（T1~T4），两把同名同品质可在商店合成升一级。
export type WeaponClass = 'melee' | 'ranged' | 'elemental';
export type WeaponKind =
  | 'thrust' // 近战直刺：沿直线伸出
  | 'sweep' // 近战横扫：扇形范围
  | 'bullet' // 子弹
  | 'rocket' // 爆炸弹
  | 'flame' // 喷火粒子（短射程、无限穿透）
  | 'aura' // 常驻光环
  | 'mine' // 地雷
  | 'boomerang' // 回旋镖
  | 'chain'; // 连锁闪电

export interface WeaponEffect {
  burn?: { dps: number; dur: number };
  slow?: { pct: number; dur: number };
  stun?: number;
  explode?: number; // 爆炸半径
  chain?: number[]; // 各品质连锁次数
  lifeSteal?: number; // 额外吸血 %
}

export interface WeaponDef {
  id: string;
  name: string;
  desc: string;
  cls: WeaponClass;
  kind: WeaponKind;
  tags: string[];
  damage: number[]; // T1..T4 基础伤害
  cooldown: number[]; // T1..T4 冷却（秒）
  range: number; // 基础射程
  scaling: Partial<Record<'melee' | 'ranged' | 'elemental' | 'maxHp' | 'armor' | 'speed', number>>;
  critMult: number;
  critBonus?: number; // 额外暴击率
  knockback?: number;
  projSpeed?: number;
  pierce?: number[]; // T1..T4 穿透
  bounce?: number[]; // T1..T4 弹射
  count?: number[]; // T1..T4 弹丸数量
  spread?: number; // 散射角（度）
  effect?: WeaponEffect;
  price: number; // T1 基础价格，T2/T3/T4 = x2 / x4 / x8
  minTier?: number; // 商店最低出现品质（0 起）
}

export const TIER_PRICE_MULT = [1, 2, 4, 8];
export const TIER_NAMES = ['I', 'II', 'III', 'IV'];

export const WEAPONS: WeaponDef[] = [
  {
    id: 'fork',
    name: '番茄叉',
    desc: '朴实的三齿叉，向前直刺。',
    cls: 'melee',
    kind: 'thrust',
    tags: ['厨具'],
    damage: [8, 14, 22, 34],
    cooldown: [0.9, 0.85, 0.78, 0.7],
    range: 150,
    scaling: { melee: 1 },
    critMult: 2,
    knockback: 10,
    price: 15,
  },
  {
    id: 'rolling_pin',
    name: '擀面杖',
    desc: '横扫一片，击退敌人。',
    cls: 'melee',
    kind: 'sweep',
    tags: ['厨具'],
    damage: [12, 20, 32, 48],
    cooldown: [1.25, 1.18, 1.1, 1.0],
    range: 130,
    scaling: { melee: 1 },
    critMult: 1.5,
    knockback: 30,
    price: 18,
  },
  {
    id: 'knife',
    name: '菜刀',
    desc: '快速直刺，高暴击。',
    cls: 'melee',
    kind: 'thrust',
    tags: ['厨具', '锋利'],
    damage: [6, 10, 16, 25],
    cooldown: [0.6, 0.55, 0.5, 0.44],
    range: 130,
    scaling: { melee: 0.8 },
    critMult: 2.5,
    critBonus: 15,
    price: 20,
  },
  {
    id: 'pan',
    name: '平底锅',
    desc: '沉重横扫，眩晕敌人 0.4 秒。伤害受护甲加成。',
    cls: 'melee',
    kind: 'sweep',
    tags: ['厨具'],
    damage: [18, 30, 46, 70],
    cooldown: [1.6, 1.5, 1.4, 1.3],
    range: 120,
    scaling: { melee: 1.2, armor: 1 },
    critMult: 1.5,
    knockback: 20,
    effect: { stun: 0.4 },
    price: 25,
  },
  {
    id: 'watermelon_hammer',
    name: '西瓜锤',
    desc: '砸地产生爆炸，范围巨大。',
    cls: 'melee',
    kind: 'sweep',
    tags: ['蔬果'],
    damage: [30, 50, 80, 120],
    cooldown: [2.2, 2.1, 2.0, 1.8],
    range: 140,
    scaling: { melee: 1.5, maxHp: 0.1 },
    critMult: 1.5,
    knockback: 40,
    effect: { explode: 80 },
    price: 35,
  },
  {
    id: 'slingshot',
    name: '番茄弹弓',
    desc: '弹出番茄，命中后弹射到下一个敌人。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['蔬果'],
    damage: [8, 13, 20, 30],
    cooldown: [0.95, 0.9, 0.83, 0.75],
    range: 380,
    scaling: { ranged: 0.9 },
    critMult: 1.5,
    projSpeed: 620,
    bounce: [1, 1, 2, 3],
    price: 15,
  },
  {
    id: 'pea_shooter',
    name: '豌豆枪',
    desc: '高射速豌豆连发。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['枪械', '蔬果'],
    damage: [4, 6, 9, 13],
    cooldown: [0.32, 0.29, 0.26, 0.22],
    range: 400,
    scaling: { ranged: 0.6 },
    critMult: 1.5,
    projSpeed: 800,
    spread: 8,
    price: 22,
  },
  {
    id: 'chili_rocket',
    name: '辣椒火箭',
    desc: '命中爆炸并灼烧敌人。',
    cls: 'ranged',
    kind: 'rocket',
    tags: ['枪械', '元素'],
    damage: [14, 24, 38, 58],
    cooldown: [1.8, 1.7, 1.6, 1.4],
    range: 450,
    scaling: { ranged: 1, elemental: 0.5 },
    critMult: 1.5,
    projSpeed: 480,
    effect: { explode: 70, burn: { dps: 3, dur: 2 } },
    price: 30,
  },
  {
    id: 'corn_cannon',
    name: '玉米加农',
    desc: '玉米粒炮弹，穿透多个敌人。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['枪械'],
    damage: [16, 28, 44, 68],
    cooldown: [1.1, 1.0, 0.92, 0.84],
    range: 520,
    scaling: { ranged: 1.2 },
    critMult: 2,
    projSpeed: 900,
    pierce: [3, 4, 5, 6],
    knockback: 15,
    price: 28,
  },
  {
    id: 'ketchup',
    name: '番茄酱瓶',
    desc: '扇形喷射番茄酱，命中额外吸血。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['酱料'],
    damage: [5, 8, 12, 17],
    cooldown: [0.75, 0.7, 0.65, 0.6],
    range: 280,
    scaling: { ranged: 0.6 },
    critMult: 1.5,
    projSpeed: 560,
    count: [3, 3, 4, 5],
    spread: 30,
    effect: { lifeSteal: 5 },
    price: 20,
  },
  {
    id: 'mustard_flamer',
    name: '芥末喷枪',
    desc: '短距离喷射火焰，无限穿透并灼烧。',
    cls: 'elemental',
    kind: 'flame',
    tags: ['酱料', '元素'],
    damage: [2, 3, 5, 8],
    cooldown: [0.2, 0.18, 0.16, 0.14],
    range: 200,
    scaling: { elemental: 0.25 },
    critMult: 1.5,
    projSpeed: 420,
    effect: { burn: { dps: 2, dur: 2 } },
    spread: 20,
    price: 28,
  },
  {
    id: 'soda',
    name: '冰镇汽水',
    desc: '冰冷的气泡穿透敌人并减速 40%。',
    cls: 'elemental',
    kind: 'bullet',
    tags: ['元素'],
    damage: [9, 15, 22, 32],
    cooldown: [0.75, 0.7, 0.65, 0.58],
    range: 400,
    scaling: { elemental: 0.9 },
    critMult: 1.5,
    projSpeed: 600,
    pierce: [1, 1, 2, 2],
    effect: { slow: { pct: 40, dur: 1.5 } },
    price: 22,
  },
  {
    id: 'garlic_aura',
    name: '大蒜光环',
    desc: '持续伤害周围敌人（每 0.5 秒）。',
    cls: 'elemental',
    kind: 'aura',
    tags: ['蔬果', '元素'],
    damage: [4, 6, 9, 13],
    cooldown: [0.5, 0.5, 0.5, 0.5],
    range: 110,
    scaling: { elemental: 0.5 },
    critMult: 1.5,
    price: 30,
  },
  {
    id: 'pepper_mine',
    name: '胡椒雷',
    desc: '在身边布雷，敌人踩中后爆炸。',
    cls: 'elemental',
    kind: 'mine',
    tags: ['元素'],
    damage: [20, 34, 52, 80],
    cooldown: [2.5, 2.3, 2.1, 1.8],
    range: 200,
    scaling: { elemental: 1 },
    critMult: 1.5,
    effect: { explode: 90 },
    price: 25,
  },
  {
    id: 'onion_boomerang',
    name: '洋葱回旋镖',
    desc: '飞出后返回，沿途无限穿透。',
    cls: 'ranged',
    kind: 'boomerang',
    tags: ['蔬果'],
    damage: [10, 17, 26, 40],
    cooldown: [1.4, 1.3, 1.2, 1.1],
    range: 360,
    scaling: { ranged: 0.9 },
    critMult: 1.5,
    projSpeed: 560,
    price: 24,
  },
  {
    id: 'broccoli_staff',
    name: '西兰花法杖',
    desc: '释放连锁闪电，在敌人间跳跃。',
    cls: 'elemental',
    kind: 'chain',
    tags: ['蔬果', '元素'],
    damage: [10, 17, 26, 40],
    cooldown: [1.1, 1.0, 0.92, 0.84],
    range: 420,
    scaling: { elemental: 1 },
    critMult: 1.5,
    effect: { chain: [2, 3, 4, 6] },
    price: 30,
  },
  {
    id: 'sauce_gatling',
    name: '酱料加特林',
    desc: '疯狂扫射的酱料机枪。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['枪械', '酱料'],
    damage: [4, 6, 8, 11],
    cooldown: [0.16, 0.14, 0.12, 0.1],
    range: 420,
    scaling: { ranged: 0.4 },
    critMult: 1.5,
    projSpeed: 850,
    spread: 14,
    effect: { lifeSteal: 1 },
    price: 40,
    minTier: 1,
  },
  {
    id: 'cleaver',
    name: '剁骨刀',
    desc: '大力横扫，击杀敌人时 20% 概率额外掉落番茄籽。',
    cls: 'melee',
    kind: 'sweep',
    tags: ['厨具', '锋利'],
    damage: [13, 22, 35, 54],
    cooldown: [1.1, 1.05, 1.0, 0.9],
    range: 125,
    scaling: { melee: 1.0 },
    critMult: 2,
    critBonus: 5,
    knockback: 15,
    price: 26,
  },
];

export const WEAPON_MAP: Record<string, WeaponDef> = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

/** 武器套装：持有 N 把带某标签的武器时获得加成 */
export const WEAPON_SETS: Record<string, { name: string; bonus: Record<number, Partial<Record<string, number>>> }> = {
  厨具: { name: '厨具', bonus: { 2: { melee: 1 }, 3: { melee: 2, armor: 1 }, 4: { melee: 3, armor: 2 }, 6: { melee: 5, armor: 3 } } },
  锋利: { name: '锋利', bonus: { 2: { crit: 5 }, 3: { crit: 10 }, 4: { crit: 15 } } },
  蔬果: {
    name: '蔬果',
    bonus: { 2: { regen: 1 }, 3: { regen: 2, harvest: 5 }, 4: { regen: 3, harvest: 10 }, 6: { regen: 5, harvest: 20 } },
  },
  枪械: {
    name: '枪械',
    bonus: { 2: { range: 20 }, 3: { range: 40 }, 4: { range: 60, attackSpeed: 5 }, 6: { range: 80, attackSpeed: 10 } },
  },
  酱料: { name: '酱料', bonus: { 2: { lifeSteal: 2 }, 3: { lifeSteal: 4 }, 4: { lifeSteal: 6 }, 6: { lifeSteal: 10 } } },
  元素: { name: '元素', bonus: { 2: { elemental: 1 }, 3: { elemental: 2 }, 4: { elemental: 3, luck: 5 }, 6: { elemental: 5, luck: 10 } } },
};
