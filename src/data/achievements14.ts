// 1.4.0 新增成就：B7 无尽专属 10 个 + I4 危机等级 / 遗物 / 事件 / 角色任务与觉醒 共 66 个。
// 全部是计数器成就（save.counters），计数器在各系统里 bump，见 tests/achievements14.test.ts 的键检查。
import type { AchievementDef, AchCategory } from './achievements';
import { CHARACTERS } from './characters';
import { RELIC_SETS } from './relics';

type T = [number, number];
const K = (
  id: string,
  category: AchCategory,
  icon: string,
  name: [string, string],
  desc: [string, string],
  key: string,
  tiers: T[],
): AchievementDef => ({ id, category, icon, name, desc, metric: 'counter', key, tiers: tiers.map(([goal, points]) => ({ goal, points })) });

/** B7：无尽专属 */
export const ENDLESS_14: AchievementDef[] = [
  K(
    'endless_revive',
    'endless',
    '💚',
    ['再来一次', 'One More Try'],
    ['在无尽模式中复活 {n} 次', 'Revive {n} time(s) in Endless'],
    'endlessRevives',
    [[1, 3]],
  ),
  K(
    'endless_superboss',
    'endless',
    '👹',
    ['双王之战', 'Clash of Kings'],
    ['击败 {n} 次超级 Boss 波', 'Clear {n} Super Boss wave(s)'],
    'superBossWins',
    [
      [1, 20],
      [5, 60],
    ],
  ),
  K(
    'endless_mutation',
    'endless',
    '🧬',
    ['变异体', 'Mutant Hunter'],
    ['在带 {n} 个变异词缀的无尽波次中存活', 'Survive Endless waves with {n} mutation affixes'],
    'mutationMax',
    [
      [3, 15],
      [6, 50],
    ],
  ),
  K(
    'endless_relics',
    'endless',
    '🏺',
    ['里程碑收藏家', 'Milestone Collector'],
    ['通过无尽里程碑获得 {n} 件遗物', 'Obtain {n} relics from Endless milestones'],
    'endlessRelics',
    [
      [3, 10],
      [10, 30],
    ],
  ),
  K(
    'endless_pure',
    'endless',
    '🕊️',
    ['不借来生', 'No Second Life'],
    ['不复活打到无尽第 {n} 波', 'Reach Endless wave {n} without reviving'],
    'endlessBestPure',
    [
      [45, 40],
      [60, 90],
    ],
  ),
  K(
    'endless_events',
    'endless',
    '🎪',
    ['无尽奇遇', 'Endless Encounters'],
    ['在无尽模式中经历 {n} 次事件波', 'Survive {n} event waves in Endless'],
    'endlessEvents',
    [
      [5, 5],
      [30, 25],
    ],
  ),
  K(
    'endless_hard',
    'endless',
    '☠️',
    ['刀尖起舞', 'On the Edge'],
    ['在无尽模式中走完 {n} 次危险路线', 'Complete {n} dangerous routes in Endless'],
    'endlessHardRoutes',
    [
      [5, 10],
      [25, 40],
    ],
  ),
  K(
    'endless_chapters',
    'endless',
    '🗺️',
    ['处处无尽', 'Endless Everywhere'],
    ['在 {n} 个章节的无尽模式打到第 30 波', 'Reach wave 30 in Endless on {n} chapters'],
    'endlessCh30',
    [
      [3, 20],
      [5, 50],
    ],
  ),
  K(
    'endless_chars',
    'endless',
    '👥',
    ['群英无尽', 'Endless Roster'],
    ['用 {n} 名角色在无尽模式打到第 30 波', 'Reach Endless wave 30 with {n} characters'],
    'endlessChars30',
    [
      [5, 20],
      [15, 60],
    ],
  ),
  K(
    'endless_legend',
    'endless',
    '🌌',
    ['无尽传说', 'Endless Legend'],
    ['无尽模式完成第 {n} 波', 'Finish Endless wave {n}'],
    'endlessBest',
    [[150, 200]],
  ),
];

/** I4：危机等级 */
const DANGER: AchievementDef[] = [
  K('danger_max', 'challenge', '🍅', ['番茄危机', 'Tomato Crisis'], ['通关番茄危机 {n} 级', 'Clear Danger level {n}'], 'dangerMax', [
    [1, 3],
    [5, 10],
    [10, 25],
    [15, 50],
    [20, 100],
  ]),
  K(
    'danger_wins',
    'challenge',
    '🔥',
    ['危机常客', 'Crisis Regular'],
    ['在危机等级下通关 {n} 次', 'Win {n} run(s) on any Danger level'],
    'dangerWins',
    [
      [1, 2],
      [10, 10],
      [50, 40],
    ],
  ),
  ...[1, 2, 3, 4, 5].map((ch) =>
    K(
      `danger_ch_${ch}`,
      'challenge',
      '📈',
      [`第 ${ch} 章危机`, `Chapter ${ch} Crisis`],
      [`第 ${ch} 章通关危机 {n} 级`, `Clear Danger {n} on Chapter ${ch}`],
      `dangerCh:${ch}`,
      [
        [5, 5],
        [10, 15],
        [20, 50],
      ],
    ),
  ),
  K(
    'gold_frames',
    'challenge',
    '🖼️',
    ['金色边框', 'Golden Frames'],
    ['让 {n} 名角色获得金色边框', 'Earn the golden frame on {n} character(s)'],
    'goldFrames',
    [
      [1, 30],
      [5, 80],
      [15, 150],
    ],
  ),
  K('gold_earned', 'economy', '🥇', ['金番茄', 'Golden Tomatoes'], ['累计获得 {n} 个金番茄', 'Earn {n} Golden Tomatoes'], 'goldEarned', [
    [50, 5],
    [500, 20],
    [3000, 60],
  ]),
];

/** I4：遗物 */
const RELIC: AchievementDef[] = [
  K('relics_total', 'collection', '🏺', ['遗物猎人', 'Relic Hunter'], ['累计获得 {n} 件遗物', 'Obtain {n} relics'], 'relics', [
    [5, 3],
    [25, 10],
    [100, 30],
  ]),
  K('relics_codex', 'collection', '📖', ['遗物图鉴', 'Relic Codex'], ['图鉴收录 {n} 件遗物', 'Discover {n} relics'], 'relicsSeen', [
    [10, 5],
    [25, 15],
    [45, 40],
  ]),
  K('relic_boon', 'collection', '🌿', ['福星高照', 'Blessed'], ['获得 {n} 件增益遗物', 'Obtain {n} Boon relics'], 'relicKind:boon', [
    [20, 5],
  ]),
  K('relic_trade', 'collection', '⚖️', ['等价交换', 'Fair Trade'], ['获得 {n} 件交易遗物', 'Obtain {n} Trade relics'], 'relicKind:trade', [
    [20, 8],
  ]),
  K(
    'relic_curse',
    'collection',
    '🕯️',
    ['与诅咒共舞', 'Dancing with Curses'],
    ['获得 {n} 件诅咒遗物', 'Obtain {n} Curse relics'],
    'relicKind:curse',
    [[10, 10]],
  ),
  ...RELIC_SETS.map((s) =>
    K(
      `relic_set_${s.id}`,
      'collection',
      '✦',
      [`${s.name[0]}套装`, `${s.name[1]} Set`],
      [`集齐「${s.name[0]}」套装`, `Complete the ${s.name[1]} set`],
      `relicSet:${s.id}`,
      [[1, 15]],
    ),
  ),
  K(
    'merchant_buys',
    'economy',
    '🧙',
    ['神秘交易', 'Shady Deals'],
    ['向神秘商人购买 {n} 件遗物', 'Buy {n} relic(s) from the Mysterious Merchant'],
    'merchantBuys',
    [
      [1, 3],
      [10, 15],
    ],
  ),
];

/** I4：事件波与路线 */
const EVENTS: AchievementDef[] = [
  K(
    'event_gold_rain',
    'progress',
    '🌧️',
    ['金币雨', 'Gold Rain'],
    ['经历 {n} 次金币雨', 'Survive {n} Gold Rain wave(s)'],
    'event:gold_rain',
    [[3, 3]],
  ),
  K(
    'event_chest_horde',
    'progress',
    '📦',
    ['宝箱怪潮', 'Chest Horde'],
    ['经历 {n} 次宝箱怪潮', 'Survive {n} Chest Horde wave(s)'],
    'event:chest_horde',
    [[3, 3]],
  ),
  K(
    'event_merchant_raid',
    'progress',
    '🛒',
    ['商人突袭', 'Merchant Raid'],
    ['经历 {n} 次商人突袭', 'Survive {n} Merchant Raid wave(s)'],
    'event:merchant_raid',
    [[3, 3]],
  ),
  K(
    'event_darkness',
    'progress',
    '🌑',
    ['黑暗之中', 'In the Dark'],
    ['经历 {n} 次黑暗波', 'Survive {n} Darkness wave(s)'],
    'event:darkness',
    [[3, 5]],
  ),
  K(
    'hard_routes',
    'progress',
    '☠️',
    ['偏向虎山行', 'Into the Tiger’s Den'],
    ['走完 {n} 次危险路线', 'Complete {n} dangerous route(s)'],
    'hardRoutes',
    [
      [1, 2],
      [10, 10],
      [30, 30],
    ],
  ),
];

/** I4：角色任务、觉醒与熟练度 */
const CHARS: AchievementDef[] = [
  K('quests_done', 'character', '📜', ['有求必应', 'Quest Master'], ['完成 {n} 个角色任务', 'Complete {n} character quest(s)'], 'quests', [
    [1, 2],
    [10, 10],
    [50, 40],
    [99, 120],
  ]),
  K('awakened', 'character', '🌟', ['觉醒者', 'Awakened'], ['觉醒 {n} 名角色', 'Awaken {n} character(s)'], 'awakened', [
    [1, 5],
    [5, 20],
    [15, 50],
    [33, 150],
  ]),
  K(
    'mastery_max',
    'character',
    '🎓',
    ['熟能生巧', 'Practice Makes Perfect'],
    ['任一角色熟练度达到 {n} 级', 'Reach mastery level {n} with any character'],
    'masteryMax',
    [
      [5, 5],
      [10, 20],
    ],
  ),
  K(
    'mastery_chars',
    'character',
    '🏅',
    ['全能大师', 'Grandmaster'],
    ['{n} 名角色熟练度达到 10 级', 'Reach mastery 10 with {n} character(s)'],
    'mastery10',
    [
      [1, 10],
      [5, 40],
    ],
  ),
  ...CHARACTERS.map((c) =>
    K(
      `awaken_${c.id}`,
      'character',
      '✨',
      [`${c.name}·觉醒`, `${c.name} Awakened`],
      [`完成${c.name}的全部 3 个专属任务`, `Complete all 3 of ${c.name}'s quests`],
      `awaken:${c.id}`,
      [[1, 10]],
    ),
  ),
];

export const ACHIEVEMENTS_14: AchievementDef[] = [...ENDLESS_14, ...DANGER, ...RELIC, ...EVENTS, ...CHARS];
