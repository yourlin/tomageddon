// 成就：每项读取一个指标（见 systems/Achievements.ts 的 METRICS），分若干等级（铜 → 银 → 金 → 钻石），
// 每达到一级获得成就点，成就点可在选角界面购买角色。
// 文字自带中英文（[中文, English]）；{n} 替换为当前等级目标值，{char} 替换为角色名。
import { CHARACTERS } from './characters';
import { BOSSES } from './bosses';

export type AchCategory = 'combat' | 'boss' | 'progress' | 'build' | 'economy' | 'codex' | 'character' | 'slayer';

export type AchMetric =
  | 'totalKills'
  | 'runKills'
  | 'eliteKills'
  | 'bossKills'
  | 'overtimeWins'
  | 'perfectWaves'
  | 'revives'
  | 'clearedChapters'
  | 'wins'
  | 'charsWon'
  | 'charsOwned'
  | 'runLevel'
  | 'runItems'
  | 'runWeapons'
  | 't4Crafted'
  | 'runSeeds'
  | 'seedsEarned'
  | 'seenWeapons'
  | 'seenItems'
  | 'seenEnemies'
  | 'seenBosses'
  | 'charRuns'
  | 'charWins'
  | 'bossDefeated';

export interface AchTier {
  /** 目标值；'all' 表示该类内容全部（运行时按数据总量计算） */
  goal: number | 'all';
  /** 达成该等级获得的成就点 */
  points: number;
}

export interface AchievementDef {
  id: string;
  category: AchCategory;
  icon: string;
  name: [string, string];
  desc: [string, string];
  metric: AchMetric;
  /** 角色类成就对应的角色 */
  charId?: string;
  /** 首杀成就对应的精英 / Boss */
  bossId?: string;
  tiers: AchTier[];
}

type T = [number | 'all', number];
const A = (
  id: string,
  category: AchCategory,
  icon: string,
  name: [string, string],
  desc: [string, string],
  metric: AchMetric,
  tiers: T[],
): AchievementDef => ({ id, category, icon, name, desc, metric, tiers: tiers.map(([goal, points]) => ({ goal, points })) });

const GLOBAL: AchievementDef[] = [
  // ---- 战斗 ----
  A('kills', 'combat', '🔪', ['番茄酱风暴', 'Ketchup Storm'], ['累计击败 {n} 只怪物', 'Defeat {n} monsters in total'], 'totalKills', [
    [100, 10],
    [1000, 20],
    [10000, 40],
    [50000, 60],
  ]),
  A('run_kills', 'combat', '🌪️', ['割草机', 'Lawnmower'], ['单局击败 {n} 只怪物', 'Defeat {n} monsters in a single run'], 'runKills', [
    [300, 10],
    [800, 20],
    [1500, 40],
  ]),
  A(
    'perfect',
    'combat',
    '🛡️',
    ['毫发无伤', 'Untouched'],
    ['累计 {n} 次无伤完成波次', 'Finish {n} waves without taking damage'],
    'perfectWaves',
    [
      [1, 10],
      [10, 20],
      [50, 40],
    ],
  ),
  A('revive', 'combat', '🔥', ['凤凰涅槃', 'Phoenix Rising'], ['在战斗中复活 {n} 次', 'Revive {n} time(s) in battle'], 'revives', [
    [1, 15],
  ]),
  // ---- 精英与 Boss ----
  A('elites', 'boss', '🎯', ['精英猎手', 'Elite Hunter'], ['累计击败 {n} 名精英', 'Defeat {n} elites'], 'eliteKills', [
    [1, 10],
    [10, 20],
    [50, 40],
  ]),
  A('bosses', 'boss', '👑', ['Boss 终结者', 'Boss Terminator'], ['累计击败 {n} 名 Boss', 'Defeat {n} bosses'], 'bossKills', [
    [1, 20],
    [5, 30],
    [15, 50],
  ]),
  A(
    'overtime',
    'boss',
    '😤',
    ['绝地反击', 'Against the Odds'],
    ['在 Boss 狂暴后将其击败 {n} 次', 'Defeat an enraged boss {n} time(s)'],
    'overtimeWins',
    [[1, 25]],
  ),
  // ---- 进度 ----
  A('clear_1', 'progress', '🍳', ['厨房清扫', 'Kitchen Cleaned'], ['通关第一章', 'Clear Chapter 1'], 'clearedChapters', [[1, 20]]),
  A('clear_2', 'progress', '🌱', ['菜园守护者', 'Garden Keeper'], ['通关第二章', 'Clear Chapter 2'], 'clearedChapters', [[2, 30]]),
  A('clear_3', 'progress', '❄️', ['破冰者', 'Icebreaker'], ['通关第三章', 'Clear Chapter 3'], 'clearedChapters', [[3, 40]]),
  A('clear_4', 'progress', '🗑️', ['垃圾场之王', 'Junkyard King'], ['通关第四章', 'Clear Chapter 4'], 'clearedChapters', [[4, 50]]),
  A(
    'clear_5',
    'progress',
    '🏭',
    ['腐烂终结', 'End of the Rot'],
    ['通关第五章，击败腐烂之源', 'Clear Chapter 5 and defeat the source of the Rot'],
    'clearedChapters',
    [[5, 60]],
  ),
  A('wins', 'progress', '🎖️', ['常胜将军', 'Veteran'], ['累计通关 {n} 次', 'Clear {n} runs'], 'wins', [
    [1, 15],
    [10, 30],
    [30, 50],
  ]),
  A(
    'chars_won',
    'progress',
    '🎭',
    ['多面手', 'Versatile'],
    ['用 {n} 名不同角色通关', 'Clear runs with {n} different characters'],
    'charsWon',
    [
      [3, 15],
      [10, 30],
      ['all', 60],
    ],
  ),
  A('chars_owned', 'progress', '🔓', ['全员集结', 'Assemble!'], ['拥有 {n} 名角色', 'Own {n} characters'], 'charsOwned', [
    [8, 10],
    [20, 25],
    ['all', 50],
  ]),
  // ---- 构筑 ----
  A('level', 'build', '📈', ['茁壮成长', 'Growth Spurt'], ['单局达到 {n} 级', 'Reach level {n} in a run'], 'runLevel', [
    [10, 10],
    [20, 20],
    [30, 40],
  ]),
  A('items', 'build', '🎒', ['收藏家', 'Hoarder'], ['单局持有 {n} 件道具', 'Hold {n} items in a run'], 'runItems', [
    [15, 10],
    [30, 20],
    [50, 40],
  ]),
  A('weapons', 'build', '🧰', ['武装到牙齿', 'Armed to the Teeth'], ['单局持有 {n} 把武器', 'Hold {n} weapons in a run'], 'runWeapons', [
    [6, 15],
  ]),
  A('t4', 'build', '💎', ['神兵利器', 'Legendary Arms'], ['累计合成 {n} 把 T4 武器', 'Combine {n} weapon(s) into T4'], 't4Crafted', [
    [1, 20],
    [5, 40],
  ]),
  // ---- 经济 ----
  A('rich', 'economy', '💰', ['小有积蓄', 'Nest Egg'], ['同时持有 {n} 番茄籽', 'Hold {n} Seeds at once'], 'runSeeds', [
    [200, 10],
    [500, 20],
    [1000, 40],
  ]),
  A('earned', 'economy', '🏦', ['番茄大亨', 'Tomato Tycoon'], ['累计获得 {n} 番茄籽', 'Earn {n} Seeds in total'], 'seedsEarned', [
    [2000, 10],
    [20000, 25],
    [100000, 50],
  ]),
  // ---- 图鉴 ----
  A(
    'codex_weapons',
    'codex',
    '🗡️',
    ['军火库', 'Arsenal'],
    ['在图鉴中发现 {n} 把武器', 'Discover {n} weapons in the codex'],
    'seenWeapons',
    [
      [9, 10],
      ['all', 25],
    ],
  ),
  A(
    'codex_items',
    'codex',
    '📦',
    ['道具百科', 'Item Encyclopedia'],
    ['在图鉴中发现 {n} 件道具', 'Discover {n} items in the codex'],
    'seenItems',
    [
      [50, 10],
      [200, 25],
      ['all', 50],
    ],
  ),
  A(
    'codex_monsters',
    'codex',
    '🔬',
    ['怪物学者', 'Monster Scholar'],
    ['在图鉴中发现 {n} 种小怪', 'Discover {n} monsters in the codex'],
    'seenEnemies',
    [['all', 25]],
  ),
  A(
    'codex_bosses',
    'codex',
    '📜',
    ['猎魔名录', 'Bestiary of Bosses'],
    ['在图鉴中发现 {n} 名精英与 Boss', 'Discover {n} elites and bosses in the codex'],
    'seenBosses',
    [
      [15, 15],
      ['all', 40],
    ],
  ),
];

/** 每名角色两项成就：使用次数（1 / 10 / 100 次开局）与通关 */
const PER_CHARACTER: AchievementDef[] = CHARACTERS.flatMap((c) => [
  {
    ...A(
      `char_runs_${c.id}`,
      'character',
      '🤝',
      ['{char}的伙伴', "{char}'s Partner"],
      ['使用{char}开局 {n} 次', 'Start {n} run(s) as {char}'],
      'charRuns',
      [
        [1, 5],
        [10, 15],
        [100, 40],
      ],
    ),
    charId: c.id,
  },
  {
    ...A(
      `char_wins_${c.id}`,
      'character',
      '🏅',
      ['{char}凯旋', '{char} Triumphant'],
      ['使用{char}通关 {n} 次', 'Clear {n} run(s) as {char}'],
      'charWins',
      [
        [1, 20],
        [5, 40],
      ],
    ),
    charId: c.id,
  },
]);

/** 每名精英与 Boss 的首杀成就 */
const PER_BOSS: AchievementDef[] = BOSSES.map((b) => ({
  ...A(
    `slay_${b.id}`,
    'slayer',
    b.elite ? '🎯' : '👑',
    ['{boss}克星', '{boss} Slayer'],
    b.elite
      ? ['首次击败精英{boss}', 'Defeat the elite {boss} for the first time']
      : ['首次击败 Boss {boss}', 'Defeat the boss {boss} for the first time'],
    'bossDefeated',
    [[1, b.elite ? 10 : 20]],
  ),
  bossId: b.id,
}));

export const ACHIEVEMENTS: AchievementDef[] = [...GLOBAL, ...PER_BOSS, ...PER_CHARACTER];
export const ACH_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export const ACH_CATEGORY_NAME: Record<AchCategory, [string, string]> = {
  combat: ['战斗', 'Combat'],
  boss: ['精英与 Boss', 'Elites & Bosses'],
  progress: ['进度', 'Progress'],
  build: ['构筑', 'Build'],
  economy: ['经济', 'Economy'],
  codex: ['图鉴', 'Codex'],
  character: ['角色', 'Characters'],
  slayer: ['首杀', 'First Kills'],
};

/** 等级奖章：单级成就只有金牌 */
export const TIER_MEDALS = ['🥉', '🥈', '🥇', '💎'];
export const TIER_NAME: [string, string][] = [
  ['铜', 'Bronze'],
  ['银', 'Silver'],
  ['金', 'Gold'],
  ['钻石', 'Diamond'],
];
