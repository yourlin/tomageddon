// 全局数值公式。所有可调参数集中在这里，方便平衡。
//
// 【成长曲线设计规范】（反推自同类游戏 Brotato 的合理数值，详见仓库根 Brotato成长公式反推.md）
// 本文件遵循以下原则，避免散落的 magic number 与断裂/非单调曲线：
//   ① 章节难度倍率必须「单调递增」，由 chapterMult() 以几何级数参数化派生，而非手填。
//   ② 敌人血量与伤害使用「同族」的次线性成长公式 growthCurve()，便于统一调参。
//   ③ 精英 / Boss 的随波次缩放集中在 eliteScale() / bossScale()，不再散落于场景代码。
//   ④ 经济校准（seedValue 的 calib）用平滑函数 incomeCalib()，取代硬编码分段魔数。
import type { Stats } from './stats';
import { dangerLevels } from './danger';

export const BALANCE = {
  arena: { width: 1920, height: 1200, margin: 40 },
  /** dodgeCap：闪避上限 %。
   *  吸血不设百分比上限（参考土豆兄弟），改为「每次吸血后 lifeStealTickCd 秒内不能再吸」，
   *  即每秒最多回复 1 / lifeStealTickCd 点生命（0.2 秒 → 5 点/秒；土豆兄弟为 0.1 秒 → 10 点/秒，
   *  这里按本作较低的生命基数减半）。 */
  player: { baseSpeed: 230, radius: 22, iframes: 0.5, dodgeCap: 60, lifeStealTickCd: 0.2, maxWeapons: 6 },
  /** 生命再生（参考土豆兄弟）：第 1 点 first 生命/秒，之后每点 perPoint 生命/秒；≤0 时不回复 */
  regen: { first: 0.2, perPoint: 0.089 },
  waves: { count: 15, eliteWaves: [5, 10], bossWave: 15 },
  /** 无尽模式：第 15 波之后每波生命 ×hp、伤害 ×dmg（复利），保证终会结束。
   *  B3：分段式——从第 from 波之后起改用该段的每波倍率，避免高波数时数值爆炸（曲线连续） */
  endless: {
    hp: 1.12,
    dmg: 1.09,
    segments: [
      { from: 30, hp: 1.08, dmg: 1.06 },
      { from: 45, hp: 1.05, dmg: 1.04 },
    ],
  },
  pickup: { baseRadius: 110, magnetSpeed: 700 },
  maxEnemies: 260,
  harvestGrowth: 0.05,
  /** 番茄籽收入曲线：base × (1 + linear·w + quad·w²)，calib 为实测拾取率校准 */
  income: { base: 34, linear: 0.5, quad: 0.035, calib: 0.75 },
  /** 商店 T4 武器概率：rate × (波次 − fromWave)^1.6，再乘幸运与章节 t4Mult */
  t4: { rate: 0.003, fromWave: 7 },
  /** 传说道具出现率（商店 / 宝箱）：参考土豆兄弟按 15 波进度换算——
   *  土豆兄弟 20 波，第 8 波起每波 +0.23%、上限 8%；本作第 6 波起每波 +0.3%、上限 8%。 */
  legendItem: { fromWave: 6, perWave: 0.003, cap: 0.08 },
  /** 升级属性选项的传说（IV 级）出现率：保持原曲线，不随道具一起削弱 */
  legendUpgrade: { fromWave: 6, perWave: 0.008, cap: 0.15 },
  /** 暴击伤害总加成上限 %（武器词条 + 道具 / 角色 / 天赋，合并成一个加法池） */
  critDmgCap: 150,
  /** 命中落雷概率总上限 % */
  lightningCap: 50,
  seedMult: 0.5, // 第 6 波起小怪番茄籽的经验倍率（货币掉落另按血量成长放大，见 Enemy.lootMult）
  cratesPerWave: 3, // 每波最多掉落宝箱（精英/Boss 不计）
  rerollBase: 2,
  shopSlots: 4,
  levelUpChoices: 4,
  treeChance: 0.0,
  /** 章节数：用于把章节倍率参数化为几何级数 */
  chapterCount: 5,
  /** 章节难度几何级数的「终点倍率」（第 1 章恒为 1，第 N 章达到该值）。
   *  由 chapterMult() 派生出每章单调递增的倍率，杜绝手填导致的曲线断裂。 */
  chapterCurve: { hpEnd: 3.4, dmgEnd: 1.7, bossHpEnd: 2.4, speedStep: 0.05 },
  /** 敌人成长曲线指数：血量与伤害共用同族公式 base·(1+growth·w^exp)。
   *  exp<1 为次线性（先快后慢），与玩家后期成长放缓相匹配。 */
  enemyGrowthExp: 0.9,
  /** 伤害相对血量的额外系数（伤害曲线整体乘此值，用于微调手感而不破坏同族形态） */
  enemyDmgScale: 1.15,
  /** 精英 / Boss 随波次的缩放参数（取代原先散落在 GameScene 的 magic number） */
  elite: { base: 0.8, perWave: 0.12, dmgBase: 1.0, dmgPerWave: 0.08 },
  boss: { hpMult: 3, dmgMult: 1.2 },
};

/** 波次时长（秒）：20, 25, 30 ... 最多 60；Boss 波 90 秒 */
/** 每 15 波一轮：第 5 / 10 波精英，第 15 波 Boss（无尽模式循环） */
export const isBossWaveNo = (wave: number): boolean => wave % BALANCE.waves.bossWave === 0;
export const isEliteWaveNo = (wave: number): boolean => BALANCE.waves.eliteWaves.includes(((wave - 1) % BALANCE.waves.bossWave) + 1);
/** 无尽模式超过第 15 波后的复利倍率 */
function endlessMult(wave: number, key: 'hp' | 'dmg'): number {
  const E = BALANCE.endless;
  const segs = [{ from: BALANCE.waves.count, hp: E.hp, dmg: E.dmg }, ...E.segments];
  let m = 1;
  segs.forEach((sg, i) => {
    const end = i + 1 < segs.length ? segs[i + 1].from : Infinity;
    const n = Math.max(0, Math.min(wave, end) - sg.from);
    m *= Math.pow(sg[key], n);
  });
  return m;
}
export const endlessHp = (wave: number): number => endlessMult(wave, 'hp');
export const endlessDmg = (wave: number): number => endlessMult(wave, 'dmg');

export function waveDuration(wave: number): number {
  if (isBossWaveNo(wave)) return 90;
  return Math.min(20 + (wave - 1) * 5, 60);
}

/** 升级所需经验：(lv + 3)^2 */
export function xpToNext(level: number): number {
  return (level + 3) * (level + 3);
}

/** 护甲减伤倍率 */
/** 生命再生速度（生命/秒），参考土豆兄弟：0.20 + (regen − 1) × 0.089。
 *  第 1 点价值最高，之后边际递减，避免堆再生无脑回满；regen ≤ 0 视为 0。 */
export function regenPerSecond(regen: number): number {
  if (regen <= 0) return 0;
  return BALANCE.regen.first + (regen - 1) * BALANCE.regen.perPoint;
}

/** 爆炸半径乘数（参考土豆兄弟的 Explosion Size）：1 + 爆炸范围% / 100，负值最低到 0.5 */
export function explodeSizeMultiplier(explodeSize: number): number {
  return Math.max(0.5, 1 + explodeSize / 100);
}

/** 吸血每秒最多回复的生命（由触发冷却推出，用于显示与文档） */
export const lifeStealMaxPerSecond = (): number => Math.round(1 / BALANCE.player.lifeStealTickCd);

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

/** 参数化章节难度倍率（几何级数，保证「单调递增」）。
 *  第 1 章恒为 1，第 chapterCount 章达到 end；中间按 end^((ch-1)/(N-1)) 平滑插值。
 *  —— 修正点：取代 chapters.ts 中手填且非单调的 hpMult/dmgMult/bossHpMult（原为 2.9→3.1→2.7→3.4 等断裂曲线）。 */
export function chapterMult(chapterId: number, end: number): number {
  const n = BALANCE.chapterCount;
  // 1.4.0：第 6 / 7 章（t > 1）沿同一公比外推，第 1–5 章数值不变
  const t = Math.max(0, (chapterId - 1) / (n - 1));
  return Math.round(Math.pow(end, t) * 100) / 100;
}

/** 便捷取各类章节倍率（供 chapters.ts 派生，而非手填） */
export const chapterHpMult = (ch: number): number => chapterMult(ch, BALANCE.chapterCurve.hpEnd);
export const chapterDmgMult = (ch: number): number => chapterMult(ch, BALANCE.chapterCurve.dmgEnd);
export const chapterBossHpMult = (ch: number): number => chapterMult(ch, BALANCE.chapterCurve.bossHpEnd);
/** 速度倍率：等差递增（每章 +speedStep），本就单调合理，保留等差形态 */
export const chapterSpeedMult = (ch: number): number => Math.round((1 + BALANCE.chapterCurve.speedStep * (ch - 1)) * 100) / 100;

/** 统一的敌人成长曲线：base·(1 + growth·w^exp)，w = wave-1。
 *  血量与伤害共用此同族形态，便于一处调参即可同步改变两条曲线。 */
export function growthCurve(base: number, growth: number, wave: number): number {
  const w = wave - 1;
  return base * (1 + growth * Math.pow(w, BALANCE.enemyGrowthExp));
}

/** 敌人血量：同族次线性成长 × 章节倍率 × 无尽复利 */
export function enemyHp(base: number, growth: number, wave: number, chapterMult: number): number {
  return Math.round(growthCurve(base, growth, wave) * chapterScale(chapterMult, wave) * endlessHp(wave));
}

/** 敌人伤害：与血量同族的成长曲线（仅整体乘 enemyDmgScale 微调手感）× 章节倍率 × 无尽复利。
 *  —— 修正点：原伤害用二次式 (0.5w+0.035w²)，与血量的 w^0.9 形态不一致、后期伤害相对血量暴涨；现统一为同族。 */
export function enemyDamage(base: number, growth: number, wave: number, chapterMult: number): number {
  return Math.max(
    1,
    Math.round(growthCurve(base, growth, wave) * BALANCE.enemyDmgScale * chapterScale(chapterMult, wave) * endlessDmg(wave)),
  );
}

/** 精英随波次的血量 / 伤害缩放系数（取代 GameScene 中散落的 0.8+(wave-5)·0.12 等 magic number） */
export function eliteHpScale(wave: number): number {
  return Math.max(BALANCE.elite.base, BALANCE.elite.base + (wave - 5) * BALANCE.elite.perWave);
}
export function eliteDmgScale(wave: number): number {
  return Math.max(BALANCE.elite.dmgBase, BALANCE.elite.dmgBase + (wave - 5) * BALANCE.elite.dmgPerWave);
}
/** Boss（非精英）固定缩放系数，集中管理，便于统一调参 */
export const bossHpScale = (): number => BALANCE.boss.hpMult;
export const bossDmgScale = (): number => BALANCE.boss.dmgMult;

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

/** 每波期望刷怪数（按刷怪节奏估算，用于把番茄籽收入归一到目标曲线） */
export function expectedSpawns(wave: number): number {
  return (waveDuration(wave) / spawnInterval(wave)) * spawnBatch(wave);
}

/** 每波番茄籽收入目标（第 1 章基准；章节再乘 lootMult）：第 1 波约 30，第 14 波约 330 */
export function incomeTarget(wave: number): number {
  const w = wave - 1;
  return BALANCE.income.base * (1 + BALANCE.income.linear * w + BALANCE.income.quad * w * w);
}

/** 经济校准系数：平滑地从早期的放大（怪死得晚、籽来不及捡→留到下波翻倍）过渡到后期的压低
 *  （分裂 / 召唤 / 精英使实际击杀多于估算）。
 *  —— 修正点：原为硬编码分段 {wave1:2.5, wave2:1, 其余:0.75}，调节刷怪节奏即失准；
 *     现用指数衰减平滑收敛到 BALANCE.income.calib，形态连续、可解释。 */
export function incomeCalib(wave: number): number {
  const floor = BALANCE.income.calib; // 稳态校准（后期趋近值）
  const peak = 2.5; // 第 1 波的放大峰值
  // 指数衰减：wave=1 → peak，随波次平滑衰减到 floor
  return floor + (peak - floor) * Math.exp(-0.9 * (wave - 1));
}

/** 单只小怪（seeds = 1）的番茄籽价值：收入目标 ÷ 期望刷怪数 × 平滑校准 */
export function seedValue(wave: number): number {
  const w = Math.min(wave, 14);
  // 无尽模式：收入跟着商店涨价走
  const endless = wave > 14 ? priceInflation(wave) / priceInflation(14) : 1;
  return (incomeTarget(w) / expectedSpawns(w)) * incomeCalib(wave) * endless;
}

/** 商店武器品质权重 [T1, T2, T3, T4]：受波次、幸运与章节 T4 系数影响 */
export function weaponTierWeights(wave: number, luck: number, t4Mult = 1): number[] {
  const l = 1 + Math.max(-0.9, luck / 100);
  const t2 = Math.min(0.5, 0.07 * (wave - 1) * l);
  const t3 = Math.min(0.2, Math.max(0, 0.02 * (wave - 5)) * l);
  const t4 = Math.min(0.25, BALANCE.t4.rate * Math.max(0, wave - BALANCE.t4.fromWave) ** 1.6 * l * t4Mult); // 前期稀有、后期陡增
  return [Math.max(0, 1 - t2 - t3 - t4), t2, t3, t4];
}

export function pickWeaponTier(wave: number, luck: number, t4Mult = 1, rnd: () => number = Math.random): number {
  const w = weaponTierWeights(wave, luck, t4Mult);
  let r = rnd();
  for (let i = 3; i >= 1; i--) {
    if (r < w[i]) return i;
    r -= w[i];
  }
  return 0;
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
  const chapterMult = 1 + 0.3 * (chapterId - 1);
  return Math.round((BALANCE.rerollBase + 3 + wave * 2 + rerolls * (2 + wave * 0.8)) * chapterMult);
}

/** 出售价格 = 25% 购买价 */
export function sellPrice(price: number): number {
  return Math.max(1, Math.floor(price * 0.25));
}

/** 稀有度概率（受波次与幸运影响）。返回 [普通, 稀有, 史诗, 传说] */
/** 传说稀有度曲线：min(cap, perWave × (波次 − fromWave)) × (1 + 幸运%) */
export interface LegendCurve {
  fromWave: number;
  perWave: number;
  cap: number;
}

export function rarityWeights(wave: number, luck: number, legendCurve: LegendCurve = BALANCE.legendItem): number[] {
  const l = 1 + Math.max(-0.9, luck / 100);
  const rareRaw = Math.min(0.6, 0.06 * (wave - 1) * l);
  const epic = Math.min(0.35, Math.max(0, 0.023 * (wave - 2)) * l);
  const legend = Math.min(legendCurve.cap, Math.max(0, legendCurve.perWave * (wave - legendCurve.fromWave)) * l);
  // 高稀有度优先保留，稀有仅占据剩余空间；与 pickRarity() 从高到低抽取的实际分布一致。
  const rare = Math.min(rareRaw, Math.max(0, 1 - epic - legend));
  const common = Math.max(0, 1 - rare - epic - legend);
  return [common, rare, epic, legend];
}

/** 抽取稀有度。默认用道具曲线（商店 / 宝箱）；升级属性选项传入 BALANCE.legendUpgrade */
export function pickRarity(wave: number, luck: number, rnd: () => number = Math.random, legendCurve?: LegendCurve): number {
  const w = rarityWeights(wave, luck, legendCurve);
  let r = rnd();
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
  return Math.min(0.04, 0.007 * (1 + luck / 100));
}

/** 宝箱掉落概率（精英必掉） */
export function crateDropChance(luck: number): number {
  return Math.min(0.02, 0.004 * (1 + Math.max(0, luck) / 100));
}

// ---------------- 番茄危机（A8） ----------------
/** 危机等级的整体倍率曲线：敌人生命 / 伤害按危机规则累加（与 data/danger.ts 一致），
 *  奖励倍率 reward 为平滑的二次曲线：0 级 1.0，10 级约 2.6，20 级约 4.8。 */
export function dangerReward(level: number): number {
  const l = Math.max(0, level);
  return Math.round((1 + 0.12 * l + 0.0035 * l * l) * 100) / 100;
}

/** 危机等级 level 下敌人的生命 / 伤害总倍率与奖励倍率 */
export function dangerMult(level: number): { hp: number; dmg: number; reward: number } {
  let hp = 0;
  let dmg = 0;
  for (const l of dangerLevels(level)) {
    hp += l.rule.enemyHp ?? 0;
    dmg += l.rule.enemyDmg ?? 0;
  }
  return { hp: 1 + hp / 100, dmg: 1 + dmg / 100, reward: dangerReward(level) };
}

/** 金番茄（I2）：危机 ≥1 或无尽 15 波以后才产出；按到达波次 × 奖励倍率 */
export function goldReward(wave: number, level: number, endless: boolean, win: boolean): number {
  let g = 0;
  if (level > 0) g += Math.floor((Math.min(wave, 15) / 3) * dangerReward(level)) + (win ? Math.round(5 * dangerReward(level)) : 0);
  if (endless && wave > 15) g += Math.floor((wave - 15) / 2) * (1 + level * 0.1);
  return Math.round(g);
}
