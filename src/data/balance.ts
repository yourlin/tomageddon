// 全局数值公式。所有可调参数集中在这里，方便平衡。
import type { Stats } from './stats';

export const BALANCE = {
  arena: { width: 1920, height: 1200, margin: 40 },
  player: { baseSpeed: 230, radius: 22, iframes: 0.5, dodgeCap: 60, maxWeapons: 6 },
  waves: { count: 15, eliteWaves: [5, 10], bossWave: 15 },
  pickup: { baseRadius: 110, magnetSpeed: 700 },
  maxEnemies: 260,
  harvestGrowth: 0.05,
  seedMult: 0.5, // 第 6 波起小怪番茄籽的经验倍率（货币掉落另按血量成长放大，见 Enemy.lootMult）
  cratesPerWave: 3, // 每波最多掉落宝箱（精英/Boss 不计）
  rerollBase: 2,
  shopSlots: 4,
  levelUpChoices: 4,
  treeChance: 0.0,
};

/** 波次时长（秒）：20, 25, 30 ... 最多 60；Boss 波 90 秒 */
export function waveDuration(wave: number): number {
  if (wave === BALANCE.waves.bossWave) return 90;
  return Math.min(20 + (wave - 1) * 5, 60);
}

/** 升级所需经验：(lv + 3)^2 */
export function xpToNext(level: number): number {
  return (level + 3) * (level + 3);
}

/** 护甲减伤倍率 */
export function armorMultiplier(armor: number): number {
  return armor >= 0 ? 15 / (15 + armor) : (15 - armor) / 15;
}

/** 攻速换算为冷却倍率 */
export function attackSpeedMultiplier(as: number): number {
  return as >= 0 ? 1 / (1 + as / 100) : 1 + -as / 100;
}

export function moveSpeed(stats: Stats): number {
  return BALANCE.player.baseSpeed * Math.max(0.3, 1 + stats.speed / 100);
}

/** 章节倍率随波次渐进：第 1 波只生效 10%，第 15 波完全生效（每章都从 0 级开始） */
export function chapterScale(mult: number, wave: number): number {
  const k = 0.1 + 0.9 * Math.min(1, (wave - 1) / (BALANCE.waves.count - 1));
  return 1 + (mult - 1) * k;
}

/** 敌人血量：随波次次线性增长（w^0.9，先快后慢），与玩家越往后越慢的成长相匹配；章节难度由章节倍率体现 */
export function enemyHp(base: number, growth: number, wave: number, chapterMult: number): number {
  const w = wave - 1;
  return Math.round(base * (1 + growth * Math.pow(w, 0.9)) * chapterScale(chapterMult, wave));
}

export function enemyDamage(base: number, growth: number, wave: number, chapterMult: number): number {
  const w = wave - 1;
  return Math.max(1, Math.round((base + growth * (0.5 * w + 0.035 * w * w)) * 1.15 * chapterScale(chapterMult, wave)));
}

/** 刷怪节奏：每波的刷新间隔（秒）与每批数量 */
export function spawnInterval(wave: number): number {
  if (wave <= 2) return 2.4;
  return Math.max(1.0, 2.1 - wave * 0.075);
}

export function spawnBatch(wave: number): number {
  if (wave <= 2) return 2; // 前两波：少量小怪，熟悉操作
  if (wave === 3) return 3;
  return 3 + Math.floor(wave * 0.4);
}

/** 商店价格：随波次上涨 */
/** 商店涨价倍率（番茄籽掉落也参考它，保证后期买得起） */
export function priceInflation(wave: number): number {
  return 1 + 0.2 * (wave - 1);
}
export function shopPrice(base: number, wave: number): number {
  return Math.max(1, Math.round(base * priceInflation(wave) + wave * 0.5));
}

/** 刷新价格：随波次、本波已刷新次数与章节上涨，避免后期靠反复刷新轻易凑齐高级武器 */
export function rerollPrice(wave: number, rerolls: number, chapterId = 1): number {
  const chapterMult = 1 + 0.25 * (chapterId - 1);
  return Math.round((BALANCE.rerollBase + 1 + wave * 1.2 + rerolls * (1 + wave * 0.6)) * chapterMult);
}

/** 出售价格 = 25% 购买价 */
export function sellPrice(price: number): number {
  return Math.max(1, Math.floor(price * 0.25));
}

/** 稀有度概率（受波次与幸运影响）。返回 [普通, 稀有, 史诗, 传说] */
export function rarityWeights(wave: number, luck: number): number[] {
  const l = 1 + Math.max(-0.9, luck / 100);
  const rare = Math.min(0.6, 0.06 * (wave - 1) * l);
  const epic = Math.min(0.35, Math.max(0, 0.023 * (wave - 2)) * l);
  const legend = Math.min(0.15, Math.max(0, 0.008 * (wave - 6)) * l);
  const common = Math.max(0, 1 - rare - epic - legend);
  return [common, rare, epic, legend];
}

export function pickRarity(wave: number, luck: number): number {
  const w = rarityWeights(wave, luck);
  let r = Math.random();
  for (let i = 3; i >= 1; i--) {
    if (r < w[i]) return i;
    r -= w[i];
  }
  return 0;
}

export const RARITY = [
  { name: '普通', color: 0xdfe6e9, css: '#dfe6e9' },
  { name: '稀有', color: 0x4aa3ff, css: '#4aa3ff' },
  { name: '史诗', color: 0xb46bff, css: '#b46bff' },
  { name: '传说', color: 0xff5a4f, css: '#ff5a4f' },
];

/** 每波结束时击杀敌人掉落果实（回血）的概率 */
export function fruitDropChance(luck: number): number {
  return Math.min(0.12, 0.02 * (1 + luck / 100));
}

/** 宝箱掉落概率（精英必掉） */
export function crateDropChance(luck: number): number {
  return Math.min(0.02, 0.004 * (1 + Math.max(0, luck) / 100));
}
