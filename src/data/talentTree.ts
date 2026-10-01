// 天赋树：6 个专精方向，每个方向以核心天赋为中心、沿若干条「道路」向外延展，像地图一样分布。
// 天赋点来自成就（见 data/achievements.ts 的 TALENT_REWARDS）；每级消耗 1 点，可随时免费重置。
// 设计原则：
//  - 大多数天赋只加一种属性，数值克制（攻击与防御尤其小），主要用来补强开局属性
//  - 每条路的尽头有特殊能力；少数「明星」天赋可以点 5 级
//  - 终极天赋（keystone）需要在该方向投入足够点数；全部天赋点约够精通 2.5 个方向
import type { StatMods } from './stats';
import type { ItemSpecial } from './items';
import type { StatusApply } from './statuses';

export type BranchId = 'might' | 'guard' | 'agility' | 'arcane' | 'fortune' | 'alchemy';

/** 天赋效果（每级叠加） */
export interface TreeFx {
  mods?: StatMods;
  special?: ItemSpecial;
  /** 闪避时向最近的敌人掷出 N 把飞刀 */
  dodgeKnives?: number;
  /** 释放技能时回复最大生命 % */
  castHeal?: number;
  /** 释放技能时对自己施加 */
  castSelf?: StatusApply[];
  /** 释放技能后 % 概率立刻冷却完毕 */
  skillEcho?: number;
  /** 开局番茄籽 */
  startSeeds?: number;
  /** 每次商店免费刷新次数 */
  freeRerolls?: number;
  /** 生命低于 40% 时伤害 +% */
  lowHpDmg?: number;
  /** 对精英与 Boss 伤害 +% */
  bossDmg?: number;
  /** 升级选项 +N */
  levelChoices?: number;
  /** 每局一次：倒下时以 N% 生命站起来，并无敌 1.5 秒 */
  cheatDeath?: number;
  /** 击杀时获得 1 层怒气（每层伤害 +4%，持续 2 秒），本天赋最多叠到 N 层 */
  killRage?: number;
  /** 小怪生命低于 N% 时直接斩杀 */
  execute?: number;
  /** 暴击时 % 概率回复 1 生命 */
  critHeal?: number;
  /** 击杀时 % 概率额外掉落 1 番茄籽 */
  killSeeds?: number;
}

export type NodeKind = 'core' | 'minor' | 'notable' | 'star' | 'keystone';

export interface TalentNode {
  id: string;
  branch: BranchId;
  kind: NodeKind;
  icon: string;
  name: [string, string];
  /** {v} 替换为当前（或下一级）的累计数值 */
  desc: [string, string];
  /** 每级用于显示的数值（{v} = val × 等级） */
  val: number;
  max: number;
  fx: TreeFx;
  /** 前置天赋（至少 1 级）；核心天赋无前置 */
  parent?: string;
  /** 需要在本方向已投入的点数（终极天赋） */
  needPoints?: number;
  /** 地图坐标（以核心为原点，像素） */
  x: number;
  y: number;
}

export interface BranchDef {
  id: BranchId;
  name: [string, string];
  /** 地图主题 */
  land: [string, string];
  color: number;
  css: string;
  desc: [string, string];
}

export const BRANCHES: BranchDef[] = [
  {
    id: 'might',
    name: ['力量', 'Might'],
    land: ['熔岩厨房', 'Lava Kitchen'],
    color: 0xff4b3e,
    css: '#ff4b3e',
    desc: ['暴击、各流派伤害与斩杀', 'Crits, class damage and executes'],
  },
  {
    id: 'guard',
    name: ['守护', 'Guard'],
    land: ['冰岩堡垒', 'Frost Bastion'],
    color: 0x4cc9f0,
    css: '#4cc9f0',
    desc: ['生命、护甲、回复与护盾', 'HP, armor, healing and shields'],
  },
  {
    id: 'agility',
    name: ['迅捷', 'Agility'],
    land: ['风语森林', 'Whispering Woods'],
    color: 0x52b788,
    css: '#52b788',
    desc: ['移速、闪避、攻速与闪避反击', 'Speed, dodge, attack speed and dodge counters'],
  },
  {
    id: 'arcane',
    name: ['奥术', 'Arcane'],
    land: ['星辰穹顶', 'Starlit Dome'],
    color: 0x9d4edd,
    css: '#b46bff',
    desc: ['大招伤害、冷却、施法回复与经验', 'Skill damage, cooldown, cast healing and XP'],
  },
  {
    id: 'fortune',
    name: ['丰收', 'Fortune'],
    land: ['金色麦田', 'Golden Fields'],
    color: 0xffb703,
    css: '#ffb703',
    desc: ['收获、幸运、本金与商店', 'Harvest, luck, starting seeds and the shop'],
  },
  {
    id: 'alchemy',
    name: ['炼金', 'Alchemy'],
    land: ['剧毒沼泽', 'Toxic Marsh'],
    color: 0x06d6a0,
    css: '#06d6a0',
    desc: ['灼烧、中毒、闪电、冰冻与持续伤害', 'Burn, poison, lightning, freeze and damage over time'],
  },
];

// ---------------- 节点编写工具 ----------------
type Def = Omit<TalentNode, 'branch' | 'x' | 'y' | 'parent'> & { at: [number, number]; parent?: string };
const ST = (id: StatusApply['id'], dur: number, chance?: number, stacks?: number): StatusApply => ({ id, dur, chance, stacks });

/**
 * 一条道路：从 parent（默认核心）出发，沿 angle 方向逐个放置节点。
 * 地图坐标：距离每步 118px，纵向压扁为 0.58，并按 id 做少量抖动，看起来像手绘地图上的据点。
 */
function road(branch: BranchId, angle: number, nodes: Omit<Def, 'at'>[], from = `${branch}_core`, startStep = 1): Def[] {
  let parent = from;
  return nodes.map((n, i) => {
    const step = startStep + i;
    const d: Def = { ...n, parent, at: [angle + jitter(n.id) * 7, step] };
    parent = n.id;
    return d;
  });
}
function jitter(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((h % 100) / 100) * 2 - 1;
}
function place(branch: BranchId, defs: Def[]): TalentNode[] {
  return defs.map(({ at, ...n }) => {
    const a = (at[0] * Math.PI) / 180,
      dist = at[1] * 118 + (n.kind === 'keystone' ? 18 : 0);
    return { ...n, branch, x: Math.round(Math.cos(a) * dist), y: Math.round(Math.sin(a) * dist * 0.58) };
  });
}
const core = (branch: BranchId, n: Omit<Def, 'at' | 'kind' | 'id'>): Def => ({ ...n, id: `${branch}_core`, kind: 'core', at: [0, 0] });

// ---------------- 力量 ----------------
const MIGHT = place('might', [
  core('might', {
    icon: '🗡️',
    name: ['利刃', 'Keen Edge'],
    desc: ['暴击率 +{v}%', 'Crit chance +{v}%'],
    val: 1,
    max: 3,
    fx: { mods: { crit: 1 } },
  }),
  ...road('might', -150, [
    {
      id: 'might_melee',
      kind: 'minor',
      icon: '🥊',
      name: ['磨刀', 'Whetstone'],
      desc: ['近战武器伤害 +{v}%', 'Melee damage +{v}%'],
      val: 2,
      max: 3,
      fx: { mods: { meleePct: 2 } },
    },
    {
      id: 'might_meleeflat',
      kind: 'minor',
      icon: '💪',
      name: ['铁拳', 'Iron Fist'],
      desc: ['近战伤害 +{v}', 'Melee +{v}'],
      val: 1,
      max: 2,
      fx: { mods: { melee: 1 } },
    },
    {
      id: 'might_frenzy',
      kind: 'notable',
      icon: '🌀',
      name: ['战意', 'Battle Lust'],
      desc: ['击杀时获得 1 层怒气（伤害 +4%，持续 2 秒，最多 3 层）', 'Kills grant a Rage stack (+4% damage, 2s, up to 3)'],
      val: 1,
      max: 1,
      fx: { killRage: 3 },
    },
  ]),
  ...road('might', -95, [
    {
      id: 'might_ranged',
      kind: 'minor',
      icon: '🎯',
      name: ['准星', 'Sights'],
      desc: ['远程武器伤害 +{v}%', 'Ranged damage +{v}%'],
      val: 2,
      max: 3,
      fx: { mods: { rangedPct: 2 } },
    },
    {
      id: 'might_range',
      kind: 'minor',
      icon: '🔭',
      name: ['远眺', 'Far Sight'],
      desc: ['射程 +{v}', 'Range +{v}'],
      val: 12,
      max: 2,
      fx: { mods: { range: 12 } },
    },
    {
      id: 'might_as',
      kind: 'minor',
      icon: '⚡',
      name: ['连珠', 'Rapid Fire'],
      desc: ['攻速 +{v}%', 'Attack speed +{v}%'],
      val: 2,
      max: 2,
      fx: { mods: { attackSpeed: 2 } },
    },
  ]),
  ...road('might', -35, [
    {
      id: 'might_elem',
      kind: 'minor',
      icon: '🔥',
      name: ['灼心', 'Burning Heart'],
      desc: ['元素武器伤害 +{v}%', 'Elemental damage +{v}%'],
      val: 2,
      max: 3,
      fx: { mods: { elementalPct: 2 } },
    },
    {
      id: 'might_aura',
      kind: 'minor',
      icon: '🌞',
      name: ['光环', 'Radiance'],
      desc: ['光环伤害 +{v}%', 'Aura damage +{v}%'],
      val: 3,
      max: 2,
      fx: { mods: { auraPct: 3 } },
    },
    {
      id: 'might_aurasize',
      kind: 'minor',
      icon: '⭕',
      name: ['扩散', 'Spread'],
      desc: ['光环范围 +{v}%', 'Aura size +{v}%'],
      val: 5,
      max: 2,
      fx: { mods: { auraSize: 5 } },
    },
  ]),
  ...road('might', 40, [
    {
      id: 'might_critdmg',
      kind: 'minor',
      icon: '💥',
      name: ['会心', 'Heavy Crit'],
      desc: ['暴击伤害 +{v}%', 'Crit damage +{v}%'],
      val: 6,
      max: 2,
      fx: { special: { critDmg: 6 } },
    },
    {
      id: 'might_boss',
      kind: 'star',
      icon: '👹',
      name: ['屠魔', 'Demon Slayer'],
      desc: ['对精英与 Boss 伤害 +{v}%', '+{v}% damage to elites and bosses'],
      val: 3,
      max: 5,
      fx: { bossDmg: 3 },
    },
    {
      id: 'might_lowhp',
      kind: 'notable',
      icon: '🩸',
      name: ['背水', 'Last Stand'],
      desc: ['生命低于 40% 时伤害 +{v}%', '+{v}% damage below 40% HP'],
      val: 6,
      max: 2,
      fx: { lowHpDmg: 6 },
    },
  ]),
  ...road('might', 110, [
    {
      id: 'might_dmg',
      kind: 'minor',
      icon: '🔪',
      name: ['锋芒', 'Sharpness'],
      desc: ['全伤害 +{v}%', 'All damage +{v}%'],
      val: 1,
      max: 2,
      fx: { mods: { damage: 1 } },
    },
    {
      id: 'might_crit2',
      kind: 'minor',
      icon: '🎲',
      name: ['弱点', 'Weak Spot'],
      desc: ['暴击率 +{v}%', 'Crit chance +{v}%'],
      val: 1,
      max: 2,
      fx: { mods: { crit: 1 } },
    },
    {
      id: 'might_key',
      kind: 'keystone',
      icon: '⚔️',
      name: ['斩杀', 'Execution'],
      desc: ['小怪生命低于 8% 时直接斩杀', 'Regular monsters below 8% HP are executed'],
      val: 8,
      max: 1,
      needPoints: 26,
      fx: { execute: 8 },
    },
  ]),
]);

// ---------------- 守护 ----------------
const GUARD = place('guard', [
  core('guard', {
    icon: '❤️',
    name: ['体魄', 'Constitution'],
    desc: ['最大生命 +{v}', 'Max HP +{v}'],
    val: 2,
    max: 3,
    fx: { mods: { maxHp: 2 } },
  }),
  ...road('guard', -145, [
    {
      id: 'guard_armor',
      kind: 'minor',
      icon: '🛡️',
      name: ['坚甲', 'Plating'],
      desc: ['护甲 +{v}', 'Armor +{v}'],
      val: 1,
      max: 3,
      fx: { mods: { armor: 1 } },
    },
    {
      id: 'guard_thorns',
      kind: 'minor',
      icon: '🌵',
      name: ['荆棘', 'Thorns'],
      desc: ['受到近身伤害时反弹 {v} 点', 'Reflect {v} damage when hit in melee'],
      val: 3,
      max: 2,
      fx: { special: { thorns: 3 } },
    },
    {
      id: 'guard_fortify',
      kind: 'notable',
      icon: '🧱',
      name: ['越战越勇', 'Hold the Line'],
      desc: ['受伤时获得 1 层坚韧（护甲 +2，持续 3 秒，最多 5 层）', 'Taking damage grants 1 Fortify stack (+2 armor, 3s, max 5)'],
      val: 1,
      max: 1,
      fx: { special: { onHurtSelf: [ST('fortify', 3)] } },
    },
  ]),
  ...road('guard', -80, [
    {
      id: 'guard_regen',
      kind: 'minor',
      icon: '🌿',
      name: ['再生', 'Regrowth'],
      desc: ['生命再生 +{v}（每 5 秒）', 'HP regen +{v} (per 5s)'],
      val: 1,
      max: 3,
      fx: { mods: { regen: 1 } },
    },
    {
      id: 'guard_fruit',
      kind: 'minor',
      icon: '🍎',
      name: ['果香', 'Fruity'],
      desc: ['果实回复量 +{v}%', 'Fruit healing +{v}%'],
      val: 15,
      max: 2,
      fx: { special: { fruitHeal: 15 } },
    },
    {
      id: 'guard_regen2',
      kind: 'minor',
      icon: '🌱',
      name: ['生机', 'Vitality'],
      desc: ['生命再生 +{v}（每 5 秒）', 'HP regen +{v} (per 5s)'],
      val: 1,
      max: 1,
      fx: { mods: { regen: 1 } },
    },
  ]),
  ...road('guard', -20, [
    {
      id: 'guard_ls',
      kind: 'minor',
      icon: '🧛',
      name: ['汲取', 'Leech'],
      desc: ['吸血 +{v}%', 'Life steal +{v}%'],
      val: 1,
      max: 3,
      fx: { mods: { lifeSteal: 1 } },
    },
    {
      id: 'guard_critheal',
      kind: 'notable',
      icon: '💗',
      name: ['痛快', 'Satisfying Hit'],
      desc: ['暴击时 {v}% 概率回复 1 生命', '{v}% chance to heal 1 HP on crit'],
      val: 15,
      max: 2,
      fx: { critHeal: 15 },
    },
  ]),
  ...road('guard', 50, [
    {
      id: 'guard_shield',
      kind: 'notable',
      icon: '🔰',
      name: ['护盾', 'Ward'],
      desc: ['每 15 秒获得一层抵挡一次伤害的护盾', 'Every 15s gain a shield that blocks one hit'],
      val: 15,
      max: 1,
      fx: { special: { shield: 15 } },
    },
    {
      id: 'guard_barrier',
      kind: 'notable',
      icon: '🫧',
      name: ['开战屏障', 'Opening Barrier'],
      desc: ['每波开始获得 3 秒屏障', 'Gain a 3s Barrier at the start of each wave'],
      val: 3,
      max: 1,
      fx: { special: { waveStartSelf: [ST('barrier', 3)] } },
    },
    {
      id: 'guard_cleanse',
      kind: 'notable',
      icon: '✨',
      name: ['净化', 'Purify'],
      desc: ['每 10 秒净化身上的减益', 'Cleanse debuffs every 10s'],
      val: 10,
      max: 1,
      fx: { special: { cleanseEvery: 10 } },
    },
  ]),
  ...road('guard', 115, [
    {
      id: 'guard_hp',
      kind: 'star',
      icon: '🫀',
      name: ['强健', 'Robust'],
      desc: ['最大生命 +{v}', 'Max HP +{v}'],
      val: 2,
      max: 5,
      fx: { mods: { maxHp: 2 } },
    },
    {
      id: 'guard_key',
      kind: 'keystone',
      icon: '🗿',
      name: ['不屈', 'Unyielding'],
      desc: [
        '每局一次：倒下时以 25% 生命站起来，并无敌 1.5 秒',
        'Once per run: get back up with 25% HP and 1.5s of invulnerability when you fall',
      ],
      val: 25,
      max: 1,
      needPoints: 24,
      fx: { cheatDeath: 25 },
    },
  ]),
]);

// ---------------- 迅捷 ----------------
const AGILITY = place('agility', [
  core('agility', {
    icon: '🍃',
    name: ['轻盈', 'Light Feet'],
    desc: ['移速 +{v}%', 'Move speed +{v}%'],
    val: 2,
    max: 3,
    fx: { mods: { speed: 2 } },
  }),
  ...road('agility', -140, [
    {
      id: 'agility_dodge',
      kind: 'minor',
      icon: '💨',
      name: ['身法', 'Footwork'],
      desc: ['闪避 +{v}%', 'Dodge +{v}%'],
      val: 1,
      max: 2,
      fx: { mods: { dodge: 1 } },
    },
    {
      id: 'agility_knives',
      kind: 'star',
      icon: '🔪',
      name: ['袖里飞刀', 'Hidden Knives'],
      desc: ['闪避时向最近的敌人掷出 {v} 把飞刀', 'On dodge, throw {v} knife(s) at nearby enemies'],
      val: 1,
      max: 5,
      fx: { dodgeKnives: 1 },
    },
    {
      id: 'agility_afterimage',
      kind: 'notable',
      icon: '👥',
      name: ['残影', 'Afterimage'],
      desc: ['闪避后获得 1.5 秒急速', 'Gain Haste for 1.5s after dodging'],
      val: 1,
      max: 1,
      fx: { special: { onDodgeSelf: [ST('haste', 1.5)] } },
    },
  ]),
  ...road('agility', -70, [
    {
      id: 'agility_as',
      kind: 'minor',
      icon: '⚡',
      name: ['手快', 'Quick Hands'],
      desc: ['攻速 +{v}%', 'Attack speed +{v}%'],
      val: 2,
      max: 3,
      fx: { mods: { attackSpeed: 2 } },
    },
    {
      id: 'agility_gale',
      kind: 'notable',
      icon: '🌬️',
      name: ['疾风', 'Gale'],
      desc: ['击杀时获得 1 秒急速', 'Gain Haste for 1s on kill'],
      val: 1,
      max: 1,
      fx: { special: { onKillSelf: [ST('haste', 1)] } },
    },
    {
      id: 'agility_as2',
      kind: 'minor',
      icon: '🏹',
      name: ['连射', 'Volley'],
      desc: ['攻速 +{v}%', 'Attack speed +{v}%'],
      val: 2,
      max: 1,
      fx: { mods: { attackSpeed: 2 } },
    },
  ]),
  ...road('agility', -5, [
    {
      id: 'agility_pickup',
      kind: 'minor',
      icon: '🧲',
      name: ['磁吸', 'Magnet'],
      desc: ['拾取距离 +{v}', 'Pickup range +{v}'],
      val: 10,
      max: 2,
      fx: { mods: { pickup: 10 } },
    },
    {
      id: 'agility_xp',
      kind: 'minor',
      icon: '📖',
      name: ['机敏', 'Quick Study'],
      desc: ['经验获取 +{v}%', 'XP gain +{v}%'],
      val: 4,
      max: 2,
      fx: { mods: { xpGain: 4 } },
    },
  ]),
  ...road('agility', 60, [
    {
      id: 'agility_speed',
      kind: 'minor',
      icon: '👟',
      name: ['疾行', 'Sprint'],
      desc: ['移速 +{v}%', 'Move speed +{v}%'],
      val: 2,
      max: 2,
      fx: { mods: { speed: 2 } },
    },
    {
      id: 'agility_dodge2',
      kind: 'minor',
      icon: '🌪️',
      name: ['风行', 'Windwalk'],
      desc: ['闪避 +{v}%', 'Dodge +{v}%'],
      val: 1,
      max: 2,
      fx: { mods: { dodge: 1 } },
    },
    {
      id: 'agility_focus',
      kind: 'notable',
      icon: '🎯',
      name: ['见切', 'Read the Blade'],
      desc: ['闪避后获得 2 秒专注（暴击率 +5%）', 'Gain Focus (+5% crit) for 2s after dodging'],
      val: 1,
      max: 1,
      fx: { special: { onDodgeSelf: [ST('focus', 2)] } },
    },
  ]),
  ...road('agility', 125, [
    {
      id: 'agility_range',
      kind: 'minor',
      icon: '📏',
      name: ['身长', 'Reach'],
      desc: ['射程 +{v}', 'Range +{v}'],
      val: 10,
      max: 2,
      fx: { mods: { range: 10 } },
    },
    {
      id: 'agility_key',
      kind: 'keystone',
      icon: '🥷',
      name: ['影舞', 'Shadow Dance'],
      desc: ['闪避后 0.35 秒内无敌，并额外掷出 2 把飞刀', 'Invulnerable for 0.35s after dodging, and throw 2 extra knives'],
      val: 1,
      max: 1,
      needPoints: 24,
      fx: { special: { onDodgeSelf: [ST('invuln', 0.35)] }, dodgeKnives: 2 },
    },
  ]),
]);

// ---------------- 奥术 ----------------
const ARCANE = place('arcane', [
  core('arcane', {
    icon: '🔮',
    name: ['灵思', 'Insight'],
    desc: ['技能伤害 +{v}%', 'Skill damage +{v}%'],
    val: 4,
    max: 3,
    fx: { mods: { skillDmg: 4 } },
  }),
  ...road('arcane', -140, [
    {
      id: 'arcane_cd',
      kind: 'minor',
      icon: '⏳',
      name: ['冥想', 'Meditation'],
      desc: ['技能冷却 -{v}%', 'Skill cooldown -{v}%'],
      val: 3,
      max: 3,
      fx: { mods: { skillCd: 3 } },
    },
    {
      id: 'arcane_echo',
      kind: 'star',
      icon: '🔁',
      name: ['回响', 'Echo'],
      desc: ['释放技能后 {v}% 概率立刻冷却完毕', '{v}% chance for your skill to come off cooldown instantly'],
      val: 5,
      max: 5,
      fx: { skillEcho: 5 },
    },
  ]),
  ...road('arcane', -75, [
    {
      id: 'arcane_heal',
      kind: 'star',
      icon: '💖',
      name: ['灵泉', 'Wellspring'],
      desc: ['释放技能时回复 {v}% 最大生命', 'Heal {v}% max HP when you cast your skill'],
      val: 0.5,
      max: 5,
      fx: { castHeal: 0.5 },
    },
    {
      id: 'arcane_ward',
      kind: 'notable',
      icon: '🌐',
      name: ['法力屏障', 'Mana Ward'],
      desc: ['释放技能后获得 2 秒屏障', 'Gain a 2s Barrier after casting'],
      val: 2,
      max: 1,
      fx: { castSelf: [ST('barrier', 2)] },
    },
  ]),
  ...road('arcane', -10, [
    {
      id: 'arcane_range',
      kind: 'minor',
      icon: '🌌',
      name: ['广域', 'Wide Cast'],
      desc: ['技能范围 +{v}%', 'Skill area +{v}%'],
      val: 5,
      max: 3,
      fx: { mods: { skillRange: 5 } },
    },
    {
      id: 'arcane_dur',
      kind: 'minor',
      icon: '⌛',
      name: ['延时', 'Lingering'],
      desc: ['技能持续时间 +{v}%', 'Skill duration +{v}%'],
      val: 6,
      max: 3,
      fx: { mods: { skillDur: 6 } },
    },
  ]),
  ...road('arcane', 55, [
    {
      id: 'arcane_xp',
      kind: 'minor',
      icon: '📚',
      name: ['博览', 'Well Read'],
      desc: ['经验获取 +{v}%', 'XP gain +{v}%'],
      val: 4,
      max: 3,
      fx: { mods: { xpGain: 4 } },
    },
    {
      id: 'arcane_choice',
      kind: 'notable',
      icon: '🃏',
      name: ['博学', 'Erudite'],
      desc: ['升级时多 1 个选项', 'One extra choice when leveling up'],
      val: 1,
      max: 1,
      fx: { levelChoices: 1 },
    },
  ]),
  ...road('arcane', 120, [
    {
      id: 'arcane_dmg',
      kind: 'minor',
      icon: '✴️',
      name: ['咒力', 'Spellpower'],
      desc: ['技能伤害 +{v}%', 'Skill damage +{v}%'],
      val: 4,
      max: 3,
      fx: { mods: { skillDmg: 4 } },
    },
    {
      id: 'arcane_cd2',
      kind: 'minor',
      icon: '🕰️',
      name: ['时序', 'Timekeeper'],
      desc: ['技能冷却 -{v}%', 'Skill cooldown -{v}%'],
      val: 3,
      max: 2,
      fx: { mods: { skillCd: 3 } },
    },
    {
      id: 'arcane_key',
      kind: 'keystone',
      icon: '🌠',
      name: ['奥术涌动', 'Arcane Surge'],
      desc: ['释放技能后 4 秒内获得 5 层怒气（伤害 +20%）与急速', 'For 4s after casting gain 5 Rage stacks (+20% damage) and Haste'],
      val: 1,
      max: 1,
      needPoints: 24,
      fx: { castSelf: [ST('rage', 4, undefined, 5), ST('haste', 4)] },
    },
  ]),
]);

// ---------------- 丰收 ----------------
const FORTUNE = place('fortune', [
  core('fortune', {
    icon: '🌾',
    name: ['丰饶', 'Abundance'],
    desc: ['收获 +{v}', 'Harvest +{v}'],
    val: 3,
    max: 3,
    fx: { mods: { harvest: 3 } },
  }),
  ...road('fortune', -145, [
    {
      id: 'fortune_luck',
      kind: 'minor',
      icon: '🍀',
      name: ['好运', 'Lucky'],
      desc: ['幸运 +{v}', 'Luck +{v}'],
      val: 4,
      max: 3,
      fx: { mods: { luck: 4 } },
    },
    {
      id: 'fortune_double',
      kind: 'minor',
      icon: '🐱',
      name: ['招财', 'Lucky Cat'],
      desc: ['{v}% 概率番茄籽翻倍', '{v}% chance to double Seeds'],
      val: 3,
      max: 2,
      fx: { special: { doubleSeed: 3 } },
    },
    {
      id: 'fortune_crate',
      kind: 'notable',
      icon: '🎁',
      name: ['寻宝', 'Treasure Hunter'],
      desc: ['宝箱掉率 ×1.25', 'Crate drop rate ×1.25'],
      val: 1,
      max: 1,
      fx: { special: { crateMult: 1.25 } },
    },
  ]),
  ...road('fortune', -75, [
    {
      id: 'fortune_seed',
      kind: 'star',
      icon: '💰',
      name: ['本金', 'Nest Egg'],
      desc: ['开局获得 {v} 番茄籽', 'Start each run with {v} Seeds'],
      val: 12,
      max: 5,
      fx: { startSeeds: 12 },
    },
    {
      id: 'fortune_interest',
      kind: 'minor',
      icon: '🏦',
      name: ['利滚利', 'Compound'],
      desc: ['每波结束获得 {v}% 利息', 'Earn {v}% interest at wave end'],
      val: 3,
      max: 2,
      fx: { special: { interest: 3 } },
    },
  ]),
  ...road('fortune', -10, [
    {
      id: 'fortune_discount',
      kind: 'minor',
      icon: '🏷️',
      name: ['砍价', 'Haggler'],
      desc: ['商店价格 -{v}%', 'Shop prices -{v}%'],
      val: 2,
      max: 3,
      fx: { special: { shopDiscount: 2 } },
    },
    {
      id: 'fortune_reroll',
      kind: 'notable',
      icon: '🔄',
      name: ['熟客', 'Regular'],
      desc: ['每次商店第一次刷新免费', 'First reroll in each shop is free'],
      val: 1,
      max: 1,
      fx: { freeRerolls: 1 },
    },
    {
      id: 'fortune_rerollcap',
      kind: 'minor',
      icon: '🎟️',
      name: ['常客卡', 'Loyalty Card'],
      desc: ['每波商店刷新次数上限 +{v}', 'Shop reroll limit +{v}'],
      val: 1,
      max: 2,
      fx: { special: { rerolls: 1 } },
    },
  ]),
  ...road('fortune', 60, [
    {
      id: 'fortune_pickup',
      kind: 'minor',
      icon: '🧲',
      name: ['拾穗', 'Gleaning'],
      desc: ['拾取距离 +{v}', 'Pickup range +{v}'],
      val: 15,
      max: 2,
      fx: { mods: { pickup: 15 } },
    },
    {
      id: 'fortune_killseed',
      kind: 'minor',
      icon: '🌰',
      name: ['捡漏', 'Scavenger'],
      desc: ['击杀时 {v}% 概率额外掉落 1 番茄籽', '{v}% chance for kills to drop an extra Seed'],
      val: 3,
      max: 3,
      fx: { killSeeds: 3 },
    },
  ]),
  ...road('fortune', 125, [
    {
      id: 'fortune_harvest',
      kind: 'minor',
      icon: '🧺',
      name: ['勤耕', 'Diligence'],
      desc: ['收获 +{v}', 'Harvest +{v}'],
      val: 3,
      max: 3,
      fx: { mods: { harvest: 3 } },
    },
    {
      id: 'fortune_key',
      kind: 'keystone',
      icon: '👑',
      name: ['点石成金', 'Midas Touch'],
      desc: ['升级时多 1 个选项，每次商店多 1 次免费刷新', 'One extra level-up choice and one more free reroll per shop'],
      val: 1,
      max: 1,
      needPoints: 24,
      fx: { levelChoices: 1, freeRerolls: 1 },
    },
  ]),
]);

// ---------------- 炼金 ----------------
const ALCHEMY = place('alchemy', [
  core('alchemy', {
    icon: '⚗️',
    name: ['药理', 'Pharmacology'],
    desc: ['持续伤害 +{v}%', 'Damage over time +{v}%'],
    val: 5,
    max: 3,
    fx: { special: { statusDmg: 5 } },
  }),
  ...road('alchemy', -145, [
    {
      id: 'alchemy_burn',
      kind: 'minor',
      icon: '🔥',
      name: ['引火', 'Kindling'],
      desc: ['命中时 {v}% 概率灼烧', '{v}% chance to Burn on hit'],
      val: 3,
      max: 3,
      fx: { special: { burnChance: 3 } },
    },
    {
      id: 'alchemy_boom',
      kind: 'minor',
      icon: '💣',
      name: ['爆燃', 'Combustion'],
      desc: ['击杀时 {v}% 概率爆炸', '{v}% chance for kills to explode'],
      val: 6,
      max: 2,
      fx: { special: { explodeOnKill: { chance: 6, dmg: 15 } } },
    },
  ]),
  ...road('alchemy', -85, [
    {
      id: 'alchemy_poison',
      kind: 'minor',
      icon: '☠️',
      name: ['淬毒', 'Envenom'],
      desc: ['命中时 {v}% 概率施加 2 层中毒', '{v}% chance to apply 2 Poison on hit'],
      val: 5,
      max: 3,
      fx: { special: { onHit: [ST('poison', 3, 5, 2)] } },
    },
    {
      id: 'alchemy_corrode',
      kind: 'minor',
      icon: '🧪',
      name: ['腐蚀', 'Corrode'],
      desc: ['命中时 {v}% 概率破甲', '{v}% chance to Armor Break on hit'],
      val: 4,
      max: 2,
      fx: { special: { onHit: [ST('armorBreak', 3, 4)] } },
    },
  ]),
  ...road('alchemy', -25, [
    {
      id: 'alchemy_spark',
      kind: 'minor',
      icon: '⚡',
      name: ['电弧', 'Arc'],
      desc: ['命中时 {v}% 概率触发闪电', '{v}% chance to trigger lightning on hit'],
      val: 2,
      max: 3,
      fx: { special: { lightningOnHit: 2 } },
    },
    {
      id: 'alchemy_stun',
      kind: 'notable',
      icon: '💫',
      name: ['麻痹', 'Paralyze'],
      desc: ['命中时 3% 概率眩晕 0.6 秒', '3% chance to Stun for 0.6s on hit'],
      val: 3,
      max: 1,
      fx: { special: { onHit: [ST('stun', 0.6, 3)] } },
    },
  ]),
  ...road('alchemy', 40, [
    {
      id: 'alchemy_slow',
      kind: 'minor',
      icon: '🧊',
      name: ['寒露', 'Chill'],
      desc: ['命中时 {v}% 概率减速', '{v}% chance to Slow on hit'],
      val: 6,
      max: 3,
      fx: { special: { onHit: [ST('slow', 2, 6)] } },
    },
    {
      id: 'alchemy_freeze',
      kind: 'minor',
      icon: '❄️',
      name: ['冰封', 'Deep Freeze'],
      desc: ['命中时 {v}% 概率冰冻', '{v}% chance to Freeze on hit'],
      val: 2,
      max: 2,
      fx: { special: { onHit: [ST('freeze', 1, 2)] } },
    },
  ]),
  ...road('alchemy', 105, [
    {
      id: 'alchemy_flat',
      kind: 'minor',
      icon: '🔮',
      name: ['元素亲和', 'Attunement'],
      desc: ['元素伤害 +{v}', 'Elemental +{v}'],
      val: 1,
      max: 3,
      fx: { mods: { elemental: 1 } },
    },
    {
      id: 'alchemy_dot',
      kind: 'minor',
      icon: '🫗',
      name: ['浓缩', 'Concentrate'],
      desc: ['持续伤害 +{v}%', 'Damage over time +{v}%'],
      val: 5,
      max: 2,
      fx: { special: { statusDmg: 5 } },
    },
    {
      id: 'alchemy_key',
      kind: 'keystone',
      icon: '☢️',
      name: ['连锁反应', 'Chain Reaction'],
      desc: ['击杀时 30% 概率引发大爆炸', '30% chance for kills to cause a big explosion'],
      val: 30,
      max: 1,
      needPoints: 24,
      fx: { special: { explodeOnKill: { chance: 30, dmg: 25 } } },
    },
  ]),
]);

export const TALENT_NODES: TalentNode[] = [...MIGHT, ...GUARD, ...AGILITY, ...ARCANE, ...FORTUNE, ...ALCHEMY];
export const TALENT_MAP: Record<string, TalentNode> = Object.fromEntries(TALENT_NODES.map((n) => [n.id, n]));
export const BRANCH_MAP: Record<BranchId, BranchDef> = Object.fromEntries(BRANCHES.map((b) => [b.id, b])) as Record<BranchId, BranchDef>;
/** 某方向全部点满所需的点数 */
export const branchCost = (b: BranchId): number => TALENT_NODES.filter((n) => n.branch === b).reduce((s, n) => s + n.max, 0);
