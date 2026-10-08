// 全局数值公式。所有可调参数集中在这里，方便平衡。
//
// 【成长曲线设计规范】（反推自同类游戏 Brotato 的合理数值，详见仓库根 Brotato成长公式反推.md）
// 本文件遵循以下原则，避免散落的 magic number 与断裂/非单调曲线：
//   ① 章节难度倍率必须「单调递增」，由 chapterMult() 以几何级数参数化派生，而非手填。
//   ② 敌人血量与伤害使用「同族」的次线性成长公式 growthCurve()，但指数分开：伤害比血量涨得慢。
//   ③ 精英 / Boss 的随波次缩放集中在 eliteScale() / bossScale()，不再散落于场景代码。
//   ④ 经济校准（seedValue 的 calib）用平滑函数 incomeCalib()，取代硬编码分段魔数。
import type { Stats } from './stats';
import { dangerLevels } from './danger';

export const BALANCE = {
  arena: { width: 1920, height: 1200, margin: 40 },
  /** dodgeCap：闪避上限 %。
   *  吸血不设百分比上限（参考土豆兄弟），改为「每次吸血后 lifeStealTickCd 秒内不能再吸」，
   *  即每秒最多触发 1 / lifeStealTickCd 次（0.2 秒 → 5 次/秒；土豆兄弟为 0.1 秒 → 10 次/秒，
   *  这里按本作较低的生命基数减半）。 */
  player: { baseSpeed: 230, radius: 22, iframes: 0.5, dodgeCap: 60, lifeStealTickCd: 0.2, maxWeapons: 6 },
  /** 吸血回复量：每次触发回 max(1, 最大生命 × healPct)，向下取整（50 血时 1 点、100 血时 2 点、150 血时 3 点），
   *  让吸血到后期仍有意义。大蒜伯爵「血之盛宴」：契合武器吸血冷却 × favoredCdMult，
   *  且同一次群体命中最多连续触发 favoredBurst 次（不是完全取消冷却，防止群体伤害吸血过量）。
   *  maxPerSec：普通情况下吸血每秒最多回复的生命（角色天赋的额外增幅除外），见 lifeStealHeal */
  lifeSteal: { healPct: 0.02, favoredCdMult: 0.5, favoredBurst: 3, maxPerSec: 10 },
  /** 生命再生（参考土豆兄弟）：第 1 点 first 生命/秒，之后每点 perPoint 生命/秒，整体收益递减地趋近 maxPerSec（见 regenPerSecond）；≤0 时不回复 */
  regen: { first: 0.2, perPoint: 0.089, maxPerSec: 10 },
  /** count / eliteWaves / bossWave：第 1–4 章（以及无尽循环）的 15 波节奏。
   *  grow：第 fromChapter 章起每章 base 波，之后每章 +step，最多 max（见 chapterWaves）；
   *  长章节里每 eliteEvery 波一只精英，最后一波 Boss。 */
  waves: {
    count: 15,
    eliteWaves: [5, 10],
    bossWave: 15,
    eliteEvery: 5,
    grow: { fromChapter: 5, base: 20, step: 5, max: 50 },
  },
  /** 无尽模式：第 15 波之后每波生命 ×hp、伤害 ×dmg（复利），保证终会结束。
   *  B3：分段式——从第 from 波之后起改用该段的每波倍率，避免高波数时数值爆炸（曲线连续） */
  endless: {
    hp: 1.12,
    dmg: 1.11,
    segments: [
      { from: 30, hp: 1.08, dmg: 1.07 },
      { from: 45, hp: 1.05, dmg: 1.05 },
    ],
  },
  pickup: { baseRadius: 110, magnetSpeed: 700 },
  /** 远程小怪：射程 = 保持距离 keepDist × rangeMult，只在射程内开火，平时在 hover × 射程（≈ 保持距离）附近横向游走；
   *  普通小怪的子弹飞出射程 × bulletReach 就消失（精英与 Boss 不限）；多发子弹相邻夹角至少 minGapDeg°，留出躲避空隙 */
  enemyRanged: { rangeMult: 1.3, hover: 0.75, bulletReach: 1.2, minGapDeg: 15 },
  /** 商店补货时「刷到已持有武器」的概率（武器越多越需要，否则凑不出同名同级） */
  shopOwnedChance: 0.5,
  /** 仓库格数：仓库里的武器不参与战斗，可与武器栏互换、出售，也能当合成材料 */
  storageSlots: 6,
  /** 超武增益（只有部分超武自带，见 WeaponDef.superBuff）：击败精英触发，持续 dur 秒、冷却 cd 秒，最多 maxStacks 层，只强化这把超武 */
  superBuff: {
    dur: 10,
    cd: 20,
    maxStacks: 3,
    rage: { per: 5, burstMult: 1.5, boomR: 90, boomDmg: 0.3 },
    haste: { per: 4 },
    focus: { per: 15 },
    vampiric: { per: 4, hpBelow: 0.5 },
  },
  /** 移动速度按点数计：每点起步 +perPoint%，收益递减地趋近 +cap%（最快基础速度的 220%），负向最低 min%（50%） */
  speed: { perPoint: 2, cap: 120, min: -50 },
  /** 武器射程下限：近战不低于基础射程 × melee（且 ≥ meleeMin 像素），远程不低于 × ranged（且 ≥ rangedMin） */
  rangeFloor: { melee: 0.85, meleeMin: 70, ranged: 0.6, rangedMin: 120 },
  maxEnemies: 260,
  /** 收获每波成长：基础收获（不含已成长部分）的 5%，不复利 */
  harvestGrowth: 0.05,
  /** 合成暴击：合成（含买入自动合成、芋头吞噬）时有此概率额外再升 1 级，例如 T2 + T2 直接得到 T4 */
  mergeBonus: 0.15,
  /** 护甲减伤上限：受到的伤害最少保留 25%（护甲 45 起不再增加减伤），防止无尽模式站着不动也打不死 */
  armorMinTaken: 0.25,
  /** 收获对掉落的加成：1 + (h/100)/(1 + h/(100·(max−1)))，收益递减，最多 ×max */
  harvestLoot: { max: 3 },
  /** 番茄籽收入曲线：base × (1 + linear·w + quad·w²)，calib 为实测拾取率校准（仅用于文档与旧测试的参考曲线，掉落已改为固定值） */
  income: { base: 34, linear: 0.5, quad: 0.035, calib: 0.75 },
  /** 掉落：每 1 点怪物番茄籽价值固定掉 perSeed 枚，不随波次、章节变化，只受收获加成（每 1 点收获 +1%）。
   *  第 1 波约 14 只小怪 → 约 34 枚。后期击杀数远多于前期，所以商店价格随波次涨得更快（priceGrowth） */
  loot: { perSeed: 2.8 },
  /** 商店涨价倍率 1 + linear·(w−1) + quad·(w−1)²（第 1 波 ×1、第 5 波 ×2.9、第 10 波 ×7.7、第 14 波 ×13.5）：
   *  掉落固定后收入跟着击杀数涨（第 14 波的击杀约是第 1 波的 40 倍），后期价格必须涨得更快 */
  priceGrowth: { linear: 0.25, quad: 0.055 },
  /** 刷新起步价随身家（持有番茄籽 + 武器当前售价）上涨的比例 % */
  rerollWorthPct: 2,
  /** 刷新价格的递增系数：类斐波那契数列 a(n) = a(n−1) + a(n−2)，第 2 次约为第 1 次的 1.8 倍 */
  rerollSteps: [1, 1.8],
  /** 商店武器品质 / 道具（商店、宝箱）稀有度 / 升级属性选项等级：按幸运分层，与波次无关。
   *  道具与升级三项依次是第 2、3、4 档（稀有/史诗/传说、II/III/IV 级）；武器只有 T2、T3 两项——
   *  商店不卖 T4，T4 只能合成。T3 无论幸运多高最多 2%。
   *  幸运 < from 时概率为 0；幸运 = from 时为 start%，幸运 100 时为 at100%，中间先快后慢（平方根曲线），
   *  超过 100 继续缓慢增长，最多 cap%。剩余归最低档。 */
  luckTiers: {
    weapon: [
      { from: 10, start: 3, at100: 15, cap: 20 },
      { from: 30, start: 0.3, at100: 1.5, cap: 2 },
    ],
    item: [
      { from: 5, start: 3, at100: 28, cap: 36 },
      { from: 15, start: 2, at100: 12, cap: 18 },
      { from: 30, start: 1, at100: 3, cap: 6 },
    ],
    upgrade: [
      { from: 5, start: 3, at100: 28, cap: 36 },
      { from: 15, start: 2, at100: 12, cap: 18 },
      { from: 30, start: 1, at100: 3, cap: 6 },
    ],
  },
  /** 暴击伤害总加成上限 %（武器词条 + 道具 / 角色 / 天赋，合并成一个加法池） */
  critDmgCap: 150,
  /** 光环范围总加成上限 %（角色 / 道具 / 升级 / 天赋 / 觉醒合并后封顶，防止光环覆盖大半个场地） */
  auraSizeCap: 225,
  /** 光环默认半径（从玩家中心算，像素）：由 T1 威力反推，威力越高半径越小（见 auraBaseRadius）。
   *  1 个身位 = bodyPx（玩家贴图直径）；半径限制在「玩家半径 + minBodies 个身位」到「+ maxBodies 个身位」之间。
   *  威力 = DPS^w.dps × 单次伤害^w.hit × 每秒次数^w.aps；ref* 为基准光环（威力相同时半径 refRadius），exp 越大差距越明显。 */
  aura: {
    bodyPx: 50,
    minBodies: 1.5,
    maxBodies: 3,
    refRadius: 135,
    refDps: 8,
    refHit: 4,
    exp: 0.8,
    w: { dps: 0.6, hit: 0.2, aps: 0.2 },
  },
  /** 命中落雷概率总上限 % */
  lightningCap: 50,
  /** 武器子弹命中后分裂：层数上限、每次分出几颗、每层伤害倍率、张角（度）、碎片飞行秒数、全场碎片上限 */
  split: { cap: 3, shards: 2, dmg: 0.5, spread: 40, life: 0.35, maxLive: 160 },
  seedMult: 0.5, // 第 6 波起小怪番茄籽的经验倍率（货币掉落为固定值，见 BALANCE.loot）
  cratesPerWave: 3, // 每波最多掉落宝箱（精英/Boss 不计）
  rerollBase: 2,
  shopSlots: 4,
  levelUpChoices: 4,
  /** 局内天赋：每次升级有此概率改为「本局天赋 · 三选一」（只在本局生效，见 LevelUpScene.showTalentPick） */
  treeChance: 0.15,
  /** 章节数：用于把章节倍率参数化为几何级数 */
  chapterCount: 5,
  /** 章节难度几何级数的「终点倍率」（第 1 章恒为 1，第 N 章达到该值）。
   *  由 chapterMult() 派生出每章单调递增的倍率，杜绝手填导致的曲线断裂。
   *  late：从 lateFrom 章之后改用更平缓的每章公比（掉落不随章节变化，后期章节不能涨得太快） */
  chapterCurve: {
    hpEnd: 3.4,
    dmgEnd: 1.7,
    bossHpEnd: 2.4,
    speedStep: 0.05,
    lateFrom: 2,
    late: { hp: 1.09, dmg: 1.04, bossHp: 1.1 },
  },
  /** 敌人血量成长指数：base·(1+growth·w^exp)。exp<1 为次线性，与玩家后期成长放缓相匹配。 */
  enemyGrowthExp: 0.9,
  /** 敌人伤害成长指数：与血量分开，比血量更平缓（伤害涨得太快会让后期只能靠堆血硬扛） */
  enemyDmgGrowthExp: 0.8,
  /** 伤害相对血量的额外系数（伤害曲线整体乘此值，用于微调手感而不破坏同族形态） */
  enemyDmgScale: 1.15,
  /** 敌人命中方式的额外倍率（在 dmg 曲线之后乘）：contact = 身体碰撞（含冲锋），bullet = 所有敌方子弹（小怪 / 精英 / Boss）。
   *  自爆、砸地、激光、地面危害不受影响。站桩硬吃要有代价，所以碰撞与子弹单独加重 */
  enemyHit: { contact: 1.5, bullet: 2 },
  /** 精英 / Boss 随波次的缩放参数（取代原先散落在 GameScene 的 magic number）。
   *  精英伤害 = def.dmg × dmgMult × (dmgBase + dmgGrow × 本章进度)，进度从第 5 波 0 到本章最后一只精英 1；
   *  Boss 伤害 = def.dmg × boss.dmgMult × chapterDmg[章]（更高），保证同章 Boss 攻击力高于任何精英。
   *  chapterDmg 按各章典型构筑（tests/bossDamage.test.ts 的 TYPICAL）反推：Boss 碰撞打死玩家的次数
   *  第 1 章 8 下、第 2 章 7、第 3–4 章 6、第 5 章 5、第 6 章 4、第 7 章 3 下 */
  /** firstDmgMult：第 firstFrom 章起，每章第一只精英（首个精英波）的伤害倍率——缓和第 5 波的难度断崖 */
  elite: { base: 0.8, perWave: 0.12, dmgBase: 1.0, dmgGrow: 0.4, dmgMult: 1.2, firstDmgMult: 0.8, firstFrom: 4 },
  boss: { hpMult: 3, dmgMult: 1.9, chapterDmg: [1, 0.65, 0.74, 0.85, 1, 1.78, 2.62] },
};

/** 每 15 波一轮：第 5 / 10 波精英，第 15 波 Boss（无尽循环的节奏；与章节无关的旧接口） */
export const isBossWaveNo = (wave: number): boolean => wave % BALANCE.waves.bossWave === 0;
export const isEliteWaveNo = (wave: number): boolean => BALANCE.waves.eliteWaves.includes(((wave - 1) % BALANCE.waves.bossWave) + 1);

/** 每章波数：第 1–4 章 15 波；第 5 章 20 波，之后每章 +5 波，最多 50 波 */
export function chapterWaves(chapterId: number): number {
  const G = BALANCE.waves.grow;
  if (chapterId < G.fromChapter) return BALANCE.waves.count;
  return Math.min(G.max, G.base + (chapterId - G.fromChapter) * G.step);
}
/** 无尽模式里本章最后一波之后的第几波（1..15 循环），本章内为 0 */
const endlessCycle = (chapterId: number, wave: number): number => {
  const n = chapterWaves(chapterId);
  return wave <= n ? 0 : ((wave - n - 1) % BALANCE.waves.bossWave) + 1;
};
/** 本章的 Boss 波：正常模式为最后一波；无尽模式之后每 15 波一只 */
export function isBossWaveFor(chapterId: number, wave: number, endless: boolean): boolean {
  const n = chapterWaves(chapterId);
  if (wave <= n) return wave === n;
  return endless && endlessCycle(chapterId, wave) === BALANCE.waves.bossWave;
}
/** 本章的精英波：章内每 5 波一只（不含 Boss 波）；无尽模式之后每轮第 5 / 10 波 */
export function isEliteWaveFor(chapterId: number, wave: number, endless: boolean): boolean {
  const n = chapterWaves(chapterId);
  if (wave <= n) return wave < n && wave % BALANCE.waves.eliteEvery === 0;
  return endless && BALANCE.waves.eliteWaves.includes(endlessCycle(chapterId, wave));
}
/** 无尽模式超过本章最后一波（默认第 15 波）后的复利倍率 */
function endlessMult(wave: number, key: 'hp' | 'dmg', from: number = BALANCE.waves.count): number {
  const E = BALANCE.endless;
  // 后续分段相对本章波数平移，保持「进入无尽后第几波」的手感一致
  const shift = from - BALANCE.waves.count;
  const segs = [{ from, hp: E.hp, dmg: E.dmg }, ...E.segments.map((s) => ({ ...s, from: s.from + shift }))];
  let m = 1;
  segs.forEach((sg, i) => {
    const end = i + 1 < segs.length ? segs[i + 1].from : Infinity;
    const n = Math.max(0, Math.min(wave, end) - sg.from);
    m *= Math.pow(sg[key], n);
  });
  return m;
}
export const endlessHp = (wave: number, from?: number): number => endlessMult(wave, 'hp', from);
export const endlessDmg = (wave: number, from?: number): number => endlessMult(wave, 'dmg', from);

/** 波次时长（秒）：20, 25, 30 ... 最多 60；Boss 波 90 秒 */
export function waveDuration(wave: number, boss: boolean = isBossWaveNo(wave)): number {
  if (boss) return 90;
  return Math.min(20 + (wave - 1) * 5, 60);
}

/** 升级所需经验：(lv + 3)^2 */
export function xpToNext(level: number): number {
  return (level + 3) * (level + 3);
}

/** 护甲减伤倍率 */
/** 生命再生速度（生命/秒）：基础曲线参考土豆兄弟 0.20 + (regen − 1) × 0.089，再收益递减地趋近每秒 regen.maxPerSec 点
 *  （regen 10 ≈ 0.95/秒、50 ≈ 3.7/秒、100 ≈ 5.9/秒、200 ≈ 8.3/秒）；regen ≤ 0 视为 0。角色天赋的额外回复不受此限。 */
export function regenPerSecond(regen: number): number {
  if (regen <= 0) return 0;
  // 原线性曲线 lin 再按 cap·(1 − e^(−lin/cap)) 压缩：前期几乎不变，越堆越接近 maxPerSec、永远到不了
  const cap = BALANCE.regen.maxPerSec;
  const lin = BALANCE.regen.first + (regen - 1) * BALANCE.regen.perPoint;
  return cap * (1 - Math.exp(-lin / cap));
}

/** 爆炸半径乘数（参考土豆兄弟的 Explosion Size）：1 + 爆炸范围% / 100，负值最低到 0.5 */
export function explodeSizeMultiplier(explodeSize: number): number {
  return Math.max(0.5, 1 + explodeSize / 100);
}

/** 光环武器的 T1 威力输入（结构化，避免 balance 依赖武器表） */
export interface AuraPowerInput {
  damage: number[];
  cooldown: number[];
  critMult: number;
  critBonus?: number;
  effect?: { burn?: { dps: number }; poison?: { stacks: number }; slow?: { pct: number }; stun?: number };
}

/** 光环 T1 威力：期望 DPS（含基础 5% 暴击、灼烧 / 中毒的持续伤害、减速 / 眩晕的控制价值）、单次伤害与每秒次数加权 */
export function auraPower(d: AuraPowerInput): number {
  const W = BALANCE.aura.w;
  const hit = d.damage[0];
  const aps = 1 / d.cooldown[0];
  const crit = Math.min(1, 0.05 + (d.critBonus ?? 0) / 100);
  let dps = hit * aps * (1 + crit * (d.critMult - 1));
  const e = d.effect;
  if (e?.burn) dps += e.burn.dps;
  if (e?.poison) dps += e.poison.stacks;
  if (e?.slow) dps *= 1 + e.slow.pct / 100;
  if (e?.stun) dps *= 1 + e.stun;
  return dps ** W.dps * hit ** W.hit * aps ** W.aps;
}

/** 光环默认半径：威力越高半径越小，至少「玩家半径 + 1.5 个身位」 */
export function auraBaseRadius(d: AuraPowerInput): number {
  const A = BALANCE.aura;
  const ref = auraPower({ damage: [A.refHit], cooldown: [A.refHit / A.refDps], critMult: 1 });
  const lo = BALANCE.player.radius + A.minBodies * A.bodyPx;
  const hi = BALANCE.player.radius + A.maxBodies * A.bodyPx;
  const r = A.refRadius * (ref / auraPower(d)) ** A.exp;
  return Math.round(Math.max(lo, Math.min(hi, r)));
}

/** 吸血每秒最多回复的生命（由触发冷却与每次回复量推出，用于显示与文档） */
export const lifeStealMaxPerSecond = (maxHp = 0): number => Math.round(1 / BALANCE.player.lifeStealTickCd) * lifeStealHeal(maxHp);

/** 吸血每次触发的回复量（见 BALANCE.lifeSteal.healPct）：
 *  不超过 maxPerSec × 触发冷却，保证普通情况下吸血每秒最多回 maxPerSec 点
 *  （大蒜伯爵「血之盛宴」缩短冷却、连续触发属于角色天赋额外增幅，可以超过） */
export function lifeStealHeal(maxHp: number): number {
  const perHit = Math.floor(BALANCE.lifeSteal.maxPerSec * BALANCE.player.lifeStealTickCd);
  return Math.max(1, Math.min(perHit, Math.floor(maxHp * BALANCE.lifeSteal.healPct)));
}

export function armorMultiplier(armor: number): number {
  return armor >= 0 ? Math.max(BALANCE.armorMinTaken, 15 / (15 + armor)) : (15 - armor) / 15;
}

/**
 * 「荆棘」词缀反伤：按本次近战实际造成的伤害（不计溢出）反弹 pct，经护甲减免；
 * 单次最多 hitCap × 最大生命，每秒累计最多 secCap × 最大生命——高伤害近战构筑不会被自己的伤害秒杀。
 */
export const THORNY = { pct: 0.05, hitCap: 0.02, secCap: 0.08 } as const;
/** 返回本次反伤（已封顶）；used = 本秒已承受的荆棘反伤 */
/**
 * 近战触及判定（目标选择与命中结算共用，保证「会对它出手」=「打得到它」）。
 * dist 为手部到敌人中心的距离；以敌人身体边缘计算：边缘进入射程即可命中。
 * 直刺的刀身有宽度，额外放宽 MELEE_THRUST_PAD。
 */
export const MELEE_THRUST_PAD = 14;
export function meleeInReach(kind: 'sweep' | 'thrust', dist: number, radius: number, range: number): boolean {
  return dist - radius <= range + (kind === 'thrust' ? MELEE_THRUST_PAD : 0);
}

export function thornyReflect(dealt: number, maxHp: number, armor: number, used: number): number {
  if (dealt <= 0 || maxHp <= 0) return 0;
  const raw = dealt * THORNY.pct * armorMultiplier(armor);
  const capped = Math.min(raw, maxHp * THORNY.hitCap, Math.max(0, maxHp * THORNY.secCap - used));
  return Math.max(0, capped);
}

/** 攻速换算为冷却倍率 */
export function attackSpeedMultiplier(as: number): number {
  return as >= 0 ? 1 / (1 + as / 100) : 1 + -as / 100;
}

/** 移动速度点数 → 实际加速 %：正向收益递减地趋近 speed.cap（每点起步 +perPoint%，10 点 ≈ +18%、50 点 ≈ +66%、100 点 ≈ +95%），
 *  负向每点 −perPoint%，最低 speed.min（基础速度的 50%） */
export function speedBonusPct(points: number): number {
  const S = BALANCE.speed;
  if (points <= 0) return Math.max(S.min, points * S.perPoint);
  return S.cap * (1 - Math.exp((-points * S.perPoint) / S.cap));
}
export function moveSpeed(stats: Stats): number {
  return BALANCE.player.baseSpeed * (1 + speedBonusPct(stats.speed) / 100);
}

/** 章节倍率随波次渐进：第 1 波只生效 10%，本章最后一波完全生效（每章都从 0 级开始） */
export function chapterScale(mult: number, wave: number, waves: number = BALANCE.waves.count): number {
  // waves：本章总波数——长章节（20 / 25 / 30 波）按自身长度逐步拉满，而不是第 15 波就满额
  const k = 0.1 + 0.9 * Math.min(1, (wave - 1) / (Math.max(2, waves) - 1));
  return 1 + (mult - 1) * k;
}

/** 参数化章节难度倍率（几何级数，保证「单调递增」）。
 *  第 1 章恒为 1，第 chapterCount 章达到 end；中间按 end^((ch-1)/(N-1)) 平滑插值。
 *  —— 修正点：取代 chapters.ts 中手填且非单调的 hpMult/dmgMult/bossHpMult（原为 2.9→3.1→2.7→3.4 等断裂曲线）。 */
export function chapterMult(chapterId: number, end: number, late?: number): number {
  const n = BALANCE.chapterCount;
  const from = BALANCE.chapterCurve.lateFrom;
  // 第 lateFrom 章之后：以该章倍率为起点，每章 × late（late 未给时沿原公比外推）
  const geo = (ch: number) => Math.pow(end, Math.max(0, (ch - 1) / (n - 1)));
  const v = late && chapterId > from ? geo(from) * Math.pow(late, chapterId - from) : geo(chapterId);
  return Math.round(v * 100) / 100;
}

/** 便捷取各类章节倍率（供 chapters.ts 派生，而非手填） */
const CC = BALANCE.chapterCurve;
export const chapterHpMult = (ch: number): number => chapterMult(ch, CC.hpEnd, CC.late.hp);
export const chapterDmgMult = (ch: number): number => chapterMult(ch, CC.dmgEnd, CC.late.dmg);
export const chapterBossHpMult = (ch: number): number => chapterMult(ch, CC.bossHpEnd, CC.late.bossHp);
/** 速度倍率：等差递增（每章 +speedStep），本就单调合理，保留等差形态 */
export const chapterSpeedMult = (ch: number): number => Math.round((1 + BALANCE.chapterCurve.speedStep * (ch - 1)) * 100) / 100;

/** 统一的敌人成长曲线：base·(1 + growth·w^exp)，w = wave-1。
 *  血量与伤害同一形态，但指数分开：血量用 enemyGrowthExp，伤害用更平缓的 enemyDmgGrowthExp。 */
export function growthCurve(base: number, growth: number, wave: number, exp: number = BALANCE.enemyGrowthExp): number {
  const w = wave - 1;
  return base * (1 + growth * Math.pow(w, exp));
}

/** 敌人血量：同族次线性成长 × 章节倍率 × 无尽复利 */
export function enemyHp(base: number, growth: number, wave: number, chapterMult: number, waves?: number): number {
  return Math.round(growthCurve(base, growth, wave) * chapterScale(chapterMult, wave, waves) * endlessHp(wave));
}

/** 敌人伤害：同族曲线但成长指数更低（enemyDmgGrowthExp），整体乘 enemyDmgScale 微调手感 × 章节倍率 × 无尽复利。
 *  怪物子弹 = 接触伤害 × projMult，同样走这条曲线。 */
export function enemyDamage(base: number, growth: number, wave: number, chapterMult: number, waves?: number): number {
  return Math.max(
    1,
    Math.round(
      growthCurve(base, growth, wave, BALANCE.enemyDmgGrowthExp) *
        BALANCE.enemyDmgScale *
        chapterScale(chapterMult, wave, waves) *
        endlessDmg(wave),
    ),
  );
}

/** 精英随波次的血量 / 伤害缩放系数（取代 GameScene 中散落的 0.8+(wave-5)·0.12 等 magic number） */
export function eliteHpScale(wave: number): number {
  return Math.max(BALANCE.elite.base, BALANCE.elite.base + (wave - 5) * BALANCE.elite.perWave);
}
export function eliteDmgScale(wave: number, chapterLen: number = BALANCE.waves.count): number {
  // 按章节内进度成长、到本章最后一只精英封顶（+dmgGrow），不随章节变长无限放大，保证始终低于本章 Boss
  const span = Math.max(1, chapterLen - 10);
  const k = Math.min(1, Math.max(0, (wave - 5) / span));
  return BALANCE.elite.dmgBase + BALANCE.elite.dmgGrow * k;
}
/** 本章第一只精英的伤害倍率（见 BALANCE.elite.firstDmgMult）；其他精英为 1 */
export function firstEliteDmgMult(chapterId: number, wave: number): number {
  const e = BALANCE.elite;
  if (chapterId < e.firstFrom) return 1;
  for (let w = 1; w < wave; w++) if (isEliteWaveFor(chapterId, w, false)) return 1;
  return isEliteWaveFor(chapterId, wave, false) ? e.firstDmgMult : 1;
}
/** Boss（非精英）固定缩放系数，集中管理，便于统一调参 */
export const bossHpScale = (): number => BALANCE.boss.hpMult;
export const bossDmgScale = (chapterId = 1): number => {
  const t = BALANCE.boss.chapterDmg;
  return BALANCE.boss.dmgMult * (t[Math.min(t.length, Math.max(1, chapterId)) - 1] ?? 1);
};
export const eliteDmgMult = (): number => BALANCE.elite.dmgMult;

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

/** 旧版每波番茄籽收入目标曲线：掉落改为固定值后只作参考（文档、旧测试） */
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

/** 单只小怪（seeds = 1）的番茄籽价值：固定值，与波次、章节无关（收获加成在击杀时另乘，见 lootHarvestMult） */
export function seedValue(): number {
  return BALANCE.loot.perSeed;
}

/** 收获对掉落的加成：前期约每 1 点收获 +1%，之后收益递减，最多 ×harvestLoot.max（收获 50 → ×1.4、100 → ×1.67、200 → ×2、1000 → ×2.7）；
 *  负收获最多 −50% */
export function lootHarvestMult(harvest: number): number {
  if (harvest <= 0) return Math.max(0.5, 1 + harvest / 100);
  const k = BALANCE.harvestLoot.max - 1;
  return 1 + harvest / 100 / (1 + harvest / (100 * k));
}

/** 一档的幸运门槛：幸运 < from 时为 0；= from 时 start%，= 100 时 at100%，先快后慢，最多 cap% */
export interface LuckTier {
  from: number;
  start: number;
  at100: number;
  cap: number;
}

/** 某一档在给定幸运下的概率（0..1）：平方根曲线 start + (at100 − start) × √((幸运 − from) / (100 − from)) */
export const luckTierChance = (luck: number, t: LuckTier): number => {
  if (luck < t.from) return 0;
  const k = Math.sqrt((luck - t.from) / (100 - t.from));
  return Math.min(t.cap, t.start + (t.at100 - t.start) * k) / 100;
};

/** 按幸运分层，返回 [最低档, 第 1 档, 第 2 档, 第 3 档]；高档优先，低档只占剩余空间。topMult 只乘最高档（章节 T4 系数） */
function tierTable(luck: number, tiers: readonly LuckTier[], topMult = 1): number[] {
  const hi = tiers.map((t, i) => Math.min(1, luckTierChance(luck, t) * (i === tiers.length - 1 ? topMult : 1)));
  let room = 1;
  for (let i = hi.length - 1; i >= 0; i--) {
    hi[i] = Math.min(hi[i], room);
    room -= hi[i];
  }
  return [Math.max(0, room), ...hi];
}

/** 从 [最低档, …, 最高档] 权重里由高到低抽取 */
function pickFrom(w: number[], rnd: () => number): number {
  let r = rnd();
  for (let i = w.length - 1; i >= 1; i--) {
    if (r < w[i]) return i;
    r -= w[i];
  }
  return 0;
}

/** 商店武器品质权重 [T1, T2, T3, T4]：只受幸运影响，与波次、章节无关；T4 恒为 0（只能合成） */
export function weaponTierWeights(luck: number): number[] {
  return [...tierTable(luck, BALANCE.luckTiers.weapon), 0];
}
export function pickWeaponTier(luck: number, rnd: () => number = Math.random): number {
  return pickFrom(weaponTierWeights(luck), rnd);
}

/** 商店涨价倍率（见 BALANCE.priceGrowth） */
export function priceInflation(wave: number): number {
  const w = wave - 1,
    g = BALANCE.priceGrowth;
  return 1 + g.linear * w + g.quad * w * w;
}
export function shopPrice(base: number, wave: number): number {
  return Math.max(1, Math.round(base * priceInflation(wave) + wave * 0.5));
}

/** 刷新价格：随波次、本波已刷新次数与章节上涨，避免后期靠反复刷新轻易凑齐高级武器 */
/** 刷新价格（商店与升级界面共用）：起步价 = 按波次与章节的基础价 + 身家 × rerollWorthPct%，
 *  身家越高刷新越贵；之后每次刷新按 rerollStep 递增 */
export function rerollPrice(wave: number, rerolls: number, chapterId = 1, worth = 0): number {
  const chapterMult = 1 + 0.3 * (chapterId - 1);
  const base = (BALANCE.rerollBase + 3 + wave * 2) * chapterMult + (Math.max(0, worth) * BALANCE.rerollWorthPct) / 100;
  return Math.round(base * rerollStep(rerolls));
}

/** 第 n 次刷新（0 起）的价格倍率：1, 1.8, 2.8, 4.6, 7.4, 12, 19.4 …（类斐波那契） */
export function rerollStep(n: number): number {
  const [a0, a1] = BALANCE.rerollSteps;
  if (n <= 0) return a0;
  let a = a0,
    b = a1;
  for (let i = 1; i < n; i++) [a, b] = [b, a + b];
  return Math.round(b * 10) / 10;
}

/** 出售价格 = 25% 购买价 */
export function sellPrice(price: number): number {
  return Math.max(1, Math.floor(price * 0.25));
}

/** 道具稀有度（商店 / 宝箱）[普通, 稀有, 史诗, 传说]：只受幸运影响，与波次无关 */
export function rarityWeights(luck: number): number[] {
  return tierTable(luck, BALANCE.luckTiers.item);
}
/** 抽取道具稀有度（商店 / 宝箱） */
export function pickRarity(luck: number, rnd: () => number = Math.random): number {
  return pickFrom(rarityWeights(luck), rnd);
}

/** 升级属性选项的稀有度（I–IV 级）：与武器 / 道具同样按幸运分层，与波次无关 */
export function upgradeRarityWeights(luck: number): number[] {
  return tierTable(luck, BALANCE.luckTiers.upgrade);
}

/** 抽取升级属性选项的稀有度 */
export function pickUpgradeRarity(luck: number, rnd: () => number = Math.random): number {
  return pickFrom(upgradeRarityWeights(luck), rnd);
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
