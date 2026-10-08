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
  { id: 'lucky_day', icon: '🍀', name: ['幸运日', 'Lucky Day'], desc: ['幸运 +24', '+24 Luck'], mods: { luck: 24 }, weight: -1 },
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

/** custom = 玩家输入的种子（D6），规则与每日相同，但不计入连续天数 */
export type ChallengeKind = 'daily' | 'weekly' | 'custom' | 'free';
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
  const weekly = kind === 'weekly';
  const chapterId = !weekly ? 1 + Math.floor(r() * 3) : 2 + Math.floor(r() * 4);
  const n = !weekly ? 2 : 3;
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

/** J4：自定义挑战——玩家自选角色、章节、模式与修饰规则；不计成就、不计连续天数。key = 角色.章节.e|n.修饰+修饰 */
export interface FreeOpts {
  charId: string;
  chapterId: number;
  endless: boolean;
  modifiers: ModifierId[];
}
export const freeKey = (o: FreeOpts): string => `${o.charId}.${o.chapterId}.${o.endless ? 'e' : 'n'}.${o.modifiers.join('+')}`;
export function parseFreeKey(key: string): FreeOpts | null {
  const [c, ch, e, mods = ''] = key.split('.');
  const chapterId = Number(ch);
  const modifiers = (mods ? mods.split('+') : []) as ModifierId[];
  if (!CHARACTERS.some((x) => x.id === c) || !Number.isInteger(chapterId) || chapterId < 1 || chapterId > 5) return null;
  if ((e !== 'e' && e !== 'n') || !modifiers.every((m) => MODIFIER_MAP[m]) || new Set(modifiers).size !== modifiers.length) return null;
  return { charId: c, chapterId, endless: e === 'e', modifiers };
}
export function makeFreeChallenge(o: FreeOpts): ChallengeDef {
  const key = freeKey(o);
  return { kind: 'free', key, seed: hashSeed(`tomageddon:free:${key}`), ...o, modifiers: [...o.modifiers] };
}

/** D5 / D6：挑战的分享码（kind:key），朋友输入后打同一局 */
export const challengeCode = (c: { kind: ChallengeKind; key: string }): string => `${c.kind}:${c.key}`;
/** 解析分享码；不是 kind:key 格式的任意文字都当作自定义种子 */
export function parseChallengeCode(code: string): ChallengeDef | null {
  const s = code.trim();
  if (!s) return null;
  const f = s.match(/^free:(.+)$/);
  if (f) {
    const o = parseFreeKey(f[1]);
    return o ? makeFreeChallenge(o) : null;
  }
  const m = s.match(/^(daily|weekly|custom):(.+)$/);
  return m ? makeChallenge(m[1] as ChallengeKind, m[2]) : makeChallenge('custom', s.slice(0, 40));
}
export const challengeKindName = (k: ChallengeKind): [string, string] =>
  k === 'daily' ? ['每日', 'Daily'] : k === 'weekly' ? ['每周', 'Weekly'] : k === 'free' ? ['自定义', 'Custom'] : ['种子', 'Seeded'];

/** D3：连续每日挑战奖励（天数 → 金番茄 / 天赋点） */
export const STREAK_REWARDS: { days: number; gold: number; tp: number }[] = [
  { days: 3, gold: 30, tp: 0 },
  { days: 7, gold: 80, tp: 1 },
  { days: 30, gold: 300, tp: 3 },
];

/** 挑战得分：每日按通关、波次、击杀与用时；每周（无尽）按波次与击杀 */
export function challengeScore(kind: ChallengeKind, r: { win: boolean; wave: number; kills: number; level: number; sec: number }): number {
  if (kind === 'weekly') return r.wave * 500 + r.kills;
  return r.wave * 200 + r.kills + r.level * 20 + (r.win ? 3000 + Math.max(0, 900 - r.sec) * 2 : 0);
}
