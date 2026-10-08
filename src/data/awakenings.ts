// 1.4.0 F2：角色觉醒。完成该角色 3 个专属任务后可开启（save.meta.awaken[charId]）。
// 每名角色一个"改变玩法"的被动，强度约等于一件史诗道具，只用现有 StatMods 与 ItemSpecial 字段表达。
// 约定：觉醒的 special 尽量不与角色自身 special 使用同一字段，合并时不必考虑同字段叠加规则（quests.test.ts 会校验）。
// desc 为手写文案，数值必须与 mods / special 一致。
import type { StatMods } from './stats';
import type { ItemSpecial } from './items';
import type { StatusApply } from './statuses';

export interface AwakeningDef {
  charId: string;
  name: [string, string];
  desc: [string, string];
  mods?: StatMods;
  special?: ItemSpecial;
}

/** 状态施加简写：持续 dur 秒、stacks 层、chance% 概率（不填为必定） */
const S = (id: StatusApply['id'], dur: number, stacks = 1, chance?: number): StatusApply => ({ id, dur, stacks, chance });

const LIST: AwakeningDef[] = [
  {
    charId: 'tomato',
    name: ['番茄酱飞溅', 'Ketchup Splash'],
    desc: ['击杀敌人 12% 概率爆炸（20 点伤害）；+5% 伤害', 'Kills have a 12% chance to explode (20 damage); +5% damage'],
    mods: { damage: 5 },
    special: { explodeOnKill: { chance: 12, dmg: 20 } },
  },
  {
    charId: 'carrot',
    name: ['圣骑士之誓', "Paladin's Oath"],
    desc: ['受伤时反弹 20 点伤害，并获得 2 层坚韧（4 秒）；+2 护甲', 'Reflect 20 damage when hit and gain 2 Fortify stacks (4s); +2 armor'],
    mods: { armor: 2 },
    special: { thorns: 20, onHurtSelf: [S('fortify', 4, 2)] },
  },
  {
    charId: 'chili',
    name: ['烈焰护体', 'Flame Mantle'],
    desc: [
      '每 1 秒使周围 130 范围内敌人灼烧 1 层（2 秒）；+2 元素伤害',
      'Every 1s, burn enemies within 130 range for 1 stack (2s); +2 elemental damage',
    ],
    mods: { elemental: 2 },
    special: { aura: { radius: 130, every: 1, status: [S('burn', 2, 1)] } },
  },
  {
    charId: 'corn',
    name: ['神枪手', 'Deadeye'],
    desc: ['+4% 暴击率；+40 射程，+2 远程伤害', '+4% crit chance; +40 range, +2 ranged damage'],
    mods: { range: 40, ranged: 2, crit: 4 },
  },
  {
    charId: 'watermelon',
    name: ['西瓜籽重生', 'Seed Rebirth'],
    desc: ['每局获得 1 次复活；+5 最大生命', 'Gain 1 revive per run; +5 max HP'],
    mods: { maxHp: 5 },
    special: { revive: 1 },
  },
  {
    charId: 'lemon',
    name: ['酸蚀刀锋', 'Acid Edge'],
    desc: ['命中 25% 概率使敌人破甲 1 层（4 秒）；+5% 暴击率', 'Hits have a 25% chance to Armor Break for 1 stack (4s); +5% crit chance'],
    mods: { crit: 5 },
    special: { onHit: [S('armorBreak', 4, 1, 25)] },
  },
  {
    charId: 'eggplant',
    name: ['雷暴护体', 'Storm Shroud'],
    desc: ['每 3 秒使周围 160 范围内敌人眩晕 0.3 秒；+2 元素伤害', 'Every 3s, stun enemies within 160 range for 0.3s; +2 elemental damage'],
    mods: { elemental: 2 },
    special: { aura: { radius: 160, every: 3, status: [S('stun', 0.3)] } },
  },
  {
    charId: 'garlic',
    name: ['鲜血契约', 'Blood Pact'],
    desc: [
      '每击杀 6 名敌人回复 1 生命；命中 15% 概率流血 1 层（3 秒）',
      'Heal 1 HP every 6 kills; hits have a 15% chance to Bleed for 1 stack (3s)',
    ],
    special: { killHeal: 6, onHit: [S('bleed', 3, 1, 15)] },
  },
  {
    charId: 'blueberry',
    name: ['三胞胎', 'Triplets'],
    desc: ['武器栏 +1；+4% 伤害', '+1 weapon slot; +4% damage'],
    mods: { damage: 4 },
    special: { weaponSlot: 1 },
  },
  {
    charId: 'pineapple',
    name: ['藏宝图', 'Treasure Map'],
    desc: ['番茄籽 15% 概率翻倍；每波商店刷新次数上限 +1', '15% chance to double Seeds; +1 shop reroll limit per wave'],
    special: { doubleSeed: 15, rerolls: 1 },
  },
  {
    charId: 'pumpkin',
    name: ['南瓜灯', "Jack-o'-Lantern"],
    desc: ['闪避成功时获得 2 层急速与 3 层怒气（2 秒）；+5% 闪避', 'On dodge, gain 2 Haste and 3 Rage stacks (2s); +5% dodge'],
    mods: { dodge: 5 },
    special: { onDodgeSelf: [S('haste', 2, 2), S('rage', 2, 3)] },
  },
  {
    charId: 'strawberry',
    name: ['安可', 'Encore'],
    desc: ['每波开始获得 3 层急速与 3 层专注（8 秒）；+20% 经验获取', 'At wave start, gain 3 Haste and 3 Focus stacks (8s); +20% XP gain'],
    mods: { xpGain: 20 },
    special: { waveStartSelf: [S('haste', 8, 3), S('focus', 8, 3)] },
  },
  {
    charId: 'ginger',
    name: ['影分身之术', 'Shadow Step'],
    desc: [
      '命中 20% 概率流血 1 层（3 秒）；+3 移动速度，+5% 攻速',
      'Hits have a 20% chance to Bleed for 1 stack (3s); +3 Move Speed, +5% attack speed',
    ],
    mods: { speed: 3, attackSpeed: 5 },
    special: { onHit: [S('bleed', 3, 1, 20)] },
  },
  {
    charId: 'avocado',
    name: ['临界质量', 'Critical Mass'],
    desc: [
      '命中 15% 概率灼烧 1 层（2 秒）；+35% 爆炸范围，+2 元素伤害',
      'Hits have a 15% chance to Burn for 1 stack (2s); +35% explosion size, +2 elemental damage',
    ],
    mods: { explodeSize: 35, elemental: 2 },
    special: { onHit: [S('burn', 2, 1, 15)] },
  },
  {
    charId: 'onion',
    name: ['催泪烟云', 'Tear Cloud'],
    desc: ['每 2 秒使周围 140 范围内敌人致盲 1 秒；+2 护甲', 'Every 2s, blind enemies within 140 range for 1s; +2 armor'],
    mods: { armor: 2 },
    special: { aura: { radius: 140, every: 2, status: [S('blind', 1)] } },
  },
  {
    charId: 'mushroom',
    name: ['孢子迷雾', 'Spore Mist'],
    desc: [
      '每 1 秒使周围 150 范围内敌人中毒 1 层（2 秒）；+2 元素伤害',
      'Every 1s, poison enemies within 150 range for 1 stack (2s); +2 elemental damage',
    ],
    mods: { elemental: 2 },
    special: { aura: { radius: 150, every: 1, status: [S('poison', 2, 1)] } },
  },
  {
    charId: 'coconut',
    name: ['铁壳', 'Iron Shell'],
    desc: [
      '受伤时反弹 12 点伤害，并获得 2 层坚韧（4 秒）；+2 近战伤害',
      'Reflect 12 damage when hit and gain 2 Fortify stacks (4s); +2 melee damage',
    ],
    mods: { melee: 2 },
    special: { thorns: 12, onHurtSelf: [S('fortify', 4, 2)] },
  },
  {
    charId: 'grape',
    name: ['帽子戏法', 'Hat Trick'],
    desc: ['命中 8% 概率使敌人混乱 2 秒；+4 幸运', 'Hits have an 8% chance to Confuse for 2s; +4 luck'],
    mods: { luck: 4 },
    special: { onHit: [S('confuse', 2, 1, 8)] },
  },
  {
    charId: 'cherry',
    name: ['弹雨狂欢', 'Bullet Frenzy'],
    desc: ['+5% 伤害；+8% 攻速', '+5% damage; +8% attack speed'],
    mods: { attackSpeed: 8, damage: 5 },
  },
  {
    charId: 'pea',
    name: ['增援部队', 'Reinforcements'],
    desc: ['武器栏 +1；+1 远程伤害', '+1 weapon slot; +1 ranged damage'],
    mods: { ranged: 1 },
    special: { weaponSlot: 1 },
  },
  {
    charId: 'peach',
    name: ['圣光', 'Holy Light'],
    desc: ['每 10 秒获得 3 层再生（5 秒），并每 10 秒净化减益', 'Every 10s, gain 3 Regen stacks (5s) and cleanse debuffs'],
    special: { periodicSelf: { every: 10, status: [S('regen', 5, 3)] }, cleanseEvery: 10 },
  },
  {
    charId: 'dragonfruit',
    name: ['龙鳞烈焰', 'Dragonscale Blaze'],
    desc: [
      '每 1 秒使周围 120 范围内敌人灼烧 1 层（2 秒）；+2 近战伤害',
      'Every 1s, burn enemies within 120 range for 1 stack (2s); +2 melee damage',
    ],
    mods: { melee: 2 },
    special: { aura: { radius: 120, every: 1, status: [S('burn', 2, 1)] } },
  },
  {
    charId: 'beet',
    name: ['嗜血狂潮', 'Bloodlust'],
    desc: ['每击杀 10 名敌人回复 1 生命；+3% 吸血概率；+5% 伤害', 'Heal 1 HP every 10 kills; +3% life steal chance; +5% damage'],
    mods: { damage: 5, lifeSteal: 3 },
    special: { killHeal: 10 },
  },
  {
    charId: 'asparagus',
    name: ['鹰眼', 'Hawkeye'],
    desc: ['暴击伤害 +35%；+30 射程', '+35% crit damage; +30 range'],
    mods: { range: 30 },
    special: { critDmg: 35 },
  },
  {
    charId: 'sweetpotato',
    name: ['秘制酱料', 'Secret Sauce'],
    desc: [
      '番茄籽 12% 概率翻倍；每波开始获得 3 层再生（10 秒）；+10 收获',
      '12% chance to double Seeds; gain 3 Regen stacks (10s) at wave start; +10 harvest',
    ],
    mods: { harvest: 10 },
    special: { doubleSeed: 12, waveStartSelf: [S('regen', 10, 3)] },
  },
  {
    charId: 'kiwi',
    name: ['放大镜', 'Magnifier'],
    desc: [
      '每 2 秒以 25% 概率标记周围 180 范围内的敌人（2 秒）；+2 幸运',
      'Every 2s, 25% chance to Mark each enemy within 180 range (2s); +2 luck',
    ],
    mods: { luck: 2 },
    special: { aura: { radius: 180, every: 2, status: [S('mark', 2, 1, 25)] } },
  },
  {
    charId: 'lychee',
    name: ['王室宝库', 'Royal Treasury'],
    desc: ['番茄籽 20% 概率翻倍；每波商店刷新次数上限 +1；+4 幸运', '20% chance to double Seeds; +1 shop reroll limit per wave; +4 luck'],
    mods: { luck: 4 },
    special: { doubleSeed: 20, rerolls: 1 },
  },
  {
    charId: 'durian',
    name: ['毒刺外壳', 'Venom Husk'],
    desc: ['受伤时使攻击者中毒 2 层（4 秒）；+2 护甲', 'When hit, poison the attacker for 2 stacks (4s); +2 armor'],
    mods: { armor: 2 },
    special: { onHurtEnemy: [S('poison', 4, 2)] },
  },
  {
    charId: 'bellpepper',
    name: ['副武器挂架', 'Hardpoint'],
    desc: ['武器栏 +1；+2 护甲', '+1 weapon slot; +2 armor'],
    mods: { armor: 2 },
    special: { weaponSlot: 1 },
  },
  {
    charId: 'wintermelon',
    name: ['金身', 'Golden Body'],
    desc: [
      '每 15 秒获得 5 层坚韧（5 秒），并每 12 秒净化减益；+2 生命再生',
      'Every 15s, gain 5 Fortify stacks (5s); cleanse debuffs every 12s; +2 HP regen',
    ],
    mods: { regen: 2 },
    special: { periodicSelf: { every: 15, status: [S('fortify', 5, 5)] }, cleanseEvery: 12 },
  },
  {
    charId: 'bittermelon',
    name: ['极寒光环', 'Frost Aura'],
    desc: [
      '每 1.5 秒使周围 140 范围内敌人减速 2 层（1.5 秒）；+2 元素伤害',
      'Every 1.5s, slow enemies within 140 range by 2 stacks (1.5s); +2 elemental damage',
    ],
    mods: { elemental: 2 },
    special: { aura: { radius: 140, every: 1.5, status: [S('slow', 1.5, 2)] } },
  },
  {
    charId: 'sprout',
    name: ['参天大树', 'Mighty Oak'],
    desc: ['每 20 秒获得 2 层急速（4 秒）；+10 最大生命，+30% 经验获取', 'Every 20s, gain 2 Haste stacks (4s); +10 max HP, +30% XP gain'],
    mods: { maxHp: 10, xpGain: 30 },
    special: { periodicSelf: { every: 20, status: [S('haste', 4, 2)] } },
  },
  {
    charId: 'wasabi',
    name: ['辛辣冲击波', 'Pungent Shockwave'],
    desc: ['+5% 伤害；+40% 爆炸范围', '+5% damage; +40% explosion size'],
    mods: { explodeSize: 40, damage: 5 },
  },
  // ---------- 1.4.0 新角色 ----------
  {
    charId: 'soybean',
    name: ['豆兵大阵', 'Bean Legion'],
    desc: ['每 10 秒获得 1 层急速（3 秒）；+25% 技能伤害', 'Every 10s, gain 1 Haste stack (3s); +25% skill damage'],
    mods: { skillDmg: 25 },
    special: { periodicSelf: { every: 10, status: [S('haste', 3, 1)] } },
  },
  {
    charId: 'jackfruit',
    name: ['震慑之刺', 'Daunting Spikes'],
    desc: [
      '每 2 秒使周围 120 范围内敌人虚弱 1 层（2 秒）；+3 护甲',
      'Every 2s, Weaken enemies within 120 range for 1 stack (2s); +3 armor',
    ],
    mods: { armor: 3 },
    special: { aura: { radius: 120, every: 2, status: [S('weaken', 2, 1)] } },
  },
  {
    charId: 'pomegranate',
    name: ['爆浆石榴', 'Bursting Seeds'],
    desc: ['击杀敌人 15% 概率爆炸（18 点伤害）；+2 远程伤害', 'Kills have a 15% chance to explode (18 damage); +2 ranged damage'],
    mods: { ranged: 2 },
    special: { explodeOnKill: { chance: 15, dmg: 18 } },
  },
  {
    charId: 'taro',
    name: ['紫芋烈焰', 'Violet Blaze'],
    desc: ['命中 15% 概率灼烧；+20% 光环范围', '15% chance to Burn on hit; +20% aura size'],
    mods: { auraSize: 20 },
    special: { burnChance: 15 },
  },
  {
    charId: 'cabbage',
    name: ['千层护甲', 'Thousand Layers'],
    desc: ['每 10 秒获得泡泡护盾；+10 最大生命', 'Gain a bubble shield every 10s; +10 max HP'],
    mods: { maxHp: 10 },
    special: { shield: 10 },
  },
  {
    charId: 'blackberry',
    name: ['黑暗仪式', 'Dark Ritual'],
    desc: ['持续伤害 +30%；+4 幸运', 'Damage over time +30%; +4 luck'],
    mods: { luck: 4 },
    special: { statusDmg: 30 },
  },
];

export const AWAKENINGS: Record<string, AwakeningDef> = Object.fromEntries(LIST.map((a) => [a.charId, a]));
