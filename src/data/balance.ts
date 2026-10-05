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
   *  且同一次群体命中最多连续触发 favoredBurst 次（不是完全取消冷却，防止群体伤害吸血过量） */
  lifeSteal: { healPct: 0.02, favoredCdMult: 0.5, favoredBurst: 3 },
  /** 生命再生（参考土豆兄弟）：第 1 点 first 生命/秒，之后每点 perPoint 生命/秒；≤0 时不回复 */
  regen: { first: 0.2, perPoint: 0.089 },
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
  /** 商店武器品质 / 道具（商店、宝箱）稀有度 / 升级属性选项等级：按幸运分层，与波次无关。
   *  三项依次是第 2、3、4 档（T2/T3/T4、稀有/史诗/传说、II/III/IV 级）：
   *  幸运 < from 时概率为 0；幸运 = from 时为 start%，幸运 100 时为 at100%，中间先快后慢（平方根曲线），
   *  超过 100 继续缓慢增长，最多 cap%。剩余归最低档。武器 T4 另乘章节 t4Mult。 */
  luckTiers: {
    weapon: [
      { from: 5, start: 3, at100: 40, cap: 50 },
      { from: 15, start: 2, at100: 20, cap: 30 },
      { from: 30, start: 1, at100: 5, cap: 10 },
    ],
    item: [
      { from: 5, start: 3, at100: 40, cap: 50 },
      { from: 15, start: 2, at100: 20, cap: 30 },
      { from: 30, start: 1, at100: 5, cap: 10 },
    ],
    upgrade: [
      { from: 5, start: 3, at100: 40, cap: 50 },
      { from: 15, start: 2, at100: 20, cap: 30 },
      { from: 30, start: 1, at100: 5, cap: 10 },
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
  elite: { base: 0.8, perWave: 0.12, dmgBase: 1.0, dmgGrow: 0.4, dmgMult: 1.2 },
  boss: { hpMult: 3, dmgMult: 1.9, chapterDmg: [1, 0.74, 0.67, 0.69, 0.74, 1.23, 1.63] },
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

/** 吸血每次触发的回复量（见 BALANCE.lifeSteal.healPct） */
export function lifeStealHeal(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp * BALANCE.lifeSteal.healPct));
}

export function armorMultiplier(armor: number): number {
  return armor >= 0 ? 15 / (15 + armor) : (15 - armor) / 15;
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
 *  血量与伤害同一形态，但指数分开：血量用 enemyGrowthExp，伤害用更平缓的 enemyDmgGrowthExp。 */
export function growthCurve(base: number, growth: number, wave: number, exp: number = BALANCE.enemyGrowthExp): number {
  const w = wave - 1;
  return base * (1 + growth * Math.pow(w, exp));
}

/** 敌人血量：同族次线性成长 × 章节倍率 × 无尽复利 */
export function enemyHp(base: number, growth: number, wave: number, chapterMult: number): number {
  return Math.round(growthCurve(base, growth, wave) * chapterScale(chapterMult, wave) * endlessHp(wave));
}

/** 敌人伤害：同族曲线但成长指数更低（enemyDmgGrowthExp），整体乘 enemyDmgScale 微调手感 × 章节倍率 × 无尽复利。
 *  怪物子弹 = 接触伤害 × projMult，同样走这条曲线。 */
export function enemyDamage(base: number, growth: number, wave: number, chapterMult: number): number {
  return Math.max(
    1,
    Math.round(
      growthCurve(base, growth, wave, BALANCE.enemyDmgGrowthExp) *
        BALANCE.enemyDmgScale *
        chapterScale(chapterMult, wave) *
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

/** 商店武器品质权重 [T1, T2, T3, T4]：只受幸运与章节 T4 系数影响，与波次无关 */
export function weaponTierWeights(luck: number, t4Mult = 1): number[] {
  return tierTable(luck, BALANCE.luckTiers.weapon, t4Mult);
}
export function pickWeaponTier(luck: number, t4Mult = 1, rnd: () => number = Math.random): number {
  return pickFrom(weaponTierWeights(luck, t4Mult), rnd);
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
