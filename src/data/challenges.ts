// 每日 / 每周挑战：由日期种子决定角色、章节与规则修饰；单机记录个人最佳。
// 每日：普通模式（15 波）+ 2 个修饰；每周：无尽模式 + 3 个修饰，比谁坚持得久。
import { CHARACTERS } from './characters';
import { hashSeed, mulberry32, shuffleWith, dayKey, weekKey } from '../systems/Rng';

export type ModifierId =
  | 'swift_foes'
  | 'glass_cannon'
  | 'melee_only'
  | 'ranged_only'
  | 'elemental_only'
  | 'rich_start'
  | 'champions'
  | 'giants'
  | 'swarm'
  | 'vampire'
  | 'one_reroll'
  | 'lucky_day'
  | 'scholar'
  | 'tough_bosses'
  | 'skill_spam';

export interface ModifierDef {
  id: ModifierId;
  icon: string;
  name: [string, string];
  desc: [string, string];
  /** 对玩家的属性修正 */
  mods?: Partial<Record<string, number>>;
  /** 难度倾向：+ 变难、- 变简单（挑选时尽量平衡） */
  weight: number;
  /** 互斥组：同组只会出现一个 */
  group?: string;
}

export const MODIFIERS: ModifierDef[] = [
  { id: 'swift_foes', icon: '💨', name: ['疾风怪潮', 'Swift Horde'], desc: ['怪物移速 +25%', 'Monsters move 25% faster'], weight: 1 },
  {
    id: 'glass_cannon',
    icon: '🍷',
    name: ['玻璃大炮', 'Glass Cannon'],
    desc: ['全伤害 +40%，最大生命 -40%', '+40% all damage, -40% max HP'],
    mods: { damage: 40 },
    weight: 0,
  },
  {
    id: 'melee_only',
    icon: '🥊',
    name: ['近战之日', 'Melee Day'],
    desc: ['商店只出近战武器', 'The shop only sells melee weapons'],
    weight: 0,
    group: 'cls',
  },
  {
    id: 'ranged_only',
    icon: '🏹',
    name: ['远程之日', 'Ranged Day'],
    desc: ['商店只出远程武器', 'The shop only sells ranged weapons'],
    weight: 0,
    group: 'cls',
  },
  {
    id: 'elemental_only',
    icon: '🔮',
    name: ['元素之日', 'Elemental Day'],
    desc: ['商店只出元素武器', 'The shop only sells elemental weapons'],
    weight: 0,
    group: 'cls',
  },
  {
    id: 'rich_start',
    icon: '💰',
    name: ['富家子弟', 'Silver Spoon'],
    desc: ['开局 +150 番茄籽，商店价格 +25%', 'Start with +150 Seeds, shop prices +25%'],
    weight: -1,
  },
  {
    id: 'champions',
    icon: '✨',
    name: ['精英横行', 'Champion Rush'],
    desc: ['词缀精英怪出现率 ×3', 'Affixed champions appear 3× as often'],
    weight: 1,
  },
  {
    id: 'giants',
    icon: '🗿',
    name: ['巨人国度', 'Land of Giants'],
    desc: ['怪物生命 +50%，移速 -15%', 'Monsters have +50% HP and move 15% slower'],
    weight: 1,
    group: 'size',
  },
  {
    id: 'swarm',
    icon: '🐜',
    name: ['蜂拥而至', 'Swarm'],
    desc: ['刷怪数量 +40%，怪物生命 -25%', '+40% spawns, -25% monster HP'],
    weight: 1,
    group: 'size',
  },
  {
    id: 'vampire',
    icon: '🧛',
    name: ['吸血之夜', 'Night of Fangs'],
    desc: ['吸血概率 +10%，但生命再生无效', '+10% Life Steal Chance, but HP Regen does nothing'],
    mods: { lifeSteal: 10 },
    weight: 0,
  },
  {
    id: 'one_reroll',
    icon: '🎯',
    name: ['一锤定音', 'One Shot'],
    desc: ['每次商店只能刷新 1 次，但这一次免费', 'One reroll per shop, but it is free'],
    weight: 1,
  },
  { id: 'lucky_day', icon: '🍀', name: ['幸运日', 'Lucky Day'], desc: ['幸运 +60', '+60 Luck'], mods: { luck: 60 }, weight: -1 },
  { id: 'scholar', icon: '📚', name: ['学霸', 'Scholar'], desc: ['经验获取 +100%', '+100% XP gain'], mods: { xpGain: 100 }, weight: -1 },
  {
    id: 'tough_bosses',
    icon: '👹',
    name: ['强敌', 'Tough Foes'],
    desc: ['精英与 Boss 生命 +50%', 'Elites and bosses have +50% HP'],
    weight: 1,
  },
  {
    id: 'skill_spam',
    icon: '🌟',
    name: ['技能狂欢', 'Skill Party'],
    desc: ['技能冷却 -50%', '-50% skill cooldown'],
    mods: { skillCd: 50 },
    weight: -1,
  },
];
export const MODIFIER_MAP: Record<ModifierId, ModifierDef> = Object.fromEntries(MODIFIERS.map((m) => [m.id, m])) as Record<
  ModifierId,
  ModifierDef
>;

export type ChallengeKind = 'daily' | 'weekly';
export interface ChallengeDef {
  kind: ChallengeKind;
  key: string;
  seed: number;
  charId: string;
  chapterId: number;
  endless: boolean;
  modifiers: ModifierId[];
}

/** 由日期键生成挑战（同一天 / 同一周结果固定） */
export function makeChallenge(kind: ChallengeKind, key = kind === 'daily' ? dayKey() : weekKey()): ChallengeDef {
  const seed = hashSeed(`tomageddon:${kind}:${key}`);
  const r = mulberry32(seed);
  const charId = CHARACTERS[Math.floor(r() * CHARACTERS.length)].id;
  const chapterId = kind === 'daily' ? 1 + Math.floor(r() * 3) : 2 + Math.floor(r() * 4);
  const n = kind === 'daily' ? 2 : 3;
  // 挑选修饰：互斥组只取一个，并让总难度倾向不超过 +2
  const picked: ModifierDef[] = [];
  for (const m of shuffleWith([...MODIFIERS], r)) {
    if (picked.length >= n) break;
    if (m.group && picked.some((p) => p.group === m.group)) continue;
    if (picked.reduce((s, p) => s + p.weight, 0) + m.weight > 2) continue;
    picked.push(m);
  }
  return { kind, key, seed, charId, chapterId, endless: kind === 'weekly', modifiers: picked.map((m) => m.id) };
}

/** 挑战得分：每日按通关、波次、击杀与用时；每周（无尽）按波次与击杀 */
export function challengeScore(kind: ChallengeKind, r: { win: boolean; wave: number; kills: number; level: number; sec: number }): number {
  if (kind === 'weekly') return r.wave * 500 + r.kills;
  return r.wave * 200 + r.kills + r.level * 20 + (r.win ? 3000 + Math.max(0, 900 - r.sec) * 2 : 0);
}
