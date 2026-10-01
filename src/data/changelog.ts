// 玩家可见的版本变化（最新版本在最前）。完整改动见 git 提交记录。
// 每条 [中文, English]；highlight 是这个版本的重点变化，一句话说清。

export interface ChangeEntry {
  version: string;
  date: string;
  highlight: [string, string];
  items: [string, string][];
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: '1.3.0',
    date: '2026-10-01',
    highlight: [
      '武器进化、每日 / 每周挑战、局后数据与战绩，新手也有引导了',
      'Weapon evolution, daily / weekly challenges, run stats and history — plus tips for new players',
    ],
    items: [
      [
        '武器进化：T4 武器 + 指定道具，在商店进化为 12 把超武之一，保留词条与打造等级；商店会提示进化配方',
        'Weapon evolution: a T4 weapon plus a specific item evolves in the shop into one of 12 super weapons, keeping affixes and forge level; the shop shows recipes',
      ],
      [
        '每日 / 每周挑战：每天、每周一套固定的角色、章节、规则和商店，15 种规则修饰；记录个人最佳和连续挑战天数',
        'Daily / weekly challenges: a fixed character, chapter, ruleset and shop every day and every week, 15 rule modifiers; personal bests and streaks are tracked',
      ],
      [
        '局后数据：伤害来源排行（每把武器、技能、持续伤害……）与每波收入；主菜单新增「战绩」，保留最近 30 局',
        'Run stats: damage by source (each weapon, skill, damage over time…) and seeds per wave; new "History" on the main menu keeps your last 30 runs',
      ],
      [
        '新手引导：第一次遇到移动、商店、合成、词条、进化、精英、Boss、天赋等系统时给出简短提示，可在设置里重新显示',
        'Tutorial tips the first time you meet movement, the shop, combining, affixes, evolution, elites, bosses, talents and more — re-enable them in Settings',
      ],
      [
        '天赋平衡：影舞无敌缩短为 0.35 秒，不屈改为每局一次以 25% 生命站起，战意最多 3 层，斩杀线降到 8%，部分生命 / 攻速 / 拾取天赋下调',
        'Talent balance: Shadow Dance invulnerability cut to 0.35s, Unyielding now gets you up once per run at 25% HP, Battle Lust caps at 3 stacks, Execution at 8%, and some HP / attack speed / pickup talents reduced',
      ],
      [
        'Boss 战音乐重做：168 BPM 的激烈曲目，Boss 登场时切入、倒下后恢复章节音乐',
        'New boss music: an intense 168 BPM track that kicks in when the boss appears and hands back to the chapter music once it falls',
      ],
      [
        '回复平衡：番茄掉率大幅降低且每波有上限，按拾取范围吸取；吸血每 0.25 秒最多触发一次、群体伤害触发率 ×0.4、上限 30%；回血技能回复量减半、冷却变长；生命再生明确为每 5 秒',
        'Healing balance: far fewer fruit drops with a per-wave cap, collected by pickup range; life steal triggers at most every 0.25s, at 40% rate for area damage, capped at 30%; healing skills heal about half as much with longer cooldowns; HP Regen is now clearly per 5 seconds',
      ],
      ['属性面板显示闪避（60%）与吸血（30%）上限', 'The stat panel shows the Dodge (60%) and Life Steal (30%) caps'],
      ['新增 18 项成就（武器进化、挑战）', '18 new achievements (evolution, challenges)'],
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-01',
    highlight: ['全新天赋树与无尽模式上线，成就扩充到 847 项', 'New talent tree and Endless mode, plus 847 achievements'],
    items: [
      [
        '天赋树：6 个专精方向、81 个天赋，像地图一样从核心向外延展；完成里程碑成就获得天赋点，强化开局属性或获得特殊能力（闪避掷飞刀、施法回血、斩杀、复活……），随时免费重置',
        'Talent tree: 6 branches and 81 talents laid out like maps around a core; milestone achievements grant points to boost starting stats or unlock abilities (knives on dodge, healing on cast, executes, a revive…), with free resets any time',
      ],
      [
        '无尽模式：通关某章后可开启，不限波数，每 15 波一轮精英与 Boss，怪物越来越强，看你能坚持到第几波',
        'Endless mode: unlocked per chapter after clearing it — no wave limit, elites and a boss every 15 waves, ever-stronger monsters',
      ],
      [
        '成就扩充到 847 项：每种怪物、武器、道具系列、技能、状态、章节、挑战、无尽模式与每名角色都有成就；越难的成就奖励越多',
        '847 achievements covering every monster, weapon, item series, skill, status, chapter, challenge, Endless and each character — harder goals pay more',
      ],
      [
        '角色价格按新的成就点总量调整，首次通关第 1 章就能买下第一名新角色',
        'Character prices rescaled to the new point total — your first Chapter 1 clear buys your first new character',
      ],
      [
        '成就页新增分类、只看未完成与快速翻页；一次解锁很多成就时合并提示',
        'Achievements screen: more categories, an unfinished-only filter and quick paging; bursts of unlocks are grouped',
      ],
    ],
  },
  {
    version: '1.1.0',
    date: '2026-09-30',
    highlight: [
      '大招有了完整的技能动画，新增 50 种怪物与 32 把武器，经济与高阶武器掉率整体重做',
      'Full ultimate animations, 50 new monsters, 32 new weapons, and a reworked economy',
    ],
    items: [
      [
        '技能动画：释放大招时显示技能名横幅、旋转光芒与镜头冲击，冲击波、光柱、速度线、全屏落雷、召唤法阵等按技能形态区分',
        'Skill animations: casting now shows the skill name, rotating light rays and a camera punch, with a distinct effect per skill form — shockwaves, light pillars, speed lines, screen-wide lightning, summoning circles',
      ],
      [
        '新增 50 种小怪（共 77 种），每章 15 种，五章各有专属阵容',
        '50 new monsters (77 total), 15 per chapter with a distinct roster each',
      ],
      ['新增 32 把武器（共 50 把）：近战 17、远程 18、元素 15', '32 new weapons (50 total): 17 melee, 18 ranged, 15 elemental'],
      [
        '契合武器：多数角色有 3 把与天赋呼应的武器，使用时伤害 +20%，商店也更容易刷到',
        'Favored weapons: most characters have 3 weapons matching their talent for +20% damage, and they show up more often in the shop',
      ],
      [
        '伤害属性拆分为近战 / 远程 / 元素 / 光环四类，光环范围与射程分开，拾取距离改为固定像素',
        'Damage split into melee / ranged / elemental / aura; aura size is separate from range; pickup radius is now a flat distance',
      ],
      [
        '升级只提供当前武器涉及的流派伤害选项，不再被无用选项稀释',
        'Level-ups only offer damage options for the weapon classes you actually own',
      ],
      [
        '经济重做：第 1 波钱变多（开局买得起东西），中后期不再滚雪球；商店刷新次数默认 3 次，可用道具提高到 10 次，刷新价随波次与章节上涨',
        'Economy rework: more money on wave 1 so you can actually buy something, no more late-game snowballing; 3 rerolls per shop by default (items raise it to 10), and reroll price scales with wave and chapter',
      ],
      [
        '高阶武器掉率重新标定：T4 从第 7 波起逐步出现，后期章节概率更高',
        'High-tier weapon rates recalibrated: T4 appears from wave 7 onward and is more common in later chapters',
      ],
      [
        '关卡难度重新标定，第 2~5 章的生命与伤害倍率更平滑',
        'Chapter difficulty recalibrated with smoother HP and damage curves for chapters 2–5',
      ],
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-29',
    highlight: [
      '首个正式版本：5 章 × 15 波、33 名角色、成就解锁与武器词条打造',
      'First release: 5 chapters × 15 waves, 33 characters, achievement unlocks and weapon forging',
    ],
    items: [
      ['5 个章节、每章 15 波，第 5 / 10 波精英、第 15 波 Boss', '5 chapters of 15 waves each, elites on waves 5 and 10, a boss on wave 15'],
      [
        '33 名角色，各有天赋、初始武器与主动技能；技能支持自动释放与手动切换',
        '33 characters with unique talents, starting weapons and ultimates; auto-cast with a manual toggle',
      ],
      ['136 项成就与分级奖章，成就点用于购买角色', '136 achievements with tiered medals; points buy characters'],
      ['T3 / T4 武器随机词条，可洗练；T4 可打造升级到 +10', 'Random affixes on T3/T4 weapons with rerolling; T4 can be forged up to +10'],
      ['暂停可保存进度，下次从当波继续', 'Save from the pause menu and resume at the same wave'],
      ['手机全屏与横屏适配，结算可生成分享海报', 'Mobile fullscreen and landscape support; end-of-run share poster'],
      ['全部美术与音乐程序生成', 'All art and music are procedurally generated'],
    ],
  },
];
