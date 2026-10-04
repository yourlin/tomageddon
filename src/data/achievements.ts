// 成就：每项读取一个指标（见 systems/Achievements.ts 的 METRICS），分若干等级（铜 → 银 → 金 → 钻石），
// 每达到一级获得成就点（累计成绩）；部分成就达成指定等级后会解锁角色（见 characters.ts 的 unlock）。
// 文字自带中英文（[中文, English]）；{n} 替换为当前等级目标值，{char} 替换为角色名，{x} 替换为 subject 的名字。
// 难度越高奖励越多：入门等级 1~3 点，中等 5~15 点，高难 30~150 点。
import { CHARACTERS } from './characters';
import { BOSSES, AFFIXES, type AffixId } from './bosses';
import { ENEMIES } from './enemies';
import { WEAPONS, WEAPON_SETS } from './weapons';
import { GENERATED_ITEMS } from './itemGen';
import { SKILL_TYPE_NAME } from './skills';
import { DEBUFF_IDS } from './statuses';
import { CHAPTERS } from './chapters';
import { EVOLUTIONS } from './evolutions';
import type { SkillType } from './characters';
import { ACHIEVEMENTS_14 } from './achievements14';

export type AchCategory =
  | 'combat'
  | 'monster'
  | 'slayer'
  | 'progress'
  | 'chapter'
  | 'challenge'
  | 'build'
  | 'arsenal'
  | 'collection'
  | 'skill'
  | 'economy'
  | 'codex'
  | 'endless'
  | 'character';

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
  | 'bossDefeated'
  /** 通用计数器（save.counters[key]） */
  | 'counter'
  /** 单局持有某系列道具件数（key = 系列 id） */
  | 'runSeries'
  /** 单局持有某套装标签武器数（key = 标签） */
  | 'runSet';

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
  /** counter / runSeries / runSet 指标的键 */
  key?: string;
  /** 各等级额外奖励的天赋点（见 TALENT_REWARDS） */
  tp?: number[];
  /** 文字中 {x} 指代的对象（运行时按当前语言取名字） */
  subject?: { kind: AchSubject; id: string };
  tiers: AchTier[];
}

export type AchSubject = 'enemy' | 'weapon' | 'series' | 'set' | 'skill' | 'status' | 'affix' | 'chapter' | 'rarity';

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
/** 计数器成就 */
const K = (
  id: string,
  category: AchCategory,
  icon: string,
  name: [string, string],
  desc: [string, string],
  key: string,
  tiers: T[],
): AchievementDef => ({
  ...A(id, category, icon, name, desc, 'counter', tiers),
  key,
});
/** 绑定 {x} 指代对象 */
const S = (a: AchievementDef, kind: AchSubject, id: string): AchievementDef => ({ ...a, subject: { kind, id } });

const GLOBAL: AchievementDef[] = [
  // ---- 战斗 ----
  A('kills', 'combat', '🔪', ['番茄酱风暴', 'Ketchup Storm'], ['累计击败 {n} 只怪物', 'Defeat {n} monsters in total'], 'totalKills', [
    [100, 2],
    [1000, 6],
    [10000, 20],
    [50000, 60],
  ]),
  A('run_kills', 'combat', '🌪️', ['割草机', 'Lawnmower'], ['单局击败 {n} 只怪物', 'Defeat {n} monsters in a single run'], 'runKills', [
    [300, 3],
    [800, 10],
    [1500, 30],
  ]),
  A(
    'perfect',
    'combat',
    '🛡️',
    ['毫发无伤', 'Untouched'],
    ['累计 {n} 次无伤完成波次', 'Finish {n} waves without taking damage'],
    'perfectWaves',
    [
      [1, 2],
      [10, 8],
      [50, 25],
      [200, 60],
    ],
  ),
  A('revive', 'combat', '🔥', ['凤凰涅槃', 'Phoenix Rising'], ['在战斗中复活 {n} 次', 'Revive {n} time(s) in battle'], 'revives', [[1, 5]]),
  K('crits', 'combat', '💥', ['会心一击', 'Critical Thinking'], ['累计造成 {n} 次暴击', 'Land {n} critical hits'], 'crits', [
    [100, 1],
    [5000, 5],
    [100000, 20],
  ]),
  K('max_hit', 'combat', '🔨', ['一击必杀', 'One Punch'], ['单次造成 {n} 点伤害', 'Deal {n} damage in a single hit'], 'maxHit', [
    [500, 2],
    [5000, 8],
    [50000, 25],
    [500000, 60],
  ]),
  K(
    'champions',
    'combat',
    '✨',
    ['精英怪克星', 'Champion Crusher'],
    ['累计击败 {n} 只词缀精英怪', 'Defeat {n} affixed champions'],
    'champions',
    [
      [1, 1],
      [50, 5],
      [500, 20],
    ],
  ),
  K('waves', 'combat', '🌊', ['波涛不息', 'Wave After Wave'], ['累计完成 {n} 个波次', 'Finish {n} waves'], 'waves', [
    [10, 2],
    [100, 10],
    [1000, 40],
  ]),
  K('casts', 'combat', '🌟', ['大招成瘾', 'Ultimate Addict'], ['累计释放 {n} 次技能', 'Cast your skill {n} times'], 'casts', [
    [1, 1],
    [100, 4],
    [1000, 15],
  ]),
  K('fruits', 'combat', '🍎', ['水果补给', 'Fruit Run'], ['累计吃到 {n} 个果实', 'Eat {n} fruit'], 'fruits', [
    [1, 1],
    [50, 4],
    [500, 15],
  ]),
  // ---- Boss ----
  A('elites', 'slayer', '🎯', ['精英猎手', 'Elite Hunter'], ['累计击败 {n} 名精英', 'Defeat {n} elites'], 'eliteKills', [
    [1, 3],
    [10, 10],
    [50, 30],
    [200, 80],
  ]),
  A('bosses', 'slayer', '👑', ['Boss 终结者', 'Boss Terminator'], ['累计击败 {n} 名 Boss', 'Defeat {n} bosses'], 'bossKills', [
    [1, 15],
    [5, 30],
    [15, 60],
    [50, 120],
  ]),
  A(
    'overtime',
    'slayer',
    '😤',
    ['绝地反击', 'Against the Odds'],
    ['在 Boss 狂暴后将其击败 {n} 次', 'Defeat an enraged boss {n} time(s)'],
    'overtimeWins',
    [
      [1, 25],
      [10, 60],
    ],
  ),
  // ---- 进度 ----
  A('clear_1', 'progress', '🍳', ['厨房清扫', 'Kitchen Cleaned'], ['通关第一章', 'Clear Chapter 1'], 'clearedChapters', [[1, 15]]),
  A('clear_2', 'progress', '🌱', ['菜园守护者', 'Garden Keeper'], ['通关第二章', 'Clear Chapter 2'], 'clearedChapters', [[2, 30]]),
  A('clear_3', 'progress', '❄️', ['破冰者', 'Icebreaker'], ['通关第三章', 'Clear Chapter 3'], 'clearedChapters', [[3, 50]]),
  A('clear_4', 'progress', '🗑️', ['垃圾场之王', 'Junkyard King'], ['通关第四章', 'Clear Chapter 4'], 'clearedChapters', [[4, 80]]),
  A(
    'clear_5',
    'progress',
    '🏭',
    ['腐烂终结', 'End of the Rot'],
    ['通关第五章，击败腐烂之源', 'Clear Chapter 5 and defeat the source of the Rot'],
    'clearedChapters',
    [[5, 120]],
  ),
  A('wins', 'progress', '🎖️', ['常胜将军', 'Veteran'], ['累计通关 {n} 次', 'Clear {n} runs'], 'wins', [
    [1, 10],
    [10, 30],
    [30, 60],
    [100, 150],
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
      [10, 40],
      ['all', 150],
    ],
  ),
  A('chars_owned', 'progress', '🔓', ['全员集结', 'Assemble!'], ['拥有 {n} 名角色', 'Own {n} characters'], 'charsOwned', [
    [8, 5],
    [20, 20],
    ['all', 60],
  ]),
  K('deaths', 'progress', '🪦', ['屡败屡战', 'Never Give Up'], ['累计阵亡 {n} 次', 'Fall in battle {n} time(s)'], 'deaths', [
    [1, 1],
    [10, 3],
    [100, 10],
  ]),
  K('death_w1', 'progress', '🤕', ['出师未捷', 'Rough Start'], ['在第 1 波阵亡', 'Fall on wave 1'], 'deathW1', [[1, 2]]),
  K('levelups', 'progress', '⬆️', ['步步高升', 'Level Up!'], ['累计升级选择 {n} 次属性', 'Pick {n} level-up upgrades'], 'levelups', [
    [10, 1],
    [200, 5],
    [2000, 20],
  ]),
  K('crates', 'progress', '🎁', ['开箱达人', 'Unboxer'], ['累计打开 {n} 个宝箱', 'Open {n} crates'], 'crates', [
    [1, 1],
    [50, 5],
    [300, 15],
  ]),
  // ---- 挑战 ----
  K('win_solo', 'challenge', '🗡️', ['孤胆英雄', 'Lone Blade'], ['只带 1 把武器通关', 'Clear a run holding only 1 weapon'], 'winSolo', [
    [1, 60],
  ]),
  K('win_low_hp', 'challenge', '❤️‍🩹', ['命悬一线', 'By a Thread'], ['以不到 10% 的生命通关', 'Clear a run with under 10% HP'], 'winLowHp', [
    [1, 30],
  ]),
  K(
    'win_pure_melee',
    'challenge',
    '🥊',
    ['纯粹近战', 'Pure Melee'],
    ['只用近战武器（至少 4 把）通关', 'Clear with only melee weapons (4+)'],
    'winPure:melee',
    [[1, 25]],
  ),
  K(
    'win_pure_ranged',
    'challenge',
    '🏹',
    ['纯粹远程', 'Pure Ranged'],
    ['只用远程武器（至少 4 把）通关', 'Clear with only ranged weapons (4+)'],
    'winPure:ranged',
    [[1, 25]],
  ),
  K(
    'win_pure_elemental',
    'challenge',
    '🔮',
    ['纯粹元素', 'Pure Elemental'],
    ['只用元素武器（至少 4 把）通关', 'Clear with only elemental weapons (4+)'],
    'winPure:elemental',
    [[1, 25]],
  ),
  K(
    'win_all_t4',
    'challenge',
    '👑',
    ['全副神兵', 'Fully Legendary'],
    ['通关时持有 6 把 T4 武器', 'Clear holding six T4 weapons'],
    'winAllT4',
    [[1, 120]],
  ),
  K('win_hoarder', 'challenge', '🎒', ['满载而归', 'Loaded Up'], ['通关时持有 60 件道具', 'Clear holding 60 items'], 'winHoarder', [
    [1, 40],
  ]),
  K('daily_runs', 'challenge', '🗓️', ['每日打卡', 'Daily Regular'], ['参加 {n} 次每日挑战', 'Play {n} daily challenge(s)'], 'dailyRuns', [
    [1, 2],
    [10, 8],
    [50, 25],
  ]),
  K(
    'daily_wins',
    'challenge',
    '🏆',
    ['今日之星', 'Star of the Day'],
    ['通关 {n} 次每日挑战', 'Clear {n} daily challenge(s)'],
    'dailyWins',
    [
      [1, 5],
      [10, 20],
      [30, 50],
    ],
  ),
  K(
    'daily_streak',
    'challenge',
    '🔥',
    ['风雨无阻', 'Rain or Shine'],
    ['连续 {n} 天参加每日挑战', 'Play the daily challenge {n} days in a row'],
    'dailyStreakBest',
    [
      [3, 5],
      [7, 15],
      [30, 60],
    ],
  ),
  K(
    'weekly_runs',
    'challenge',
    '♾️',
    ['周末战士', 'Weekend Warrior'],
    ['参加 {n} 次每周挑战', 'Play {n} weekly challenge(s)'],
    'weeklyRuns',
    [
      [1, 3],
      [10, 15],
    ],
  ),
  K(
    'weekly_best',
    'challenge',
    '🏔️',
    ['本周之巅', 'Peak of the Week'],
    ['每周挑战中完成第 {n} 波', 'Finish wave {n} in a weekly challenge'],
    'weeklyBest',
    [
      [20, 5],
      [30, 15],
      [45, 40],
    ],
  ),
  // ---- 构筑 ----
  A('level', 'build', '📈', ['茁壮成长', 'Growth Spurt'], ['单局达到 {n} 级', 'Reach level {n} in a run'], 'runLevel', [
    [10, 2],
    [20, 8],
    [30, 40],
  ]),
  A('items', 'build', '🎒', ['收藏家', 'Hoarder'], ['单局持有 {n} 件道具', 'Hold {n} items in a run'], 'runItems', [
    [15, 3],
    [30, 8],
    [50, 25],
    [80, 60],
  ]),
  A('weapons', 'build', '🧰', ['武装到牙齿', 'Armed to the Teeth'], ['单局持有 {n} 把武器', 'Hold {n} weapons in a run'], 'runWeapons', [
    [6, 3],
  ]),
  A('t4', 'build', '💎', ['神兵利器', 'Legendary Arms'], ['累计合成 {n} 把 T4 武器', 'Combine {n} weapon(s) into T4'], 't4Crafted', [
    [1, 10],
    [5, 25],
    [20, 60],
  ]),
  K('combines', 'build', '🔗', ['合二为一', 'Two Become One'], ['累计合成武器 {n} 次', 'Combine weapons {n} times'], 'combines', [
    [1, 1],
    [20, 5],
    [200, 20],
  ]),
  K('forges', 'build', '⚒️', ['铁匠学徒', 'Smith Apprentice'], ['累计打造武器 {n} 次', 'Forge weapons {n} times'], 'forges', [
    [1, 2],
    [50, 10],
    [300, 30],
  ]),
  K(
    'forge_fail',
    'build',
    '💔',
    ['失败是成功之母', 'Learning the Hard Way'],
    ['打造失败 {n} 次', 'Fail a forge {n} time(s)'],
    'forgeFail',
    [
      [1, 1],
      [20, 5],
      [100, 15],
    ],
  ),
  K('forge_max', 'build', '🔥', ['千锤百炼', 'Tempered Steel'], ['把任意武器打造到 +{n}', 'Forge any weapon to +{n}'], 'forgeMax', [
    [3, 5],
    [7, 20],
    [10, 60],
  ]),
  K('affix_rerolls', 'build', '🎲', ['词条赌徒', 'Affix Gambler'], ['累计洗练词条 {n} 次', 'Reroll affixes {n} times'], 'affixRerolls', [
    [1, 1],
    [50, 5],
    [500, 20],
  ]),
  // ---- 经济 ----
  A('rich', 'economy', '💰', ['小有积蓄', 'Nest Egg'], ['同时持有 {n} 番茄籽', 'Hold {n} Seeds at once'], 'runSeeds', [
    [200, 3],
    [500, 8],
    [1000, 20],
    [3000, 50],
  ]),
  A('earned', 'economy', '🏦', ['番茄大亨', 'Tomato Tycoon'], ['累计获得 {n} 番茄籽', 'Earn {n} Seeds in total'], 'seedsEarned', [
    [2000, 3],
    [20000, 15],
    [100000, 40],
    [500000, 100],
  ]),
  K('items_bought', 'economy', '🛒', ['购物狂', 'Shopaholic'], ['累计购买 {n} 件道具', 'Buy {n} items'], 'itemsBought', [
    [1, 1],
    [100, 5],
    [1000, 20],
  ]),
  K('weapons_bought', 'economy', '🏪', ['军火商', 'Arms Dealer'], ['累计购买 {n} 把武器', 'Buy {n} weapons'], 'weaponsBought', [
    [1, 1],
    [50, 5],
    [300, 15],
  ]),
  K('shop_rerolls', 'economy', '🔄', ['再来一次', 'One More Roll'], ['累计刷新商店 {n} 次', 'Reroll the shop {n} times'], 'shopRerolls', [
    [1, 1],
    [100, 5],
    [1000, 20],
  ]),
  K('sells', 'economy', '💸', ['以旧换新', 'Trade-In'], ['累计出售武器 {n} 次', 'Sell {n} weapons'], 'sells', [
    [1, 1],
    [50, 6],
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
      [9, 2],
      [25, 8],
      ['all', 30],
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
      [50, 3],
      [200, 10],
      ['all', 60],
    ],
  ),
  A(
    'codex_monsters',
    'codex',
    '🔬',
    ['怪物学者', 'Monster Scholar'],
    ['在图鉴中发现 {n} 种小怪', 'Discover {n} monsters in the codex'],
    'seenEnemies',
    [
      [20, 3],
      ['all', 30],
    ],
  ),
  A(
    'codex_bosses',
    'codex',
    '📜',
    ['猎魔名录', 'Bestiary of Bosses'],
    ['在图鉴中发现 {n} 名精英与 Boss', 'Discover {n} elites and bosses in the codex'],
    'seenBosses',
    [
      [15, 10],
      ['all', 50],
    ],
  ),
];

/** 角色成就：开局、通关、波次、等级、击杀、精英、逐章通关（每名角色 11 项） */
const CH_CLEAR_POINTS = [8, 15, 25, 40, 60];
const PER_CHARACTER: AchievementDef[] = CHARACTERS.flatMap((c) => {
  const C = (def: AchievementDef): AchievementDef => ({ ...def, charId: c.id });
  return [
    C(
      A(
        `char_runs_${c.id}`,
        'character',
        '🤝',
        ['{char}的伙伴', "{char}'s Partner"],
        ['使用{char}开局 {n} 次', 'Start {n} run(s) as {char}'],
        'charRuns',
        [
          [1, 1],
          [10, 5],
          [100, 30],
        ],
      ),
    ),
    C(
      A(
        `char_wins_${c.id}`,
        'character',
        '🏅',
        ['{char}凯旋', '{char} Triumphant'],
        ['使用{char}通关 {n} 次', 'Clear {n} run(s) as {char}'],
        'charWins',
        [
          [1, 10],
          [5, 25],
          [20, 60],
        ],
      ),
    ),
    C(
      K(
        `char_wave_${c.id}`,
        'character',
        '🌊',
        ['{char}出征', '{char} Marches On'],
        ['使用{char}完成第 {n} 波', 'Finish wave {n} as {char}'],
        `charWave:${c.id}`,
        [
          [5, 1],
          [10, 3],
        ],
      ),
    ),
    C(
      K(
        `char_level_${c.id}`,
        'character',
        '📈',
        ['{char}成长记', '{char} Grows Up'],
        ['使用{char}单局达到 {n} 级', 'Reach level {n} as {char}'],
        `charLevel:${c.id}`,
        [
          [10, 1],
          [20, 5],
          [30, 25],
        ],
      ),
    ),
    C(
      K(
        `char_kills_${c.id}`,
        'character',
        '⚔️',
        ['{char}的战绩', "{char}'s Tally"],
        ['使用{char}累计击败 {n} 只怪物', 'Defeat {n} monsters as {char}'],
        `charKills:${c.id}`,
        [
          [500, 1],
          [5000, 5],
          [30000, 20],
        ],
      ),
    ),
    C(
      K(
        `char_elite_${c.id}`,
        'character',
        '🎯',
        ['{char}猎精英', '{char} the Hunter'],
        ['使用{char}击败 {n} 名精英', 'Defeat {n} elite(s) as {char}'],
        `charElite:${c.id}`,
        [
          [1, 2],
          [10, 8],
        ],
      ),
    ),
    ...CHAPTERS.map((ch, i) =>
      C(
        K(
          `char_ch${ch.id}_${c.id}`,
          'character',
          ['🍳', '🌱', '❄️', '🗑️', '🏭'][i],
          [`{char}·第${ch.id}章`, `{char} · Chapter ${ch.id}`],
          [`使用{char}通关第 ${ch.id} 章`, `Clear Chapter ${ch.id} as {char}`],
          `charClear:${c.id}:${ch.id}`,
          [[1, CH_CLEAR_POINTS[i]]],
        ),
      ),
    ),
  ];
});

/** 每名精英与 Boss：首杀 + 多次击败 */
const PER_BOSS: AchievementDef[] = BOSSES.map((b) => ({
  ...A(
    `slay_${b.id}`,
    'slayer',
    b.elite ? '🎯' : '👑',
    ['{boss}克星', '{boss} Slayer'],
    b.elite
      ? ['击败精英{boss} {n} 次', 'Defeat the elite {boss} {n} time(s)']
      : ['击败 Boss {boss} {n} 次', 'Defeat the boss {boss} {n} time(s)'],
    'bossDefeated',
    b.elite
      ? [
          [1, 8],
          [5, 15],
          [20, 40],
        ]
      : [
          [1, 20],
          [5, 40],
          [15, 80],
        ],
  ),
  bossId: b.id,
}));

/** 每种怪物的击杀成就 + 每种精英词缀 */
const PER_MONSTER: AchievementDef[] = [
  ...ENEMIES.map((e) =>
    S(
      K(`kill_${e.id}`, 'monster', e.critter ? '🐇' : '👾', ['{x}克星', '{x} Bane'], ['击败 {n} 只{x}', 'Defeat {n} {x}'], `kill:${e.id}`, [
        [10, 1],
        [100, 3],
        [1000, 10],
      ]),
      'enemy',
      e.id,
    ),
  ),
  ...(Object.keys(AFFIXES) as AffixId[]).map((id) =>
    S(
      K(
        `champ_${id}`,
        'monster',
        '✨',
        ['{x}终结者', '{x} Breaker'],
        ['击败 {n} 只带【{x}】词缀的精英怪', 'Defeat {n} champion(s) with the [{x}] affix'],
        `champ:${id}`,
        [
          [1, 2],
          [25, 6],
          [200, 20],
        ],
      ),
      'affix',
      id,
    ),
  ),
];

/** 每把武器：获得、合成 T4、打造等级 */
const PER_WEAPON: AchievementDef[] = WEAPONS.flatMap((w) => [
  S(
    K(
      `wpn_got_${w.id}`,
      'arsenal',
      '🗡️',
      ['{x}收藏者', '{x} Collector'],
      ['累计获得 {n} 次{x}', 'Obtain {x} {n} time(s)'],
      `weaponGot:${w.id}`,
      [
        [1, 1],
        [10, 3],
        [30, 8],
      ],
    ),
    'weapon',
    w.id,
  ),
  S(
    K(`wpn_t4_${w.id}`, 'arsenal', '💎', ['神兵·{x}', 'Legendary {x}'], ['获得 {n} 把 T4 {x}', 'Own a T4 {x} {n} time(s)'], `t4:${w.id}`, [
      [1, 10],
      [5, 30],
    ]),
    'weapon',
    w.id,
  ),
  S(
    K(`wpn_forge_${w.id}`, 'arsenal', '🔨', ['{x}匠心', '{x} Mastercraft'], ['将{x}打造到 +{n}', 'Forge {x} to +{n}'], `forge:${w.id}`, [
      [3, 5],
      [7, 15],
      [10, 40],
    ]),
    'weapon',
    w.id,
  ),
]);

/** 武器进化：累计次数 + 每把超武的首次进化 */
const PER_EVOLUTION: AchievementDef[] = [
  K('evolutions', 'arsenal', '✨', ['进化论', 'Evolution Theory'], ['累计进化武器 {n} 次', 'Evolve weapons {n} time(s)'], 'evolutions', [
    [1, 5],
    [10, 20],
    [50, 60],
  ]),
  ...EVOLUTIONS.map((e) =>
    S(
      K(
        `evolve_${e.to.id}`,
        'arsenal',
        '🌟',
        ['{x}诞生', '{x} Is Born'],
        ['首次进化出「{x}」', 'Evolve {x} for the first time'],
        `evolve:${e.to.id}`,
        [[1, 20]],
      ),
      'weapon',
      e.to.id,
    ),
  ),
];

/** 收藏：道具系列、武器套装、各稀有度购买 */
const SERIES_IDS = [...new Set(GENERATED_ITEMS.map((i) => i.id.replace(/_\d+$/, '')))];
const PER_COLLECTION: AchievementDef[] = [
  ...SERIES_IDS.map((sid) =>
    S(
      {
        ...A(
          `series_${sid}`,
          'collection',
          '📚',
          ['{x}系列', '{x} Series'],
          ['单局持有 {n} 件「{x}」系列道具', 'Hold {n} "{x}" series items in one run'],
          'runSeries',
          [
            [3, 1],
            [6, 4],
            [10, 15],
          ],
        ),
        key: sid,
      },
      'series',
      sid,
    ),
  ),
  ...Object.entries(WEAPON_SETS).map(([tag, set]) => {
    const lv = Object.keys(set.bonus).map(Number);
    const goals = lv.length >= 4 ? [2, 4, 6] : [2, 3, 4];
    return S(
      {
        ...A(
          `set_${tag}`,
          'collection',
          '🧩',
          ['{x}套装', '{x} Set'],
          ['单局持有 {n} 把【{x}】武器', 'Hold {n} [{x}] weapons in one run'],
          'runSet',
          [
            [goals[0], 1],
            [goals[1], 4],
            [goals[2], 15],
          ],
        ),
        key: tag,
      },
      'set',
      tag,
    );
  }),
  ...(
    [
      [20, 200, 1000, 1, 4, 12],
      [10, 100, 500, 1, 5, 15],
      [5, 50, 300, 2, 8, 25],
      [1, 10, 50, 5, 15, 40],
    ] as const
  ).map(([g1, g2, g3, p1, p2, p3], r) =>
    S(
      K(
        `rarity_${r}`,
        'collection',
        ['⚪', '🔵', '🟣', '🔴'][r],
        ['{x}买家', '{x} Shopper'],
        ['累计购买 {n} 件{x}道具', 'Buy {n} {x} item(s)'],
        `rarityBought:${r}`,
        [
          [g1, p1],
          [g2, p2],
          [g3, p3],
        ],
      ),
      'rarity',
      String(r),
    ),
  ),
];

/** 技能形态与施加状态 */
const PER_SKILL: AchievementDef[] = [
  ...(Object.keys(SKILL_TYPE_NAME) as SkillType[]).map((t) =>
    S(
      K(`cast_${t}`, 'skill', '🌟', ['{x}大师', '{x} Master'], ['释放 {n} 次【{x}】类技能', 'Cast {n} [{x}] skill(s)'], `cast:${t}`, [
        [10, 1],
        [100, 4],
        [1000, 15],
      ]),
      'skill',
      t,
    ),
  ),
  ...DEBUFF_IDS.map((id) =>
    S(
      K(
        `inflict_${id}`,
        'skill',
        '🧪',
        ['{x}专家', '{x} Specialist'],
        ['对敌人施加 {n} 次【{x}】', 'Inflict [{x}] on enemies {n} times'],
        `inflict:${id}`,
        [
          [50, 1],
          [1000, 4],
          [20000, 15],
        ],
      ),
      'status',
      id,
    ),
  ),
];

/** 每章：完成波次、击杀、无伤波次 */
const PER_CHAPTER: AchievementDef[] = CHAPTERS.flatMap((ch, i) => [
  S(
    K(
      `ch_wave_${ch.id}`,
      'chapter',
      '🚩',
      ['{x}探索者', '{x} Explorer'],
      ['在「{x}」完成第 {n} 波', 'Finish wave {n} in {x}'],
      `chWave:${ch.id}`,
      [
        [5, 1 + i],
        [10, 3 + i * 3],
      ],
    ),
    'chapter',
    String(ch.id),
  ),
  S(
    K(
      `ch_kills_${ch.id}`,
      'chapter',
      '💀',
      ['{x}清道夫', '{x} Sweeper'],
      ['在「{x}」累计击败 {n} 只怪物', 'Defeat {n} monsters in {x}'],
      `chKills:${ch.id}`,
      [
        [500, 1],
        [5000, 5],
        [30000, 20],
      ],
    ),
    'chapter',
    String(ch.id),
  ),
  S(
    K(
      `ch_perfect_${ch.id}`,
      'chapter',
      '🛡️',
      ['{x}无伤', '{x} Untouched'],
      ['在「{x}」无伤完成 {n} 个波次', 'Finish {n} wave(s) in {x} without taking damage'],
      `chPerfect:${ch.id}`,
      [
        [1, 2 + i],
        [20, 8 + i * 3],
        [100, 25 + i * 8],
      ],
    ),
    'chapter',
    String(ch.id),
  ),
]);

/** 无尽模式：最佳波次（全局 / 每章 / 每名角色）、累计波次、Boss、单局击杀 */
const ENDLESS: AchievementDef[] = [
  K('endless_runs', 'endless', '♾️', ['永不停歇', 'Never Stop'], ['开始 {n} 次无尽模式', 'Start {n} Endless run(s)'], 'endlessRuns', [
    [1, 2],
    [20, 10],
  ]),
  K(
    'endless_best',
    'endless',
    '🏔️',
    ['无尽攀登', 'Endless Climb'],
    ['无尽模式完成第 {n} 波', 'Finish wave {n} in Endless'],
    'endlessBest',
    [
      [20, 5],
      [30, 15],
      [45, 40],
      [60, 80],
      [100, 150],
    ],
  ),
  K(
    'endless_waves',
    'endless',
    '🌊',
    ['无尽浪潮', 'Endless Tide'],
    ['无尽模式累计完成 {n} 个波次', 'Finish {n} Endless waves'],
    'endlessWaves',
    [
      [50, 3],
      [500, 15],
      [3000, 50],
    ],
  ),
  K(
    'endless_bosses',
    'endless',
    '👑',
    ['轮回猎手', 'Cycle Hunter'],
    ['无尽模式击败 {n} 名 Boss', 'Defeat {n} bosses in Endless'],
    'endlessBosses',
    [
      [1, 10],
      [10, 30],
      [50, 80],
    ],
  ),
  K(
    'endless_kills',
    'endless',
    '🌪️',
    ['无尽收割', 'Endless Harvest'],
    ['无尽模式单局击败 {n} 只怪物', 'Defeat {n} monsters in one Endless run'],
    'endlessRunKills',
    [
      [3000, 10],
      [10000, 40],
    ],
  ),
  ...CHAPTERS.map((ch, i) =>
    S(
      K(
        `endless_ch_${ch.id}`,
        'endless',
        '🚩',
        ['{x}·无尽', '{x} · Endless'],
        ['在「{x}」无尽模式完成第 {n} 波', 'Finish wave {n} of {x} in Endless'],
        `endlessBest:ch:${ch.id}`,
        [
          [20, 3 + i * 2],
          [30, 10 + i * 5],
          [45, 30 + i * 10],
        ],
      ),
      'chapter',
      String(ch.id),
    ),
  ),
  ...CHARACTERS.map((c) => ({
    ...K(
      `endless_char_${c.id}`,
      'endless',
      '♾️',
      ['{char}·无尽', '{char} · Endless'],
      ['使用{char}在无尽模式完成第 {n} 波', 'Finish wave {n} in Endless as {char}'],
      `endlessBest:char:${c.id}`,
      [
        [20, 2],
        [30, 8],
      ],
    ),
    charId: c.id,
  })),
];

export const ACHIEVEMENTS: AchievementDef[] = [
  ...GLOBAL,
  ...PER_CHAPTER,
  ...PER_MONSTER,
  ...PER_BOSS,
  ...PER_WEAPON,
  ...PER_EVOLUTION,
  ...PER_COLLECTION,
  ...PER_SKILL,
  ...ENDLESS,
  ...PER_CHARACTER,
  // 1.4.0：危机等级、遗物、事件波、无尽专属、角色任务与觉醒
  ...ACHIEVEMENTS_14,
];
/** 天赋点奖励：只有里程碑成就给，总计约 80 点（≈ 精通 2.5 个天赋方向）；首次通关第 1 章约得 7 点 */
export const TALENT_REWARDS: Record<string, number[]> = {
  clear_1: [2],
  clear_2: [2],
  clear_3: [2],
  clear_4: [3],
  clear_5: [3],
  wins: [1, 1, 2, 3],
  chars_won: [1, 2, 4],
  bosses: [1, 1, 2, 3],
  elites: [1, 1, 1, 2],
  overtime: [1, 1],
  kills: [1, 1, 1, 2],
  perfect: [0, 1, 1, 1],
  level: [1, 1, 1],
  t4: [1, 1, 1],
  forge_max: [0, 1, 1],
  win_solo: [2],
  win_low_hp: [1],
  win_pure_melee: [1],
  win_pure_ranged: [1],
  win_pure_elemental: [1],
  win_all_t4: [2],
  win_hoarder: [1],
  codex_weapons: [0, 0, 1],
  codex_items: [0, 0, 1],
  codex_monsters: [0, 1],
  codex_bosses: [0, 1],
  endless_best: [1, 1, 1, 2, 2],
  endless_bosses: [1, 1, 1],
};
for (const a of ACHIEVEMENTS) if (TALENT_REWARDS[a.id]) a.tp = TALENT_REWARDS[a.id];

export const ACH_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export const ACH_CATEGORY_NAME: Record<AchCategory, [string, string]> = {
  combat: ['战斗', 'Combat'],
  monster: ['怪物', 'Monsters'],
  slayer: ['Boss', 'Bosses'],
  progress: ['进度', 'Progress'],
  chapter: ['章节', 'Chapters'],
  challenge: ['挑战', 'Challenge'],
  build: ['构筑', 'Build'],
  arsenal: ['武器', 'Arsenal'],
  collection: ['收藏', 'Collection'],
  skill: ['技能', 'Skills'],
  economy: ['经济', 'Economy'],
  codex: ['图鉴', 'Codex'],
  endless: ['无尽', 'Endless'],
  character: ['角色', 'Characters'],
};

/** 等级奖章：单级成就只有金牌 */
export const TIER_MEDALS = ['🥉', '🥈', '🥇', '💎'];
export const TIER_NAME: [string, string][] = [
  ['铜', 'Bronze'],
  ['银', 'Silver'],
  ['金', 'Gold'],
  ['钻石', 'Diamond'],
];
