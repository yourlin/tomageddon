// 角色属性系统（属性面板）
export interface Stats {
  maxHp: number; // 最大生命
  regen: number; // 生命再生：每 5 秒回复 regen 点
  lifeSteal: number; // 吸血 %：每次命中有该概率回复 1 点生命
  damage: number; // 全伤害 %：所有武器伤害乘算（少量来源：部分角色、天赋与经典道具）
  meleePct: number; // 近战武器伤害 %
  rangedPct: number; // 远程武器伤害 %
  elementalPct: number; // 元素武器伤害 %
  auraPct: number; // 光环武器伤害 %（光环不吃元素/近战/远程伤害 %）
  auraSize: number; // 光环范围 %（射程不影响光环）
  melee: number; // 近战伤害（加成数值，按武器系数计入）
  ranged: number; // 远程伤害
  elemental: number; // 元素伤害
  attackSpeed: number; // 攻速 %
  crit: number; // 暴击率 %
  range: number; // 射程（像素，近战计一半）
  armor: number; // 护甲：减伤 = 15 / (15 + armor)
  dodge: number; // 闪避 %
  speed: number; // 移速 %
  luck: number; // 幸运：影响商店稀有度、掉落
  harvest: number; // 收获：每波结束获得等量番茄籽与经验，每波 +5%
  pickup: number; // 拾取范围（像素，加在基础半径上）
  xpGain: number; // 经验获取 %
  skillCd: number; // 技能冷却缩减 %
  skillDmg: number; // 技能伤害 %
  skillRange: number; // 技能范围 %
  skillDur: number; // 技能持续时间 %
}

export type StatKey = keyof Stats;
export type StatMods = Partial<Stats>;

export const BASE_STATS: Stats = {
  maxHp: 35,
  regen: 0,
  lifeSteal: 0,
  damage: 0,
  meleePct: 0,
  rangedPct: 0,
  elementalPct: 0,
  auraPct: 0,
  auraSize: 0,
  melee: 0,
  ranged: 0,
  elemental: 0,
  attackSpeed: 0,
  crit: 0,
  range: 0,
  armor: 0,
  dodge: 0,
  speed: 0,
  luck: 0,
  harvest: 0,
  pickup: 0,
  xpGain: 0,
  skillCd: 0,
  skillDmg: 0,
  skillRange: 0,
  skillDur: 0,
};

export const STAT_INFO: Record<StatKey, { name: string; pct?: boolean; color: string }> = {
  maxHp: { name: '最大生命', color: '#ff6b6b' },
  regen: { name: '生命再生', color: '#ff9f9f' },
  lifeSteal: { name: '吸血', pct: true, color: '#ff4d6d' },
  damage: { name: '全伤害', pct: true, color: '#ffb347' },
  meleePct: { name: '近战武器伤害', pct: true, color: '#ffd166' },
  rangedPct: { name: '远程武器伤害', pct: true, color: '#9be564' },
  elementalPct: { name: '元素武器伤害', pct: true, color: '#6ec6ff' },
  auraPct: { name: '光环伤害', pct: true, color: '#c77dff' },
  auraSize: { name: '光环范围', pct: true, color: '#e0aaff' },
  melee: { name: '近战伤害', color: '#ffd166' },
  ranged: { name: '远程伤害', color: '#9be564' },
  elemental: { name: '元素伤害', color: '#6ec6ff' },
  attackSpeed: { name: '攻击速度', pct: true, color: '#f7d794' },
  crit: { name: '暴击率', pct: true, color: '#ff7675' },
  range: { name: '射程', color: '#a29bfe' },
  armor: { name: '护甲', color: '#b2bec3' },
  dodge: { name: '闪避', pct: true, color: '#81ecec' },
  speed: { name: '移动速度', pct: true, color: '#55efc4' },
  luck: { name: '幸运', color: '#fdcb6e' },
  harvest: { name: '收获', color: '#e17055' },
  pickup: { name: '拾取范围', color: '#74b9ff' },
  xpGain: { name: '经验获取', pct: true, color: '#c39bd3' },
  skillCd: { name: '技能冷却缩减', pct: true, color: '#a0e7e5' },
  skillDmg: { name: '技能伤害', pct: true, color: '#ff70a6' },
  skillRange: { name: '技能范围', pct: true, color: '#9b5de5' },
  skillDur: { name: '技能持续', pct: true, color: '#00bbf9' },
};

export const STAT_ORDER: StatKey[] = [
  'maxHp',
  'regen',
  'lifeSteal',
  'damage',
  'meleePct',
  'rangedPct',
  'elementalPct',
  'auraPct',
  'auraSize',
  'melee',
  'ranged',
  'elemental',
  'attackSpeed',
  'crit',
  'range',
  'armor',
  'dodge',
  'speed',
  'luck',
  'harvest',
  'pickup',
  'xpGain',
  'skillCd',
  'skillDmg',
  'skillRange',
  'skillDur',
];

export function addMods(target: Stats, mods: StatMods, times = 1): void {
  for (const k in mods) {
    const key = k as StatKey;
    target[key] += (mods[key] ?? 0) * times;
  }
}

export function formatMod(key: StatKey, v: number): string {
  const info = STAT_INFO[key];
  const sign = v > 0 ? '+' : '';
  const num = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return `${sign}${num}${info.pct ? '%' : ''} ${info.name}`;
}

export function describeMods(mods: StatMods): string[] {
  return STAT_ORDER.filter((k) => mods[k] !== undefined && mods[k] !== 0).map((k) => formatMod(k, mods[k]!));
}
