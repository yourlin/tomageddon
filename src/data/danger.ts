// 「番茄危机」难度阶梯（A1–A3、A6）：0–20 级，每级在前一级基础上再叠加一条永久规则。
// 规则用和挑战修饰（challenges.ts）同一套 ModifierDef 描述，数值部分放在 rule 里，由 systems/Rules.ts 汇总。
import type { ModifierDef } from './challenges';
import type { Pattern } from './bosses';

/** 所有「规则来源」（危机等级、遗物、事件波、无尽变异）共用的数值修正。百分比为加法叠加 */
export interface RuleDelta {
  /** 敌人生命 / 伤害 / 移速 % */
  enemyHp?: number;
  enemyDmg?: number;
  enemySpeed?: number;
  /** 刷怪数量 % */
  spawn?: number;
  /** 词缀精英小怪出现率 % */
  champ?: number;
  /** 精英与 Boss 生命 % */
  eliteHp?: number;
  /** 精英额外词缀数 */
  eliteAffix?: number;
  /** Boss 额外招式数（A6） */
  bossSkill?: number;
  /** 商店价格 / 刷新价格 % */
  shopPrice?: number;
  rerollPrice?: number;
  /** 所有治疗（再生、吸血、技能回复、果实）% */
  heal?: number;
  /** 经验 / 番茄籽收入 % */
  xp?: number;
  income?: number;
}

export interface DangerLevel extends ModifierDef {
  level: number;
  rule: RuleDelta;
}

const L = (level: number, icon: string, zh: string, en: string, descZh: string, descEn: string, rule: RuleDelta): DangerLevel => ({
  id: `danger_${level}` as ModifierDef['id'],
  level,
  icon,
  name: [zh, en],
  desc: [descZh, descEn],
  weight: 1,
  rule,
});

export const DANGER_LEVELS: DangerLevel[] = [
  L(1, '❤️', '厚皮', 'Thick Skin', '敌人生命 +10%', 'Enemies +10% HP', { enemyHp: 10 }),
  L(2, '🗡️', '利齿', 'Sharp Teeth', '敌人伤害 +10%', 'Enemies +10% damage', { enemyDmg: 10 }),
  L(3, '✨', '精英涌现', 'Champions Rise', '词缀精英小怪出现率 +50%', 'Affixed champions +50% more often', { champ: 50 }),
  L(4, '💰', '物价上涨', 'Inflation', '商店价格 +10%', 'Shop prices +10%', { shopPrice: 10 }),
  L(5, '🩹', '伤口难愈', 'Slow Healing', '所有治疗效果 -20%', 'All healing -20%', { heal: -20 }),
  L(6, '💨', '躁动', 'Restless', '敌人移速 +8%', 'Enemies move 8% faster', { enemySpeed: 8 }),
  L(7, '🐜', '虫潮', 'Infestation', '刷怪数量 +15%', '+15% spawns', { spawn: 15 }),
  L(8, '🧿', '诅咒词缀', 'Cursed Champions', '精英额外 +1 个词缀', 'Elites gain +1 affix', { eliteAffix: 1 }),
  L(9, '❤️', '更厚的皮', 'Thicker Skin', '敌人生命 +15%', 'Enemies +15% HP', { enemyHp: 15 }),
  L(10, '👹', 'Boss 觉醒 I', 'Boss Awakening I', 'Boss 学会 1 个新招式', 'Bosses learn 1 new attack', { bossSkill: 1 }),
  L(11, '🗡️', '更利的齿', 'Sharper Teeth', '敌人伤害 +15%', 'Enemies +15% damage', { enemyDmg: 15 }),
  L(12, '🎲', '刷新涨价', 'Costly Rerolls', '商店刷新价格 +30%', 'Rerolls cost +30%', { rerollPrice: 30 }),
  L(13, '📉', '学得更慢', 'Slow Learner', '经验获取 -15%', '-15% XP gain', { xp: -15 }),
  L(14, '🛡️', '精英铁甲', 'Ironclad Elites', '精英与 Boss 生命 +30%', 'Elites and bosses +30% HP', { eliteHp: 30 }),
  L(15, '👹', 'Boss 觉醒 II', 'Boss Awakening II', 'Boss 再学会 1 个新招式', 'Bosses learn another attack', { bossSkill: 1 }),
  L(16, '❤️', '腐烂硬化', 'Rot Hardening', '敌人生命 +20%', 'Enemies +20% HP', { enemyHp: 20 }),
  L(17, '🗡️', '腐蚀之牙', 'Corrosive Fangs', '敌人伤害 +20%', 'Enemies +20% damage', { enemyDmg: 20 }),
  L(18, '🪙', '歉收', 'Poor Harvest', '番茄籽收入 -15%', '-15% Seed income', { income: -15 }),
  L(19, '🐜', '大虫潮', 'Great Infestation', '刷怪数量 +20%，治疗再 -15%', '+20% spawns, healing another -15%', { spawn: 20, heal: -15 }),
  L(20, '☠️', '番茄末日', 'Tomageddon', 'Boss 再学 1 招，敌人生命 +25%', 'Bosses learn one more attack, enemies +25% HP', {
    bossSkill: 1,
    enemyHp: 25,
  }),
];

export const MAX_DANGER = DANGER_LEVELS.length;

/** 危机等级 lv 生效的所有规则（1..lv 累加） */
export const dangerLevels = (lv: number): DangerLevel[] => DANGER_LEVELS.slice(0, Math.max(0, Math.min(MAX_DANGER, lv)));

/** A6：Boss 在危机 10 / 15 / 20 学会的新招式（按顺序追加；伤害系数会按 Boss 本身伤害缩放） */
export const BOSS_DANGER_PATTERNS: Pattern[] = [
  { type: 'ring', cd: 5.5, count: 14, speed: 200, dmg: 0.6 },
  { type: 'hazard', cd: 7, radius: 95, windup: 0.9, dmg: 0.4 },
  { type: 'laser', cd: 8, windup: 1.1, dmg: 1 },
];
