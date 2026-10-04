// Buff / Debuff 定义。玩家与敌人共用同一套状态系统。
// 数值为“每层”效果；dps 类按层数叠加。
export type StatusId =
  // 减益
  | 'burn'
  | 'poison'
  | 'bleed'
  | 'slow'
  | 'freeze'
  | 'stun'
  | 'weaken'
  | 'vulnerable'
  | 'armorBreak'
  | 'curse'
  | 'blind'
  | 'confuse'
  | 'sticky'
  | 'mark'
  | 'silence'
  | 'rot'
  | 'soaked'
  | 'corrode'
  // 增益
  | 'haste'
  | 'rage'
  | 'shield'
  | 'regen'
  | 'fortify'
  | 'invuln'
  | 'thorns'
  | 'focus'
  | 'barrier'
  | 'enrage'
  | 'lucky'
  | 'vampiric'
  | 'tailwind'
  | 'hardened';

export interface StatusDef {
  id: StatusId;
  name: string;
  kind: 'buff' | 'debuff';
  color: number;
  glyph: string; // HUD 小图标上的字
  desc: string;
  maxStacks: number;
  // 效果（每层）
  dps?: number; // 持续伤害（每秒，按层）
  speed?: number; // 移速 %
  attackSpeed?: number; // 攻速 %
  dmgDealt?: number; // 造成伤害 %
  dmgTaken?: number; // 受到伤害 %
  armor?: number; // 护甲
  crit?: number; // 暴击 %
  dodge?: number; // 闪避 %
  range?: number; // 射程 %
  luck?: number;
  lifeSteal?: number;
  regen?: number; // 每秒回复
  disable?: boolean; // 无法行动（眩晕/冰冻）
  noHeal?: boolean; // 无法回复
  noAttack?: boolean; // 无法攻击（沉默/致盲的敌人）
  confuse?: boolean;
  immune?: boolean; // 无敌
  reflect?: number; // 反弹伤害（固定值，按层）
}

export const STATUSES: Record<StatusId, StatusDef> = {
  burn: { id: 'burn', name: '灼烧', kind: 'debuff', color: 0xff7b00, glyph: '火', desc: '每层每秒受到火焰伤害', maxStacks: 5, dps: 1 },
  poison: {
    id: 'poison',
    name: '中毒',
    kind: 'debuff',
    color: 0x70e000,
    glyph: '毒',
    desc: '每层每秒受到毒素伤害，可叠加 8 层',
    maxStacks: 8,
    dps: 0.5,
  },
  bleed: { id: 'bleed', name: '流血', kind: 'debuff', color: 0xd00000, glyph: '血', desc: '每层每秒流失生命', maxStacks: 5, dps: 1.2 },
  slow: { id: 'slow', name: '减速', kind: 'debuff', color: 0x48cae4, glyph: '缓', desc: '移动速度降低', maxStacks: 3, speed: -15 },
  freeze: {
    id: 'freeze',
    name: '冰冻',
    kind: 'debuff',
    color: 0xa9def9,
    glyph: '冰',
    desc: '无法行动，受到伤害 +20%',
    maxStacks: 1,
    disable: true,
    dmgTaken: 20,
  },
  stun: { id: 'stun', name: '眩晕', kind: 'debuff', color: 0xffd166, glyph: '晕', desc: '无法行动', maxStacks: 1, disable: true },
  weaken: { id: 'weaken', name: '虚弱', kind: 'debuff', color: 0x9d8189, glyph: '弱', desc: '造成的伤害降低', maxStacks: 3, dmgDealt: -12 },
  vulnerable: {
    id: 'vulnerable',
    name: '易伤',
    kind: 'debuff',
    color: 0xff006e,
    glyph: '伤',
    desc: '受到的伤害提高',
    maxStacks: 3,
    dmgTaken: 12,
  },
  armorBreak: {
    id: 'armorBreak',
    name: '破甲',
    kind: 'debuff',
    color: 0x8d99ae,
    glyph: '破',
    desc: '护甲降低',
    maxStacks: 5,
    armor: -2,
    dmgTaken: 5,
  },
  curse: {
    id: 'curse',
    name: '诅咒',
    kind: 'debuff',
    color: 0x7b2cbf,
    glyph: '咒',
    desc: '无法回复生命，受到伤害 +10%',
    maxStacks: 1,
    noHeal: true,
    dmgTaken: 10,
  },
  blind: {
    id: 'blind',
    name: '致盲',
    kind: 'debuff',
    color: 0x343a40,
    glyph: '盲',
    desc: '射程降低 30%（敌人无法射击）',
    maxStacks: 1,
    range: -30,
    noAttack: true,
  },
  confuse: { id: 'confuse', name: '混乱', kind: 'debuff', color: 0xf15bb5, glyph: '乱', desc: '移动方向紊乱', maxStacks: 1, confuse: true },
  sticky: { id: 'sticky', name: '黏液', kind: 'debuff', color: 0xb5e48c, glyph: '黏', desc: '移动速度大幅降低', maxStacks: 1, speed: -40 },
  mark: { id: 'mark', name: '标记', kind: 'debuff', color: 0xffbe0b, glyph: '标', desc: '下一次受到的攻击必定暴击', maxStacks: 1 },
  silence: {
    id: 'silence',
    name: '沉默',
    kind: 'debuff',
    color: 0x6c757d,
    glyph: '默',
    desc: '无法释放技能',
    maxStacks: 1,
    noAttack: true,
  },
  rot: {
    id: 'rot',
    name: '腐烂',
    kind: 'debuff',
    color: 0x6a994e,
    glyph: '腐',
    desc: '最大生命效果降低，攻速 -10%',
    maxStacks: 3,
    attackSpeed: -10,
    dps: 0.4,
  },
  // 1.4.0 新增（G9）：浸湿 / 腐蚀 / 顺风 / 硬化，全部走 StatusSet.recalc 的 totals 汇总
  soaked: {
    id: 'soaked',
    name: '浸湿',
    kind: 'debuff',
    color: 0x4895ef,
    glyph: '湿',
    desc: '每层移速 -10%、攻速 -8%，最多 3 层',
    maxStacks: 3,
    speed: -10,
    attackSpeed: -8,
  },
  corrode: {
    id: 'corrode',
    name: '腐蚀',
    kind: 'debuff',
    color: 0xa7c957,
    glyph: '蚀',
    desc: '每层每秒受到酸蚀伤害，受到伤害 +6%，最多 4 层',
    maxStacks: 4,
    dps: 0.3,
    dmgTaken: 6,
  },

  haste: {
    id: 'haste',
    name: '急速',
    kind: 'buff',
    color: 0x55efc4,
    glyph: '速',
    desc: '移速与攻速提高',
    maxStacks: 3,
    speed: 10,
    attackSpeed: 10,
  },
  rage: { id: 'rage', name: '怒气', kind: 'buff', color: 0xff4d4d, glyph: '怒', desc: '造成的伤害提高', maxStacks: 10, dmgDealt: 4 },
  shield: { id: 'shield', name: '护盾', kind: 'buff', color: 0x9bf6ff, glyph: '盾', desc: '抵挡等量伤害', maxStacks: 1 },
  regen: { id: 'regen', name: '再生', kind: 'buff', color: 0x52b788, glyph: '生', desc: '每层每秒回复 1 生命', maxStacks: 5, regen: 1 },
  fortify: { id: 'fortify', name: '坚韧', kind: 'buff', color: 0xb2bec3, glyph: '坚', desc: '护甲提高', maxStacks: 5, armor: 2 },
  invuln: { id: 'invuln', name: '无敌', kind: 'buff', color: 0xffffff, glyph: '无', desc: '免疫所有伤害', maxStacks: 1, immune: true },
  thorns: { id: 'thorns', name: '荆棘', kind: 'buff', color: 0x6a994e, glyph: '刺', desc: '反弹近身伤害', maxStacks: 5, reflect: 5 },
  focus: { id: 'focus', name: '专注', kind: 'buff', color: 0xffd23f, glyph: '专', desc: '暴击率提高', maxStacks: 5, crit: 5 },
  barrier: {
    id: 'barrier',
    name: '屏障',
    kind: 'buff',
    color: 0x4cc9f0,
    glyph: '障',
    desc: '受到的伤害降低 40%',
    maxStacks: 1,
    dmgTaken: -40,
  },
  enrage: {
    id: 'enrage',
    name: '暴怒',
    kind: 'buff',
    color: 0xd00000,
    glyph: '暴',
    desc: '移速 +30%，伤害 +30%',
    maxStacks: 1,
    speed: 30,
    dmgDealt: 30,
  },
  lucky: { id: 'lucky', name: '好运', kind: 'buff', color: 0xfdcb6e, glyph: '运', desc: '幸运提高', maxStacks: 5, luck: 10 },
  vampiric: {
    id: 'vampiric',
    name: '嗜血',
    kind: 'buff',
    color: 0x9d0208,
    glyph: '嗜',
    desc: '吸血概率每层 +4%',
    maxStacks: 5,
    lifeSteal: 4,
  },
  tailwind: {
    id: 'tailwind',
    name: '顺风',
    kind: 'buff',
    color: 0xcaf0f8,
    glyph: '风',
    desc: '每层移速 +12%、闪避 +4%，最多 3 层',
    maxStacks: 3,
    speed: 12,
    dodge: 4,
  },
  hardened: {
    id: 'hardened',
    name: '硬化',
    kind: 'buff',
    color: 0xe9c46a,
    glyph: '硬',
    desc: '每层护甲 +3、受到伤害 -10%，最多 2 层',
    maxStacks: 2,
    armor: 3,
    dmgTaken: -10,
  },
};

export const DEBUFF_IDS = (Object.keys(STATUSES) as StatusId[]).filter((k) => STATUSES[k].kind === 'debuff');
export const BUFF_IDS = (Object.keys(STATUSES) as StatusId[]).filter((k) => STATUSES[k].kind === 'buff');

/** 状态施加描述（技能/子弹/道具/词缀使用） */
export interface StatusApply {
  id: StatusId;
  dur: number;
  stacks?: number;
  chance?: number; // 0~100，默认 100
  value?: number; // 护盾值等
}
